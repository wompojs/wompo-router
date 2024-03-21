import { WompProps, defineWomp } from 'womp';
import { Route, Routes } from '../ts/Routes';

export default function App({ children }: WompProps) {
	return (
		<Routes>
			<Route path="/" element={<div />}>
				<Route index element={<div />} />
				<Route path=":boh" element={<div />}>
					<Route path=":teamId/members/coaches" element={<div />} />
				</Route>
				<Route path="teams" element={<div />}>
					<Route path="*" element={<div />} />
					<Route path=":teamId" element={<div />} />
					<Route path=":teamId/members/*" element={<div />} />
					<Route path=":teamId/members/coaches" element={<div />} />
					<Route path=":teamId/members/:param" element={<div />} />
					<Route path=":teamId/edit" element={<div />} />
					<Route path="new" element={<div />} />
					<Route index element={<div />} />
				</Route>
			</Route>
			<Route element={<div />}>
				<Route path="/privacy" element={<div />} />
				<Route path="/tos" element={<div />} />
			</Route>
			<Route path="contact-us" element={<div />} />
		</Routes>
	);
}

defineWomp(App);
