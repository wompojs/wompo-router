import {
	type LazyCallbackResult,
	type LazyResult,
	type RenderHtml,
	type WompoComponent,
	type WompoElement,
	type WompoProps,
	createContext,
	defineWompo,
	lazy,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	Suspense,
	html,
} from 'wompo';

/*
================================================================
HELPERS
================================================================
*/
/**
 * Normalizes the `origin` prop into a canonical prefix: it always starts with a slash and never
 * ends with one (e.g. "subapp/" and "/subapp" both become "/subapp"). Any falsy or root-only value
 * ("", null, undefined, "/", whitespace) is collapsed to an empty string, which disables every
 * origin-aware behavior across the router.
 */
const normalizeOrigin = (origin: string | null | undefined): string => {
	// Be defensive about non-string values: an `origin` prop written as `origin=""` or a bare
	// `origin` is coerced to the boolean `true` by the template, and should mean "no origin".
	if (!origin || typeof origin !== 'string') return '';
	let normalized = origin.trim();
	if (!normalized.startsWith('/')) normalized = `/${normalized}`;
	while (normalized.length > 1 && normalized.endsWith('/')) {
		normalized = normalized.substring(0, normalized.length - 1);
	}
	return normalized === '/' ? '' : normalized;
};

const buildTreeStructure = (
	origin: string,
	childNodes: Node[] | NodeList,
	structure: RouteStructure[] = [],
	parent: RouteStructure | null = null
): RouteStructure[] => {
	const routeClass = (Route as WompoComponent).class;
	childNodes.forEach((child) => {
		if (routeClass && child instanceof routeClass) {
			const props = (child as WompoElement).props as RouteProps;
			const lazyComp = props.lazy ? lazy(props.lazy) : null;
			// Top-level routes are prefixed with the (normalized) origin so that the browser url —
			// which always includes the origin — can be matched against the built routes. Nested
			// routes inherit the origin automatically through their parent's path.
			let path = props.path;
			if (parent === null && origin && path) {
				const normalizedPath = path.startsWith('/') ? path : `/${path}`;
				path = normalizedPath === '/' ? origin : origin + normalizedPath;
			}
			const route: RouteStructure = {
				...props,
				parent: parent,
				element: props.element,
				path: path,
				lazy: lazyComp,
				fallback: props.fallback,
				index: null,
				children: [],
			};
			if (props.index && parent) parent.index = route;
			structure.push(route);
			buildTreeStructure(origin, child.childNodes, route.children, route);
		}
	});
	return structure;
};

const getRoutes = (
	treeStructure: RouteStructure[],
	paths: [string, RouteStructure][] = [],
	parent: string = ''
) => {
	for (const route of treeStructure) {
		let newRoute = '';
		if (route.path) {
			const slash =
				(parent && !parent.endsWith('/')) || (!parent && !route.path.startsWith('/')) ? '/' : '';
			newRoute += parent + slash + route.path;
			route.fullPath = newRoute;
			paths.push([newRoute, route]);
		}
		if (route.children) {
			getRoutes(route.children, paths, newRoute);
		}
	}
	return paths;
};

interface Params {
	segments?: string[];
	search?: { [key: string]: any };
	[key: string]: any;
}

const getWichParametricRouteisMoreSpecific = (routes: Params) => {
	const parametricPaths = Object.keys(routes);
	parametricPaths.sort((a, b) => {
		const matchA = routes[a];
		const matchB = routes[b];
		const dynamicsA = Object.keys(matchA).filter((key) => key !== 'segments').length;
		const dynamicsB = Object.keys(matchB).filter((key) => key !== 'segments').length;
		const difference = dynamicsB - dynamicsA;
		if (difference === 0) {
			let staticsA = a.split('/');
			let staticsB = b.split('/');
			const lengthDifference = staticsB.length - staticsA.length;
			if (lengthDifference !== 0) return lengthDifference;
			let staticsALength = 0;
			let staticsBLength = 0;
			for (let i = 0; i < staticsA.length; i++) {
				const sA = staticsA[i];
				const sB = staticsB[i];
				if (!sA.startsWith(':')) staticsALength++;
				if (!sB.startsWith(':')) staticsBLength++;
				if (sA.startsWith(':') || sB.startsWith(':') || sA.startsWith('*') || sB.startsWith('*'))
					break;
			}
			return staticsBLength - staticsALength;
		}
		return difference;
	});
	return routes[parametricPaths[0]];
};

