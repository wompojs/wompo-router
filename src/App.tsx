import { WompProps, defineWomp, useEffect, useState } from 'womp';
import { ChildRoute, Link, Route, Routes, useNavigate, useParams } from '../ts/Routes';

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
	const [counter, setCounter] = useState(0);
	return (
		<div>
			<p>
				<button onClick={() => setCounter(counter + 1)}>Inc {counter}</button>
				Root!!
				<p>
					<Link to='teams'>Vai a Teams</Link>
				</p>
				<p>
					<Link to='/'>Vai a Root</Link>
				</p>
			</p>
			<ChildRoute />
			<p>
				<Link to='teams'>Vai a Teams</Link>
			</p>
		</div>
	);
};
defineWomp(Root);

export default function App({ children }: WompProps) {
	return (
		<Routes>
			<Route path='/' element={<Root />}>
				<Route index element={<i>L'index della home</i>} />
				<Route path=':boh' element={<div>BOH!</div>}>
					<Route path=':teamId/members/coaches' element={<div>Non si vede!</div>} />
				</Route>
				<Route path='teams' element={<Teams />}>
					<Route path='*' element={<i>Fallbackkkk</i>} />
					<Route path=':teamId' lazy={() => import('./Team')} />
					<Route path=':teamId/members/*' element={<div />} />
					<Route path=':teamId/members/coaches' element={<div />} />
					<Route path=':teamId/members/:param' element={<div />} />
					<Route path=':teamId/edit' element={<div />} />
					<Route path='new' element={<div />} />
					<Route
						index
						element={
							<u>
								Bro dai seleziona un team<Link to='90'>90</Link>
							</u>
						}
					/>
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
