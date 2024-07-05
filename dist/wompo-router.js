import{createContext as w,defineWompo as b,lazy as O,useCallback as j,useContext as k,useEffect as v,useMemo as W,useState as M,Suspense as z,html as y}from"wompo";const F=typeof global<"u";F&&(global.window={location:{pathname:"/",hash:""},addEventListener:()=>{},scrollTo:()=>{}});const L=(t,e=[],n=null)=>(t.forEach(o=>{if(o instanceof Route.class){const s=o.props,u=s.lazy?O(s.lazy):null,r={...s,parent:n,element:s.element,path:s.path,lazy:u,fallback:s.fallback,index:null,children:[]};s.index&&(n.index=r),e.push(r),L(o.childNodes,r.children,r)}}),e),N=(t,e=[],n="")=>{for(const o of t){let s="";if(o.path){const u=n&&!n.endsWith("/")||!n&&!o.path.startsWith("/")?"/":"";s+=n+u+o.path,e.push([s,o])}o.children&&N(o.children,e,s)}return e},A=t=>{const e=Object.keys(t);return e.sort((n,o)=>{const s=t[n],u=t[o],r=Object.keys(s).filter(i=>i!=="segments").length,l=Object.keys(u).filter(i=>i!=="segments").length-r;if(l===0){let i=n.split("/"),a=o.split("/");const d=a.length-i.length;if(d!==0)return d;let p=0,h=0;for(let m=0;m<i.length;m++){const x=i[m],g=a[m];if(x.startsWith(":")||p++,g.startsWith(":")||h++,x.startsWith(":")||g.startsWith(":")||x.startsWith("*")||g.startsWith("*"))break}return h-p}return l}),t[e[0]]},C=(t,e)=>{const n={exact:null,parametric:{},fallbacks:{}},o=e!=="/"&&e.endsWith("/")?e.substring(0,e.length-1):e;for(const l of t){const[i,a]=l,d=i.endsWith("*");if(!d&&i.split("/").length!==o.split("/").length)continue;if(i===o){n.exact=a;break}if(!i.includes(":")&&!i.includes("*"))continue;const p=i.split("/");let h="";const m=[];for(let f=1;f<p.length;f++){const R=p[f];h+="\\/",R.startsWith(":")?(f===p.length-1?h+="(.*)":h+="(.*?)",m.push(R.substring(1))):R==="*"?(h+="(.*)",m.push("segments")):h+=R}const g=new RegExp(h,"g").exec(o);if(g){const f={};for(let R=1;R<g.length;R++)f[m[R-1]]=g[R];d?n.fallbacks[i]=[a,f]:n.parametric[i]=[a,f]}}const s=Object.keys(n.parametric),u=Object.keys(n.fallbacks);let r=[null,null];n.exact?r=[n.exact,{}]:s.length?r=A(n.parametric):u.length&&(r=A(n.fallbacks));const c=r[0]?.redirect||r[0]?.index?.redirect;if(c){const l=E(e,c);history.replaceState({},void 0,l),r=C(t,l)}return r},E=(t,e)=>e.startsWith("/")?e:t+(t.endsWith("/")||e.startsWith("#")?"":"/")+e,B=t=>t?y`
		<${P.Provider} value=${{...t}}>
			${t.lazy?t.fallback?y`
							<${z} fallback=${t.fallback}>
								<${t.lazy} />
							</${z}>
						`:y`<${t.lazy} />`:t.element}
		</${P.Provider}>
	`:null,S=w({params:null,hash:null,currentRoute:null,setNewRoute:null,routes:[]}),$=t=>{if(t){const e=document.getElementById(t);e&&e.scrollIntoView({block:"start",behavior:"smooth"})}};export function Routes({children:t}){const[e,n]=M(window.location.pathname),o=j((p,h=!0)=>{n(m=>{const x=E(m,p),[g,f]=x.split("#");return h&&m!==x&&history.pushState({},null,x),$(f),g})}),s=W(()=>L(t.nodes),[]),u=W(()=>N(s),[]);v(()=>{window.addEventListener("popstate",()=>{o(window.location.pathname,!1)})},[]);const r=window.location.hash.split("#")[1],[c,l]=C(u,e);v(()=>{window.scrollTo(0,0),c.lazy?c.lazy().then(()=>{setTimeout(()=>{$(r)})}):$(r)},[e]);const i=W(()=>({hash:r,params:l,currentRoute:e,setNewRoute:o,routes:u}),[e]);let a={notFound:!0};if(c){if(a=c,c.meta?.title){document.title=c.meta.title;const p=document.querySelector('meta[property="og:title"]');p&&p.setAttribute("content",c.meta.title)}if(c.meta?.description){const p=document.querySelector('meta[name="description"]');p&&p.setAttribute("content",c.meta.description);const h=document.querySelector('meta[property="og:description"]');h&&h.setAttribute("content",c.meta.description)}}let d=null;for(a.nextRoute=d;a.parent;)d=a,a=a.parent,a.nextRoute=d;return y`<${S.Provider} value=${i}>
		${a.notFound?y`<div>Not found!</div>`:B(a)}
	</${S.Provider}>`}b(Routes,{name:"womp-routes"});const P=w(null);export function Route(t){return y``}b(Route,{name:"wompo-route"});export function ChildRoute(){const t=k(P);let e=null;if(t){const n=t.nextRoute;n?e=n:t.index&&(e=t.index)}return B(e)}b(ChildRoute,{name:"wompo-child-route"});const H=(t,e)=>{let n=t;if(!n.startsWith("/")&&!n.startsWith("#")){let o=e;for(;o;){const s=o.path;if(s){const u=s.endsWith("/")?"":"/";n=o.path+u+n}o=o.parent}}return n};export function Link({to:t,children:e}){const n=useNavigate(),o=k(P),s=useRoutes(),u=H(t,o),r=l=>{l.preventDefault(),n(u)},c=()=>{const[l]=C(s,u.split("#")[0]);l&&l.lazy&&l.lazy()};return y`<a href=${u} @click=${r} @mouseenter=${c} @touchstart=${c}>
		${e}
	</a>`}Link.css=":host { display: inline-block; }",b(Link,{name:"wompo-link"});export function NavLink({to:t,children:e}){const n=useNavigate(),o=useCurrentRoute(),s=useRoutes(),u=k(P),r=H(t,u),c=a=>{a.preventDefault(),n(r)},l=()=>{const[a]=C(s,r.split("#")[0]);a&&a.lazy&&a.lazy()};return y`<a
		class=${o===r&&"active"}
		href=${r}
		@click=${c}
		@mouseenter=${l}
		@touchstart=${l}
	>
		${e}
	</a>`}NavLink.css=":host { display: inline-block; }",b(NavLink,{name:"wompo-nav-link"});export const useParams=()=>k(S).params,useNavigate=()=>k(S).setNewRoute,useCurrentRoute=()=>k(S).currentRoute,useRoutes=()=>k(S).routes;
