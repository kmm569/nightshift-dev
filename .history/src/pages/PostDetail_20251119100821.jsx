import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { toggleLike, toggleSave } from "../lib/posts";

export default function PostDetail() {
	const { postId } = useParams();
	const navigate = useNavigate();
	const { currentUser } = useAuth();

	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(true);

	// live author profile
	const [author, setAuthor] = useState(null);

	// UI state for likes/saves (local only)
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);

	// tooltip state
	const [showProfileCard, setShowProfileCard] = useState(false);

	// Load post content
	useEffect(() => {
		const ref = doc(db, "posts", postId);

		const unsub = onSnapshot(
			ref,
			(snap) => {
				if (!snap.exists()) {
					setPost(null);
				} else {
					setPost({ id: snap.id, ...snap.data() });
				}
				setLoading(false);
			},
			(err) => {
				console.error("Error loading post:", err);
				setLoading(false);
			}
		);

		return unsub;
	}, [postId]);

	// Live author info from /users/{authorId}
	useEffect(() => {
		if (!post || !post.authorId) {
			// no setState here — avoid React warning
			return;
		}

		const ref = doc(db, "users", post.authorId);

		const unsub = onSnapshot(
			ref,
			(snap) => {
				if (snap.exists()) {
					setAuthor({ id: snap.id, ...snap.data() });
				} else {
					setAuthor(null);
				}
			},
			(err) => {
				console.error("Error loading author profile:", err);
			}
		);

		return unsub;
	}, [post]);

	if (loading) {
		return <p>Loading post...</p>;
	}

	if (!post) {
		return <p>Post not found.</p>;
	}

	const isAuthor =
		currentUser && currentUser.uid && currentUser.uid === post.authorId;

	const formattedDate =
		post.createdAt?.toDate && post.createdAt.toDate().toLocaleDateString();

	// derive display data from live author first, then fallback
	const displayName =
		author?.displayName || author?.name || post.authorName || "Unknown";

	const avatarUrl =
		author?.avatarUrl || author?.photoURL || author?.photoUrl || null;

	const authorInitial =
		displayName && displayName.length ? displayName[0].toUpperCase() : "?";

	const authorRole = author?.role || null;
	const authorBio = author?.bio || null;

	const handleToggleLike = async () => {
		if (!currentUser) {
			alert("Sign in to like posts.");
			return;
		}

		try {
			setLiked((prev) => !prev);
			await toggleLike(post.id, currentUser.uid);
		} catch (err) {
			console.error(err);
		}
	};

	const handleToggleSave = async () => {
		if (!currentUser) {
			alert("Sign in to save posts.");
			return;
		}

		try {
			setSaved((prev) => !prev);
			await toggleSave(post.id, currentUser.uid);
		} catch (err) {
			console.error(err);
		}
	};

	const handleAuthorClick = () => {
		// For now, send to your own account/profile page.
		// Later you can swap this to /user/:id for public profiles.
		navigate("/account");
	};

	return (
		<article className="post-detail">
			<header className="post-detail-header">
				<div className="post-detail-titles">
					<h1>{post.title}</h1>

					<div className="post-detail-meta">
						{/* Author pill + tooltip */}
						<div
							className="post-detail-author-wrapper"
							onMouseEnter={() => setShowProfileCard(true)}
							onMouseLeave={() => setShowProfileCard(false)}
						>
							<button
								type="button"
								className="post-detail-author"
								onClick={handleAuthorClick}
							>
								<div className="post-detail-author-avatar">
									{avatarUrl ? (
										<img src={avatarUrl} alt={displayName} />
									) : (
										authorInitial
									)}
								</div>
								<div className="post-detail-author-text">
									<span className="post-detail-author-label">By</span>
									<span className="post-detail-author-name">{displayName}</span>
								</div>
							</button>

							{showProfileCard && (
								<div className="author-popup-card">
									<div className="author-popup-header">
										<div className="author-popup-avatar">
											{avatarUrl ? (
												<img src={avatarUrl} alt={displayName} />
											) : (
												authorInitial
											)}
										</div>
										<div className="author-popup-main">
											<div className="author-popup-name">{displayName}</div>
											{authorRole && (
												<div className="author-popup-role">{authorRole}</div>
											)}
										</div>
									</div>
									{authorBio && <p className="author-popup-bio">{authorBio}</p>}
									<button
										type="button"
										className="btn btn-secondary author-popup-link"
										onClick={handleAuthorClick}
									>
										View profile
									</button>
								</div>
							)}
						</div>

						{formattedDate && <span>{formattedDate}</span>}
					</div>
				</div>

				<div className="post-detail-header-actions">
					<button
						className="btn btn-secondary"
						type="button"
						onClick={() => navigate("/blog")}
					>
						Back to posts
					</button>

					{isAuthor && (
						<button
							className="btn btn-primary"
							type="button"
							onClick={() => navigate(`/blog/${post.id}/edit`)}
						>
							Edit
						</button>
					)}
				</div>
			</header>

			{post.bannerImageUrl && (
				<div className="post-detail-banner-wrapper">
					<img
						src={post.bannerImageUrl}
						alt={post.title}
						className="post-detail-banner"
					/>
				</div>
			)}

			<div className="post-detail-actions">
				<button
					type="button"
					className={`pill-button ${liked ? "pill-button-active" : ""}`}
					onClick={handleToggleLike}
				>
					{liked ? "♥ Liked" : "♡ Like"} ({post.likesCount || 0})
				</button>

				<button
					type="button"
					className={`pill-button ${saved ? "pill-button-active" : ""}`}
					onClick={handleToggleSave}
				>
					{saved ? "★ Saved" : "☆ Save"} ({post.savesCount || 0})
				</button>
			</div>

			<div className="post-detail-content">
				{post.content
					.split("\n")
					.map((line, index) =>
						line.trim().length === 0 ? (
							<br key={index} />
						) : (
							<p key={index}>{line}</p>
						)
					)}
			</div>
		</article>
	);
}
