// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			await signInWithEmailAndPassword(auth, email, password);
			navigate('/account');
		} catch (err) {
			console.error(err);
			setError('Login failed. Check your email/password.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth-page">
			<div className="auth-card">
				<h1 className="auth-title">Admin Login</h1>
				<p className="auth-sub">
					Secure access to the Nightshift Dev control panel.
				</p>

				<form onSubmit={handleSubmit} className="auth-form">
					<label className="auth-label">
						<span>Email</span>
						<input
							type="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
							className="auth-input"
						/>
					</label>

					<label className="auth-label">
						<span>Password</span>
						<input
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
							className="auth-input"
						/>
					</label>

					{error && <p className="auth-error">{error}</p>}

					<button
						type="submit"
						className="btn-primary auth-button"
						disabled={loading}
					>
						{loading ? 'Logging in…' : 'Log in'}
					</button>
				</form>
			</div>
		</div>
	);
}
