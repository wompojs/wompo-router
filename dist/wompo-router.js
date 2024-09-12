import{createContext as M,defineWompo as w,lazy as F,useCallback as T,useContext as P,useEffect as A,useMemo as W,useState as q,Suspense as E,html as b}from"wompo";const j=(n,t,s=[],o=null)=>(t.forEach(r=>{if(r instanceof Route.class){const a=r.props,c=a.lazy?F(a.lazy):null,h=o===null&&n?(a.path.startsWith("/")?a.path.substring(0,a.path.length-1):a.path)+n:a.path,e={...a,parent:o,element:a.element,path:h,lazy:c,fallback:a.fallback,index:null,children:[]};a.index&&(o.index=e),s.push(e),j(n,r.childNodes,e.children,e)}}),s),B=(n,t=[],s="")=>{for(const o of n){let r="";if(o.path){const a=s&&!s.endsWith("/")||!s&&!o.path.startsWith("/")?"/":"";r+=s+a+o.path,o.fullPath=r,t.push([r,o])}o.children&&B(o.children,t,r)}return t},H=n=>{const t=Object.keys(n);return t.sort((s,o)=>{const r=n[s],a=n[o],c=Object.keys(r).filter(u=>u!=="segments").length,e=Object.keys(a).filter(u=>u!=="segments").length-c;if(e===0){let u=s.split("/"),p=o.split("/");const m=p.length-u.length;if(m!==0)return m;let i=0,y=0;for(let x=0;x<u.length;x++){const l=u[x],f=p[x];if(l.startsWith(":")||i++,f.startsWith(":")||y++,l.startsWith(":")||f.startsWith(":")||l.startsWith("*")||f.startsWith("*"))break}return y-i}return e}),n[t[0]]},D=n=>{if(!n)return{};const t={};return n.split("&").forEach(s=>{const[o,r]=s.split("=");t[o]=r}),t},$=(n,t)=>{const s={exact:null,parametric:{},fallbacks:{}},o=t!=="/"&&t.endsWith("/")?t.substring(0,t.length-1):t,[r,a]=o.split("?");for(const p of n){const[m,i]=p,y=m.endsWith("*");if(!y&&m.split("/").length!==r.split("/").length)continue;if(m===r){s.exact=i;break}if(!m.includes(":")&&!m.includes("*"))continue;const x=m.split("/");let l="";const f=[];for(let R=1;R<x.length;R++){const g=x[R];l+="\\/",g.startsWith(":")?(R===x.length-1?l+="(.*)":l+="(.*?)",f.push(g.substring(1))):g==="*"?(l+="(.*)?",f.push("segments")):l+=g}const S=new RegExp(l,"g"),k=r+(l.endsWith("(.*)?")&&!r.endsWith("/")?"/":""),C=S.exec(k);if(C){const R={};for(let g=1;g<C.length;g++){let z=C[g]??"";if(f[g-1]==="segments"){const N=z?z.split("/"):[];N.pop(),R[f[g-1]]=N}else R[f[g-1]]=z}y?s.fallbacks[m]=[i,R]:s.parametric[m]=[i,R]}}const c=Object.keys(s.parametric),h=Object.keys(s.fallbacks);let e=[null,null];s.exact?e=[s.exact,{}]:c.length?e=H(s.parametric):h.length&&(e=H(s.fallbacks));const u=e[0]?.redirect||e[0]?.index?.redirect;if(u){const p=v(u,e[0],e[1]);history.replaceState({},void 0,p),e=$(n,p)}return e[1]&&(e[1].search=D(a)),e},O=n=>{const t=n.singleRoute;return b`
		<${d.Provider} value=${n}>
			${t?.lazy?t.fallback?b`
							<${E} fallback=${t.fallback}>
								<${t.lazy} />
							</${E}>
						`:b`<${t.lazy} />`:t?.element}
		</${d.Provider}>
	`},d=M({params:null,hash:null,currentRoute:null,setNewRoute:null,routes:[],route:null,singleRoute:null}),L=n=>{if(n){const t=document.getElementById(n);t&&t.scrollIntoView({block:"start",behavior:"smooth"})}};export function Routes({origin:n,notFoundElement:t,children:s}){const[o,r]=q(window.location.pathname+window.location.search),a=W(()=>j(n,s.nodes),[]),c=W(()=>B(a),[]),h=window.location.hash.split("#")[1],[e,u]=$(c,o),p=T((l,f=!0)=>{r(S=>{const k=v(l,e,u),[C,R]=k.split("#");return f&&S!==k?history.pushState({},null,k):!f&&S!==k&&history.replaceState({},null,k),L(R),k.startsWith("#")?S:C})},[e,u]);A(()=>{window.addEventListener("popstate",()=>{p(window.location.pathname,!1)})},[]),A(()=>{window.scrollTo(0,0),e?.lazy?e.lazy().then(()=>{setTimeout(()=>{L(h)})}):L(h)},[o]);const m=W(()=>({hash:h,params:u,currentRoute:o,setNewRoute:p,routes:c,route:e}),[o]);let i={notFound:!0};if(e){if(i=e,e.meta?.title){document.title=e.meta.title;const l=document.querySelector('meta[property="og:title"]');l&&l.setAttribute("content",e.meta.title)}if(e.meta?.description){const l=document.querySelector('meta[name="description"]');l&&l.setAttribute("content",e.meta.description);const f=document.querySelector('meta[property="og:description"]');f&&f.setAttribute("content",e.meta.description)}}let y=null;for(i.nextRoute=y;i.parent;)y=i,i=i.parent,i.nextRoute=y;const x=W(()=>({...m,singleRoute:i}),[o]);return b`<${d.Provider} value=${m}>
		${i.notFound?t??b`<div class="wompo-router-not-found">Not found!</div>`:O(x)}
	</${d.Provider}>`}w(Routes,{name:"wompo-routes"});export function Route(n){return b``}w(Route,{name:"wompo-route"});export function ChildRoute(){const n=P(d),t=n.singleRoute;let s=null;if(t){const r=t.nextRoute;r?s=r:t.index&&(s=t.index)}const o=W(()=>({...n,singleRoute:s}),[n]);return O(o)}w(ChildRoute,{name:"wompo-child-route"});const v=(n,t,s)=>{let o=n;if(!o.startsWith("/")&&!o.startsWith("#")&&t){let r=t;for(;r;){const a=r.path;if(a){let c=a;c.includes(":")&&c.split("/").filter(u=>u.startsWith(":")).map(u=>u.substring(1)).forEach(u=>{c=c.replace(`:${u}`,s[u])}),c.includes("*")&&(c=c.replace("*",s.segments.join("/")));const h=!c.endsWith("/")&&!o.startsWith("/")?"/":"";o=c+h+o}r=r.parent}}return o};export function Link({to:n,target:t,children:s}){const o=useNavigate(),{singleRoute:r}=P(d),a=useRoutes(),c=useParams(),h=v(n,r,c),e=p=>{t||(p.preventDefault(),o(h))},u=()=>{const[p]=$(a,h.split("#")[0]);p&&p.lazy&&p.lazy()};return b`<a
		href=${h}
		target=${t}
		@click=${e}
		@mouseenter=${u}
		@touchstart=${u}
	>
		${s}
	</a>`}Link.css=":host { display: inline-block; }",w(Link,{name:"wompo-link"});export function NavLink({to:n,target:t,children:s}){const o=useNavigate(),r=useCurrentRoute(),a=useParams(),c=useRoutes(),{singleRoute:h}=P(d),e=v(n,h,a),u=i=>{t||(i.preventDefault(),o(e))},p=()=>{const[i]=$(c,e.split("#")[0]);i&&i.lazy&&i.lazy()};return b`<a
		class=${r===e&&"active"}
		href=${e}
		target=${t}
		@click=${u}
		@mouseenter=${p}
		@touchstart=${p}
	>
		${s}
	</a>`}NavLink.css=":host { display: inline-block; }",w(NavLink,{name:"wompo-nav-link"});export const useParams=()=>P(d).params,useNavigate=()=>P(d).setNewRoute,useCurrentRoute=()=>P(d).currentRoute,useRoute=()=>P(d).route,useRoutes=()=>P(d).routes;
//# sourceMappingURL=wompo-router.js.map
