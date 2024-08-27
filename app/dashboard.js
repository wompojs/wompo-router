import { defineWompo, html, useEffect } from 'wompo';
import { ChildRoute, Link, useNavigate, useParams } from '../dist/wompo-router.js';

export default function Dashboard() {
	const params = useParams();
	const navigate = useNavigate();
	console.log(params);

	useEffect(() => {
		console.log('initiated');
	}, []);

	return html`
    Emmm??
		<button @click=${() => {
			navigate('236');
		}}>Ciaooo</button>
    <${ChildRoute} />
    <${Link} to="ciao">Linkk</${Link}>
    <${Link} to="#" target="_blank">Linkk</${Link}>
  `;
}

defineWompo(Dashboard);
