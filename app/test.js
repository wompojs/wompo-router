import { defineWompo, html } from 'wompo';
import { Routes, Route } from '../dist/wompo-router.js';
import Dashboard from './dashboard.js';

export default function Test() {
	return html`
    <${Routes} notFoundElement=${html`OMGGGG 404 NOT FOUNDDD`}>
      <${Route} path="/:key" element=${html`<h1>AAAA</h1>`} />
      <${Route} path="/:key/*" element=${html`<${Dashboard} />`} />
    </${Routes}>
  `;
}

defineWompo(Test);
