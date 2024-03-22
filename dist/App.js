(() => {
  // ../womp/dist/womp.js
  var DEV_MODE = false;
  var currentRenderingComponent = null;
  var currentHookIndex = 0;
  var WC_MARKER = "$wc$";
  var DYNAMIC_TAG_MARKER = "wc-wc";
  var isDynamicTagRegex = /<\/?$/g;
  var isAttrRegex = /\s+([^\s]*?)="?$/g;
  var selfClosingRegex = /(<([a-z]*?-[a-z]*).*?)\/>/g;
  var isInsideTextTag = /<(?<tag>script|style|textarea|title])(?!.*?<\/\k<tag>)/gi;
  var onlyTextChildrenElementsRegex = /^(?:script|style|textarea|title)$/i;
  var NODE = 0;
  var ATTR = 1;
  var TAG = 2;
  var IS_SERVER = typeof global !== "undefined";
  var doc = IS_SERVER ? { createTreeWalker() {
  } } : document;
  var treeWalker = doc.createTreeWalker(
    doc,
    129
    // NodeFilter.SHOW_{ELEMENT|COMMENT}
  );
  var CachedTemplate = class {
    /**
     * Create a new CachedTemplate instance.
     * @param template The HTML Template already elaborated to handle the dynamic parts.
     * @param dependencies The metadata dependencies for the template.
     */
    constructor(template, dependencies, stringified) {
      this.template = template;
      this.dependencies = dependencies;
      this.stringified = stringified;
    }
    /**
     * This function will clone the template content and build the dynamcis metadata - an array
     * containing all the information to efficiently put values in the DOM, without checking if each
     * node is equal to a virtual one. The DOM update is not done through this function, but thanks to
     * the `__setValues` function.
     * @returns An array containing 2 values: The DOM fragment cloned from the content of the
     * template, and the dynamics metadata.
     */
    clone() {
      const content = this.template.content;
      const dependencies = this.dependencies;
      const fragment = document.importNode(content, true);
      treeWalker.currentNode = fragment;
      let node = treeWalker.nextNode();
      let nodeIndex = 0;
      let dynamicIndex = 0;
      let templateDependency = dependencies[0];
      const dynamics = [];
      while (templateDependency !== void 0) {
        if (nodeIndex === templateDependency.index) {
          let dynamic;
          const type = templateDependency.type;
          if (type === NODE) {
            dynamic = new DynamicNode(node, node.nextSibling);
          } else if (type === ATTR) {
            dynamic = new DynamicAttribute(node, templateDependency);
          } else if (type === TAG) {
            dynamic = new DynamicTag(node);
          }
          dynamics.push(dynamic);
          templateDependency = dependencies[++dynamicIndex];
        }
        if (nodeIndex !== templateDependency?.index) {
          node = treeWalker.nextNode();
          nodeIndex++;
        }
      }
      treeWalker.currentNode = document;
      return [fragment, dynamics];
    }
  };
  var HtmlProcessedValue = class {
    constructor(stringifiedTemplate, values, template) {
      this.stringifiedTemplate = stringifiedTemplate;
      this.values = values;
      this.template = template;
    }
  };
  var DynamicNode = class {
    // For faster access
    /**
     * Creates a new DynamicNode instance.
     * @param startNode The start node.
     * @param endNode The end node.
     */
    constructor(startNode, endNode) {
      this.isNode = true;
      this.isAttr = false;
      this.isTag = false;
      this.startNode = startNode;
      this.endNode = endNode;
    }
    /**
     * Removes all the nodes between the start and the end nodes.
     */
    clearValue() {
      let currentNode = this.startNode.nextSibling;
      while (currentNode !== this.endNode) {
        currentNode.remove();
        currentNode = this.startNode.nextSibling;
      }
    }
    /**
     * First removes all the nodes between the start and the end nodes, then it also removes the
     * start node and the end node.
     */
    dispose() {
      this.clearValue();
      this.startNode.remove();
      this.endNode.remove();
    }
  };
  var DynamicAttribute = class {
    /**
     * Creates a new DynamicAttribute instance.
     * @param node The node that owns the attribute.
     * @param dependency The dependency metadata.
     */
    constructor(node, dependency) {
      this.isNode = false;
      this.isAttr = true;
      this.isTag = false;
      this.__eventInitialized = false;
      this.node = node;
      this.name = dependency.name;
      this.attrStructure = dependency.attrDynamics;
    }
    /**
     * Update an attribute value.
     * @param newValue The new value of the attribute
     */
    updateValue(newValue) {
      if (this.name === "ref" && newValue.__wcRef) {
        newValue.current = this.node;
        if (this.node._$womp) {
          const oldDisconnectedCallback = this.node.onDisconnected;
          this.node.onDisconnected = () => {
            newValue.current = null;
            oldDisconnectedCallback();
          };
        }
        return;
      }
      if (DEV_MODE && this.name === "wc-perf")
        this.node._$measurePerf = true;
      const isWompElement = this.node._$womp;
      if (isWompElement)
        this.node.updateProps(this.name, newValue);
      const isPrimitive = newValue !== Object(newValue);
      if (newValue === false)
        this.node.removeAttribute(this.name);
      else if (isPrimitive && !this.name.match(/[A-Z]/))
        this.node.setAttribute(this.name, newValue);
      else if (this.name === "style") {
        let styleString = "";
        const styles = Object.keys(newValue);
        for (const key of styles) {
          let styleValue = newValue[key];
          let styleKey = key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
          if (typeof styleValue === "number")
            styleValue = `${styleValue}px`;
          styleString += `${styleKey}:${styleValue};`;
        }
        this.node.setAttribute(this.name, styleString);
      }
      if (this.name === "title" && isWompElement)
        this.node.removeAttribute(this.name);
    }
    /**
     * Set the callback function to be executed when an event is fired. If the event has not been
     * initialized, the event listener will be added.
     */
    set callback(callback) {
      if (!this.__eventInitialized) {
        const eventName = this.name.substring(1);
        this.node.addEventListener(eventName, this.__listener.bind(this));
        this.__eventInitialized = true;
      }
      this.__callback = callback;
    }
    /**
     * The listener that will execute the __callback function (if defined).
     * @param event The event object
     */
    __listener(event) {
      if (this.__callback)
        this.__callback(event);
    }
  };
  var DynamicTag = class {
    // For faster access
    /**
     * Creates a new DynamicTag instance.
     * @param node The node instance.
     */
    constructor(node) {
      this.isNode = false;
      this.isAttr = false;
      this.isTag = true;
      this.node = node;
    }
  };
  var WompChildren = class {
    constructor(nodes) {
      this._$wompChildren = true;
      this.nodes = nodes;
    }
  };
  var WompArrayDependency = class {
    /**
     * Creates a new WompArrayDependency instance.
     * @param values The array of values to put in the DOM
     * @param dependency The dynamic node dependency on which the array should be rendered.
     */
    constructor(values, dependency) {
      this.isArrayDependency = true;
      this.dynamics = [];
      this.__parentDependency = dependency;
      this.addDependenciesFrom(dependency.startNode, values.length);
      this.__oldValues = __setValues(this.dynamics, values, []);
    }
    /**
     * This function will add markers (HTML comments) and generate dynamic nodes dependecies used to
     * efficiently udpate the values inside of the array.
     * @param startNode The start node on which insert the new "single-item" dependencies.
     * @param toAdd The number of dependencies to generate.
     */
    addDependenciesFrom(startNode, toAdd) {
      let currentNode = startNode;
      let toAddNumber = toAdd;
      while (toAddNumber) {
        const startComment = document.createComment(`?START`);
        const endComment = document.createComment(`?END`);
        currentNode.after(startComment);
        startComment.after(endComment);
        const dependency = new DynamicNode(startComment, endComment);
        currentNode = endComment;
        this.dynamics.push(dependency);
        toAddNumber--;
      }
    }
    /**
     * Check if there are dependencies to add/remove, and then set the new values to the old nodes.
     * Setting the new values will start an eventual recursive check for eventual nested arrays.
     * @param newValues The new values to check with the old ones fot updates.
     * @returns This instance.
     */
    checkUpdates(newValues) {
      let diff = newValues.length - this.__oldValues.length;
      if (diff > 0) {
        let startNode = this.dynamics[this.dynamics.length - 1]?.endNode;
        if (!startNode)
          startNode = this.__parentDependency.startNode;
        this.addDependenciesFrom(startNode, diff);
      } else if (diff < 0) {
        while (diff) {
          const toClean = this.dynamics.pop();
          toClean.dispose();
          diff++;
        }
      }
      this.__oldValues = __setValues(this.dynamics, newValues, this.__oldValues);
      return this;
    }
  };
  var __generateSpecifcStyles = (component, options) => {
    const { css } = component;
    const { shadow, name, cssGeneration } = options;
    const componentName = name;
    const classes = {};
    let generatedCss = css;
    if (DEV_MODE) {
      if (!shadow && !cssGeneration && !name.startsWith("womp-context-provider"))
        console.warn(
          `The component ${name} is not an isolated component (shadow=false) and has the cssGeneration option set to false.
This can lead to unexpected behaviors, because this component can alter other components' styles.`
        );
    }
    if (cssGeneration) {
      if (!css.includes(":host"))
        generatedCss = `${shadow ? ":host" : componentName} {display:block;} ${css}`;
      if (DEV_MODE) {
        const invalidSelectors = [];
        [...generatedCss.matchAll(/.*?}([\s\S]*?){/gm)].forEach((selector) => {
          const cssSelector = selector[1].trim();
          if (!cssSelector.includes("."))
            invalidSelectors.push(cssSelector);
        });
        invalidSelectors.forEach((selector) => {
          console.warn(
            `The CSS selector "${selector} {...}" in the component "${componentName}" is not enough specific: include at least one class.`
          );
        });
      }
      if (!shadow)
        generatedCss = generatedCss.replace(/:host/g, componentName);
      generatedCss = generatedCss.replace(/\.(?!\d)(.*?)[\s|{|,|+|~|>]/gm, (_, className) => {
        const uniqueClassName = `${componentName}__${className}`;
        classes[className] = uniqueClassName;
        return `.${uniqueClassName} `;
      });
    }
    return [generatedCss, classes];
  };
  var __createHtml = (parts) => {
    let html2 = "";
    const attributes = [];
    const length = parts.length - 1;
    let attrDelimiter = "";
    let textTagName = "";
    for (let i = 0; i < length; i++) {
      let part = parts[i];
      if (attrDelimiter && part.includes(attrDelimiter))
        attrDelimiter = "";
      if (textTagName && new RegExp(`</${textTagName}>`))
        textTagName = "";
      if (attrDelimiter || textTagName) {
        html2 += part + WC_MARKER;
      } else {
        isAttrRegex.lastIndex = 0;
        const isAttr = isAttrRegex.exec(part);
        if (isAttr) {
          const [match, attrName] = isAttr;
          const beforeLastChar = match[match.length - 1];
          attrDelimiter = beforeLastChar === '"' || beforeLastChar === "'" ? beforeLastChar : "";
          part = part.substring(0, part.length - attrDelimiter.length - 1);
          let toAdd = `${part}${WC_MARKER}=`;
          if (attrDelimiter)
            toAdd += `${attrDelimiter}${WC_MARKER}`;
          else
            toAdd += '"0"';
          html2 += toAdd;
          attributes.push(attrName);
        } else {
          if (part.match(isDynamicTagRegex)) {
            html2 += part + DYNAMIC_TAG_MARKER;
            continue;
          }
          isInsideTextTag.lastIndex = 0;
          const insideTextTag = isInsideTextTag.exec(part);
          if (insideTextTag) {
            textTagName = insideTextTag[1];
            html2 += part + WC_MARKER;
          } else {
            html2 += part + `<?${WC_MARKER}>`;
          }
        }
      }
    }
    html2 += parts[parts.length - 1];
    html2 = html2.replace(selfClosingRegex, "$1></$2>");
    return [html2, attributes];
  };
  var __createDependencies = (template, parts, attributes) => {
    const dependencies = [];
    treeWalker.currentNode = template.content;
    let node;
    let dependencyIndex = 0;
    let nodeIndex = 0;
    const partsLength = parts.length;
    while ((node = treeWalker.nextNode()) !== null && dependencies.length < partsLength) {
      if (node.nodeType === 1) {
        if (node.nodeName === DYNAMIC_TAG_MARKER.toUpperCase()) {
          const dependency = {
            type: TAG,
            index: nodeIndex
          };
          dependencies.push(dependency);
        }
        if (node.hasAttributes()) {
          const attributeNames = node.getAttributeNames();
          for (const attrName of attributeNames) {
            if (attrName.endsWith(WC_MARKER)) {
              const realName = attributes[dependencyIndex++];
              const attrValue = node.getAttribute(attrName);
              if (attrValue !== "0") {
                const dynamicParts = attrValue.split(WC_MARKER);
                for (let i = 0; i < dynamicParts.length - 1; i++) {
                  const dependency = {
                    type: ATTR,
                    index: nodeIndex,
                    attrDynamics: attrValue,
                    name: realName
                  };
                  dependencies.push(dependency);
                }
              } else {
                const dependency = {
                  type: ATTR,
                  index: nodeIndex,
                  name: realName
                };
                dependencies.push(dependency);
              }
              node.removeAttribute(attrName);
            }
          }
        }
        if (onlyTextChildrenElementsRegex.test(node.tagName)) {
          const strings = node.textContent.split(WC_MARKER);
          const lastIndex = strings.length - 1;
          if (lastIndex > 0) {
            node.textContent = "";
            for (let i = 0; i < lastIndex; i++) {
              node.append(strings[i], document.createComment(""));
              treeWalker.nextNode();
              dependencies.push({ type: NODE, index: ++nodeIndex });
            }
            node.append(strings[lastIndex], document.createComment(""));
          }
        }
      } else if (node.nodeType === 8) {
        const data = node.data;
        if (data === `?${WC_MARKER}`)
          dependencies.push({ type: NODE, index: nodeIndex });
      }
      nodeIndex++;
    }
    return dependencies;
  };
  var __createTemplate = (html2) => {
    const [dom, attributes] = __createHtml(html2.parts);
    const template = document.createElement("template");
    template.innerHTML = dom;
    const dependencies = __createDependencies(template, html2.parts, attributes);
    return new CachedTemplate(template, dependencies, __getRenderHtmlString(html2));
  };
  var __getRenderHtmlString = (render) => {
    let value = "";
    const { parts, values } = render;
    for (let i = 0; i < parts.length; i++) {
      value += parts[i];
      if (values[i]?.componentName)
        value += values[i].componentName;
    }
    return value;
  };
  var __shouldUpdate = (currentValue, oldValue, dependency) => {
    const valuesDiffers = currentValue !== oldValue;
    const isComposedAttribute = !!dependency.attrStructure;
    const isWompChildren = currentValue?._$wompChildren;
    const childrenNeedUpdate = isWompChildren && dependency.startNode.nextSibling !== currentValue.nodes[0];
    return valuesDiffers || isComposedAttribute || childrenNeedUpdate;
  };
  var __setValues = (dynamics, values, oldValues) => {
    const newValues = [...values];
    for (let i = 0; i < dynamics.length; i++) {
      const currentDependency = dynamics[i];
      const currentValue = newValues[i];
      const oldValue = oldValues[i];
      if (!__shouldUpdate(currentValue, oldValue, currentDependency))
        continue;
      if (currentDependency.isNode) {
        if (currentValue === false) {
          currentDependency.clearValue();
          continue;
        }
        if (currentValue?._$wompHtml) {
          const oldStringified = oldValue?.stringifiedTemplate;
          const newTemplate = __getRenderHtmlString(currentValue);
          const sameString = newTemplate === oldStringified;
          if (oldValue === void 0 || !sameString) {
            const cachedTemplate = __createTemplate(currentValue);
            const template = cachedTemplate.clone();
            const [fragment, dynamics2] = template;
            newValues[i] = new HtmlProcessedValue(newTemplate, currentValue.values, template);
            __setValues(dynamics2, currentValue.values, oldValue?.values ?? oldValue ?? []);
            const endNode = currentDependency.endNode;
            const startNode2 = currentDependency.startNode;
            let currentNode = startNode2.nextSibling;
            while (currentNode !== endNode) {
              currentNode.remove();
              currentNode = startNode2.nextSibling;
            }
            currentNode = startNode2;
            while (fragment.childNodes.length) {
              currentNode.after(fragment.childNodes[0]);
              currentNode = currentNode.nextSibling;
            }
          } else {
            const [_, dynamics2] = oldValue.template;
            const processedValues = __setValues(
              dynamics2,
              currentValue.values,
              oldValue.values
            );
            oldValue.values = processedValues;
            newValues[i] = oldValue;
          }
          continue;
        }
        const isPrimitive = currentValue !== Object(currentValue);
        const oldIsPrimitive = oldValue !== Object(oldValue) && oldValue !== void 0;
        const startNode = currentDependency.startNode;
        if (isPrimitive) {
          if (oldIsPrimitive) {
            if (startNode.nextSibling)
              startNode.nextSibling.textContent = currentValue;
            else
              startNode.after(currentValue);
          } else {
            currentDependency.clearValue();
            startNode.after(currentValue);
          }
        } else {
          let currentNode = startNode.nextSibling;
          let newNodeIndex = 0;
          let index = 0;
          if (currentValue._$wompChildren) {
            const childrenNodes = currentValue.nodes;
            while (index < childrenNodes.length) {
              if (!currentNode || index === 0)
                currentNode = startNode;
              const newNode = childrenNodes[newNodeIndex];
              newNodeIndex++;
              currentNode.after(newNode);
              currentNode = currentNode.nextSibling;
              index++;
            }
          } else {
            if (Array.isArray(currentValue)) {
              if (!oldValue?.isArrayDependency) {
                currentDependency.clearValue();
                newValues[i] = new WompArrayDependency(currentValue, currentDependency);
              } else
                newValues[i] = oldValue.checkUpdates(currentValue);
            } else if (DEV_MODE) {
              console.warn(
                "Rendering objects is not supported. Doing a stringified version of it can rise errors.\nThis node will be ignored."
              );
            }
          }
        }
      } else if (currentDependency.isAttr) {
        const attrName = currentDependency.name;
        if (attrName.startsWith("@")) {
          currentDependency.callback = currentValue;
        } else {
          const attrStructure = currentDependency.attrStructure;
          if (attrStructure) {
            const parts = attrStructure.split(WC_MARKER);
            let dynamicValue = currentValue;
            for (let j = 0; j < parts.length - 1; j++) {
              parts[j] = `${parts[j]}${dynamicValue}`;
              i++;
              dynamicValue = newValues[i];
            }
            i--;
            currentDependency.updateValue(parts.join("").trim());
          } else {
            currentDependency.updateValue(currentValue);
          }
        }
      } else if (currentDependency.isTag) {
        const node = currentDependency.node;
        let customElement = null;
        const isCustomComponent = currentValue._$wompF;
        const newNodeName = isCustomComponent ? currentValue.componentName : currentValue;
        if (node.nodeName !== newNodeName.toUpperCase()) {
          const oldAttributes = node.getAttributeNames();
          if (isCustomComponent) {
            if (DEV_MODE) {
              if (node._$womp) {
                console.error(
                  "Dynamic tags are currently not supported, unsless used to render for the first time a custom component.\nInstead, you can use conditional rendering.\n(e.g. condition ? html`<${First} />` : html`<${Second} />`)."
                );
                continue;
              }
            }
            const initialProps = {};
            for (const attrName of oldAttributes) {
              const attrValue = node.getAttribute(attrName);
              initialProps[attrName] = attrValue === "" ? true : attrValue;
            }
            customElement = new currentValue.class();
            customElement._$initialProps = initialProps;
            const childNodes = node.childNodes;
            while (childNodes.length) {
              customElement.appendChild(childNodes[0]);
            }
          } else {
            customElement = document.createElement(newNodeName);
            for (const attrName of oldAttributes) {
              customElement.setAttribute(attrName, node.getAttribute(attrName));
            }
          }
          let index = i;
          let currentDynamic = dynamics[index];
          while (currentDynamic?.node === node) {
            currentDynamic.node = customElement;
            currentDynamic = dynamics[++index];
            if (currentDynamic?.name && currentDynamic?.name !== "ref")
              customElement._$initialProps[currentDynamic.name] = values[index];
          }
          node.replaceWith(customElement);
        }
      }
    }
    return newValues;
  };
  var _$womp = (Component, options) => {
    const { generatedCSS, styles } = Component.options;
    let style;
    const styleClassName = `${options.name}__styles`;
    if (!window.wompHydrationData) {
      style = document.createElement("style");
      if (generatedCSS) {
        style.classList.add(styleClassName);
        style.textContent = generatedCSS;
        if (!options.shadow) {
          document.body.appendChild(style);
        }
      }
    } else {
      style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = `/${options.name}.css`;
    }
    const WompComponent2 = class extends HTMLElement {
      constructor() {
        super();
        this._$womp = true;
        this.props = {};
        this._$hooks = [];
        this._$measurePerf = false;
        this._$initialProps = {};
        this._$usesContext = false;
        this._$hasBeenMoved = false;
        this._$layoutEffects = [];
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
        this.componentName = options.name;
      }
      /**
       * Get the already present cached template, or create a new one if the component is rendering
       * for the first time.
       * @param parts The template parts from the html function.
       * @returns The cached template.
       */
      static _$getOrCreateTemplate(html2, makeNew) {
        if (!this._$cachedTemplate || makeNew)
          this._$cachedTemplate = __createTemplate(html2);
        return this._$cachedTemplate;
      }
      /** @override component has been connected to the DOM */
      connectedCallback() {
        this.__isInDOM = true;
        if (!this.__connected && this.isConnected)
          this.initElement();
      }
      /** @override component has been disconnected from the DOM */
      disconnectedCallback() {
        if (this.__connected) {
          this.__isInDOM = false;
          Promise.resolve().then(() => {
            if (!this.__isInDOM) {
              this.onDisconnected();
              if (DEV_MODE)
                console.warn("Disconnected", this);
            } else {
              this._$hasBeenMoved = true;
              if (this._$usesContext)
                this.requestRender();
            }
          });
        }
      }
      /**
       * This public callback will be used when a component is removed permanently from the DOM.
       * It allows other code to hook into the component and unmount listeners or similar when the
       * component is disconnected from the DOM.
       */
      onDisconnected() {
      }
      /**
       * Initializes the component with the state, props, and styles.
       */
      initElement() {
        this.__ROOT = this;
        this.props = {
          ...this.props,
          ...this._$initialProps,
          styles
        };
        const componentAttributes = this.getAttributeNames();
        for (const attrName of componentAttributes) {
          if (!this.props.hasOwnProperty(attrName)) {
            const attrValue = this.getAttribute(attrName);
            this.props[attrName] = attrValue === "" ? true : attrValue;
          }
        }
        if (DEV_MODE && this.props["wc-perf"])
          this._$measurePerf = true;
        if (DEV_MODE && this._$measurePerf)
          console.time("First render " + options.name);
        const childNodes = this.__ROOT.childNodes;
        const childrenArray = [];
        while (childNodes.length) {
          childrenArray.push(childNodes[0]);
          childNodes[0].remove();
        }
        const children = new WompChildren(childrenArray);
        this.props.children = children;
        if (options.shadow && !this.shadowRoot)
          this.__ROOT = this.attachShadow({ mode: "open" });
        if (generatedCSS) {
          const clonedStyles = style.cloneNode(true);
          this.__ROOT.appendChild(clonedStyles);
        }
        this.__render();
        this.__isInitializing = false;
        this.__connected = true;
        if (DEV_MODE && this._$measurePerf)
          console.timeEnd("First render " + options.name);
      }
      /**
       * Calls the functional component by first setting correct values to the
       * [currentRenderingComponent] and [currentHookIndex] variables.
       * @returns The result of the call.
       */
      __callComponent() {
        currentRenderingComponent = this;
        currentHookIndex = 0;
        const result = Component.call(this, this.props);
        let renderHtml = result;
        if (typeof result === "string" || result instanceof HTMLElement)
          renderHtml = html`${result}`;
        return renderHtml;
      }
      /**
       * Calls the component and executes the operations to update the DOM.
       */
      __render() {
        const renderHtml = this.__callComponent();
        if (renderHtml === null || renderHtml === void 0) {
          this.remove();
          return;
        }
        const constructor = this.constructor;
        const shouldRebuild = __getRenderHtmlString(renderHtml) !== constructor._$cachedTemplate?.stringified;
        if (this.__isInitializing || shouldRebuild) {
          const template = constructor._$getOrCreateTemplate(renderHtml, shouldRebuild);
          const [fragment, dynamics] = template.clone();
          this.__dynamics = dynamics;
          const elaboratedValues = __setValues(this.__dynamics, renderHtml.values, this.__oldValues);
          this.__oldValues = elaboratedValues;
          if (!this.__isInitializing)
            this.__ROOT.innerHTML = "";
          while (fragment.childNodes.length) {
            this.__ROOT.appendChild(fragment.childNodes[0]);
          }
        } else {
          const oldValues = __setValues(this.__dynamics, renderHtml.values, this.__oldValues);
          this.__oldValues = oldValues;
        }
        while (this._$layoutEffects.length) {
          const layoutEffectHook = this._$layoutEffects.pop();
          layoutEffectHook.cleanupFunction = layoutEffectHook.callback();
        }
      }
      /**
       * It requests a render to the component. If the component has already received a render
       * request, the request will be rejected. This is to avoid multiple re-renders when it's not
       * necessary. The following function will cause a single re-render:
       * ```javascript
       * const incBy2 = () => {
       *   setState((oldState) => oldState + 1)
       *   setState((oldState) => oldState + 1)
       * }
       * ```
       */
      requestRender() {
        if (!this.__updating) {
          this.__updating = true;
          Promise.resolve().then(() => {
            if (DEV_MODE && this._$measurePerf)
              console.time("Re-render " + options.name);
            this.__render();
            this.__updating = false;
            this._$hasBeenMoved = false;
            if (DEV_MODE && this._$measurePerf)
              console.timeEnd("Re-render " + options.name);
          });
        }
      }
      /**
       * It'll set a new value to a specific prop of the component, and a re-render will be requested.
       * @param prop The prop name.
       * @param value The new value to set.
       */
      updateProps(prop, value) {
        if (this.props[prop] !== value) {
          this.props[prop] = value;
          if (!this.__isInitializing) {
            console.warn(`Updating ${prop}`, this.__isInitializing);
            this.requestRender();
          }
        }
      }
    };
    return WompComponent2;
  };
  var useHook = () => {
    const currentComponent = currentRenderingComponent;
    const currentIndex = currentHookIndex;
    const res = [currentComponent, currentIndex];
    currentHookIndex++;
    return res;
  };
  var useState = (defaultValue) => {
    const [component, hookIndex] = useHook();
    if (!component) {
      return [defaultValue, () => {
      }];
    }
    if (!component._$hooks.hasOwnProperty(hookIndex)) {
      const index = hookIndex;
      component._$hooks[index] = [
        defaultValue,
        (newValue) => {
          let computedValue = newValue;
          const stateHook = component._$hooks[index];
          if (typeof newValue === "function") {
            computedValue = newValue(stateHook[0]);
          }
          if (computedValue !== stateHook[0]) {
            stateHook[0] = computedValue;
            component.requestRender();
          }
        }
      ];
    }
    const state = component._$hooks[hookIndex];
    return state;
  };
  var useEffect = (callback, dependencies = null) => {
    const [component, hookIndex] = useHook();
    if (!component._$hooks.hasOwnProperty(hookIndex)) {
      const effectHook = {
        dependencies,
        callback,
        cleanupFunction: null
      };
      component._$hooks[hookIndex] = effectHook;
      Promise.resolve().then(() => {
        effectHook.cleanupFunction = callback();
      });
    } else {
      const componentEffect = component._$hooks[hookIndex];
      if (dependencies !== null) {
        for (let i = 0; i < dependencies.length; i++) {
          const oldDep = componentEffect.dependencies[i];
          if (oldDep !== dependencies[i]) {
            if (typeof componentEffect.cleanupFunction === "function")
              componentEffect.cleanupFunction();
            Promise.resolve().then(() => {
              componentEffect.cleanupFunction = callback();
              componentEffect.dependencies = dependencies;
            });
            break;
          }
        }
      } else {
        Promise.resolve().then(() => {
          componentEffect.cleanupFunction = callback();
          componentEffect.dependencies = dependencies;
        });
      }
    }
  };
  var useRef = (initialValue = null) => {
    const [component, hookIndex] = useHook();
    if (!component._$hooks.hasOwnProperty(hookIndex)) {
      component._$hooks[hookIndex] = {
        current: initialValue,
        __wcRef: true
      };
    }
    const ref = component._$hooks[hookIndex];
    return ref;
  };
  var useCallback = (callbackFn) => {
    const [component, hookIndex] = useHook();
    if (!component._$hooks.hasOwnProperty(hookIndex)) {
      component._$hooks[hookIndex] = callbackFn;
    }
    const callback = component._$hooks[hookIndex];
    return callback;
  };
  var useIdMemo = () => {
    let counter = 0;
    return () => {
      const [component, hookIndex] = useHook();
      if (!component._$hooks.hasOwnProperty(hookIndex)) {
        component._$hooks[hookIndex] = `:r${counter}:`;
        counter++;
      }
      const callback = component._$hooks[hookIndex];
      return callback;
    };
  };
  var useId = useIdMemo();
  var useMemo = (callbackFn, dependencies) => {
    const [component, hookIndex] = useHook();
    if (!component._$hooks.hasOwnProperty(hookIndex)) {
      component._$hooks[hookIndex] = {
        value: callbackFn(),
        dependencies
      };
    } else {
      const oldMemo = component._$hooks[hookIndex];
      for (let i = 0; i < dependencies.length; i++) {
        const oldDep = oldMemo.dependencies[i];
        if (oldDep !== dependencies[i]) {
          oldMemo.dependencies = dependencies;
          oldMemo.value = callbackFn();
          break;
        }
      }
    }
    const memoizedResult = component._$hooks[hookIndex];
    return memoizedResult.value;
  };
  var useExposed = (toExpose) => {
    const component = currentRenderingComponent;
    const keys = Object.keys(toExpose);
    for (const key of keys) {
      component[key] = toExpose[key];
    }
  };
  var createContextMemo = () => {
    let contextIdentifier = 0;
    return (initialValue) => {
      const name = `womp-context-provider-${contextIdentifier}`;
      contextIdentifier++;
      const ProviderFunction = defineWomp(
        ({ children }) => {
          const initialSubscribers = /* @__PURE__ */ new Set();
          const subscribers = useRef(initialSubscribers);
          useExposed({ subscribers });
          subscribers.current.forEach((el) => el.requestRender());
          return html`${children}`;
        },
        {
          name,
          cssGeneration: false
        }
      );
      const Context = {
        name,
        Provider: ProviderFunction,
        default: initialValue,
        subscribers: /* @__PURE__ */ new Set()
      };
      return Context;
    };
  };
  var createContext = createContextMemo();
  var useContext = (Context) => {
    const [component, hookIndex] = useHook();
    component._$usesContext = true;
    if (!component._$hooks.hasOwnProperty(hookIndex) || component._$hasBeenMoved) {
      let parent = component;
      const toFind = Context.name.toUpperCase();
      while (parent && parent.nodeName !== toFind && parent !== document.body) {
        if (parent instanceof ShadowRoot)
          parent = parent.host;
        else
          parent = parent.parentNode;
      }
      const oldParent = component._$hooks[hookIndex]?.node;
      if (parent && parent !== document.body) {
        parent.subscribers.current.add(component);
        const oldDisconnect = component.onDisconnected;
        component.onDisconnected = () => {
          parent.subscribers.current.delete(component);
          oldDisconnect();
        };
      } else if (oldParent) {
        if (DEV_MODE) {
          console.warn(
            `The element ${component.tagName} doens't have access to the Context ${Context.name} because is no longer a child of it.`
          );
        }
        oldParent.subscribers.current.delete(component);
      } else if (DEV_MODE && component.isConnected) {
        console.warn(
          `The element ${component.tagName} doens't have access to the Context ${Context.name}. The default value will be returned instead.`
        );
      }
      component._$hooks[hookIndex] = {
        node: parent
      };
    }
    const contextNode = component._$hooks[hookIndex].node;
    return contextNode ? contextNode.props.value : Context.default;
  };
  function html(templateParts, ...values) {
    const cleanValues = [];
    const length = templateParts.length - 1;
    if (!IS_SERVER) {
      for (let i = 0; i < length; i++) {
        if (!templateParts[i].endsWith("</"))
          cleanValues.push(values[i]);
      }
    } else {
      cleanValues.push(...values);
    }
    return {
      parts: templateParts,
      values: cleanValues,
      _$wompHtml: true
    };
  }
  var wompDefaultOptions = {
    shadow: false,
    name: "",
    cssGeneration: true
  };
  var registeredComponents = {};
  function defineWomp(Component, options) {
    if (!Component.css)
      Component.css = "";
    const componentOptions = {
      ...wompDefaultOptions,
      ...options || {}
    };
    if (!componentOptions.name) {
      let newName = Component.name.replace(/.[A-Z]/g, (letter) => `${letter[0]}-${letter[1].toLowerCase()}`).toLowerCase();
      if (!newName.includes("-"))
        newName += "-womp";
      componentOptions.name = newName;
    }
    Component.componentName = componentOptions.name;
    Component._$wompF = true;
    const [generatedCSS, styles] = __generateSpecifcStyles(Component, componentOptions);
    Component.css = generatedCSS;
    Component.options = {
      generatedCSS,
      styles,
      shadow: componentOptions.shadow
    };
    if (!IS_SERVER) {
      const ComponentClass = _$womp(Component, componentOptions);
      Component.class = ComponentClass;
      customElements.define(componentOptions.name, ComponentClass);
    }
    registeredComponents[componentOptions.name] = Component;
    return Component;
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
  var buildTreeStructure = (childNodes, structure = [], parent = null) => {
    childNodes.forEach((child) => {
      if (child instanceof Route.class) {
        const props = child.props;
        const route = {
          parent,
          element: props.element,
          path: props.path,
          index: null,
          children: []
        };
        if (props.index)
          parent.index = route;
        structure.push(route);
        buildTreeStructure(child.childNodes, route.children, route);
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
  var getWichParametricRouteisMoreSpecific = (routes) => {
    const parametricPaths = Object.keys(routes);
    parametricPaths.sort((a, b) => {
      const matchA = routes[a];
      const matchB = routes[b];
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
    return routes[parametricPaths[0]];
  };
  var getMatch = (routes, broswerRoute) => {
    const matches = {
      exact: null,
      parametric: {},
      fallbacks: {}
    };
    const currentRoute = broswerRoute !== "/" && broswerRoute.endsWith("/") ? broswerRoute.substring(0, broswerRoute.length - 1) : broswerRoute;
    for (const routeStructure of routes) {
      const [routePath, route] = routeStructure;
      const isFallback = routePath.endsWith("*");
      if (!isFallback && routePath.split("/").length !== currentRoute.split("/").length)
        continue;
      if (routePath === currentRoute) {
        matches.exact = route;
        break;
      }
      if (!routePath.includes(":") && !routePath.includes("*"))
        continue;
      const segments = routePath.split("/");
      let regex = "";
      const paramNames = [];
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        regex += "\\/";
        if (segment.startsWith(":")) {
          if (i === segments.length - 1)
            regex += "(.*)";
          else
            regex += "(.*?)";
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
        if (isFallback)
          matches.fallbacks[routePath] = [route, params];
        else
          matches.parametric[routePath] = [route, params];
      }
    }
    const parametricPaths = Object.keys(matches.parametric);
    const fallbackPaths = Object.keys(matches.fallbacks);
    if (matches.exact) {
      return [matches.exact, {}];
    } else if (parametricPaths.length) {
      return getWichParametricRouteisMoreSpecific(matches.parametric);
    } else if (fallbackPaths.length) {
      return getWichParametricRouteisMoreSpecific(matches.fallbacks);
    }
    return [null, null];
  };
  var getFullPath = (prevRoute, newRoute) => {
    return newRoute.startsWith("/") ? newRoute : prevRoute + (prevRoute.endsWith("/") ? "" : "/") + newRoute;
  };
  var RouterContext = createContext({
    route: null,
    params: null,
    currentRoute: null,
    setNewRoute: null
  });
  function Routes({ children }) {
    const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
    const setNewRoute = useCallback((newRoute, pushState = true) => {
      setCurrentRoute((prevRoute) => {
        const nextRoute2 = getFullPath(prevRoute, newRoute);
        if (pushState && prevRoute !== nextRoute2) {
          history.pushState({}, null, nextRoute2);
          context.currentRoute = nextRoute2;
        }
        return nextRoute2;
      });
    });
    const context = {
      route: null,
      params: null,
      currentRoute,
      setNewRoute
    };
    const treeStructure = useMemo(() => buildTreeStructure(children.nodes), []);
    const routes = useMemo(() => getRoutes(treeStructure), []);
    useEffect(() => {
      window.addEventListener("popstate", () => {
        setNewRoute(window.location.pathname, false);
      });
    }, []);
    const [route, params] = getMatch(routes, currentRoute);
    context.params = params;
    if (!route)
      return /* @__PURE__ */ jsx("div", { children: "Not found!" });
    let root = route;
    let nextRoute = null;
    root.nextRoute = nextRoute;
    while (root.parent) {
      nextRoute = root;
      root = root.parent;
      root.nextRoute = nextRoute;
    }
    context.route = root;
    return /* @__PURE__ */ jsx(RouterContext.Provider, { value: context, children: /* @__PURE__ */ jsx(SingleRouteContext.Provider, { value: root, children: root?.element }) });
  }
  defineWomp(Routes, {
    name: "womp-routes"
  });
  var SingleRouteContext = createContext(null);
  function Route({ route }) {
    return /* @__PURE__ */ jsx(Fragment, {});
  }
  defineWomp(Route, {
    name: "womp-route"
  });
  function ChildRoute() {
    const routerContext = useContext(RouterContext);
    let toRender = null;
    const route = routerContext.route;
    if (routerContext) {
      const newRoute = route.nextRoute;
      if (newRoute) {
        toRender = newRoute;
      } else if (route.index) {
        toRender = route.index;
      }
    }
    routerContext.route = toRender;
    return /* @__PURE__ */ jsx(SingleRouteContext.Provider, { value: toRender, children: toRender?.element });
  }
  defineWomp(ChildRoute, {
    name: "womp-child-route"
  });
  function Link({ to, children }) {
    const navigate = useNavigate();
    const route = useContext(SingleRouteContext);
    let href = to;
    if (!href.startsWith("/")) {
      let parentRoute = route;
      while (parentRoute) {
        const parentPath = parentRoute.path;
        if (parentPath) {
          const slash = !parentPath.endsWith("/") ? "/" : "";
          href = parentRoute.path + slash + href;
        }
        parentRoute = parentRoute.parent;
      }
    }
    const onLinkClick = (ev) => {
      ev.preventDefault();
      navigate(href);
    };
    return /* @__PURE__ */ jsx("a", { href, onClick: onLinkClick, children });
  }
  Link.css = `
	:host {
		display: inline-block;
	}
`;
  defineWomp(Link, {
    name: "womp-link"
  });
  var useParams = () => {
    const routerContext = useContext(RouterContext);
    return routerContext.params;
  };
  var useNavigate = () => {
    const routerContext = useContext(RouterContext);
    return routerContext.setNewRoute;
  };

  // src/App.tsx
  var Teams = () => {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { children: "Bro sono dentro un team io" }),
      /* @__PURE__ */ jsx(ChildRoute, {})
    ] });
  };
  defineWomp(Teams);
  var Root = () => {
    const [counter, setCounter] = useState(0);
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setCounter(counter + 1), children: [
          "Inc ",
          counter
        ] }),
        "Root!! ",
        /* @__PURE__ */ jsx(Link, { to: "teams", children: "Vai a Teams" }),
        /* @__PURE__ */ jsx(Link, { to: "/", children: "Vai a Root" })
      ] }),
      /* @__PURE__ */ jsx(ChildRoute, {}),
      /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx(Link, { to: "teams", children: "Vai a Teams" }) })
    ] });
  };
  defineWomp(Root);
  var Team = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    useEffect(() => {
      setTimeout(() => {
        navigate("/");
      }, 4e3);
    }, []);
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "Team singolo ",
        teamId,
        "!!"
      ] }),
      /* @__PURE__ */ jsx("p", { children: "In 4 seconds you'll go in the home!!!" }),
      /* @__PURE__ */ jsx(Link, { to: "/teams/200", children: "200!" })
    ] });
  };
  defineWomp(Team);
  function App({ children }) {
    return /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsxs(Route, { path: "/", element: /* @__PURE__ */ jsx(Root, {}), children: [
        /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx("i", { children: "L'index della home" }) }),
        /* @__PURE__ */ jsx(Route, { path: ":boh", element: /* @__PURE__ */ jsx("div", { children: "BOH!" }), children: /* @__PURE__ */ jsx(Route, { path: ":teamId/members/coaches", element: /* @__PURE__ */ jsx("div", { children: "Non si vede!" }) }) }),
        /* @__PURE__ */ jsxs(Route, { path: "teams", element: /* @__PURE__ */ jsx(Teams, {}), children: [
          /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx("i", { children: "Fallbackkkk" }) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId", element: /* @__PURE__ */ jsx(Team, {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/members/*", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/members/coaches", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/members/:param", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: ":teamId/edit", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(Route, { path: "new", element: /* @__PURE__ */ jsx("div", {}) }),
          /* @__PURE__ */ jsx(
            Route,
            {
              index: true,
              element: /* @__PURE__ */ jsxs("u", { children: [
                "Bro dai seleziona un team",
                /* @__PURE__ */ jsx(Link, { to: "90", children: "90" })
              ] })
            }
          )
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
//! For each hook, if the hook is !null && has a cleanupFunction, execute it.
//! This beacuse timers will continue it's execution also after the component has been
//! Disconnected
//! Create a compare htmlTemplates function which will compare each part and return false
//! in the first non-match (better than stringifying the whole templates and compare them).
//! Use it also on __setValues.
//! Make custom component. Allow to override it.