const getSearchObject = (searchString: string) => {
	if (!searchString) return {};
	const params: any = {};
	searchString.split('&').forEach((el) => {
		const [key, value] = el.split('=');
		params[key] = value;
	});
	return params;
};

const getMatch = (
	routes: [string, RouteStructure][],
	broswerRoute: string,
	origin: string = ''
): [RouteStructure | null, Params | null] => {
	const matches: {
		exact: RouteStructure | null;
		parametric: Params;
		fallbacks: Params;
	} = {
		exact: null,
		parametric: {},
		fallbacks: {},
	};
	const bRoute =
		broswerRoute !== '/' && broswerRoute.endsWith('/')
			? broswerRoute.substring(0, broswerRoute.length - 1)
			: broswerRoute;
	const [currentRoute, search] = bRoute.split('?');
	for (const routeStructure of routes) {
		const [routePath, route] = routeStructure;
		const isFallback = routePath.endsWith('*');
		if (!isFallback && routePath.split('/').length !== currentRoute.split('/').length) continue;
		if (routePath === currentRoute) {
			matches.exact = route;
			break;
		}
		if (!routePath.includes(':') && !routePath.includes('*')) continue;
		const segments = routePath.split('/');
		let regex = '';
		// Skips first element
		const paramNames: string[] = [];
		for (let i = 1; i < segments.length; i++) {
			const segment = segments[i];
			regex += '\\/';
			if (segment.startsWith(':')) {
				if (i === segments.length - 1) regex += '(.*)';
				else regex += '(.*?)';
				paramNames.push(segment.substring(1));
			} else if (segment === '*') {
				regex += '(.*)?';
				paramNames.push('segments');
			} else {
				regex += segment;
			}
		}
		const matchRegex = new RegExp(regex, 'g');
		const routeToMatch =
			currentRoute + (regex.endsWith('(.*)?') && !currentRoute.endsWith('/') ? '/' : '');
		const match = matchRegex.exec(routeToMatch);
		if (match) {
			const params: Params = {};
			// Skips first element, which is the whole match
			for (let i = 1; i < match.length; i++) {
				let matchedSegment = match[i] ?? '';
				if (paramNames[i - 1] === 'segments') {
					const segmentsParam = matchedSegment ? matchedSegment.split('/') : [];
					segmentsParam.pop();
					params[paramNames[i - 1]] = segmentsParam;
				} else {
					params[paramNames[i - 1]] = matchedSegment;
				}
			}
			if (isFallback) matches.fallbacks[routePath] = [route, params];
			else matches.parametric[routePath] = [route, params];
		}
	}
	const parametricPaths = Object.keys(matches.parametric);
	const fallbackPaths = Object.keys(matches.fallbacks);
	let match: [RouteStructure | null, Params | null] = [null, null];
	if (matches.exact) {
		match = [matches.exact, {}];
	} else if (parametricPaths.length) {
		match = getWichParametricRouteisMoreSpecific(matches.parametric);
	} else if (fallbackPaths.length) {
		match = getWichParametricRouteisMoreSpecific(matches.fallbacks);
	}
	const redirect = match[0]?.redirect || match[0]?.index?.redirect;
	if (redirect) {
		const newPath = getHref(redirect, match[0], match[1], origin);
		history.replaceState({}, '', newPath);
		match = getMatch(routes, newPath, origin);
	}
	if (match[1]) match[1].search = getSearchObject(search);
	return match;
};

