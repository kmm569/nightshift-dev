import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Blog() {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

		const unsub = onSnapshot(
			q,
			snapshot => {
				const list = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
				}));
				setPosts(list);
				setLoading(false);
			},
			err => {
				console.error('Error loading posts:', err);
				setLoading(false);
			},
		);

		return unsub;
	}, []);

	if (loading) return <p>Loading posts...</p>;
	if (!posts.length) return <p>No posts yet. Go write something in the admin panel.</p>;

	return (
		<section className="blog">
			<h2>Blog</h2>
			<div className="post-list">
				{posts.map(post => (
					<article key={post.id} className="post-card">
						<h3>{post.title}</h3>
						{post.summary && <p>{post.summary}</p>}
						{post.createdAt?.toDate && (
							<small>
								{post.createdAt.toDate().toLocaleString()}
							</small>
						)}
					</article>
				))}
			</div>
		</section>
	);
}
