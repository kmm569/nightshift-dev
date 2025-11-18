// src/pages/Account.jsx
import React, { useEffect, useState } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Account() {
	const { currentUser } = useAuth();

	const [displayName, setDisplayName] = useState('');
	const [dob, setDob] = useState('');
	const [bio, setBio] = useState('');
	const [role, setRole] = useState('Member');
	const [joined, setJoined] = useState('');
	const [avatarUrl, setAvatarUrl] = useState('');
	const [avatarFile, setAvatarFile] = useState(null);

	const [github, setGithub] = useState('');
	const [website, setWebsite] = useState('');
	const [twitter, setTwitter] = useState('');
	const [linkedin, setLinkedin] = useState('');

	const [status, setStatus] = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [loadingProfile, setLoadingProfile] = useState(true);

	const email = currentUser?.email || 'unknown@example.com';
	const uid = currentUser?.uid;

	// Load or create user profile in Firestore
	useEffect(() => {
		if (!uid) return;

		const userRef = doc(db, 'users', uid);

		async function loadProfile() {
			try {
				const snap = await getDoc(userRef);

				if (snap.exists()) {
					const data = snap.data();

					const baseName =
						data.displayName ||
						currentUser?.displayName ||
						email.split('@')[0];

					setDisplayName(baseName);
					setDob(data.dob || '');
					setBio(
						data.bio ||
							'Just another night owl breaking things in dev and pretending it’s on purpose.',
					);

					const rawRole = (data.role || 'member').toString().toLowerCase();
					setRole(rawRole.charAt(0).toUpperCase() + rawRole.slice(1));

					if (data.createdAt?.toDate) {
						setJoined(data.createdAt.toDate().toString());
					} else {
						setJoined(currentUser?.metadata?.creationTime || '—');
					}

					setAvatarUrl(data.avatarUrl || '');

					const links = data.links || {};
					setGithub(links.github || '');
					setWebsite(links.website || '');
					setTwitter(links.twitter || '');
					setLinkedin(links.linkedin || '');
				} else {
					// create default profile doc
					const defaultProfile = {
						displayName:
							currentUser?.displayName || email.split('@')[0] || 'User',
						email,
						dob: '',
						bio: 'Just another night owl breaking things in dev and pretending it’s on purpose.',
						role: 'member',
						avatarUrl: '',
						links: {
							github: '',
							website: '',
							twitter: '',
							linkedin: '',
						},
						createdAt: serverTimestamp(),
						updatedAt: serverTimestamp(),
					};

					await setDoc(userRef, defaultProfile);

					setDisplayName(defaultProfile.displayName);
					setDob(defaultProfile.dob);
					setBio(defaultProfile.bio);
					setRole('Member');
					setJoined(
						currentUser?.metadata?.creationTime ||
							new Date().toString(),
					);
					setAvatarUrl('');
					setGithub('');
					setWebsite('');
					setTwitter('');
					setLinkedin('');
				}
			} catch (err) {
				console.error('Error loading profile:', err);
				setStatus('Failed to load profile.');
			} finally {
				setLoadingProfile(false);
			}
		}

		loadProfile();
	}, [uid, currentUser, email]);

	async function handleLogout() {
		await signOut(auth);
	}

	function handleEditClick() {
		setIsEditing(true);
		setStatus('');
	}

	function handleAvatarFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarFile(file);

		// preview
		const previewUrl = URL.createObjectURL(file);
		setAvatarUrl(previewUrl);
	}

	function handleCancel(e) {
		e?.preventDefault?.();
		// easiest reset: reload from Firestore
		window.location.reload();
	}

	async function handleSave(e) {
		e.preventDefault();
		if (!uid) return;

		const userRef = doc(db, 'users', uid);

		try {
			let finalAvatarUrl = avatarUrl;

			// If a new file was selected, upload to Storage
			if (avatarFile) {
				const avatarRef = ref(storage, `avatars/${uid}`);
				await uploadBytes(avatarRef, avatarFile);
				finalAvatarUrl = await getDownloadURL(avatarRef);
				setAvatarUrl(finalAvatarUrl);
			}

			await updateDoc(userRef, {
				displayName,
				dob,
				bio,
				avatarUrl: finalAvatarUrl,
				role: role.toLowerCase(),
				links: {
					github,
					website,
					twitter,
					linkedin,
				},
				updatedAt: serverTimestamp(),
			});

			// keep Firebase Auth profile displayName in sync
			if (auth.currentUser && auth.currentUser.displayName !== displayName) {
				await updateProfile(auth.currentUser, { displayName });
			}

			setIsEditing(false);
			setAvatarFile(null);
			setStatus('Profile saved to the cloud.');
			setTimeout(() => setStatus(''), 3000);
		} catch (err) {
			console.error('Error saving profile:', err);
			setStatus('Error saving profile. Try again.');
		}
	}

	if (loadingProfile) {
		return (
			<div className="account-page">
				<div className="account-card">
					<p>Loading profile…</p>
				</div>
			</div>
		);
	}

	const initialLetter = (displayName || email).charAt(0).toUpperCase();

	return (
		<div className="account-page">
			<div className="account-card">
				<div className="account-header">
					<div className="account-avatar">
						{avatarUrl ? (
							<img src={avatarUrl} alt="Avatar" />
						) : (
							<span>{initialLetter}</span>
						)}
					</div>

					<div className="account-main-info">
						<h1 className="account-name">{displayName}</h1>
						<p className="account-email">{email}</p>
						<p className="account-role">{role}</p>
					</div>

					<div className="account-actions">
						{!isEditing && (
							<button
								type="button"
								className="btn-secondary account-edit"
								onClick={handleEditClick}
							>
								Edit profile
							</button>
						)}
						<button
							type="button"
							className="btn-secondary account-logout"
							onClick={handleLogout}
						>
							Log out
						</button>
					</div>
				</div>

				<div className="account-body">
					{isEditing ? (
						<form onSubmit={handleSave} className="account-form">
							<div className="account-section account-avatar-row">
								<div>
									<h2>Avatar</h2>
									<p className="account-mini">
										Upload a square image for best results. This will show
										anywhere your profile appears.
									</p>
								</div>
								<div className="account-avatar-edit">
									<label className="avatar-upload-label">
										<span>Choose image</span>
										<input
											type="file"
											accept="image/*"
											onChange={handleAvatarFileChange}
										/>
									</label>
								</div>
							</div>

							<div className="account-section">
								<h2>Profile</h2>
								<textarea
									className="account-textarea"
									value={bio}
									onChange={e => setBio(e.target.value)}
									rows={3}
								/>
							</div>

							<div className="account-section account-grid">
								<div className="account-field">
									<span className="label">Display name</span>
									<input
										type="text"
										className="account-input"
										value={displayName}
										onChange={e => setDisplayName(e.target.value)}
									/>
								</div>

								<div className="account-field">
									<span className="label">Email</span>
									<input
										type="email"
										className="account-input"
										value={email}
										disabled
									/>
								</div>

								<div className="account-field">
									<span className="label">Date of birth</span>
									<input
										type="date"
										className="account-input"
										value={dob}
										onChange={e => setDob(e.target.value)}
									/>
								</div>

								<div className="account-field">
									<span className="label">Joined</span>
									<input
										type="text"
										className="account-input"
										value={joined}
										disabled
									/>
								</div>
							</div>

							<div className="account-section">
								<h2>Social links</h2>
								<div className="account-grid">
									<div className="account-field">
										<span className="label">GitHub</span>
										<input
											type="text"
											className="account-input"
											value={github}
											onChange={e => setGithub(e.target.value)}
											placeholder="@username or full URL"
										/>
									</div>
									<div className="account-field">
										<span className="label">Website</span>
										<input
											type="text"
											className="account-input"
											value={website}
											onChange={e => setWebsite(e.target.value)}
											placeholder="https://..."
										/>
									</div>
									<div className="account-field">
										<span className="label">Twitter / X</span>
										<input
											type="text"
											className="account-input"
											value={twitter}
											onChange={e => setTwitter(e.target.value)}
											placeholder="@username or URL"
										/>
									</div>
									<div className="account-field">
										<span className="label">LinkedIn</span>
										<input
											type="text"
											className="account-input"
											value={linkedin}
											onChange={e => setLinkedin(e.target.value)}
											placeholder="Profile URL"
										/>
									</div>
								</div>
							</div>

							<div className="account-footer-row">
								{status && <span className="account-status">{status}</span>}
								<button
									type="button"
									className="btn-secondary account-cancel"
									onClick={handleCancel}
								>
									Cancel
								</button>
								<button type="submit" className="btn-primary account-save">
									Save changes
								</button>
							</div>
						</form>
					) : (
						<>
							<div className="account-section">
								<h2>Profile</h2>
								<p className="account-bio">{bio}</p>
							</div>

							<div className="account-section account-grid">
								<div className="account-field">
									<span className="label">Display name</span>
									<span className="value">{displayName}</span>
								</div>
								<div className="account-field">
									<span className="label">Email</span>
									<span className="value">{email}</span>
								</div>
								<div className="account-field">
									<span className="label">Date of birth</span>
									<span className="value">{dob || '—'}</span>
								</div>
								<div className="account-field">
									<span className="label">Joined</span>
									<span className="value">{joined}</span>
								</div>
							</div>

							<div className="account-section">
								<h2>Social links</h2>
								<div className="social-links">
									{github && (
										<a
											href={
												github.startsWith('http')
													? github
													: `https://github.com/${github.replace('@', '')}`
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
													: `https://twitter.com/${twitter.replace('@', '')}`
											}
											target="_blank"
											rel="noreferrer"
										>
											Twitter / X
										</a>
									)}
									{linkedin && (
										<a
											href={linkedin}
											target="_blank"
											rel="noreferrer"
										>
											LinkedIn
										</a>
									)}
									{!github && !website && !twitter && !linkedin && (
										<p className="account-mini">
											No social links added yet.
										</p>
									)}
								</div>
							</div>

							{status && (
								<div className="account-footer-row">
									<span className="account-status">{status}</span>
								</div>
							)}
						</>
					)}

					<div className="account-section muted">
						<p>
							Your profile info and social links are now stored in your
							Nightshift Dev account. Later we can surface this on public
							author pages and comment sections.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