const getRouteContent = (router: RouterContext) => {
	const route = router.singleRoute;
	return html`
		<${RouterContext.Provider} value=${router}>
			${
				route?.lazy
					? route?.fallback
						? html`
							<${Suspense} fallback=${route?.fallback}>
								<${route?.lazy} />
							</${Suspense}>
						`
						: html`<${route?.lazy} />`
					: route?.element
			}
		</${RouterContext.Provider}>
	`;
};

/* 
================================================================
ROUTES
================================================================
*/
interface RoutesProps extends WompoProps {
	notFoundElement?: RenderHtml;
	origin?: string;
}

interface RouteStructure extends Omit<RouteProps, 'index' | 'children' | 'lazy'> {
	parent: RouteStructure | null;
	element?: RenderHtml;
	path?: string;
	fullPath?: string;
	children: RouteStructure[];
	index: RouteStructure | null;
	nextRoute?: RouteStructure | null;
	fallback?: RenderHtml;
	lazy: LazyResult | null;
	notFound?: boolean;
}

interface RouterContext {
	params: Params | null;
	hash?: string | null;
	currentRoute: string | null;
	setNewRoute: (newValue: string, push?: boolean) => void;
	routes: [string, RouteStructure][];
	route: RouteStructure | null;
	singleRoute: RouteStructure | null;
	/** The normalized origin of the closest `Routes` ancestor (empty string when not set). */
	origin: string;
}
const RouterContext = createContext<RouterContext>(
	{
		params: null,
		hash: null,
		currentRoute: null,
		setNewRoute: () => {},
		routes: [],
		route: null,
		singleRoute: null,
		origin: '',
	},
	'wompo-route-context'
);

const scrollIntoView = (hash: string) => {
	if (hash) {
		const element = document.getElementById(hash);
		if (element) element.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}
};

/**
 * The main component to handle the client routing system.
 * It will iterate through all the children to find `Route` components so that it'll build all the
 * necessary routes.
 * The routes will be deleted after the first render and the content of the current route will be
 * displayed.
 *
 * It accepts the following props:
 * - notFoundElement: the component to render if the route current route is not found between the
 *   routes tree.
 * - origin: specifies the url location on where the routing starts (e.g. "/admin"). When set, it is
 *   prepended to every top-level route and to every absolute navigation target, so a link to
 *   "/users" under origin "/admin" resolves to "/admin/users". Any falsy value (e.g. "", null,
 *   undefined) disables this behavior entirely.
 *
 * Example:
 * ```javascript
 * function App(){
 *   return html`
 *     <${Routes}>
 * 		   <${Route} path="/" component=${html`<${Home} />`} />
 * 			 <${Route} path="/users" component=${html`<${UsersDashboard} />`}>
 * 				 <${Route} path=":id" component=${html`<${UserDetails} />`} />
 * 				 <${Route} index component=${html`<${UsersList} />`} />
 * 			 </${Route}>
 *     </${Routes}>
 *   `
 * }
 * ```
 */
