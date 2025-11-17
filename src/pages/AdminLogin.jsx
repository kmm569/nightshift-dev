import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const navigate = useNavigate();

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		try {
			await signInWithEmailAndPassword(auth, email, password);
			navigate('/account');
		} catch (err) {
			console.error(err);
			setError('Login failed. Check your email/password.');
		}
	}

	return (
		<section className="auth">
			<h2>Admin Login</h2>
			<form onSubmit={handleSubmit} className="auth-form">
				<label>
					Email
					<input
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
				</label>
				<label>
					Password
					<input
						type="password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
				</label>
				{error && <p className="error">{error}</p>}
				<button type="submit" className="btn-primary">
					Log in
				</button>
			</form>
		</section>
	);
}
