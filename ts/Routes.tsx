import {
	RenderHtml,
	WompComponent,
	WompProps,
	createContext,
	defineWomp,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'womp';

/* 
================================================================
ROUTES
================================================================
*/
interface RoutesProps extends WompProps {}

interface RouteStructure {
	parent?: RouteStructure;
	element?: RenderHtml;
	path?: string;
	children?: RouteStructure[];
	index?: RouteStructure;
	nextRoute?: RouteStructure;
}

const buildTreeStructure = (
	childNodes: Node[] | NodeList,
	structure: RouteStructure[] = [],
	parent: RouteStructure = null
) => {
	childNodes.forEach((child) => {
		if (child instanceof (Route as WompComponent).class) {
			const props = child.props as RouteProps;
			const route: RouteStructure = {
				parent: parent,
				element: props.element,
				path: props.path,
				index: null,
				children: [],
			};
			if (props.index) parent.index = route;
			structure.push(route);
			buildTreeStructure(child.childNodes, route.children, route);
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
	[key: string]: any;
}

const getMatch = (
	routes: [string, RouteStructure][],
	currentRoute: string
): [RouteStructure, Params] => {
	const matches: {
		exact?: RouteStructure;
		parametric?: Params;
	} = {
		exact: null,
		parametric: {},
	};
	for (const routeStructure of routes) {
		const [routePath, route] = routeStructure;
		const isFallback = routePath.endsWith('*');
		if (!isFallback && routePath.split('/').length !== currentRoute.split('/').length) continue;
		if (routePath === currentRoute) {
			matches.exact = route;
			break;
		}
		const segments = routePath.split('/');
		let regex = '';
		// Skips first element
		const paramNames: string[] = [];
		for (let i = 1; i < segments.length; i++) {
			const segment = segments[i];
			regex += '\\/';
			if (segment.startsWith(':')) {
				if (i === segments.length - 1) regex += '(.*?)';
				else regex += '(.*)';
				paramNames.push(segment.substring(1));
			} else if (segment === '*') {
				regex += '(.*)';
				paramNames.push('segments');
			} else {
				regex += segment;
			}
		}
		const matchRegex = new RegExp(regex, 'g');
		const match = matchRegex.exec(currentRoute);
		if (match) {
			const params: { [key: string]: string } = {};
			// Skips first element, which is the whole match
			for (let i = 1; i < match.length; i++) {
				params[paramNames[i - 1]] = match[i];
			}
			matches.parametric[routePath] = [route, params];
		}
	}
	if (matches.exact) {
		return [matches.exact, {}];
	} else {
		const routes = matches.parametric;
		const paths = Object.keys(routes);
		paths.sort((a, b) => {
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
		return routes[paths[0]];
	}
};

const RouterContext = createContext({});

export function Routes({ children }: RoutesProps) {
	const context = useRef({
		route: null,
		params: null,
	});
	const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
	const treeStructure = useMemo(() => buildTreeStructure(children.nodes), []);
	const routes: [string, RouteStructure][] = useMemo(() => getRoutes(treeStructure), []);
	const [route, params] = getMatch(routes, currentRoute);
	let root = route;
	let nextRoute = null;
	root.nextRoute = nextRoute;
	while (root.parent) {
		nextRoute = root;
		root = root.parent;
		root.nextRoute = nextRoute;
	}
	context.current = {
		...context.current,
		route: root,
		params: params,
	};
	return <RouterContext.Provider value={context.current}>{root.element}</RouterContext.Provider>;
}

defineWomp(Routes, {
	name: 'womp-routes',
});

/* 
================================================================
NEXT-ROUTE
================================================================
*/
export function ChildRoute() {
	const routerContext = useContext(RouterContext);
	if (routerContext && routerContext.route) {
		const route = routerContext.route;
		const newRoute = route.nextRoute;
		if (newRoute) {
			routerContext.route = newRoute;
			return newRoute.element;
		} else if (route.index) {
			routerContext.route = null;
			return route.index.element;
		}
	}
	return null;
}
defineWomp(ChildRoute, {
	name: 'child-route',
});

/* 
================================================================
ROUTE
================================================================
*/
interface RouteProps extends WompProps {
	path?: string;
	index?: boolean;
	element: RenderHtml;
}

export function Route(props: RouteProps) {
	return <div></div>;
}

defineWomp(Route, {
	name: 'womp-route',
});
