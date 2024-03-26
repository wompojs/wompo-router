import { type LazyCallbackResult, type LazyResult, RenderHtml, WompProps } from 'womp';
interface RoutesProps extends WompProps {
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
export declare function Routes({ children }: RoutesProps): RenderHtml;
interface RouteProps extends WompProps {
    path?: string;
    index?: boolean;
    redirect?: string;
    element?: RenderHtml;
    lazy?: () => LazyCallbackResult;
    fallback?: RenderHtml;
    route?: RouteStructure;
}
export declare function Route({ route }: RouteProps): RenderHtml;
export declare function ChildRoute(): RenderHtml;
interface LinkProps extends WompProps {
    to: string;
}
export declare function Link({ to, children }: LinkProps): RenderHtml;
export declare namespace Link {
    var css: string;
}
export declare function NavLink({ to, children }: LinkProps): RenderHtml;
export declare namespace NavLink {
    var css: string;
}
export declare const useParams: () => any;
export declare const useNavigate: () => (newValue: string, push?: boolean) => void;
export declare const useCurrentRoute: () => string;
export {};
