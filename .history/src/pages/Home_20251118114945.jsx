// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
	return (
		<div className="home-container">

			{/* HERO SECTION */}
			<section className="hero-section">
				<h1 className="hero-title">Welcome to Nightshift Dev</h1>
				<p className="hero-sub">
					Late-night builds, experiments, bugs I regret, and notes for future me.
					This is where the chaos becomes documentation.
				</p>
				<div className="hero-buttons">
					<Link to="/blog" className="btn-primary">Read Posts</Link>
					<Link to="/connect" className="btn-secondary">Connect</Link>
				</div>
			</section>

			{/* FEATURE SECTION */}
			<section className="feature-grid">
				<div className="feature-card">
					<h3>Dev Logs</h3>
					<p>Weekly posts on whatever I’m building, breaking, or fixing at 2am.</p>
					<Link to="/blog">Browse Posts →</Link>
				</div>

				<div className="feature-card">
					<h3>Mini Projects</h3>
					<p>A collection of small, sometimes cursed experiments and tools.</p>
					<Link to="/about">See More →</Link>
				</div>

				<div className="feature-card">
					<h3>Shop</h3>
					<p>Digital tools, templates, and designs coming soon.</p>
					<Link to="/shop">View Shop →</Link>
				</div>
			</section>

			{/* CTA SECTION */}
			<section className="cta-section">
				<h2>Want to collaborate?</h2>
				<p>I’m always interested in cool technical challenges and creative ideas.</p>
				<Link to="/connect" className="btn-primary large">Reach Out</Link>
			</section>
		</div>
	);
}
