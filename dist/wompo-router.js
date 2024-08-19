import{createContext as N,defineWompo as W,lazy as F,useCallback as T,useContext as S,useEffect as A,useMemo as z,useState as q,Suspense as E,html as k}from"wompo";const j=(t,n,s=[],e=null)=>(n.forEach(i=>{if(i instanceof Route.class){const c=i.props,a=c.lazy?F(c.lazy):null,h=e===null&&t?(c.path.startsWith("/")?c.path.substring(0,c.path.length-1):c.path)+t:c.path,r={...c,parent:e,element:c.element,path:h,lazy:a,fallback:c.fallback,index:null,children:[]};c.index&&(e.index=r),s.push(r),j(t,i.childNodes,r.children,r)}}),s),B=(t,n=[],s="")=>{for(const e of t){let i="";if(e.path){const c=s&&!s.endsWith("/")||!s&&!e.path.startsWith("/")?"/":"";i+=s+c+e.path,n.push([i,e])}e.children&&B(e.children,n,i)}return n},H=t=>{const n=Object.keys(t);return n.sort((s,e)=>{const i=t[s],c=t[e],a=Object.keys(i).filter(o=>o!=="segments").length,r=Object.keys(c).filter(o=>o!=="segments").length-a;if(r===0){let o=s.split("/"),p=e.split("/");const y=p.length-o.length;if(y!==0)return y;let u=0,m=0;for(let l=0;l<o.length;l++){const g=o[l],x=p[l];if(g.startsWith(":")||u++,x.startsWith(":")||m++,g.startsWith(":")||x.startsWith(":")||g.startsWith("*")||x.startsWith("*"))break}return m-u}return r}),t[n[0]]},D=t=>{const n={};return t.split("&").forEach(s=>{const[e,i]=s.split("=");n[e]=i}),n},w=(t,n)=>{const s={exact:null,parametric:{},fallbacks:{}},e=n!=="/"&&n.endsWith("/")?n.substring(0,n.length-1):n;for(const r of t){const[o,p]=r,y=o.endsWith("*");if(!y&&o.split("/").length!==e.split("/").length)continue;if(o===e){s.exact=p;break}if(!o.includes(":")&&!o.includes("*"))continue;const u=o.split("/");let m="";const l=[];for(let d=1;d<u.length;d++){const f=u[d];m+="\\/",f.startsWith(":")?(d===u.length-1?m+="(.*)":m+="(.*?)",l.push(f.substring(1))):f==="*"?(m+="(.*)?",l.push("segments")):m+=f}const g=new RegExp(m,"g"),x=e+(m.endsWith("(.*)?")&&!e.endsWith("/")?"/":""),R=g.exec(x);if(R){const d={};for(let f=1;f<R.length;f++){let b=R[f]??"";if(b.includes("?")){const[$,M]=b.split("?");b=$,d.search=D(M)}if(l[f-1]==="segments"){const $=b?b.split("/"):[];$.pop(),d[l[f-1]]=$}else d[l[f-1]]=b}y?s.fallbacks[o]=[p,d]:s.parametric[o]=[p,d]}}const i=Object.keys(s.parametric),c=Object.keys(s.fallbacks);let a=[null,null];s.exact?a=[s.exact,{}]:i.length?a=H(s.parametric):c.length&&(a=H(s.fallbacks));const h=a[0]?.redirect||a[0]?.index?.redirect;if(h){const r=v(h,a[0],a[1]);history.replaceState({},void 0,r),a=w(t,r)}return a},O=t=>t?k`
		<${C.Provider} value=${{...t}}>
			${t.lazy?t.fallback?k`
							<${E} fallback=${t.fallback}>
								<${t.lazy} />
							</${E}>
						`:k`<${t.lazy} />`:t.element}
		</${C.Provider}>
	`:null,P=N({params:null,hash:null,currentRoute:null,setNewRoute:null,routes:[]}),L=t=>{if(t){const n=document.getElementById(t);n&&n.scrollIntoView({block:"start",behavior:"smooth"})}};export function Routes({origin:t,notFoundElement:n,children:s}){const[e,i]=q(window.location.pathname),c=z(()=>j(t,s.nodes),[]),a=z(()=>B(c),[]),h=window.location.hash.split("#")[1],[r,o]=w(a,e),p=T((l,g=!0)=>{i(x=>{const R=v(l,r,o),[d,f]=R.split("#");return g&&x!==R?history.pushState({},null,R):!g&&x!==R&&history.replaceState({},null,R),L(f),R.startsWith("#")?x:d})},[r,o]);A(()=>{window.addEventListener("popstate",()=>{p(window.location.pathname,!1)})},[]),A(()=>{window.scrollTo(0,0),r?.lazy?r.lazy().then(()=>{setTimeout(()=>{L(h)})}):L(h)},[e]);const y=z(()=>({hash:h,params:o,currentRoute:e,setNewRoute:p,routes:a}),[e]);let u={notFound:!0};if(r){if(u=r,r.meta?.title){document.title=r.meta.title;const l=document.querySelector('meta[property="og:title"]');l&&l.setAttribute("content",r.meta.title)}if(r.meta?.description){const l=document.querySelector('meta[name="description"]');l&&l.setAttribute("content",r.meta.description);const g=document.querySelector('meta[property="og:description"]');g&&g.setAttribute("content",r.meta.description)}}let m=null;for(u.nextRoute=m;u.parent;)m=u,u=u.parent,u.nextRoute=m;return k`<${P.Provider} value=${y}>
		${u.notFound?n??k`<div class="wompo-router-not-found">Not found!</div>`:O(u)}
	</${P.Provider}>`}W(Routes,{name:"womp-routes"});const C=N(null);export function Route(t){return k``}W(Route,{name:"wompo-route"});export function ChildRoute(){const t=S(C);let n=null;if(t){const s=t.nextRoute;s?n=s:t.index&&(n=t.index)}return O(n)}W(ChildRoute,{name:"wompo-child-route"});const v=(t,n,s)=>{let e=t;if(!e.startsWith("/")&&!e.startsWith("#")&&n){let i=n;for(;i;){const c=i.path;if(c){let a=c;a.includes(":")&&a.split("/").filter(o=>o.startsWith(":")).map(o=>o.substring(1)).forEach(o=>{a=a.replace(`:${o}`,s[o])}),a.includes("*")&&(a=a.replace("*",s.segments.join("/")));const h=!a.endsWith("/")&&!e.startsWith("/")?"/":"";e=a+h+e}i=i.parent}}return e};export function Link({to:t,target:n,children:s}){const e=useNavigate(),i=S(C),c=useRoutes(),a=useParams(),h=v(t,i,a),r=p=>{n||(p.preventDefault(),e(h))},o=()=>{const[p]=w(c,h.split("#")[0]);p&&p.lazy&&p.lazy()};return k`<a
		href=${h}
		target=${n}
		@click=${r}
		@mouseenter=${o}
		@touchstart=${o}
	>
		${s}
	</a>`}Link.css=":host { display: inline-block; }",W(Link,{name:"wompo-link"});export function NavLink({to:t,target:n,children:s}){const e=useNavigate(),i=useCurrentRoute(),c=useParams(),a=useRoutes(),h=S(C),r=v(t,h,c),o=u=>{n||(u.preventDefault(),e(r))},p=()=>{const[u]=w(a,r.split("#")[0]);u&&u.lazy&&u.lazy()};return k`<a
		class=${i===r&&"active"}
		href=${r}
		target=${n}
		@click=${o}
		@mouseenter=${p}
		@touchstart=${p}
	>
		${s}
	</a>`}NavLink.css=":host { display: inline-block; }",W(NavLink,{name:"wompo-nav-link"});export const useParams=()=>S(P).params,useNavigate=()=>S(P).setNewRoute,useCurrentRoute=()=>S(P).currentRoute,useRoutes=()=>S(P).routes;
