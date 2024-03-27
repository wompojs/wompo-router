import {
  createContext,
  defineWomp,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
  html
} from "womp";
const buildTreeStructure = (childNodes, structure = [], parent = null, toPreload = []) => {
  childNodes.forEach((child) => {
    if (child instanceof Route.class) {
      const props = child.props;
      const lazyComp = props.lazy ? lazy(props.lazy) : null;
      const route = {
        ...props,
        parent,
        element: props.element,
        path: props.path,
        lazy: lazyComp,
        fallback: props.fallback,
        index: null,
        children: []
      };
      if (lazyComp)
        toPreload.push(lazyComp);
      if (props.index)
        parent.index = route;
      structure.push(route);
      buildTreeStructure(child.childNodes, route.children, route, toPreload);
    }
  });
  return [structure, toPreload];
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
    const newPath = getFullPath(broswerRoute, redirect);
    history.replaceState({}, void 0, newPath);
    match = getMatch(routes, newPath);
  }
  return match;
};
const getFullPath = (prevRoute, newRoute) => {
  return newRoute.startsWith("/") ? newRoute : prevRoute + (prevRoute.endsWith("/") || newRoute.startsWith("#") ? "" : "/") + newRoute;
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
  setNewRoute: null
});
const scrollIntoView = (hash) => {
  if (hash) {
    const element = document.getElementById(hash);
    const y = element.getBoundingClientRect().top + window.scrollY + 60;
    if (element)
      element.scrollIntoView({ block: "start", behavior: "smooth" });
  }
};
export function Routes({ children }) {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const setNewRoute = useCallback((newRoute, pushState = true) => {
    setCurrentRoute((prevRoute) => {
      const nextRoute2 = getFullPath(prevRoute, newRoute);
      const [pathname, hash] = nextRoute2.split("#");
      if (pushState && prevRoute !== nextRoute2) {
        history.pushState({}, null, nextRoute2);
        if (!hash)
          window.scrollTo(0, 0);
      }
      scrollIntoView(hash);
      return pathname;
    });
  });
  const treeStructure = useMemo(() => {
    const [tree, toPreload] = buildTreeStructure(children.nodes);
    if (window.requestIdleCallback) {
      toPreload.forEach((asyncComponent) => {
        requestIdleCallback(asyncComponent);
      });
    } else {
      setTimeout(() => {
        toPreload.forEach((asyncComponent) => {
          asyncComponent();
        });
      }, 4e3);
    }
    return tree;
  }, []);
  const routes = useMemo(() => getRoutes(treeStructure), []);
  useEffect(() => {
    window.addEventListener("popstate", () => {
      window.scrollTo(0, 0);
      setNewRoute(window.location.pathname, false);
    });
    setTimeout(() => {
      scrollIntoView(context.hash);
    }, 200);
  }, []);
  const [route, params] = getMatch(routes, currentRoute);
  const context = useMemo(
    () => ({
      hash: window.location.hash.split("#")[1],
      params,
      currentRoute,
      setNewRoute
    }),
    [currentRoute]
  );
  let root = route ?? { notFound: true };
  let nextRoute = null;
  root.nextRoute = nextRoute;
  while (root.parent) {
    nextRoute = root;
    root = root.parent;
    root.nextRoute = nextRoute;
  }
  return html`<${RouterContext.Provider} value=${context}>
		${root.notFound ? html`<div>Not found!</div>` : getRouteContent(root)}
	</${RouterContext.Provider}>`;
}
defineWomp(Routes, {
  name: "womp-routes"
});
const SingleRouteContext = createContext(null);
export function Route({ route }) {
  return html``;
}
defineWomp(Route, {
  name: "womp-route"
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
defineWomp(ChildRoute, {
  name: "womp-child-route"
});
const getHref = (to, route) => {
  let href = to;
  if (!href.startsWith("/") && !href.startsWith("#")) {
    let parentRoute = route;
    while (parentRoute) {
      const parentPath = parentRoute.path;
      if (parentPath) {
        const slash = !parentPath.endsWith("/") ? "/" : "";
        href = parentRoute.path + slash + href;
      }
      parentRoute = parentRoute.parent;
    }
  }
  return href;
};
export function Link({ to, children }) {
  const navigate = useNavigate();
  const route = useContext(SingleRouteContext);
  const href = getHref(to, route);
  const onLinkClick = (ev) => {
    ev.preventDefault();
    navigate(href);
  };
  return html`<a href=${href} @click=${onLinkClick}>${children}</a> `;
}
Link.css = `:host { display: inline-block; }`;
defineWomp(Link, {
  name: "womp-link"
});
export function NavLink({ to, children }) {
  const navigate = useNavigate();
  const currentRoute = useCurrentRoute();
  const route = useContext(SingleRouteContext);
  const href = getHref(to, route);
  const onLinkClick = (ev) => {
    ev.preventDefault();
    navigate(href);
  };
  const isActive = currentRoute === href;
  return html`<a class=${isActive && "active"} href=${href} @click=${onLinkClick}>${children}</a>`;
}
NavLink.css = `:host { display: inline-block; }`;
defineWomp(NavLink, {
  name: "womp-nav-link"
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
