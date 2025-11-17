import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Blog from './pages/Blog.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Account from './pages/Account.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<Home />} />
				<Route path="/blog" element={<Blog />} />
				<Route path="/admin" element={<AdminLogin />} />
				<Route
					path="/account"
					element={
						<ProtectedRoute>
							<Account />
						</ProtectedRoute>
					}
				/>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
