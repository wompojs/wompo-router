import{createContext as C,defineWomp as P,lazy as B,useCallback as E,useContext as k,useEffect as O,useMemo as W,useState as j,Suspense as v,html as d,useRef as H}from"womp";const $=(t,e=[],n=null)=>(t.forEach(r=>{if(r instanceof Route.class){const o=r.props;console.log(o);const u={...o,parent:n,element:o.element,path:o.path,lazy:o.lazy?B(o.lazy):null,fallback:o.fallback,index:null,children:[]};o.index&&(n.index=u),e.push(u),$(r.childNodes,u.children,u)}}),e),w=(t,e=[],n="")=>{for(const r of t){let o="";if(r.path){const u=n&&!n.endsWith("/")||!n&&!r.path.startsWith("/")?"/":"";o+=n+u+r.path,e.push([o,r])}r.children&&w(r.children,e,o)}return e},L=t=>{const e=Object.keys(t);return e.sort((n,r)=>{const o=t[n],u=t[r],a=Object.keys(o).filter(s=>s!=="segments").length,c=Object.keys(u).filter(s=>s!=="segments").length-a;if(c===0){let s=n.split("/"),l=r.split("/");const g=l.length-s.length;if(g!==0)return g;let m=0,p=0;for(let i=0;i<s.length;i++){const b=s[i],x=l[i];if(b.startsWith(":")||m++,x.startsWith(":")||p++,b.startsWith(":")||x.startsWith(":")||b.startsWith("*")||x.startsWith("*"))break}return p-m}return c}),t[e[0]]},z=(t,e)=>{const n={exact:null,parametric:{},fallbacks:{}},r=e!=="/"&&e.endsWith("/")?e.substring(0,e.length-1):e;for(const c of t){const[s,l]=c,g=s.endsWith("*");if(!g&&s.split("/").length!==r.split("/").length)continue;if(s===r){n.exact=l;break}if(!s.includes(":")&&!s.includes("*"))continue;const m=s.split("/");let p="";const i=[];for(let R=1;R<m.length;R++){const f=m[R];p+="\\/",f.startsWith(":")?(R===m.length-1?p+="(.*)":p+="(.*?)",i.push(f.substring(1))):f==="*"?(p+="(.*)",i.push("segments")):p+=f}const x=new RegExp(p,"g").exec(r);if(x){const R={};for(let f=1;f<x.length;f++)R[i[f-1]]=x[f];g?n.fallbacks[s]=[l,R]:n.parametric[s]=[l,R]}}const o=Object.keys(n.parametric),u=Object.keys(n.fallbacks);let a=[null,null];n.exact?a=[n.exact,{}]:o.length?a=L(n.parametric):u.length&&(a=L(n.fallbacks));const h=a[0].redirect||a[0].index?.redirect;if(h){const c=N(e,h);history.replaceState({},void 0,c),a=z(t,c)}return a},N=(t,e)=>e.startsWith("/")?e:t+(t.endsWith("/")?"":"/")+e,A=t=>t?d`
		<${S.Provider} value=${{...t}}>
			${t.lazy?t.fallback?d`
							<${v} fallback=${t.fallback}>
								<${t.lazy} />
							</${v}>
						`:d`<${t.lazy} />`:t.element}
		</${S.Provider}>
	`:null,y=C({route:null,params:null,currentRoute:null,setNewRoute:null});export function Routes({children:t}){const[e,n]=j(window.location.pathname),r=H({route:null,params:null,currentRoute:null,setNewRoute:null}),o=E((g,m=!0)=>{n(p=>{const i=N(p,g);return m&&p!==i&&(history.pushState({},null,i),r.current.currentRoute=i),i})});r.current.currentRoute=e,r.current.setNewRoute=o;const u=W(()=>$(t.nodes),[]),a=W(()=>w(u),[]);O(()=>{window.addEventListener("popstate",()=>{o(window.location.pathname,!1)})},[]);const[h,c]=z(a,e);if(r.current.params=c,!h)return d`<div>Not found!</div>`;//! Make custom component. Allow to override it.
let s=h,l=null;for(s.nextRoute=l;s.parent;)l=s,s=s.parent,s.nextRoute=l;return r.current.route=s,d`<${y.Provider} value=${r.current}>${A(s)}</${y.Provider}>`}P(Routes,{name:"womp-routes"});const S=C(null);export function Route({route:t}){return d``}P(Route,{name:"womp-route"});export function ChildRoute(){const t=k(S);let e=null;if(t){const n=t.nextRoute;n?e=n:t.index&&(e=t.index)}return A(e)}P(ChildRoute,{name:"womp-child-route"});export function Link({to:t,children:e}){const n=useNavigate(),r=k(S);let o=t;if(!o.startsWith("/")){let a=r;for(;a;){const h=a.path;if(h){const c=h.endsWith("/")?"":"/";o=a.path+c+o}a=a.parent}}return d`<a href=${o} @click=${a=>{a.preventDefault(),n(o)}}>${e}</a> `}Link.css=":host { display: inline-block; }",P(Link,{name:"womp-link"});export function NavLink({to:t,children:e}){const n=useNavigate(),r=useCurrentRoute(),o=k(S);let u=t;if(!u.startsWith("/")){let c=o;for(;c;){const s=c.path;if(s){const l=s.endsWith("/")?"":"/";u=c.path+l+u}c=c.parent}}return d`<a class=${r===u&&"active"} href=${u} @click=${c=>{c.preventDefault(),n(u)}}>${e}</a>`}NavLink.css=":host { display: inline-block; }",P(NavLink,{name:"womp-nav-link"});export const useParams=()=>k(y).params,useNavigate=()=>k(y).setNewRoute,useCurrentRoute=()=>k(y).currentRoute;
