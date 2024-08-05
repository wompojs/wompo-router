import { defineWompo, html, useEffect } from 'wompo';
import { ChildRoute, Link, useNavigate, useParams } from '../dist/wompo-router.js';

export default function Dashboard() {
	const params = useParams();
	const navigate = useNavigate();
	console.log(params);

	/* useEffect(() => {
		setTimeout(() => {
			navigate('nested', false);
		}, 5000);
	}, []); */

	return html`
    Emmm??
    <${ChildRoute} />
    <${Link} to="#">Linkk</${Link}>
    <${Link} to="#" target="_blank">Linkk</${Link}>
  `;
}

defineWompo(Dashboard);
