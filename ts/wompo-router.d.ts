import { type LazyCallbackResult, type LazyResult, RenderHtml, WompoProps } from 'wompo';
interface RoutesProps extends WompoProps {
    notFoundElement?: RenderHtml;
    origin?: string;
}
interface RouteStructure extends Omit<RouteProps, 'index' | 'children' | 'lazy'> {
    parent: RouteStructure;
    element: RenderHtml;
    path: string;
    children: RouteStructure[];
    index: RouteStructure;
    nextRoute?: RouteStructure;
    fallback: RenderHtml;
    lazy: LazyResult;
}
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
 * - origin: specifies the url location on where the routing starts (e.g. "/admin").
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
export declare function Routes({ origin, notFoundElement, children }: RoutesProps): RenderHtml;
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
export declare function Route(_: RouteProps): RenderHtml;
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
export declare function ChildRoute(): RenderHtml;
interface LinkProps extends WompoProps {
    to: string;
    target?: string;
}
/**
 * This component will render a link to navigate through the routes. You should use this component
 * instead of a simple `a` tag to navigate through your application, so that you use the pure client
 * routing system, without fetching the whole page through the server.
 *
 * It accepts the following props:
 * - to: required. The url of the link. If the link doesn't start with a slash ("/"), it will be
 *   positioned in the current route (e.g.: if the current route is "/users" and the `to` prop is
 *   "20", the link will go to "/users/20", not "/20").
 * - target: the target of the link.
 */
export declare function Link({ to, target, children }: LinkProps): RenderHtml;
export declare namespace Link {
    var css: string;
}
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
 *   "20", the link will go to "/users/20", not "/20").
 * - target: the target of the link.
 */
export declare function NavLink({ to, target, children }: LinkProps): RenderHtml;
export declare namespace NavLink {
    var css: string;
}
/**
 * This hook will return the current url parameters and search parameters of the current route.
 * Also, the components using this hook will automatically re-render whenver the current route
 * changes.
 */
export declare const useParams: () => any;
/**
 * This hook will return function that can be used to manually navigate through the routes.
 * The function accepts two parameters: the new route (which has the same behavior of the "to" prop
 * in the `Link` component) and then a boolean value (default `true`) to indicate whether the new
 * route should be pushed or not in the history.
 */
export declare const useNavigate: () => (newValue: string, push?: boolean) => void;
/**
 * This hook will return all the data of the current route, and will re-render the component whenver
 * the current route changes.
 */
export declare const useCurrentRoute: () => string;
/**
 * This hook will return the whole routes object that the `Routes` component uses to render the
 * correct routes.
 */
export declare const useRoutes: () => [string, RouteStructure][];
export {};
