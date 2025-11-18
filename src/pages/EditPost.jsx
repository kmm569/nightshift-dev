import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPost, updatePost } from '../lib/posts';

export default function EditPost() {
	const { postId } = useParams();
	const navigate = useNavigate();
	const { currentUser } = useAuth();

	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await getPost(postId);
				setPost(data);
			} catch (err) {
				console.error(err);
				setError('Failed to load post.');
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [postId]);

	if (loading) {
		return <p>Loading post...</p>;
	}

	if (!post) {
		return <p>Post not found.</p>;
	}

	if (!currentUser || currentUser.uid !== post.authorId) {
		return <p>You don&apos;t have permission to edit this post.</p>;
	}

	const [title, setTitle] = useState(post.title || '');
	const [excerpt, setExcerpt] = useState(post.excerpt || '');
	const [content, setContent] = useState(post.content || '');
	const [bannerImageUrl, setBannerImageUrl] = useState(
		post.bannerImageUrl || '',
	);
	const [tags, setTags] = useState((post.tags || []).join(', '));

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

			await updatePost(post.id, {
				title: title.trim(),
				excerpt: excerpt.trim(),
				content,
				bannerImageUrl: bannerImageUrl.trim(),
				tags: tagList,
			});

			navigate(`/blog/${post.id}`);
		} catch (err) {
			console.error(err);
			setError('Failed to save changes.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="post-editor-page">
			<header className="post-editor-header">
				<h2>Edit Post</h2>
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
					/>
				</label>

				<label className="post-form-field">
					<span>Banner image URL</span>
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
					/>
				</label>

				<label className="post-form-field">
					<span>Content</span>
					<textarea
						value={content}
						onChange={e => setContent(e.target.value)}
						rows={16}
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
						{saving ? 'Saving…' : 'Save changes'}
					</button>
				</div>
			</form>
		</section>
	);
}
