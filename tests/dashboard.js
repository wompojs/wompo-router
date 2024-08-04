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
    <${Link} to="nested?a=2">Linkk</${Link}>
  `;
}

defineWompo(Dashboard);
