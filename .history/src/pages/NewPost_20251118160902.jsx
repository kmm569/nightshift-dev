import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../lib/posts';

export default function NewPost() {
	const { currentUser, isAdmin } = useAuth();
	const navigate = useNavigate();

	const [title, setTitle] = useState('');
	const [excerpt, setExcerpt] = useState('');
	const [content, setContent] = useState('');
	const [bannerImageUrl, setBannerImageUrl] = useState('');
	const [tags, setTags] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	if (!currentUser || !isAdmin) {
		return <p>You don&apos;t have permission to create posts.</p>;
	}

	const handleSubmit = async e => {
		e.preventDefault();
		setError(null);

		if (!title.trim() || !content.trim()) {
			setError('Title and content are required.');
			return;
		}

		try {
			setSaving(true);

			const tagList = tags
				.split(',')
				.map(t => t.trim())
				.filter(Boolean);

			const postId = await createPost(
				{
					title: title.trim(),
					excerpt: excerpt.trim(),
					content,
					bannerImageUrl: bannerImageUrl.trim(),
					tags: tagList,
				},
				currentUser,
			);

			navigate(`/blog/${postId}`);
		} catch (err) {
			console.error(err);
			setError('Failed to create post.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="post-editor-page">
			<header className="post-editor-header">
				<h2>Create Post</h2>
			</header>

			<form className="post-form" onSubmit={handleSubmit}>
				{error && <p className="error-text">{error}</p>}

				<label className="post-form-field">
					<span>Title</span>
					<input
						type="text"
						value={title}
						onChange={e => setTitle(e.target.value)}
						required
					/>
				</label>

				<label className="post-form-field">
					<span>Excerpt</span>
					<textarea
						value={excerpt}
						onChange={e => setExcerpt(e.target.value)}
						rows={3}
						placeholder="Short description shown on the blog cards."
					/>
				</label>

				<label className="post-form-field">
					<span>Banner image URL (optional)</span>
					<input
						type="url"
						value={bannerImageUrl}
						onChange={e => setBannerImageUrl(e.target.value)}
					/>
				</label>

				<label className="post-form-field">
					<span>Tags (comma-separated)</span>
					<input
						type="text"
						value={tags}
						onChange={e => setTags(e.target.value)}
						placeholder="react, firebase, blog"
					/>
				</label>

				<label className="post-form-field">
					<span>Content</span>
					<textarea
						value={content}
						onChange={e => setContent(e.target.value)}
						rows={16}
						placeholder="Write your full post here..."
						required
					/>
				</label>

				<div className="post-form-actions">
					<button
						type="button"
						className="btn btn-secondary"
						onClick={() => navigate(-1)}
					>
						Cancel
					</button>

					<button
						type="submit"
						className="btn btn-primary"
						disabled={saving}
					>
						{saving ? 'Publishing…' : 'Publish'}
					</button>
				</div>
			</form>
		</section>
	);
}
