import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Account() {
	const { currentUser } = useAuth();
	const [title, setTitle] = useState('');
	const [summary, setSummary] = useState('');
	const [content, setContent] = useState('');
	const [status, setStatus] = useState('');

	async function handleCreatePost(e) {
		e.preventDefault();
		setStatus('');
		try {
			await addDoc(collection(db, 'posts'), {
				title,
				summary,
				content,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				authorUid: currentUser.uid,
			});
			setTitle('');
			setSummary('');
			setContent('');
			setStatus('Post created');
		} catch (err) {
			console.error(err);
			setStatus('Error creating post');
		}
	}

	async function handleLogout() {
		await signOut(auth);
	}

	return (
		<section className="account">
			<h2>Account</h2>
			<p>Logged in as {currentUser?.email}</p>
			<button onClick={handleLogout}>Log out</button>

			<h3>Create new post</h3>
			<form onSubmit={handleCreatePost} className="post-form">
				<label>
					Title
					<input
						type="text"
						value={title}
						onChange={e => setTitle(e.target.value)}
						required
					/>
				</label>

				<label>
					Summary
					<textarea
						value={summary}
						onChange={e => setSummary(e.target.value)}
						rows="2"
					/>
				</label>

				<label>
					Content
					<textarea
						value={content}
						onChange={e => setContent(e.target.value)}
						rows="6"
					/>
				</label>

				<button type="submit" className="btn-primary">
					Publish
				</button>

				{status && <p className="status">{status}</p>}
			</form>
		</section>
	);
}
