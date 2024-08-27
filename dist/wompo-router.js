import {
  createContext,
  defineWompo,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
  html
} from "wompo";
const buildTreeStructure = (origin, childNodes, structure = [], parent = null) => {
  childNodes.forEach((child) => {
    if (child instanceof Route.class) {
      const props = child.props;
      const lazyComp = props.lazy ? lazy(props.lazy) : null;
      const path = parent === null && origin ? (props.path.startsWith("/") ? props.path.substring(0, props.path.length - 1) : props.path) + origin : props.path;
      const route = {
        ...props,
        parent,
        element: props.element,
        path,
        lazy: lazyComp,
        fallback: props.fallback,
        index: null,
        children: []
      };
      if (props.index)
        parent.index = route;
      structure.push(route);
      buildTreeStructure(origin, child.childNodes, route.children, route);
    }
  });
  return structure;
};
const getRoutes = (treeStructure, paths = [], parent = "") => {
  for (const route of treeStructure) {
    let newRoute = "";
    if (route.path) {
      const slash = parent && !parent.endsWith("/") || !parent && !route.path.startsWith("/") ? "/" : "";
      newRoute += parent + slash + route.path;
      paths.push([newRoute, route]);
    }
    if (route.children) {
      getRoutes(route.children, paths, newRoute);
    }
  }
  return paths;
};
const getWichParametricRouteisMoreSpecific = (routes) => {
  const parametricPaths = Object.keys(routes);
  parametricPaths.sort((a, b) => {
    const matchA = routes[a];
    const matchB = routes[b];
    const dynamicsA = Object.keys(matchA).filter((key) => key !== "segments").length;
    const dynamicsB = Object.keys(matchB).filter((key) => key !== "segments").length;
    const difference = dynamicsB - dynamicsA;
    if (difference === 0) {
      let staticsA = a.split("/");
      let staticsB = b.split("/");
      const lengthDifference = staticsB.length - staticsA.length;
      if (lengthDifference !== 0)
        return lengthDifference;
      let staticsALength = 0;
      let staticsBLength = 0;
      for (let i = 0; i < staticsA.length; i++) {
        const sA = staticsA[i];
        const sB = staticsB[i];
        if (!sA.startsWith(":"))
          staticsALength++;
        if (!sB.startsWith(":"))
          staticsBLength++;
        if (sA.startsWith(":") || sB.startsWith(":") || sA.startsWith("*") || sB.startsWith("*"))
          break;
      }
      return staticsBLength - staticsALength;
    }
    return difference;
  });
  return routes[parametricPaths[0]];
};
const getSearchObject = (searchString) => {
  const search = {};
  searchString.split("&").forEach((keyVal) => {
    const [key, value] = keyVal.split("=");
    search[key] = value;
  });
  return search;
};
const getMatch = (routes, broswerRoute) => {
  const matches = {
    exact: null,
    parametric: {},
    fallbacks: {}
  };
  const currentRoute = broswerRoute !== "/" && broswerRoute.endsWith("/") ? broswerRoute.substring(0, broswerRoute.length - 1) : broswerRoute;
  for (const routeStructure of routes) {
    const [routePath, route] = routeStructure;
    const isFallback = routePath.endsWith("*");
    if (!isFallback && routePath.split("/").length !== currentRoute.split("/").length)
      continue;
    if (routePath === currentRoute) {
      matches.exact = route;
      break;
    }
    if (!routePath.includes(":") && !routePath.includes("*"))
      continue;
    const segments = routePath.split("/");
    let regex = "";
    const paramNames = [];
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      regex += "\\/";
      if (segment.startsWith(":")) {
        if (i === segments.length - 1)
          regex += "(.*)";
        else
          regex += "(.*?)";
        paramNames.push(segment.substring(1));
      } else if (segment === "*") {
        regex += "(.*)";
        paramNames.push("segments");
      } else {
        regex += segment;
      }
    }
    const matchRegex = new RegExp(regex, "g");
    const match2 = matchRegex.exec(currentRoute);
    if (match2) {
      const params = {};
      for (let i = 1; i < match2.length; i++) {
        if (match2[i].includes("?")) {
          const [param, searchString] = match2[i].split("?");
          match2[i] = param;
          params.search = getSearchObject(searchString);
        }
        params[paramNames[i - 1]] = match2[i];
      }
      if (isFallback)
        matches.fallbacks[routePath] = [route, params];
      else
        matches.parametric[routePath] = [route, params];
    }
  }
  const parametricPaths = Object.keys(matches.parametric);
  const fallbackPaths = Object.keys(matches.fallbacks);
  let match = [null, null];
  if (matches.exact) {
    match = [matches.exact, {}];
  } else if (parametricPaths.length) {
    match = getWichParametricRouteisMoreSpecific(matches.parametric);
  } else if (fallbackPaths.length) {
    match = getWichParametricRouteisMoreSpecific(matches.fallbacks);
  }
  const redirect = match[0]?.redirect || match[0]?.index?.redirect;
  if (redirect) {
    const newPath = getHref(redirect, match[0], match[1]);
    history.replaceState({}, void 0, newPath);
    match = getMatch(routes, newPath);
  }
  return match;
};
const getRouteContent = (route) => {
  if (!route)
    return null;
  return html`
		<${SingleRouteContext.Provider} value=${{ ...route }}>
			${route.lazy ? route.fallback ? html`
							<${Suspense} fallback=${route.fallback}>
								<${route.lazy} />
							</${Suspense}>
						` : html`<${route.lazy} />` : route.element}
		</${SingleRouteContext.Provider}>
	`;
};
const RouterContext = createContext({
  params: null,
  hash: null,
  currentRoute: null,
  setNewRoute: null,
  routes: []
});
const scrollIntoView = (hash) => {
  if (hash) {
    const element = document.getElementById(hash);
    if (element)
      element.scrollIntoView({ block: "start", behavior: "smooth" });
  }
};
export function Routes({ origin, notFoundElement, children }) {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const treeStructure = useMemo(() => {
    const tree = buildTreeStructure(origin, children.nodes);
    return tree;
  }, []);
  const routes = useMemo(() => getRoutes(treeStructure), []);
  const hash = window.location.hash.split("#")[1];
  const [route, params] = getMatch(routes, currentRoute);
  const setNewRoute = useCallback((newRoute, pushState = true) => {
    setCurrentRoute((prevRoute) => {
      const nextRoute2 = getHref(newRoute, route, params);
      const [pathname, hash2] = nextRoute2.split("#");
      if (pushState && prevRoute !== nextRoute2) {
        history.pushState({}, null, nextRoute2);
      } else if (!pushState && prevRoute !== nextRoute2) {
        history.replaceState({}, null, nextRoute2);
      }
      scrollIntoView(hash2);
      return pathname;
    });
  });
  useEffect(() => {
    window.addEventListener("popstate", () => {
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
    () => ({
      hash,
      params,
      currentRoute,
      setNewRoute,
      routes
    }),
    [currentRoute]
  );
  let root = { notFound: true };
  if (route) {
    root = route;
    if (route.meta?.title) {
      document.title = route.meta.title;
      const ogMeta = document.querySelector('meta[property="og:title"]');
      if (ogMeta)
        ogMeta.setAttribute("content", route.meta.title);
    }
    if (route.meta?.description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta)
        meta.setAttribute("content", route.meta.description);
      const ogMeta = document.querySelector('meta[property="og:description"]');
      if (ogMeta)
        ogMeta.setAttribute("content", route.meta.description);
    }
  }
  let nextRoute = null;
  root.nextRoute = nextRoute;
  while (root.parent) {
    nextRoute = root;
    root = root.parent;
    root.nextRoute = nextRoute;
  }
  return html`<${RouterContext.Provider} value=${context}>
		${root.notFound ? notFoundElement ?? html`<div class="wompo-router-not-found">Not found!</div>` : getRouteContent(root)}
	</${RouterContext.Provider}>`;
}
defineWompo(Routes, {
  name: "womp-routes"
});
const SingleRouteContext = createContext(null);
export function Route(_) {
  return html``;
}
defineWompo(Route, {
  name: "wompo-route"
});
export function ChildRoute() {
  const route = useContext(SingleRouteContext);
  let toRender = null;
  if (route) {
    const newRoute = route.nextRoute;
    if (newRoute) {
      toRender = newRoute;
    } else if (route.index) {
      toRender = route.index;
    }
  }
  return getRouteContent(toRender);
}
defineWompo(ChildRoute, {
  name: "wompo-child-route"
});
const getHref = (to, route, params) => {
  let href = to;
  if (!href.startsWith("/") && !href.startsWith("#") && route) {
    let parentRoute = route;
    while (parentRoute) {
      const parentPath = parentRoute.path;
      if (parentPath) {
        const slash = !parentPath.endsWith("/") ? "/" : "";
        let parentRoutePath = parentRoute.path;
        if (parentRoutePath.includes(":")) {
          const paths = parentRoutePath.split("/");
          paths.filter((p) => p.startsWith(":")).map((p) => p.substring(1)).forEach((param) => {
            parentRoutePath = parentRoutePath.replace(`:${param}`, params[param]);
          });
        }
        href = parentRoutePath + slash + href;
      }
      parentRoute = parentRoute.parent;
    }
  }
  return href;
};
export function Link({ to, target, children }) {
  const navigate = useNavigate();
  const route = useContext(SingleRouteContext);
  const routes = useRoutes();
  const params = useParams();
  const href = getHref(to, route, params);
  const onLinkClick = (ev) => {
    if (!target) {
      ev.preventDefault();
      navigate(href);
    }
  };
  const preload = () => {
    const [route2] = getMatch(routes, href.split("#")[0]);
    if (route2 && route2.lazy)
      route2.lazy();
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
  name: "wompo-link"
});
export function NavLink({ to, target, children }) {
  const navigate = useNavigate();
  const currentRoute = useCurrentRoute();
  const params = useParams();
  const routes = useRoutes();
  const route = useContext(SingleRouteContext);
  const href = getHref(to, route, params);
  const onLinkClick = (ev) => {
    if (!target) {
      ev.preventDefault();
      navigate(href);
    }
  };
  const preload = () => {
    const [route2] = getMatch(routes, href.split("#")[0]);
    if (route2 && route2.lazy)
      route2.lazy();
  };
  const isActive = currentRoute === href;
  return html`<a
		class=${isActive && "active"}
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
  name: "wompo-nav-link"
});
export const useParams = () => {
  const routerContext = useContext(RouterContext);
  return routerContext.params;
};
export const useNavigate = () => {
  const routerContext = useContext(RouterContext);
  return routerContext.setNewRoute;
};
export const useCurrentRoute = () => {
  const routerContext = useContext(RouterContext);
  return routerContext.currentRoute;
};
export const useRoutes = () => {
  const routerContext = useContext(RouterContext);
  return routerContext.routes;
};