export function Routes({ origin: originProp, notFoundElement, children }: RoutesProps) {
	const origin = normalizeOrigin(originProp);
	const [currentRoute, setCurrentRoute] = useState(
		window.location.pathname + window.location.search
	);

	const treeStructure = useMemo(() => {
		const tree = buildTreeStructure(origin, children?.nodes ?? []);
		return tree;
	}, []);

	const routes: [string, RouteStructure][] = useMemo(() => getRoutes(treeStructure), []);
	const hash = window.location.hash.split('#')[1];
	const [route, params] = getMatch(routes, currentRoute, origin);

	const setNewRoute = useCallback(
		(newRoute: string, pushState: boolean = true) => {
			setCurrentRoute((prevRoute) => {
				const nextRoute = getHref(newRoute, route, params, origin);
				const [pathname, hash] = nextRoute.split('#');
				if (pushState && prevRoute !== nextRoute) {
					history.pushState({}, '', nextRoute);
				} else if (!pushState && prevRoute !== nextRoute) {
					history.replaceState({}, '', nextRoute);
				}
				scrollIntoView(hash);
				if (!nextRoute.startsWith('#')) return pathname;
				return prevRoute;
			});
		},
		[route, params, origin]
	);

	useEffect(() => {
		window.addEventListener('popstate', () => {
			setNewRoute(window.location.pathname, false);
		});
	}, []);

	useEffect(() => {
		window.scrollTo(0, 0);
		if (route?.lazy) {
			route.lazy().then(() => {
				setTimeout(() => {
					scrollIntoView(hash);
				});
			});
		} else {
			scrollIntoView(hash);
		}
	}, [currentRoute]);

	const context = useMemo(
		() =>
			({
				hash: hash,
				params: params,
				currentRoute: currentRoute,
				setNewRoute: setNewRoute,
				routes: routes,
				route: route,
				origin: origin,
			} as RouterContext),
		[currentRoute]
	);

	let root: RouteStructure = { notFound: true } as any;
	if (route) {
		root = route;
		if (route.meta?.title) {
			document.title = route.meta.title;
			const ogMeta = document.querySelector('meta[property="og:title"]');
			if (ogMeta) ogMeta.setAttribute('content', route.meta.title);
		}
		if (route.meta?.description) {
			const meta = document.querySelector('meta[name="description"]');
			if (meta) meta.setAttribute('content', route.meta.description);
			const ogMeta = document.querySelector('meta[property="og:description"]');
			if (ogMeta) ogMeta.setAttribute('content', route.meta.description);
		}
	}
	let nextRoute: RouteStructure | null = null;
	root.nextRoute = nextRoute;
	while (root.parent) {
		nextRoute = root;
		root = root.parent;
		root.nextRoute = nextRoute;
	}

	const nextRouteCtx: RouterContext = useMemo(
		() => ({
			...context,
			singleRoute: root,
		}),
		[currentRoute]
	);

	return html`<${RouterContext.Provider} value=${context}>
		${
			root.notFound
				? notFoundElement ?? html`<div class="wompo-router-not-found">Not found!</div>`
				: getRouteContent(nextRouteCtx)
		}
	</${RouterContext.Provider}>`;
}

defineWompo(Routes, {
	name: 'wompo-routes',
});

/* 
================================================================
ROUTE
================================================================
*/

interface RouteProps extends WompoProps {
	path?: string;
	index?: boolean;
	redirect?: string;
	element?: RenderHtml;
	lazy?: () => LazyCallbackResult;
	fallback?: RenderHtml;
	route?: RouteStructure;
	meta?: {
		title?: string;
		description?: string;
	};
}

/**
 * This component is basically only used to create the routing tree structure. It will not render
 * anything, and will be deleted from the DOM after the `Routes` component has fully rendered.
 *
 * It accepts the following props:
 * - path?: the path of the current route. If it is a nested route, it shouldn't start with a slash.
 * - index?: If true, the route will be the index route of the parent. This is useful when you want
 *   a route to be a layout route.
 * - redirect?: if defined, the route will redirect the user to another path, without pushing the
 *   route in the history stack.
 * - element?: the element to render.
 * - lazy?: if defined, it must be a callback that returns a lazy Wompo component. This is very
 *   useful for performance optimizations, becasue every route will only be loaded when needed.
 * - fallback?: if the `lazy` prop is defined, this property will define what to render while the
 *   component to render is being fetched from the server.
 * - meta?: the metadata associated to the route. It's an object that accepts a title and a
 *   description key.
 */
export function Route(_: RouteProps) {
	return html``;
}

defineWompo(Route, {
	name: 'wompo-route',
});

