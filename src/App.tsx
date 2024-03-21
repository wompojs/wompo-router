import { WompProps, defineWomp } from 'womp';
import { ChildRoute, Route, Routes } from '../ts/Routes';

const Teams = () => {
	return (
		<div>
			<p>Bro sono dentro un team io</p>
			<ChildRoute />
		</div>
	);
};
defineWomp(Teams);

const Root = () => {
	return (
		<div>
			<p>Root!!</p>
			<ChildRoute />
		</div>
	);
};
defineWomp(Root);

const Team = () => {
	return (
		<div>
			<p>Team singolo!!</p>
		</div>
	);
};
defineWomp(Team);

export default function App({ children }: WompProps) {
	return (
		<Routes>
			<Route path='/' element={<Root />}>
				<Route index element={<div />} />
				<Route path=':boh' element={<div />}>
					<Route path=':teamId/members/coaches' element={<div />} />
				</Route>
				<Route path='teams' element={<Teams />}>
					<Route path='*' element={<div />} />
					<Route path=':teamId' element={<Team />} />
					<Route path=':teamId/members/*' element={<div />} />
					<Route path=':teamId/members/coaches' element={<div />} />
					<Route path=':teamId/members/:param' element={<div />} />
					<Route path=':teamId/edit' element={<div />} />
					<Route path='new' element={<div />} />
					<Route index element={<div>Bro dai seleziona un team</div>} />
				</Route>
			</Route>
			<Route element={<div />}>
				<Route path='/privacy' element={<div />} />
				<Route path='/tos' element={<div />} />
			</Route>
			<Route path='contact-us' element={<div />} />
		</Routes>
	);
}

defineWomp(App);
