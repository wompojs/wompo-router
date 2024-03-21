(() => {
  // ../womp/dist/womp.js
  var D = null;
  var N = 0;
  var _ = "$wc$";
  var T = "wc-wc";
  var V = /<\/?$/g;
  var P = /\s+([^\s]*?)="?$/g;
  var I = /(<([a-z]*?-[a-z]*).*?)\/>/g;
  var W = /<(?<tag>script|style|textarea|title])(?!.*?<\/\k<tag>)/gi;
  var L = /^(?:script|style|textarea|title)$/i;
  var w = 0;
  var v = 1;
  var R = 2;
  var S = typeof global < "u";
  var A = S ? { createTreeWalker() {
  } } : document;
  var k = A.createTreeWalker(A, 129);
  var F = class {
    constructor(e, n) {
      this.template = e, this.dependencies = n;
    }
    clone() {
      const e = this.template.content, n = this.dependencies, s = document.importNode(e, true);
      k.currentNode = s;
      let t = k.nextNode(), a = 0, i = 0, r = n[0];
      const c2 = [];
      for (; r !== void 0; ) {
        if (a === r.index) {
          let l;
          const d = r.type;
          d === w ? l = new O(t, t.nextSibling) : d === v ? l = new j(t, r) : d === R && (l = new q(t)), c2.push(l), r = n[++i];
        }
        a !== r?.index && (t = k.nextNode(), a++);
      }
      return k.currentNode = document, [s, c2];
    }
  };
  var z = class {
    constructor(e, n, s) {
      this.stringifiedTemplate = e, this.values = n, this.template = s;
    }
  };
  var O = class {
    constructor(e, n) {
      this.isNode = true;
      this.isAttr = false;
      this.isTag = false;
      this.startNode = e, this.endNode = n;
    }
    clearValue() {
      let e = this.startNode.nextSibling;
      for (; e !== this.endNode; )
        e.remove(), e = this.startNode.nextSibling;
    }
    dispose() {
      this.clearValue(), this.startNode.remove(), this.endNode.remove();
    }
  };
  var j = class {
    constructor(e, n) {
      this.isNode = false;
      this.isAttr = true;
      this.isTag = false;
      this.__eventInitialized = false;
      this.node = e, this.name = n.name, this.attrStructure = n.attrDynamics;
    }
    updateValue(e) {
      if (this.name === "ref" && e.__wcRef) {
        if (e.current = this.node, this.node._$womp) {
          const t = this.node.onDisconnected;
          this.node.onDisconnected = () => {
            e.current = null, t();
          };
        }
        return;
      }
      const n = this.node._$womp;
      n && this.node.updateProps(this.name, e);
      const s = e !== Object(e);
      if (e === false)
        this.node.removeAttribute(this.name);
      else if (s && !this.name.match(/[A-Z]/))
        this.node.setAttribute(this.name, e);
      else if (this.name === "style") {
        let t = "";
        const a = Object.keys(e);
        for (const i of a) {
          let r = e[i], c2 = i.replace(/[A-Z]/g, (l) => "-" + l.toLowerCase());
          typeof r == "number" && (r = `${r}px`), t += `${c2}:${r};`;
        }
        this.node.setAttribute(this.name, t);
      }
      this.name === "title" && n && this.node.removeAttribute(this.name);
    }
    set callback(e) {
      if (!this.__eventInitialized) {
        const n = this.name.substring(1);
        this.node.addEventListener(n, this.__listener.bind(this)), this.__eventInitialized = true;
      }
      this.__callback = e;
    }
    __listener(e) {
      this.__callback && this.__callback(e);
    }
  };
  var q = class {
    constructor(e) {
      this.isNode = false;
      this.isAttr = false;
      this.isTag = true;
      this.node = e;
    }
  };
  var G = class {
    constructor(e) {
      this._$wompChildren = true;
      this.nodes = e;
    }
  };
  var U = class {
    constructor(e, n) {
      this.isArrayDependency = true;
      this.dynamics = [], this.__parentDependency = n, this.addDependenciesFrom(n.startNode, e.length), this.__oldValues = E(this.dynamics, e, []);
    }
    addDependenciesFrom(e, n) {
      let s = e, t = n;
      for (; t; ) {
        const a = document.createComment("?START"), i = document.createComment("?END");
        s.after(a), a.after(i);
        const r = new O(a, i);
        s = i, this.dynamics.push(r), t--;
      }
    }
    checkUpdates(e) {
      let n = e.length - this.__oldValues.length;
      if (n > 0) {
        let s = this.dynamics[this.dynamics.length - 1]?.endNode;
        s || (s = this.__parentDependency.startNode), this.addDependenciesFrom(s, n);
      } else if (n < 0)
        for (; n; )
          this.dynamics.pop().dispose(), n++;
      return this.__oldValues = E(this.dynamics, e, this.__oldValues), this;
    }
  };
  var B = (o, e) => {
    const { css: n } = o, { shadow: s, name: t, cssGeneration: a } = e, i = t, r = {};
    let c2 = n;
    if (a) {
      if (n.includes(":host") || (c2 = `${s ? ":host" : i} {display:block;} ${n}`), 0) {
      }
      s || (c2 = c2.replace(/:host/g, i)), c2 = c2.replace(/\.(?!\d)(.*?)[\s|{|,|+|~|>]/gm, (l, d) => {
        const p = `${i}__${d}`;
        return r[d] = p, `.${p} `;
      });
    }
    return [c2, r];
  };
  var K = (o) => {
    let e = "";
    const n = [], s = o.length - 1;
    let t = "", a = "";
    for (let i = 0; i < s; i++) {
      let r = o[i];
      if (t && r.includes(t) && (t = ""), a && new RegExp(`</${a}>`) && (a = ""), t || a)
        e += r + _;
      else {
        P.lastIndex = 0;
        const c2 = P.exec(r);
        if (c2) {
          const [l, d] = c2, p = l[l.length - 1];
          t = p === '"' || p === "'" ? p : "", r = r.substring(0, r.length - t.length - 1);
          let m = `${r}${_}=`;
          t ? m += `${t}${_}` : m += '"0"', e += m, n.push(d);
        } else {
          if (r.match(V)) {
            e += r + T;
            continue;
          }
          W.lastIndex = 0;
          const l = W.exec(r);
          l ? (a = l[1], e += r + _) : e += r + `<?${_}>`;
        }
      }
    }
    return e += o[o.length - 1], e = e.replace(I, "$1></$2>"), [e, n];
  };
  var Z = (o, e, n) => {
    const s = [];
    k.currentNode = o.content;
    let t, a = 0, i = 0;
    const r = e.length;
    for (; (t = k.nextNode()) !== null && s.length < r; ) {
      if (t.nodeType === 1) {
        if (t.nodeName === T.toUpperCase()) {
          const c2 = { type: R, index: i };
          s.push(c2);
        }
        if (t.hasAttributes()) {
          const c2 = t.getAttributeNames();
          for (const l of c2)
            if (l.endsWith(_)) {
              const d = n[a++], p = t.getAttribute(l);
              if (p !== "0") {
                const m = p.split(_);
                for (let u = 0; u < m.length - 1; u++) {
                  const h = { type: v, index: i, attrDynamics: p, name: d };
                  s.push(h);
                }
              } else {
                const m = { type: v, index: i, name: d };
                s.push(m);
              }
              t.removeAttribute(l);
            }
        }
        if (L.test(t.tagName)) {
          const c2 = t.textContent.split(_), l = c2.length - 1;
          if (l > 0) {
            t.textContent = "";
            for (let d = 0; d < l; d++)
              t.append(c2[d], document.createComment("")), k.nextNode(), s.push({ type: w, index: ++i });
            t.append(c2[l], document.createComment(""));
          }
        }
      } else
        t.nodeType === 8 && t.data === `?${_}` && s.push({ type: w, index: i });
      i++;
    }
    return s;
  };
  var M = (o) => {
    const [e, n] = K(o), s = document.createElement("template");
    s.innerHTML = e;
    const t = Z(s, o, n);
    return new F(s, t);
  };
  var Y = (o) => {
    let e = "";
    const { parts: n, values: s } = o;
    for (let t = 0; t < n.length; t++)
      e += n[t], s[t]?.componentName && (e += s[t].componentName);
    return e;
  };
  var J = (o, e, n) => {
    const s = o !== e, t = !!n.attrStructure, i = o?._$wompChildren && n.startNode.nextSibling !== o.nodes[0];
    return s || t || i;
  };
  var E = (o, e, n) => {
    const s = [...e];
    for (let t = 0; t < o.length; t++) {
      const a = o[t], i = s[t], r = n[t];
      if (J(i, r, a)) {
        if (a.isNode) {
          if (i === false) {
            a.clearValue();
            continue;
          }
          if (i?._$wompHtml) {
            const p = r?.stringifiedTemplate, m = Y(i);
            if (r === void 0 || !(m === p)) {
              const f = M(i.parts).clone(), [y, x] = f;
              s[t] = new z(m, i.values, f), E(x, i.values, r?.values ?? r ?? []);
              const b = a.endNode, $ = a.startNode;
              let g = $.nextSibling;
              for (; g !== b; )
                g.remove(), g = $.nextSibling;
              for (g = $; y.childNodes.length; )
                g.after(y.childNodes[0]), g = g.nextSibling;
            } else {
              const [h, f] = r.template, y = E(f, i.values, r.values);
              r.values = y, s[t] = r;
            }
            continue;
          }
          const c2 = i !== Object(i), l = r !== Object(r) && r !== void 0, d = a.startNode;
          if (c2)
            l ? d.nextSibling ? d.nextSibling.textContent = i : d.after(i) : (a.clearValue(), d.after(i));
          else {
            let p = d.nextSibling, m = 0, u = 0;
            if (i._$wompChildren) {
              const h = i.nodes;
              for (; u < h.length; ) {
                (!p || u === 0) && (p = d);
                const f = h[m];
                m++, p.after(f), p = p.nextSibling, u++;
              }
            } else
              Array.isArray(i) && (r?.isArrayDependency ? s[t] = r.checkUpdates(i) : (a.clearValue(), s[t] = new U(i, a)));
          }
        } else if (a.isAttr)
          if (a.name.startsWith("@"))
            a.callback = i;
          else {
            const l = a.attrStructure;
            if (l) {
              const d = l.split(_);
              let p = i;
              for (let m = 0; m < d.length - 1; m++)
                d[m] = `${d[m]}${p}`, t++, p = s[t];
              t--, a.updateValue(d.join("").trim());
            } else
              a.updateValue(i);
          }
        else if (a.isTag) {
          const c2 = a.node;
          let l = null;
          const d = i._$wompF, p = d ? i.componentName : i;
          if (c2.nodeName !== p.toUpperCase()) {
            const m = c2.getAttributeNames();
            if (d) {
              const f = {};
              for (const x of m) {
                const b = c2.getAttribute(x);
                f[x] = b === "" ? true : b;
              }
              l = new i.class(), l._$initialProps = f;
              const y = c2.childNodes;
              for (; y.length; )
                l.appendChild(y[0]);
            } else {
              l = document.createElement(p);
              for (const f of m)
                l.setAttribute(f, c2.getAttribute(f));
            }
            let u = t, h = o[u];
            for (; h?.node === c2; )
              h.node = l, h = o[++u], h?.name && h?.name !== "ref" && (l._$initialProps[h.name] = e[u]);
            c2.replaceWith(l);
          }
        }
      }
    }
    return s;
  };
  var Q = (o, e) => {
    const { generatedCSS: n, styles: s } = o.options;
    let t;
    const a = `${e.name}__styles`;
    return window.wompHydrationData ? (t = document.createElement("link"), t.rel = "stylesheet", t.href = `/${e.name}.css`) : (t = document.createElement("style"), n && (t.classList.add(a), t.textContent = n, e.shadow || document.body.appendChild(t))), class extends HTMLElement {
      constructor() {
        super();
        this._$womp = true;
        this.props = {};
        this._$hooks = [];
        this._$measurePerf = false;
        this._$initialProps = {};
        this._$usesContext = false;
        this._$hasBeenMoved = false;
        this.__updating = false;
        this.__oldValues = [];
        this.__isInitializing = true;
        this.__connected = false;
        this.__isInDOM = false;
      }
      static {
        this._$womp = true;
      }
      static {
        this.componentName = e.name;
      }
      static _$getOrCreateTemplate(c2) {
        return this._$cachedTemplate || (this._$cachedTemplate = M(c2)), this._$cachedTemplate;
      }
      connectedCallback() {
        this.__isInDOM = true, !this.__connected && this.isConnected && this.initElement();
      }
      disconnectedCallback() {
        this.__connected && (this.__isInDOM = false, Promise.resolve().then(() => {
          this.__isInDOM ? (this._$hasBeenMoved = true, this._$usesContext && this.requestRender()) : this.onDisconnected();
        }));
      }
      onDisconnected() {
      }
      initElement() {
        this.__ROOT = this;
        const c2 = this.getAttribute("womp-hydrate");
        c2 !== null && window.wompHydrationData && this.__hydrate(c2), this.props = { ...this.props, ...this._$initialProps, styles: s };
        const l = this.getAttributeNames();
        for (const C of l)
          if (!this.props.hasOwnProperty(C)) {
            const H = this.getAttribute(C);
            this.props[C] = H === "" ? true : H;
          }
        const d = this.__ROOT.childNodes, p = [];
        for (; d.length; )
          p.push(d[0]), d[0].remove();
        const m = new G(p);
        this.props.children = m, e.shadow && !this.shadowRoot && (this.__ROOT = this.attachShadow({ mode: "open" }));
        const u = t.cloneNode(true);
        this.__ROOT.appendChild(u);
        const h = this.__callComponent(), { values: f, parts: y } = h, x = this.constructor._$getOrCreateTemplate(y), [b, $] = x.clone();
        this.__dynamics = $;
        const g = E(this.__dynamics, f, this.__oldValues);
        for (this.__oldValues = g; b.childNodes.length; )
          this.__ROOT.appendChild(b.childNodes[0]);
        this.__isInitializing = false, this.__connected = true;
      }
      __hydrate(c2) {
        this.shadowRoot && (this.__ROOT = this.shadowRoot);
        const l = window.wompHydrationData[e.name][c2];
        this._$initialProps = structuredClone(l);
      }
      __callComponent() {
        D = this, N = 0;
        const c2 = o.call(this, this.props);
        let l = c2;
        return (typeof c2 == "string" || c2 instanceof HTMLElement) && (l = html`${c2}`), l;
      }
      requestRender() {
        this.__updating || (this.__updating = true, Promise.resolve().then(() => {
          const c2 = this.__callComponent(), l = E(this.__dynamics, c2.values, this.__oldValues);
          this.__oldValues = l, this.__updating = false, this._$hasBeenMoved = false;
        }));
      }
      updateProps(c2, l) {
        this.props[c2] !== l && (this.props[c2] = l, this.__isInitializing || (console.warn(`Updating ${c2}`, this.__isInitializing), this.requestRender()));
      }
    };
  };
  var useHook = () => {
    const n = [D, N];
    return N++, n;
  };
  var useState = (o) => {
    const [e, n] = useHook();
    if (!e)
      return [o, () => {
      }];
    if (!e._$hooks.hasOwnProperty(n)) {
      const t = n;
      e._$hooks[t] = [o, (a) => {
        let i = a;
        const r = e._$hooks[t];
        typeof a == "function" && (i = a(r[0])), i !== r[0] && (r[0] = i, e.requestRender());
      }];
    }
    return e._$hooks[n];
  };
  var useRef = (o = null) => {
    const [e, n] = useHook();
    return e._$hooks.hasOwnProperty(n) || (e._$hooks[n] = { current: o, __wcRef: true }), e._$hooks[n];
  };
  var X = () => {
    let o = 0;
    return () => {
      const [e, n] = useHook();
      return e._$hooks.hasOwnProperty(n) || (e._$hooks[n] = `:r${o}:`, o++), e._$hooks[n];
    };
  };
  var useId = X();
  var useMemo = (o, e) => {
    const [n, s] = useHook();
    if (!n._$hooks.hasOwnProperty(s))
      n._$hooks[s] = { value: o(), dependencies: e };
    else {
      const a = n._$hooks[s];
      for (let i = 0; i < e.length; i++)
        if (a.dependencies[i] !== e[i]) {
          a.dependencies = e, a.value = o();
          break;
        }
    }
    return n._$hooks[s].value;
  };
  var useExposed = (o) => {
    const e = D, n = Object.keys(o);
    for (const s of n)
      e[s] = o[s];
  };
  var ee = () => {
    let o = 0;
    return (e) => {
      const n = `womp-context-provider-${o}`;
      o++;
      const s = defineWomp(({ children: a }) => {
        const r = useRef(/* @__PURE__ */ new Set());
        return useExposed({ subscribers: r }), r.current.forEach((c2) => c2.requestRender()), html`${a}`;
      }, { name: n, cssGeneration: false });
      return { name: n, Provider: s, default: e, subscribers: /* @__PURE__ */ new Set() };
    };
  };
  var createContext = ee();
  function html(o, ...e) {
    const n = [], s = o.length - 1;
    if (S)
      n.push(...e);
    else
      for (let t = 0; t < s; t++)
        o[t].endsWith("</") || n.push(e[t]);
    return { parts: o, values: n, _$wompHtml: true };
  }
  var wompDefaultOptions = { shadow: false, name: "", cssGeneration: true };
  var registeredComponents = {};
  function defineWomp(o, e) {
    o.css || (o.css = "");
    const n = { ...wompDefaultOptions, ...e || {} };
    if (!n.name) {
      let a = o.name.replace(/.[A-Z]/g, (i) => `${i[0]}-${i[1].toLowerCase()}`).toLowerCase();
      a.includes("-") || (a += "-womp"), n.name = a;
    }
    o.componentName = n.name, o._$wompF = true;
    const [s, t] = B(o, n);
    if (o.css = s, o.options = { generatedCSS: s, styles: t, shadow: n.shadow }, !S) {
      const a = Q(o, n);
      o.class = a, customElements.define(n.name, a);
    }
    return registeredComponents[n.name] = o, o;
  }

  // ../womp/jsx-runtime.js
  var c = (l, e) => {
    const s = { parts: [], values: [], _$wompHtml: true };
    let r = l;
    l._$wompF ? r = l.componentName : l === Fragment && (r = "");
    let a = r ? `<${r}` : "";
    const o = Object.keys(e);
    for (const p of o) {
      if (p === "children")
        break;
      const t = p.match(/on([A-Z].*)/);
      t ? a += ` @${t[1].toLowerCase()}=` : a += ` ${p}=`, s.parts.push(a), s.values.push(e[p]), a = "";
    }
    a += r ? ">" : "", s.parts.push(a);
    const n = e.children;
    if (n && n.parts) {
      if (e.children.parts)
        s.values.push(false), s.parts.push(...e.children.parts), s.values.push(...e.children.values), s.values.push(false);
      else if (Array.isArray(e.children))
        for (const p of e.children)
          s.values.push(false), s.parts.push(...p.parts), s.values.push(...p.values), s.values.push(false);
    } else
      s.values.push(n);
    return a = r ? `</${r}>` : "", s.parts.push(a), s;
  };
  var Fragment = "wc-fragment";
  var jsx = c;
  var jsxs = jsx;

  // ts/Routes.tsx
  var buildTreeStructure = (childNodes, structure = []) => {
    childNodes.forEach((child) => {
      if (child instanceof Route.class) {
        const props = child.props;
        const route = {
          element: props.element,
          path: props.path,
          index: props.index,
          children: []
        };
        structure.push(route);
        buildTreeStructure(child.childNodes, route.children);
      }
    });
    return structure;
  };
  var getRoutes = (treeStructure, paths = [], parent = "") => {
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
  var getMatch = (routes, currentRoute) => {
    const matches = {
      exact: null,
      parametric: {}
    };
    for (const routeStructure of routes) {
      const [routePath, route] = routeStructure;
      const isFallback = routePath.endsWith("*");
      if (!isFallback && routePath.split("/").length !== currentRoute.split("/").length)
        continue;
      if (route === currentRoute) {
        matches.exact = route;
        break;
      }
      const segments = routePath.split("/");
      let regex = "";
      const paramNames = [];
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        regex += "\\/";
        if (segment.startsWith(":")) {
          if (i === segments.length - 1)
            regex += "(.*?)";
          else
            regex += "(.*)";
          paramNames.push(segment.substring(1));
        } else if (segment === "*") {
          regex += "(.*)";
          paramNames.push("segments");
        } else {
          regex += segment;
        }
      }
      const matchRegex = new RegExp(regex, "g");
      const match = matchRegex.exec(currentRoute);
      if (match) {
        const params = {};
        for (let i = 1; i < match.length; i++) {
          params[paramNames[i - 1]] = match[i];
        }
        matches.parametric[routePath] = [route, params];
      }
    }
    if (matches.exact) {
      return matches.exact;
    } else {
      const routes2 = matches.parametric;
      const paths = Object.keys(routes2);
      paths.sort((a, b) => {
        const matchA = routes2[a];
        const matchB = routes2[b];
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
      console.log(paths);
      return routes2[paths[0]];
    }
  };
  function Routes({ children }) {
    const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
    const treeStructure = useMemo(() => buildTreeStructure(children.nodes), []);
    const routes = useMemo(() => getRoutes(treeStructure), []);
    const match = getMatch(routes, currentRoute);
    console.log(match);
    return /* @__PURE__ */ jsx(Fragment, {});
  }
  defineWomp(Routes, {
    name: "womp-routes"
  });
  function Route(props) {
    return /* @__PURE__ */ jsx("div", {});
  }
  defineWomp(Route, {
    name: "womp-route"
  });

  // src/App.tsx
  function App({ children }) {
    return /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsxs(Route, { path: "/", element: /* @__PURE__ */ jsx("div", {}), children: [
        /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx("div", {}) }),
        /* @__PURE__ */ jsx(Route, { path: ":boh", element: /* @__PURE__ */ jsx("div", {}), children: /* @__PURE__ */ jsx(Route, { path: ":teamId/members/coaches", element: /* @__PURE__ */ jsx("div", {}) }) }),
        /* @__PURE__ */ jsxs(Route, { path: "teams", element: /* @__PURE__ */ jsx("div", {}), children: [
          /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/members/*", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/members/coaches", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/members/:param", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/edit", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: "new", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx("div", {}) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx("div", {}), children: [
        /* @__PURE__ */ jsx(Route, { path: "/privacy", element: /* @__PURE__ */ jsx("div", {}) }),
        /* @__PURE__ */ jsx(Route, { path: "/tos", element: /* @__PURE__ */ jsx("div", {}) })
      ] }),
      /* @__PURE__ */ jsx(Route, { path: "contact-us", element: /* @__PURE__ */ jsx("div", {}) })
    ] });
  }
  defineWomp(App);
})();
//! Can cause problems. You should put also the "s" modifier
//! Some valid selectors are marked as invalid e.g. :host/componentName, @media, etc.
//! To finish
//! when you implement hydration, immediately return: it's not necessary to initialize