/* 
================================================================
CHILD-ROUTE
================================================================
*/
/**
 * The `ChildRoute` component is the component responsible for building nested routes.
 * Each nested route will not render automatically: you need to use this component.
 *
 * Example:
 * Given the following routes:
 * ```javascript
 * function App(){
 *   return html`
 *     <${Routes}>
 * 		   <${Route} path="/" component=${html`<${Home} />`} />
 * 			 <${Route} path="/users" component=${html`<${UsersDashboard} />`}>
 * 				 <${Route} path=":id" component=${html`<${UserDetails} />`} />
 * 				 <${Route} index component=${html`<${UsersList} />`} />
 * 			 </${Route}>
 *     </${Routes}>
 *   `
 * }
 * ```
 *
 * The `UsersDashboard` component will look like this:
 * ```javascript
 * function UsersDashboard(){
 *   return html`
 *     ...
 *     <${ChildRoute} />
 *     ...
 *   `
 * }
 * ```
 *
 * The child route will allow to render the `UsersList` and the `UserDetails` components.
 */
export function ChildRoute() {
	const router = useContext(RouterContext);
	const route = router.singleRoute;
	let toRender: RouteStructure | null = null;
	if (route) {
		const newRoute = route.nextRoute;
		if (newRoute) {
			toRender = newRoute;
		} else if (route.index) {
			toRender = route.index;
		}
	}
	const childRouter = useMemo(
		(): RouterContext =>
			({
				...router,
				singleRoute: toRender,
			} as RouterContext),
		[router]
	);

	return getRouteContent(childRouter);
}

defineWompo(ChildRoute, {
	name: 'wompo-child-route',
});

/* 
================================================================
LINK
================================================================
*/
interface LinkProps extends WompoProps {
	to: string;
	target?: string;
}

const getHref = (
	to: string,
	route: RouteStructure | null,
	params: Params | null,
	origin: string = ''
) => {
	let href = to;
	if (!href.startsWith('/') && !href.startsWith('#') && route) {
		// Relative links are resolved against the current route's chain of parents. The top-level
		// parent already carries the origin in its path, so relative links inherit it for free.
		let parentRoute: RouteStructure | null = route;
		while (parentRoute) {
			const parentPath = parentRoute.path;
			if (parentPath) {
				let parentRoutePath = parentPath;
				if (parentRoutePath.includes(':')) {
					const paths = parentRoutePath.split('/');
					paths
						.filter((p) => p.startsWith(':'))
						.map((p) => p.substring(1))
						.forEach((param) => {
							parentRoutePath = parentRoutePath.replace(`:${param}`, params?.[param] ?? '');
						});
				}
				if (parentRoutePath.includes('*')) {
					parentRoutePath = parentRoutePath.replace('*', params?.segments?.join('/') ?? '');
				}
				const slash = !parentRoutePath.endsWith('/') && !href.startsWith('/') ? '/' : '';
				href = parentRoutePath + slash + href;
			}
			parentRoute = parentRoute.parent;
		}
	} else if (origin && href.startsWith('/') && href !== origin && !href.startsWith(`${origin}/`)) {
		// Absolute links are resolved relative to the origin (the router's mount point): a link to
		// "/foo" under origin "/subapp" navigates to "/subapp/foo". The guards keep this idempotent —
		// getHref runs both when building the <a href> and again on navigation, and the browser url
		// already carries the origin, so an href that is already origin-prefixed is left untouched.
		href = origin + href;
	}
	return href;
};

/**
 * This component will render a link to navigate through the routes. You should use this component
 * instead of a simple `a` tag to navigate through your application, so that you use the pure client
 * routing system, without fetching the whole page through the server.
 *
 * It accepts the following props:
 * - to: required. The url of the link. If the link doesn't start with a slash ("/"), it will be
 *   positioned in the current route (e.g.: if the current route is "/users" and the `to` prop is
 *   "20", the link will go to "/users/20", not "/20"). Absolute links (starting with "/") are
 *   resolved against the `Routes` origin when one is set (e.g. "/users" becomes "/admin/users").
 * - target: the target of the link.
 */
