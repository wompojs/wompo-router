import { defineWompo, html } from 'wompo';
import { Routes, Route, ChildRoute } from '../dist/wompo-router.js';
import Dashboard from './dashboard.js';

export default function Test() {
	return html`
    <${Routes} notFoundElement=${html`OMGGGG 404 NOT FOUNDDD`}>
      <${Route} path="/" element=${html`<h1>BBB</h1>
		<${ChildRoute} />`}>
        <${Route} path="file-manager/*" element=${html`<${Dashboard} />`} />
      </${Route}>
      <${Route} path="/:key" element=${html`<h1>AAAA</h1>`} />
      <${Route} path="/:key/*" element=${html`<${Dashboard} />`} />
    </${Routes}>
  `;
}

defineWompo(Test);
