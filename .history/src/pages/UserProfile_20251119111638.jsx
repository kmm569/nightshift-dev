// src/pages/UserProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	doc,
	getDoc,
	collection,
	query,
	where,
	orderBy,
	getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

export default function UserProfile() {
	const { userId } = useParams();
	const navigate = useNavigate();

	const [profile, setProfile] = useState(null);
	const [posts, setPosts] = useState([]);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [loadingPosts, setLoadingPosts] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!userId) return;

		const loadProfile = async () => {
			setLoadingProfile(true);
			setError('');

			try {
				const userRef = doc(db, 'users', userId);
				const snap = await getDoc(userRef);

				if (!snap.exists()) {
					setProfile(null);
					setError('User not found.');
				} else {
					setProfile({ id: snap.id, ...snap.data() });
				}
			} catch (err) {
				console.error('Error loading user profile:', err);
				setError('Failed to load user profile.');
			} finally {
				setLoadingProfile(false);
			}
		};

		loadProfile();
	}, [userId]);

	useEffect(() => {
	if (!userId) return;

	const loadPosts = async () => {
		setLoadingPosts(true);
		try {
			const postsRef = collection(db, 'posts');
			const q = query(postsRef, where('authorId', '==', userId));
			const snap = await getDocs(q);

			const items = [];
			snap.forEach(docSnap => {
				const data = docSnap.data();
				items.push({ id: docSnap.id, ...data });
			});

			// sort newest → oldest by createdAt
			items.sort((a, b) => {
				const aTime = a.createdAt?.toDate
					? a.createdAt.toDate().getTime()
					: 0;
				const bTime = b.createdAt?.toDate
					? b.createdAt.toDate().getTime()
					: 0;
				return bTime - aTime;
			});

			setPosts(items);
		} catch (err) {
			console.error('Error loading user posts:', err);
		} finally {
			setLoadingPosts(false);
		}
	};

	loadPosts();
}, [userId]);


	if (loadingProfile) {
		return (
			<div className="account-page">
				<div className="account-card">
					<p>Loading profile…</p>
				</div>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="account-page">
				<div className="account-card">
					<p>{error || 'User not found.'}</p>
					<button
						type="button"
						className="btn-secondary account-logout"
						onClick={() => navigate(-1)}
					>
						Go back
					</button>
				</div>
			</div>
		);
	}

	const displayName =
		profile.displayName ||
		profile.name ||
		'Unknown';
	const email = profile.email || '';
	const roleRaw = (profile.role || 'member').toString().toLowerCase();
	const role =
		roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);

	const joined =
		profile.createdAt?.toDate
			? profile.createdAt.toDate().toLocaleDateString()
			: '';

	const avatarUrl =
		profile.avatarUrl ||
		profile.photoURL ||
		profile.photoUrl ||
		null;

	const initialLetter = displayName.charAt(0).toUpperCase();

	const links = profile.links || {};
	const github = links.github || '';
	const website = links.website || '';
	const twitter = links.twitter || '';
	const linkedin = links.linkedin || '';

	return (
		<div className="account-page">
			<div className="account-card">
				<div className="account-header">
					<div className="account-avatar">
						{avatarUrl ? (
							<img src={avatarUrl} alt={displayName} />
						) : (
							<span>{initialLetter}</span>
						)}
					</div>

					<div className="account-main-info">
						<h1 className="account-name">{displayName}</h1>
						{email && (
							<p className="account-email">{email}</p>
						)}
						<p className="account-role">{role}</p>
					</div>

					<div className="account-actions">
						<button
							type="button"
							className="btn-secondary account-logout"
							onClick={() => navigate(-1)}
						>
							Back
						</button>
					</div>
				</div>

				<div className="account-body">
					<div className="account-section">
						<h2>About</h2>
						<p className="account-bio">
							{profile.bio ||
								'This nightshift dev has not written a bio yet.'}
						</p>
					</div>

					<div className="account-section account-grid">
						<div className="account-field">
							<span className="label">Joined</span>
							<span className="value">
								{joined || '—'}
							</span>
						</div>
						<div className="account-field">
							<span className="label">Role</span>
							<span className="value">
								{role || 'Member'}
							</span>
						</div>
					</div>

					<div className="account-section">
						<h2>Social links</h2>
						{!github && !website && !twitter && !linkedin && (
							<p className="account-mini">
								No social links added yet.
							</p>
						)}
						<div className="social-links">
							{github && (
								<a
									href={
										github.startsWith('http')
											? github
											: `https://${github}`
									}
									target="_blank"
									rel="noreferrer"
								>
									GitHub
								</a>
							)}
							{website && (
								<a
									href={
										website.startsWith('http')
											? website
											: `https://${website}`
									}
									target="_blank"
									rel="noreferrer"
								>
									Website
								</a>
							)}
							{twitter && (
								<a
									href={
										twitter.startsWith('http')
											? twitter
											: `https://${twitter}`
									}
									target="_blank"
									rel="noreferrer"
								>
									Twitter / X
								</a>
							)}
							{linkedin && (
								<a
									href={
										linkedin.startsWith('http')
											? linkedin
											: `https://${linkedin}`
									}
									target="_blank"
									rel="noreferrer"
								>
									LinkedIn
								</a>
							)}
						</div>
					</div>

					<div className="account-section">
						<h2>Posts</h2>
						{loadingPosts ? (
							<p className="account-mini">
								Loading posts…
							</p>
						) : posts.length === 0 ? (
							<p className="account-mini">
								No posts from this user yet.
							</p>
						) : (
							<ul className="user-post-list">
								{posts.map(post => (
									<li
										key={post.id}
										className="user-post-item"
									>
										<button
											type="button"
											className="link-button"
											onClick={() =>
												navigate(`/blog/${post.id}`)
											}
										>
											{post.title || 'Untitled post'}
										</button>
										{post.createdAt?.toDate && (
											<span className="user-post-date">
												{post.createdAt
													.toDate()
													.toLocaleDateString()}
											</span>
										)}
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="account-section muted">
						<p>
							This is a public profile view. Edit your own
							info from the Account page when signed in.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
