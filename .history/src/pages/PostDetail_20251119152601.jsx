import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	doc,
	onSnapshot,
	deleteDoc,
	getDocs,
	collection,
	addDoc,
	query,
	orderBy,
	serverTimestamp,
	getDoc,
	where
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { toggleLike, toggleSave } from "../lib/posts";
import { toggleCommentLike } from "../lib/comments";
import { createNotification } from "../lib/notifications";

export default function PostDetail() {
	const { postId } = useParams();
	const navigate = useNavigate();
	const { currentUser, isAdmin } = useAuth();

	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(true);

	// live author profile
	const [author, setAuthor] = useState(null);

	// UI state for likes/saves (local only)
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);

	// delete state (post)
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	// comments state
	const [comments, setComments] = useState([]);
	const [commentsLoading, setCommentsLoading] = useState(true);
	const [commentText, setCommentText] = useState("");
	const [commentSubmitting, setCommentSubmitting] = useState(false);
	const [commentError, setCommentError] = useState("");

	// reply state
	const [replyingTo, setReplyingTo] = useState(null); // comment id
	const [replyText, setReplyText] = useState("");
	const [replySubmitting, setReplySubmitting] = useState(false);
	const [replyError, setReplyError] = useState("");

	// current user profile for comment header avatar
	const [currentProfile, setCurrentProfile] = useState(null);

	// Load post content
	useEffect(() => {
		const refDoc = doc(db, "posts", postId);

		const unsub = onSnapshot(
			refDoc,
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
			return;
		}

		const refUser = doc(db, "users", post.authorId);

		const unsub = onSnapshot(
			refUser,
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

	// live current user profile for comment header
	useEffect(() => {
		if (!currentUser || !currentUser.uid) {
			setCurrentProfile(null);
			return;
		}

		const meRef = doc(db, "users", currentUser.uid);

		const unsub = onSnapshot(
			meRef,
			(snap) => {
				if (snap.exists()) {
					setCurrentProfile({ id: snap.id, ...snap.data() });
				} else {
					setCurrentProfile(null);
				}
			},
			(err) => {
				console.error("Error loading current user profile:", err);
			}
		);

		return unsub;
	}, [currentUser]);

	// Live comments from /posts/{postId}/comments
	// replies are comments with parentId set
	useEffect(() => {
		if (!postId) return;

		const commentsRef = collection(db, "posts", postId, "comments");
		const q = query(commentsRef, orderBy("createdAt", "asc"));

		const unsub = onSnapshot(
			q,
			(snap) => {
				const items = [];
				snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
				setComments(items);
				setCommentsLoading(false);
			},
			(err) => {
				console.error("Error loading comments:", err);
				setCommentsLoading(false);
			}
		);

		return unsub;
	}, [postId]);

	if (loading) {
		return <p>Loading post...</p>;
	}

	if (!post) {
		return <p>Post not found.</p>;
	}

	const canEditOrDeletePost =
		currentUser &&
		currentUser.uid &&
		(currentUser.uid === post.authorId || isAdmin);

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
		if (post?.authorId) {
			navigate(`/u/${post.authorId}`);
		} else if (author?.id) {
			navigate(`/u/${author.id}`);
		}
	};

	const handleDeletePost = async () => {
		if (!post || !canEditOrDeletePost || deleting) return;

		const confirmed = window.confirm(
			"Delete this post permanently? This cannot be undone."
		);
		if (!confirmed) return;

		setDeleting(true);
		setDeleteError("");

		try {
			const postRef = doc(db, "posts", post.id);

			// delete likes + saves subcollections
			const [likesSnap, savesSnap] = await Promise.all([
				getDocs(collection(db, "posts", post.id, "likes")),
				getDocs(collection(db, "posts", post.id, "saves"))
			]);

			const subDeletes = [];
			likesSnap.forEach((d) => subDeletes.push(deleteDoc(d.ref)));
			savesSnap.forEach((d) => subDeletes.push(deleteDoc(d.ref)));

			if (subDeletes.length) {
				await Promise.all(subDeletes);
			}

			// delete banner image from Storage if stored in our bucket
			if (post.bannerImageUrl && typeof post.bannerImageUrl === "string") {
				try {
					const url = post.bannerImageUrl;
					const isFirebaseUrl =
						url.includes("firebasestorage.googleapis.com") ||
						url.includes("nightshiftdev");

					if (isFirebaseUrl) {
						const imgRef = ref(storage, url);
						await deleteObject(imgRef).catch((err) => {
							console.error("Error deleting banner image:", err);
						});
					}
				} catch (err) {
					console.error("Error preparing banner image delete:", err);
				}
			}

			await deleteDoc(postRef);
			navigate("/blog");
		} catch (err) {
			console.error("Error deleting post:", err);
			setDeleteError("Failed to delete post. Try again in a moment.");
		} finally {
			setDeleting(false);
		}
	};

	const handleSubmitComment = async (e) => {
		e.preventDefault();
		setCommentError("");

		if (!currentUser) {
			alert("Sign in to comment.");
			return;
		}

		const trimmed = commentText.trim();
		if (!trimmed) return;

		if (trimmed.length > 1000) {
			setCommentError("Comments are limited to 1000 characters.");
			return;
		}

		setCommentSubmitting(true);

		try {
			const commentsRef = collection(db, "posts", post.id, "comments");

			let authorName =
				currentUser.displayName || currentUser.email || "Anonymous";
			let authorPhotoURL = currentUser.photoURL || null;

			try {
				const profileSnap = await getDoc(
					doc(db, "users", currentUser.uid)
				);
				if (profileSnap.exists()) {
					const p = profileSnap.data();
					authorName = p.displayName || p.name || authorName;
					authorPhotoURL =
						p.avatarUrl || p.photoURL || authorPhotoURL;
				}
			} catch (profileErr) {
				console.error("Error loading profile for comment:", profileErr);
			}

			await addDoc(commentsRef, {
				text: trimmed,
				authorId: currentUser.uid,
				authorName,
				authorPhotoURL,
				parentId: null,
				createdAt: serverTimestamp()
			});

			setCommentText("");
		} catch (err) {
			console.error("Error adding comment:", err);
			setCommentError(err?.message || "Failed to post comment. Try again.");
		} finally {
			setCommentSubmitting(false);
		}
	};

	const handleReplyClick = (commentId) => {
		if (!currentUser) {
			alert("Sign in to reply.");
			return;
		}
		if (replyingTo === commentId) {
			setReplyingTo(null);
			setReplyText("");
			setReplyError("");
		} else {
			setReplyingTo(commentId);
			setReplyText("");
			setReplyError("");
		}
	};

	const handleSubmitReply = async (e, parentComment) => {
		e.preventDefault();
		setReplyError("");

		if (!currentUser) {
			alert("Sign in to reply.");
			return;
		}

		const trimmed = replyText.trim();
		if (!trimmed) return;

		if (trimmed.length > 1000) {
			setReplyError("Replies are limited to 1000 characters.");
			return;
		}

		setReplySubmitting(true);

		try {
			const commentsRef = collection(db, "posts", post.id, "comments");

			let authorName =
				currentUser.displayName || currentUser.email || "Anonymous";
			let authorPhotoURL = currentUser.photoURL || null;

			try {
				const profileSnap = await getDoc(
					doc(db, "users", currentUser.uid)
				);
				if (profileSnap.exists()) {
					const p = profileSnap.data();
					authorName = p.displayName || p.name || authorName;
					authorPhotoURL =
						p.avatarUrl || p.photoURL || authorPhotoURL;
				}
			} catch (profileErr) {
				console.error("Error loading profile for reply:", profileErr);
			}

			await addDoc(commentsRef, {
				text: trimmed,
				authorId: currentUser.uid,
				authorName,
				authorPhotoURL,
				parentId: parentComment.id,
				createdAt: serverTimestamp()
			});

			setReplyText("");
			setReplyingTo(null);
		} catch (err) {
			console.error("Error adding reply:", err);
			setReplyError(err?.message || "Failed to post reply. Try again.");
		} finally {
			setReplySubmitting(false);
		}
	};

	const handleCommentAuthorClick = (authorId) => {
		if (!authorId) return;
		navigate(`/u/${authorId}`);
	};

	const handleDeleteComment = async (comment) => {
		if (!currentUser) return;

		const canDelete =
			currentUser.uid === comment.authorId || isAdmin;
		if (!canDelete) return;

		const confirmed = window.confirm(
			comment.parentId
				? "Delete this reply?"
				: "Delete this comment and all its replies?"
		);
		if (!confirmed) return;

		try {
			const deletes = [];

			// delete this comment
			deletes.push(
				deleteDoc(
					doc(db, "posts", post.id, "comments", comment.id)
				)
			);

			// if it's a parent comment, also delete its replies
			if (!comment.parentId) {
				const repliesRef = collection(db, "posts", post.id, "comments");
				const q = query(repliesRef, where("parentId", "==", comment.id));
				const snap = await getDocs(q);
				snap.forEach((d) => deletes.push(deleteDoc(d.ref)));
			}

			await Promise.all(deletes);
		} catch (err) {
			console.error("Error deleting comment:", err);
		}
	};

	// split comments into top-level + replies map
	const topLevelComments = comments.filter(
		(c) => !c.parentId
	);
	const repliesByParent = {};
	comments.forEach((c) => {
		if (c.parentId) {
			if (!repliesByParent[c.parentId]) {
				repliesByParent[c.parentId] = [];
			}
			repliesByParent[c.parentId].push(c);
		}
	});

	return (
		<article className="post-detail">
			<header className="post-detail-header">
				<div className="post-detail-titles">
					<h1>{post.title}</h1>

					<div className="post-detail-meta">
						{/* Author pill + hoverable tooltip */}
						<div className="post-detail-author-wrapper">
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
									<span className="post-detail-author-name">
										{displayName}
									</span>
								</div>
							</button>

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

								{authorBio && (
									<p className="author-popup-bio">{authorBio}</p>
								)}

								<button
									type="button"
									className="btn btn-secondary author-popup-link"
									onClick={handleAuthorClick}
								>
									View profile
								</button>
							</div>
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

					{canEditOrDeletePost && (
						<button
							className="btn btn-primary"
							type="button"
							onClick={() => navigate(`/blog/${post.id}/edit`)}
						>
							Edit
						</button>
					)}

					{canEditOrDeletePost && (
						<button
							type="button"
							className="icon-button delete-button"
							onClick={handleDeletePost}
							disabled={deleting}
							title="Delete post"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="3 6 5 6 21 6" />
								<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
								<line x1="10" y1="11" x2="10" y2="17" />
								<line x1="14" y1="11" x2="14" y2="17" />
							</svg>
						</button>
					)}
				</div>
			</header>

			{post.bannerImageUrl && (
				<div className="post-detail-banner-container">
					<img src={post.bannerImageUrl} alt={post.title} />
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

			{deleteError && (
				<p className="error-text" style={{ marginTop: "1rem" }}>
					{deleteError}
				</p>
			)}

			{/* COMMENTS SECTION */}
			<section className="post-detail-comments">
				<h2>Comments</h2>

				{commentsLoading ? (
					<p className="post-comments-meta">Loading comments…</p>
				) : topLevelComments.length === 0 ? (
					<p className="post-comments-meta">No comments yet.</p>
				) : (
					<div className="post-comments-list">
						{topLevelComments.map((c) => {
							const cDate =
								c.createdAt?.toDate &&
								c.createdAt.toDate().toLocaleString();
							const cAvatar = c.authorPhotoURL || null;
							const cInitial =
								c.authorName && c.authorName.length
									? c.authorName[0].toUpperCase()
									: "?";

							const canDeleteComment =
								currentUser &&
								(currentUser.uid === c.authorId || isAdmin);

							const replies = repliesByParent[c.id] || [];

							return (
								<div key={c.id} className="post-comment">
									<div
										className="post-comment-avatar post-comment-avatar-clickable"
										onClick={() =>
											handleCommentAuthorClick(c.authorId)
										}
									>
										{cAvatar ? (
											<img
												src={cAvatar}
												alt={c.authorName || "User"}
											/>
										) : (
											<span>{cInitial}</span>
										)}
									</div>
									<div className="post-comment-body">
										<div className="post-comment-header">
											<button
												type="button"
												className="post-comment-author-button"
												onClick={() =>
													handleCommentAuthorClick(
														c.authorId
													)
												}
											>
												{c.authorName || "Unknown"}
											</button>
											{cDate && (
												<span className="post-comment-date">
													{cDate}
												</span>
											)}
											<div className="post-comment-header-actions">
												<button
													type="button"
													className="post-comment-reply-button"
													onClick={() =>
														handleReplyClick(c.id)
													}
												>
													Reply
												</button>
												{canDeleteComment && (
													<button
														type="button"
														className="icon-button comment-delete-button"
														onClick={() =>
															handleDeleteComment(
																c
															)
														}
														title="Delete comment"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="14"
															height="14"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round"
															strokeLinejoin="round"
														>
															<polyline points="3 6 5 6 21 6" />
															<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
															<line x1="10" y1="11" x2="10" y2="17" />
															<line x1="14" y1="11" x2="14" y2="17" />
														</svg>
													</button>
												)}
											</div>
										</div>
										<p className="post-comment-text">
											{c.text}
										</p>

										{/* replies */}
										{replies.length > 0 && (
											<div className="post-comment-replies">
												{replies.map((r) => {
													const rDate =
														r.createdAt?.toDate &&
														r.createdAt
															.toDate()
															.toLocaleString();
													const rAvatar =
														r.authorPhotoURL || null;
													const rInitial =
														r.authorName &&
														r.authorName.length
															? r.authorName[0].toUpperCase()
															: "?";

													const canDeleteReply =
														currentUser &&
														(currentUser.uid ===
															r.authorId ||
															isAdmin);

													return (
														<div
															key={r.id}
															className="post-comment post-comment-reply"
														>
															<div
																className="post-comment-avatar post-comment-avatar-clickable"
																onClick={() =>
																	handleCommentAuthorClick(
																		r.authorId
																	)
																}
															>
																{rAvatar ? (
																	<img
																		src={
																			rAvatar
																		}
																		alt={
																			r.authorName ||
																			"User"
																		}
																	/>
																) : (
																	<span>
																		{
																			rInitial
																		}
																	</span>
																)}
															</div>
															<div className="post-comment-body">
																<div className="post-comment-header">
																	<button
																		type="button"
																		className="post-comment-author-button"
																		onClick={() =>
																			handleCommentAuthorClick(
																				r.authorId
																			)
																		}
																	>
																		{r.authorName ||
																			"Unknown"}
																	</button>
																	{rDate && (
																		<span className="post-comment-date">
																			{
																				rDate
																			}
																		</span>
																	)}
																	<div className="post-comment-header-actions">
																		{canDeleteReply && (
																			<button
																				type="button"
																				className="icon-button comment-delete-button"
																				onClick={() =>
																					handleDeleteComment(
																						r
																					)
																				}
																				title="Delete reply"
																			>
																				<svg
																					xmlns="http://www.w3.org/2000/svg"
																					width="14"
																					height="14"
																					viewBox="0 0 24 24"
																					fill="none"
																					stroke="currentColor"
																					strokeWidth="2"
																					strokeLinecap="round"
																					strokeLinejoin="round"
																				>
																					<polyline points="3 6 5 6 21 6" />
																					<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
																					<line
																						x1="10"
																						y1="11"
																						x2="10"
																						y2="17"
																					/>
																					<line
																						x1="14"
																						y1="11"
																						x2="14"
																						y2="17"
																					/>
																				</svg>
																			</button>
																		)}
																	</div>
																</div>
																<p className="post-comment-text">
																	{r.text}
																</p>
															</div>
														</div>
													);
												})}
											</div>
										)}

										{/* reply form under this comment */}
										{replyingTo === c.id && currentUser && (
											<form
												onSubmit={(e) =>
													handleSubmitReply(e, c)
												}
												className="post-comment-reply-form"
											>
												<textarea
													className="post-comment-input post-comment-input-reply"
													placeholder={`Reply to ${c.authorName || "this comment"}…`}
													value={replyText}
													onChange={(e) =>
														setReplyText(
															e.target.value
														)
													}
													rows={2}
												/>
												<div className="post-comment-actions">
													{replyError && (
														<span className="error-text">
															{replyError}
														</span>
													)}
													<div className="post-comment-actions-buttons">
														<button
															type="button"
															className="btn btn-secondary btn-sm"
															onClick={() =>
																handleReplyClick(
																	c.id
																)
															}
														>
															Cancel
														</button>
														<button
															type="submit"
															className="btn btn-primary btn-sm"
															disabled={
																replySubmitting ||
																!replyText.trim()
															}
														>
															{replySubmitting
																? "Posting…"
																: "Post reply"}
														</button>
													</div>
												</div>
											</form>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}

				<div className="post-comment-form-wrap">
					{currentUser ? (
						<form
							onSubmit={handleSubmitComment}
							className="post-comment-form"
						>
							<div className="post-comment-form-header">
								<div className="post-comment-avatar">
									{(
										currentProfile?.avatarUrl ||
										currentProfile?.photoURL ||
										currentUser.photoURL
									) ? (
										<img
											src={
												currentProfile?.avatarUrl ||
												currentProfile?.photoURL ||
												currentUser.photoURL
											}
											alt={
												currentProfile?.displayName ||
												currentUser.displayName ||
												"You"
											}
										/>
									) : (
										<span>
											{(
												currentProfile?.displayName ||
												currentUser.displayName ||
												currentUser.email ||
												"?"
											)[0].toUpperCase()}
										</span>
									)}
								</div>
								<span className="post-comment-you">
									Commenting as{" "}
									{currentProfile?.displayName ||
										currentUser.displayName ||
										currentUser.email}
								</span>
							</div>

							<textarea
								className="post-comment-input"
								placeholder="Share your thoughts…"
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								rows={3}
							/>

							<div className="post-comment-actions">
								{commentError && (
									<span className="error-text">
										{commentError}
									</span>
								)}
								<button
									type="submit"
									className="btn btn-primary"
									disabled={
										commentSubmitting ||
										!commentText.trim()
									}
								>
									{commentSubmitting
										? "Posting…"
										: "Post comment"}
								</button>
							</div>
						</form>
					) : (
						<div className="post-comment-signin">
							<p>Sign in to join the discussion.</p>
							<button
								type="button"
								className="btn btn-primary"
								onClick={() => navigate("/account")}
							>
								Sign in
							</button>
						</div>
					)}
				</div>
			</section>
		</article>
	);
}
