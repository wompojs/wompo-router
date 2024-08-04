import{createContext as z,defineWompo as b,lazy as j,useCallback as M,useContext as k,useEffect as L,useMemo as W,useState as F,Suspense as N,html as y}from"wompo";const A=(t,e,r=[],n=null)=>(e.forEach(c=>{if(c instanceof Route.class){const a=c.props,i=a.lazy?j(a.lazy):null,l=n===null&&t?(a.path.startsWith("/")?a.path.substring(0,a.path.length-1):a.path)+t:a.path,s={...a,parent:n,element:a.element,path:l,lazy:i,fallback:a.fallback,index:null,children:[]};a.index&&(n.index=s),r.push(s),A(t,c.childNodes,s.children,s)}}),r),E=(t,e=[],r="")=>{for(const n of t){let c="";if(n.path){const a=r&&!r.endsWith("/")||!r&&!n.path.startsWith("/")?"/":"";c+=r+a+n.path,e.push([c,n])}n.children&&E(n.children,e,c)}return e},B=t=>{const e=Object.keys(t);return e.sort((r,n)=>{const c=t[r],a=t[n],i=Object.keys(c).filter(o=>o!=="segments").length,s=Object.keys(a).filter(o=>o!=="segments").length-i;if(s===0){let o=r.split("/"),p=n.split("/");const x=p.length-o.length;if(x!==0)return x;let u=0,d=0;for(let h=0;h<o.length;h++){const R=o[h],g=p[h];if(R.startsWith(":")||u++,g.startsWith(":")||d++,R.startsWith(":")||g.startsWith(":")||R.startsWith("*")||g.startsWith("*"))break}return d-u}return s}),t[e[0]]},q=t=>{const e={};return t.split("&").forEach(r=>{const[n,c]=r.split("=");e[n]=c}),e},C=(t,e)=>{const r={exact:null,parametric:{},fallbacks:{}},n=e!=="/"&&e.endsWith("/")?e.substring(0,e.length-1):e;for(const s of t){const[o,p]=s,x=o.endsWith("*");if(!x&&o.split("/").length!==n.split("/").length)continue;if(o===n){r.exact=p;break}if(!o.includes(":")&&!o.includes("*"))continue;const u=o.split("/");let d="";const h=[];for(let m=1;m<u.length;m++){const f=u[m];d+="\\/",f.startsWith(":")?(m===u.length-1?d+="(.*)":d+="(.*?)",h.push(f.substring(1))):f==="*"?(d+="(.*)",h.push("segments")):d+=f}const g=new RegExp(d,"g").exec(n);if(g){const m={};for(let f=1;f<g.length;f++){if(g[f].includes("?")){const[w,O]=g[f].split("?");g[f]=w,m.search=q(O)}m[h[f-1]]=g[f]}x?r.fallbacks[o]=[p,m]:r.parametric[o]=[p,m]}}const c=Object.keys(r.parametric),a=Object.keys(r.fallbacks);let i=[null,null];r.exact?i=[r.exact,{}]:c.length?i=B(r.parametric):a.length&&(i=B(r.fallbacks));const l=i[0]?.redirect||i[0]?.index?.redirect;if(l){const s=$(l,i[0],i[1]);history.replaceState({},void 0,s),i=C(t,s)}return i},H=t=>t?y`
		<${P.Provider} value=${{...t}}>
			${t.lazy?t.fallback?y`
							<${N} fallback=${t.fallback}>
								<${t.lazy} />
							</${N}>
						`:y`<${t.lazy} />`:t.element}
		</${P.Provider}>
	`:null,S=z({params:null,hash:null,currentRoute:null,setNewRoute:null,routes:[]}),v=t=>{if(t){const e=document.getElementById(t);e&&e.scrollIntoView({block:"start",behavior:"smooth"})}};export function Routes({origin:t,notFoundElement:e,children:r}){const[n,c]=F(window.location.pathname),a=W(()=>A(t,r.nodes),[]),i=W(()=>E(a),[]),l=window.location.hash.split("#")[1],[s,o]=C(i,n),p=M((h,R=!0)=>{c(g=>{const m=$(h,s,o),[f,w]=m.split("#");return R&&g!==m?history.pushState({},null,m):!R&&g!==m&&history.replaceState({},null,m),v(w),f})});L(()=>{window.addEventListener("popstate",()=>{p(window.location.pathname,!1)})},[]),L(()=>{window.scrollTo(0,0),s?.lazy?s.lazy().then(()=>{setTimeout(()=>{v(l)})}):v(l)},[n]);const x=W(()=>({hash:l,params:o,currentRoute:n,setNewRoute:p,routes:i}),[n]);let u={notFound:!0};if(s){if(u=s,s.meta?.title){document.title=s.meta.title;const h=document.querySelector('meta[property="og:title"]');h&&h.setAttribute("content",s.meta.title)}if(s.meta?.description){const h=document.querySelector('meta[name="description"]');h&&h.setAttribute("content",s.meta.description);const R=document.querySelector('meta[property="og:description"]');R&&R.setAttribute("content",s.meta.description)}}let d=null;for(u.nextRoute=d;u.parent;)d=u,u=u.parent,u.nextRoute=d;return y`<${S.Provider} value=${x}>
		${u.notFound?e??y`<div class="wompo-router-not-found">Not found!</div>`:H(u)}
	</${S.Provider}>`}b(Routes,{name:"womp-routes"});const P=z(null);export function Route(t){return y``}b(Route,{name:"wompo-route"});export function ChildRoute(){const t=k(P);let e=null;if(t){const r=t.nextRoute;r?e=r:t.index&&(e=t.index)}return H(e)}b(ChildRoute,{name:"wompo-child-route"});const $=(t,e,r)=>{let n=t;if(!n.startsWith("/")&&!n.startsWith("#")&&e){let c=e;for(;c;){const a=c.path;if(a){const i=a.endsWith("/")?"":"/";let l=c.path;l.includes(":")&&l.split("/").filter(o=>o.startsWith(":")).map(o=>o.substring(1)).forEach(o=>{l=l.replace(`:${o}`,r[o])}),n=l+i+n}c=c.parent}}return n};export function Link({to:t,target:e,children:r}){const n=useNavigate(),c=k(P),a=useRoutes(),i=useParams(),l=$(t,c,i),s=p=>{e||(p.preventDefault(),n(l))},o=()=>{const[p]=C(a,l.split("#")[0]);p&&p.lazy&&p.lazy()};return y`<a
		href=${l}
		target=${e}
		@click=${s}
		@mouseenter=${o}
		@touchstart=${o}
	>
		${r}
	</a>`}Link.css=":host { display: inline-block; }",b(Link,{name:"wompo-link"});export function NavLink({to:t,target:e,children:r}){const n=useNavigate(),c=useCurrentRoute(),a=useParams(),i=useRoutes(),l=k(P),s=$(t,l,a),o=u=>{e||(u.preventDefault(),n(s))},p=()=>{const[u]=C(i,s.split("#")[0]);u&&u.lazy&&u.lazy()};return y`<a
		class=${c===s&&"active"}
		href=${s}
		target=${e}
		@click=${o}
		@mouseenter=${p}
		@touchstart=${p}
	>
		${r}
	</a>`}NavLink.css=":host { display: inline-block; }",b(NavLink,{name:"wompo-nav-link"});export const useParams=()=>k(S).params,useNavigate=()=>k(S).setNewRoute,useCurrentRoute=()=>k(S).currentRoute,useRoutes=()=>k(S).routes;
