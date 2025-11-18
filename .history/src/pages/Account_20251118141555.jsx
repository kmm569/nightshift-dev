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

	const initialDisplayName =
		currentUser?.displayName ||
		currentUser?.email?.split('@')[0] ||
		'Nightshift User';

	const email = currentUser?.email || 'unknown@example.com';
	const joined = currentUser?.metadata?.creationTime || '—';
	const role = 'Member'; // later: swap to real roles from Firestore

	// local editable fields
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [dob, setDob] = useState('');
	const [bio, setBio] = useState(
		'Just another night owl breaking things in dev and pretending it’s on purpose.',
	);
	const [status, setStatus] = useState('');
	const [isEditing, setIsEditing] = useState(false);

	async function handleLogout() {
		await signOut(auth);
	}

	function handleEditClick() {
		setIsEditing(true);
		setStatus('');
	}

	function handleCancel(e) {
		e?.preventDefault?.();
		// reset back to whatever our "saved" values are right now
		setDisplayName(initialDisplayName);
		setDob('');
		setBio(
			'Just another night owl breaking things in dev and pretending it’s on purpose.',
		);
		setIsEditing(false);
		setStatus('');
	}

	function handleSave(e) {
		e.preventDefault();
		// later: persist to Firestore
		setIsEditing(false);
		setStatus('Profile updated locally (not yet saved to the cloud).');
		setTimeout(() => setStatus(''), 3000);
	}

	return (
		<div className="account-page">
			<div className="account-card">
				<div className="account-header">
					<div className="account-avatar">
						<span>{displayName.charAt(0).toUpperCase()}</span>
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
							Eventually this will sync with a real user profile in Firestore
							(display name, avatar, bio, DOB, roles, and more). For now, this
							is just your local sandbox.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
