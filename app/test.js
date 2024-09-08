import { defineWompo, html } from 'wompo';
import { Routes, Route, ChildRoute, Link, useParams, useRoute } from '../dist/wompo-router.js';
import Dashboard from './dashboard.js';

function Elem() {
	const params = useParams();
	const route = useRoute();
	console.log(route);
	return html`
    <h1>BBB</h1>
    <${ChildRoute} />
    <${Link} to="/">Home</${Link}><br/>
    <${Link} to="?aa=bbb&c=10">Search</${Link}><br/>
    <${Link} to="#">#</${Link}><br/>
  `;
}
defineWompo(Elem);

export default function Test() {
	return html`
    <${Routes} notFoundElement=${html`OMGGGG 404 NOT FOUNDDD`}>
      <${Route} path="*" element=${html`<${Dashboard} />`} />
    </${Routes}>
  `;
}

defineWompo(Test);
