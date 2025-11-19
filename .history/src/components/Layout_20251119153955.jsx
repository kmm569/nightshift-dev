// src/components/Layout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationsBell from "./NotificationsBell.jsx";

export default function Layout() {
	const { currentUser } = useAuth();

	return (
		<div className="app-shell">
			<header className="bubble-header">
				<div className="header-inner">
					<div className="logo">Nightshift Dev</div>

					<nav className="nav-links">
						<NavLink to="/" end className="nav-link">
							Home
						</NavLink>
						<NavLink to="/about" className="nav-link">
							About
						</NavLink>
						<NavLink to="/blog" className="nav-link">
							Posts
						</NavLink>
						<NavLink to="/shop" className="nav-link">
							Shop
						</NavLink>
						<NavLink to="/connect" className="nav-link">
							Connect
						</NavLink>

						{currentUser && <NotificationsBell />}

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
