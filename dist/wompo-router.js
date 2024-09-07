import{createContext as E,defineWompo as C,lazy as T,useCallback as q,useContext as k,useEffect as j,useMemo as L,useState as D,Suspense as B,html as P}from"wompo";const H=(t,n,o=[],r=null)=>(n.forEach(s=>{if(s instanceof Route.class){const a=s.props,i=a.lazy?T(a.lazy):null,m=r===null&&t?(a.path.startsWith("/")?a.path.substring(0,a.path.length-1):a.path)+t:a.path,e={...a,parent:r,element:a.element,path:m,lazy:i,fallback:a.fallback,index:null,children:[]};a.index&&(r.index=e),o.push(e),H(t,s.childNodes,e.children,e)}}),o),O=(t,n=[],o="")=>{for(const r of t){let s="";if(r.path){const a=o&&!o.endsWith("/")||!o&&!r.path.startsWith("/")?"/":"";s+=o+a+r.path,r.fullPath=s,n.push([s,r])}r.children&&O(r.children,n,s)}return n},M=t=>{const n=Object.keys(t);return n.sort((o,r)=>{const s=t[o],a=t[r],i=Object.keys(s).filter(c=>c!=="segments").length,e=Object.keys(a).filter(c=>c!=="segments").length-i;if(e===0){let c=o.split("/"),l=r.split("/");const f=l.length-c.length;if(f!==0)return f;let u=0,R=0;for(let p=0;p<c.length;p++){const h=c[p],d=l[p];if(h.startsWith(":")||u++,d.startsWith(":")||R++,h.startsWith(":")||d.startsWith(":")||h.startsWith("*")||d.startsWith("*"))break}return R-u}return e}),t[n[0]]},I=t=>{if(!t)return{};const n={};return t.split("&").forEach(o=>{const[r,s]=o.split("=");n[r]=s}),n},W=(t,n)=>{const o={exact:null,parametric:{},fallbacks:{}},r=n!=="/"&&n.endsWith("/")?n.substring(0,n.length-1):n,[s,a]=r.split("?");for(const l of t){const[f,u]=l,R=f.endsWith("*");if(!R&&f.split("/").length!==s.split("/").length)continue;if(f===s){o.exact=u;break}if(!f.includes(":")&&!f.includes("*"))continue;const p=f.split("/");let h="";const d=[];for(let x=1;x<p.length;x++){const g=p[x];h+="\\/",g.startsWith(":")?(x===p.length-1?h+="(.*)":h+="(.*?)",d.push(g.substring(1))):g==="*"?(h+="(.*)?",d.push("segments")):h+=g}const y=new RegExp(h,"g"),v=s+(h.endsWith("(.*)?")&&!s.endsWith("/")?"/":""),S=y.exec(v);if(S){const x={};for(let g=1;g<S.length;g++){let z=S[g]??"";if(d[g-1]==="segments"){const A=z?z.split("/"):[];A.pop(),x[d[g-1]]=A}else x[d[g-1]]=z}R?o.fallbacks[f]=[u,x]:o.parametric[f]=[u,x]}}const i=Object.keys(o.parametric),m=Object.keys(o.fallbacks);let e=[null,null];o.exact?e=[o.exact,{}]:i.length?e=M(o.parametric):m.length&&(e=M(o.fallbacks));const c=e[0]?.redirect||e[0]?.index?.redirect;if(c){const l=$(c,e[0],e[1]);history.replaceState({},void 0,l),e=W(t,l)}return e[1]&&(e[1].search=I(a)),e},F=t=>P`
		<${w.Provider} value=${{...t}}>
			${t?.lazy?t.fallback?P`
							<${B} fallback=${t.fallback}>
								<${t.lazy} />
							</${B}>
						`:P`<${t.lazy} />`:t?.element}
		</${w.Provider}>
	`,b=E({params:null,hash:null,currentRoute:null,setNewRoute:null,routes:[],route:null}),N=t=>{if(t){const n=document.getElementById(t);n&&n.scrollIntoView({block:"start",behavior:"smooth"})}};export function Routes({origin:t,notFoundElement:n,children:o}){const[r,s]=D(window.location.pathname+window.location.search),a=L(()=>H(t,o.nodes),[]),i=L(()=>O(a),[]),m=window.location.hash.split("#")[1],[e,c]=W(i,r),l=q((p,h=!0)=>{s(d=>{const y=$(p,e,c),[v,S]=y.split("#");return h&&d!==y?history.pushState({},null,y):!h&&d!==y&&history.replaceState({},null,y),N(S),y.startsWith("#")?d:v})},[e,c]);j(()=>{window.addEventListener("popstate",()=>{l(window.location.pathname,!1)})},[]),j(()=>{window.scrollTo(0,0),e?.lazy?e.lazy().then(()=>{setTimeout(()=>{N(m)})}):N(m)},[r]);const f=L(()=>({hash:m,params:c,currentRoute:r,setNewRoute:l,routes:i,route:e}),[r]);let u={notFound:!0};if(e){if(u=e,e.meta?.title){document.title=e.meta.title;const p=document.querySelector('meta[property="og:title"]');p&&p.setAttribute("content",e.meta.title)}if(e.meta?.description){const p=document.querySelector('meta[name="description"]');p&&p.setAttribute("content",e.meta.description);const h=document.querySelector('meta[property="og:description"]');h&&h.setAttribute("content",e.meta.description)}}let R=null;for(u.nextRoute=R;u.parent;)R=u,u=u.parent,u.nextRoute=R;return P`<${b.Provider} value=${f}>
		${u.notFound?n??P`<div class="wompo-router-not-found">Not found!</div>`:F(u)}
	</${b.Provider}>`}C(Routes,{name:"wompo-routes"});const w=E(null);export function Route(t){return P``}C(Route,{name:"wompo-route"});export function ChildRoute(){const t=k(w);let n=null;if(t){const o=t.nextRoute;o?n=o:t.index&&(n=t.index)}return F(n)}C(ChildRoute,{name:"wompo-child-route"});const $=(t,n,o)=>{let r=t;if(!r.startsWith("/")&&!r.startsWith("#")&&n){let s=n;for(;s;){const a=s.path;if(a){let i=a;i.includes(":")&&i.split("/").filter(c=>c.startsWith(":")).map(c=>c.substring(1)).forEach(c=>{i=i.replace(`:${c}`,o[c])}),i.includes("*")&&(i=i.replace("*",o.segments.join("/")));const m=!i.endsWith("/")&&!r.startsWith("/")?"/":"";r=i+m+r}s=s.parent}}return r};export function Link({to:t,target:n,children:o}){const r=useNavigate(),s=k(w),a=useRoutes(),i=useParams(),m=$(t,s,i),e=l=>{n||(l.preventDefault(),r(m))},c=()=>{const[l]=W(a,m.split("#")[0]);l&&l.lazy&&l.lazy()};return P`<a
		href=${m}
		target=${n}
		@click=${e}
		@mouseenter=${c}
		@touchstart=${c}
	>
		${o}
	</a>`}Link.css=":host { display: inline-block; }",C(Link,{name:"wompo-link"});export function NavLink({to:t,target:n,children:o}){const r=useNavigate(),s=useCurrentRoute(),a=useParams(),i=useRoutes(),m=k(w),e=$(t,m,a),c=u=>{n||(u.preventDefault(),r(e))},l=()=>{const[u]=W(i,e.split("#")[0]);u&&u.lazy&&u.lazy()};return P`<a
		class=${s===e&&"active"}
		href=${e}
		target=${n}
		@click=${c}
		@mouseenter=${l}
		@touchstart=${l}
	>
		${o}
	</a>`}NavLink.css=":host { display: inline-block; }",C(NavLink,{name:"wompo-nav-link"});export const useParams=()=>k(b).params,useNavigate=()=>k(b).setNewRoute,useCurrentRoute=()=>k(b).currentRoute,useRoute=()=>k(b).route,useRoutes=()=>k(b).routes;
