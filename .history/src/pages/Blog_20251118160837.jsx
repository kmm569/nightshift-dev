import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Blog() {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const { currentUser, isAdmin } = useAuth();
	const navigate = useNavigate();

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
				setError('Failed to load posts.');
				setLoading(false);
			},
		);

		return unsub;
	}, []);

	if (loading) {
		return <p>Loading posts...</p>;
	}

	if (error) {
		return <p>{error}</p>;
	}

	return (
		<section className="blog">
			<header className="blog-header">
				<div className="blog-header-text">
					<h2>Blog</h2>
					<p>Thoughts, tutorials, and nightshift brain dumps.</p>
				</div>

				{currentUser && isAdmin && (
					<button
						className="btn btn-primary"
						onClick={() => navigate('/blog/new')}
					>
						Create Post
					</button>
				)}
			</header>

			{posts.length === 0 ? (
				<p>No posts yet.</p>
			) : (
				<div className="post-list">
					{posts.map(post => (
						<article
							key={post.id}
							className="post-card"
							onClick={() => navigate(`/blog/${post.id}`)}
						>
							{post.bannerImageUrl && (
								<img
									src={post.bannerImageUrl}
									alt={post.title}
									className="post-card-image"
								/>
							)}
							<div className="post-card-body">
								<h3>{post.title}</h3>

								{post.excerpt && (
									<p className="post-card-excerpt">
										{post.excerpt}
									</p>
								)}

								<div className="post-card-meta">
									<span className="post-card-author">
										{post.authorName || 'Unknown'}
									</span>

									<div className="post-card-stats">
										<span>
											♥ {post.likesCount || 0}
										</span>
										<span>
											★ {post.savesCount || 0}
										</span>
									</div>
								</div>

								{post.createdAt?.toDate && (
									<small className="post-card-date">
										{post.createdAt
											.toDate()
											.toLocaleDateString()}
									</small>
								)}
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