export function Link({ to, target, children }: LinkProps) {
	const navigate = useNavigate();
	const { singleRoute, origin } = useContext(RouterContext);
	const routes = useRoutes();
	const params = useParams();
	const href = getHref(to, singleRoute, params, origin);
	const onLinkClick = (ev: Event) => {
		if (!target) {
			ev.preventDefault();
			navigate(href);
		}
	};
	const preload = () => {
		const [route] = getMatch(routes, href.split('#')[0], origin);
		if (route && route.lazy) route.lazy();
	};
	return html`<a
		href=${href}
		target=${target}
		@click=${onLinkClick}
		@mouseenter=${preload}
		@touchstart=${preload}
	>
		${children}
	</a>`;
}
Link.css = `:host { display: inline-block; }`;
defineWompo(Link, {
	name: 'wompo-link',
});

/* 
================================================================
NAV-LINK
================================================================
*/
/**
 * This component will render a link to navigate through the routes. You should use this component
 * instead of a simple `a` tag to navigate through your application, so that you use the pure client
 * routing system, without fetching the whole page through the server.
 *
 * The difference between the `Link` and `NavLink` is that the `NavLink` will have an "active" class
 * whenever the route associated with the link is actually the current one. This is useful to create
 * navbars and navigation links in general.
 *
 * It accepts the following props:
 * - to: required. The url of the link. If the link doesn't start with a slash ("/"), it will be
 *   positioned in the current route (e.g.: if the current route is "/users" and the `to` prop is
 *   "20", the link will go to "/users/20", not "/20"). Absolute links (starting with "/") are
 *   resolved against the `Routes` origin when one is set (e.g. "/users" becomes "/admin/users").
 * - target: the target of the link.
 */
export function NavLink({ to, target, children }: LinkProps) {
	const navigate = useNavigate();
	const currentRoute = useCurrentRoute();
	const params = useParams();
	const routes = useRoutes();
	const { singleRoute, origin } = useContext(RouterContext);
	const href = getHref(to, singleRoute, params, origin);
	const onLinkClick = (ev: Event) => {
		if (!target) {
			ev.preventDefault();
			navigate(href);
		}
	};
	const preload = () => {
		const [route] = getMatch(routes, href.split('#')[0], origin);
		if (route && route.lazy) route.lazy();
	};
	const isActive = currentRoute === href;
	return html`<a
		class=${isActive && 'active'}
		href=${href}
		target=${target}
		@click=${onLinkClick}
		@mouseenter=${preload}
		@touchstart=${preload}
	>
		${children}
	</a>`;
}
NavLink.css = `:host { display: inline-block; }`;

defineWompo(NavLink, {
	name: 'wompo-nav-link',
});

/* 
================================================================
HOOKS
================================================================
*/
/**
 * This hook will return the current url parameters and search parameters of the current route.
 * Also, the components using this hook will automatically re-render whenver the current route
 * changes.
 */
export const useParams = () => {
	const routerContext = useContext(RouterContext);
	return routerContext.params;
};

/**
 * This hook will return function that can be used to manually navigate through the routes.
 * The function accepts two parameters: the new route (which has the same behavior of the "to" prop
 * in the `Link` component) and then a boolean value (default `true`) to indicate whether the new
 * route should be pushed or not in the history.
 */
export const useNavigate = () => {
	const routerContext = useContext(RouterContext);
	return routerContext.setNewRoute;
};

/**
 * This hook will return the current path, and will re-render the component whenever it changes.
 */
export const useCurrentRoute = () => {
	const routerContext = useContext(RouterContext);
	return routerContext.currentRoute;
};

/**
 * This hook will return all the data of the current route, and will re-render the component
 * whenever the current route changes.
 */
export const useRoute = () => {
	const routerContext = useContext(RouterContext);
	return routerContext.route;
};

/**
 * This hook will return the whole routes object that the `Routes` component uses to render the
 * correct routes.
 */
export const useRoutes = () => {
	const routerContext = useContext(RouterContext);
	return routerContext.routes;
};
