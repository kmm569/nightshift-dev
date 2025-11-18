import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Blog from './pages/Blog.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Account from './pages/Account.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import About from './pages/About';
import Connect from './pages/Connect';
import Shop from './pages/Shop';
import NewPost from './pages/NewPost.jsx';
import PostDetail from './pages/PostDetail.jsx';
import EditPost from './pages/EditPost.jsx';

export default function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<Home />} />

				{/* Blog routes */}
				<Route path="/blog" element={<Blog />} />
				<Route
					path="/blog/new"
					element={
						<ProtectedRoute>
							<NewPost />
						</ProtectedRoute>
					}
				/>
				<Route path="/blog/:postId" element={<PostDetail />} />
				<Route
					path="/blog/:postId/edit"
					element={
						<ProtectedRoute>
							<EditPost />
						</ProtectedRoute>
					}
				/>

				<Route path="/admin" element={<AdminLogin />} />
				<Route path="/about" element={<About />} />
				<Route path="/shop" element={<Shop />} />
				<Route path="/connect" element={<Connect />} />

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
