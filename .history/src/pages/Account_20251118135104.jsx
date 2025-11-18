// src/pages/Account.jsx
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Account() {
	const { currentUser } = useAuth();

	const initialDisplayName =
		currentUser?.displayName ||
		currentUser?.email?.split('@')[0] ||
		'Nightshift User';

	const email = currentUser?.email || 'unknown@example.com';

	// local editable state (not persisted yet)
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [dob, setDob] = useState(''); // you can default this later
	const [bio, setBio] = useState(
		'Just another night owl breaking things in dev and pretending it’s on purpose.',
	);
	const [status, setStatus] = useState('');

	const role = 'Member'; // later: pull from Firestore / claims
	const joined = currentUser?.metadata?.creationTime || '—';

	async function handleLogout() {
		await signOut(auth);
	}

	function handleSave(e) {
		e.preventDefault();
		// later this will call Firestore to persist
		setStatus('Changes saved locally (not yet stored in the cloud).');
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
							<button type="submit" className="btn-primary account-save">
								Save changes
							</button>
						</div>
					</form>

					<div className="account-section muted">
						<p>
							Right now changes only live in this session. Next step will be
							wiring this up to a Firestore user profile so it persists across
							logins.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
