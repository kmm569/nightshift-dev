// src/pages/Account.jsx
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Account() {
	const { currentUser } = useAuth();

	const displayName =
		currentUser?.displayName ||
		currentUser?.email?.split('@')[0] ||
		'Nightshift User';

	const email = currentUser?.email || 'unknown@example.com';

	// TODO later: load these from Firestore user profile
	const role = 'Member'; // or 'Admin' if you want to flag admins
	const dob = '—'; // placeholder until you store real DOB
	const joined = currentUser?.metadata?.creationTime || '—';
	const bio =
		'Just another night owl breaking things in dev and pretending it’s on purpose.';

	async function handleLogout() {
		await signOut(auth);
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
							<span className="value">{dob}</span>
						</div>
						<div className="account-field">
							<span className="label">Joined</span>
							<span className="value">{joined}</span>
						</div>
					</div>

					<div className="account-section muted">
						<p>
							Later we can turn this into a full settings page: editable display
							name, avatar upload, social links, and preferences. For now, this
							is your cozy little profile hub.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
