import { defineWomp, useEffect } from 'womp';
import { Link, useNavigate, useParams } from '../ts/Routes';

export default function Team() {
	const { teamId } = useParams();
	const navigate = useNavigate();
	useEffect(() => {
		setTimeout(() => {
			navigate('/');
		}, 4000);
	}, []);
	return (
		<div>
			<p>Team singolo {teamId}!!</p>
			<p>In 4 seconds you'll go in the home!!!</p>
			<Link to='/teams/200'>200!</Link>
		</div>
	);
}
defineWomp(Team);
