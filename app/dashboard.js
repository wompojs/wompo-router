import { defineWompo, html, useEffect, useLayoutEffect } from 'wompo';
import { ChildRoute, Link, useNavigate, useParams } from '../dist/wompo-router.js';

function Widget({ remove }) {
	if (remove) {
		const parent = this.parentElement;
		Promise.resolve().then(() => {
			parent.remove();
		});
		return null;
	}
	return html` <p>WIDGET</p> `;
}
defineWompo(Widget);

export default function Dashboard() {
	const params = useParams();

	console.log(params);

	useEffect(() => {
		return () => {
			console.log('disconnected dashboard');
		};
	}, []);

	useEffect(() => {
		console.log('dashboard');
	});

	return html`
		<h1>DASHBOARD</h1>
		<${ChildRoute} />
		<p>
			<${Widget} />
		</p>
		<p>
			<${Widget} />
		</p>
		<p>
			<${Widget} remove />
		</p>
		<p>
			<${Widget} />
		</p>
		${params.segments.map((el) => html`<p>${el}</p>`)}
	`;
}

Dashboard.css = `
	p {
		background-color: black;
		padding: 20px;
		color: white;
	}
`;

defineWompo(Dashboard);
