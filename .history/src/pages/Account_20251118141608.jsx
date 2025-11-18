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
import { db } from '../firebase';

export default function Account() {
	const { currentUser } = useAuth();

	const [displayName, setDisplayName] = useState('');
	const [dob, setDob] = useState('');
	const [bio, setBio] = useState('');
	const [role, setRole] = useState('Member'); // string for display
	const [joined, setJoined] = useState('');
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
					setDisplayName(
						data.displayName ||
							currentUser?.displayName ||
							email.split('@')[0],
					);
					setDob(data.dob || '');
					setBio(
						data.bio ||
							'Just another night owl breaking things in dev and pretending it’s on purpose.',
					);
					setRole((data.role || 'member').toString().replace(/^\w/, c => c.toUpperCase()));
					setJoined(
						data.createdAt?.toDate
							? data.createdAt.toDate().toString()
							: currentUser?.metadata?.creationTime || '—',
					);
				} else {
					// create default profile doc
					const defaultProfile = {
						displayName:
							currentUser?.displayName || email.split('@')[0] || 'User',
						email,
						dob: '',
						bio: 'Just another night owl breaking things in dev and pretending it’s on purpose.',
						role: 'member',
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

	function handleCancel(e) {
		e?.preventDefault?.();
		setIsEditing(false);
		setStatus('');
		// reload from Firestore by toggling loading state
		setLoadingProfile(true);
		// re-run effect by changing a dummy key would be ideal, but simplest:
		window.location.reload(); // we can replace this later with better state mgmt
	}

	async function handleSave(e) {
		e.preventDefault();
		if (!uid) return;

		const userRef = doc(db, 'users', uid);

		try {
			await updateDoc(userRef, {
				displayName,
				dob,
				bio,
				updatedAt: serverTimestamp(),
			});

			// also update Firebase Auth profile displayName so it stays in sync
			if (auth.currentUser && auth.currentUser.displayName !== displayName) {
				await updateProfile(auth.currentUser, { displayName });
			}

			setIsEditing(false);
			setStatus('Profile saved to the cloud.');
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

	return (
		<div className="account-page">
			<div className="account-card">
				<div className="account-header">
					<div className="account-avatar">
						<span>{(displayName || email).charAt(0).toUpperCase()}</span>
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

							{status && (
								<div className="account-footer-row">
									<span className="account-status">{status}</span>
								</div>
							)}
						</>
					)}

					<div className="account-section muted">
						<p>
							These settings are now stored in your Nightshift Dev profile.
							Later we can extend this with avatar uploads, social links, and
							role-based access for admin tools.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
