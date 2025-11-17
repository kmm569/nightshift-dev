// src/components/Layout.jsx
import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
	const { currentUser } = useAuth();

	return (
		<div className="app-shell">
			<header className="site-header">
				<div className="nav-inner">
					<Link to="/" className="logo">
						Nightshift Dev
					</Link>
					<nav className="nav-links">
						<NavLink to="/" end className="nav-link">
							Home
						</NavLink>
						<NavLink to="/blog" className="nav-link">
							Blog
						</NavLink>
						{currentUser ? (
							<NavLink to="/account" className="nav-link">
								Account
							</NavLink>
						) : (
							<NavLink to="/admin" className="nav-link">
								Login
							</NavLink>
						)}
					</nav>
				</div>
			</header>

			<main className="site-main">
				<Outlet />
			</main>

			<footer className="site-footer">
				<p>© {new Date().getFullYear()} Nightshift Dev</p>
			</footer>
		</div>
	);
}
