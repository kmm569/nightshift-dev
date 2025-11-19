import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { toggleLike, toggleSave } from '../lib/posts';

export default function PostDetail() {
	const { postId } = useParams();
	const navigate = useNavigate();
	const { currentUser } = useAuth();

	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(true);
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);

	// load post content
	useEffect(() => {
		const ref = doc(db, 'posts', postId);

		const unsub = onSnapshot(
			ref,
			snap => {
				if (!snap.exists()) {
					setPost(null);
				} else {
					setPost({ id: snap.id, ...snap.data() });
				}
				setLoading(false);
			},
			err => {
				console.error('Error loading post:', err);
				setLoading(false);
			},
		);

		return unsub;
	}, [postId]);

	if (loading) {
		return <p>Loading post...</p>;
	}

	if (!post) {
		return <p>Post not found.</p>;
	}

	const isAuthor =
		currentUser && currentUser.uid && currentUser.uid === post.authorId;

	const handleToggleLike = async () => {
		if (!currentUser) {
			alert('Sign in to like posts.');
			return;
		}

		try {
			setLiked(prev => !prev);
			await toggleLike(post.id, currentUser.uid);
		} catch (err) {
			console.error(err);
		}
	};

	const handleToggleSave = async () => {
		if (!currentUser) {
			alert('Sign in to save posts.');
			return;
		}

		try {
			setSaved(prev => !prev);
			await toggleSave(post.id, currentUser.uid);
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<article className="post-detail">
			<header className="post-detail-header">
				<div className="post-detail-titles">
					<h1>{post.title}</h1>
					<div className="post-detail-meta">
						<span>By {post.authorName || 'Unknown'}</span>
						{post.createdAt?.toDate && (
							<span>
								{post.createdAt
									.toDate()
									.toLocaleDateString()}
							</span>
						)}
					</div>
				</div>

				<div className="post-detail-header-actions">
					<button
						className="btn btn-secondary"
						onClick={() => navigate('/blog')}
					>
						Back to posts
					</button>

					{isAuthor && (
						<button
							className="btn btn-primary"
							onClick={() => navigate(`/blog/${post.id}/edit`)}
						>
							Edit
						</button>
					)}
				</div>
			</header>

			{post.bannerImageUrl && (
				<img
					src={post.bannerImageUrl}
					alt={post.title}
					className="post-detail-banner"
				/>
			)}

			<div className="post-detail-actions">
				<button
					className={`pill-button ${
						liked ? 'pill-button-active' : ''
					}`}
					onClick={handleToggleLike}
				>
					{liked ? '♥ Liked' : '♡ Like'} ({post.likesCount || 0})
				</button>

				<button
					className={`pill-button ${
						saved ? 'pill-button-active' : ''
					}`}
					onClick={handleToggleSave}
				>
					{saved ? '★ Saved' : '☆ Save'} ({post.savesCount || 0})
				</button>
			</div>

			<div className="post-detail-content">
				{post.content
					.split('\n')
					.map((line, index) =>
						line.trim().length === 0 ? (
							<br key={index} />
						) : (
							<p key={index}>{line}</p>
						),
					)}
			</div>
		</article>
	);
}
