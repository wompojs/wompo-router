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
export declare function Routes({ children }: RoutesProps): any;
interface RouteProps extends WompProps {
    path?: string;
    index?: boolean;
    element?: RenderHtml;
    lazy?: () => LazyCallbackResult;
    fallback?: RenderHtml;
    route?: RouteStructure;
}
export declare function Route({ route }: RouteProps): any;
export declare function ChildRoute(): any;
interface LinkProps extends WompProps {
    to: string;
}
export declare function Link({ to, children }: LinkProps): any;
export declare namespace Link {
    var css: string;
}
export declare const useParams: () => any;
export declare const useNavigate: () => (newValue: string, push?: boolean) => void;
export {};
