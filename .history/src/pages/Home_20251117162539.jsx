import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
	return (
		<section className="home">
			<h1>Nightshift Dev</h1>
			<p>
				Late-night builds, bugs I regret, and notes for future me.
				This is the dev log.
			</p>
			<Link to="/blog" className="btn-primary">
				Check the latest posts
			</Link>
		</section>
	);
}
