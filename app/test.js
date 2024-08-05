import { defineWompo, html } from 'wompo';
import { Routes, Route } from '../dist/wompo-router.js';
import Dashboard from './dashboard.js';

export default function Test() {
	if (location.pathname.startsWith('/router')) {
		return html`
      <${Routes} origin="/router" notFoundElement=${html`OMGGGG 404 NOT FOUNDDD`}>
        <${Route} path="/" element=${html`<${Dashboard} />`}>
          <${Route} path=":id" element=${html`<${Dashboard} />`}>
            <${Route} path="nested" element=${html`<${Dashboard} />`}>
              <${Route} path=":pageId" element=${html`<${Dashboard} />`}>

              </${Route}>
            </${Route}>
          </${Route}>
        </${Route}>
      </${Routes}>
    `;
	}
	return null;
}

defineWompo(Test);
