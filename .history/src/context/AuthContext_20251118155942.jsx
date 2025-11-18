/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [currentUser, setCurrentUser] = useState(null);
	const [userProfile, setUserProfile] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async user => {
			setCurrentUser(user);

			if (!user) {
				setUserProfile(null);
				setLoading(false);
				return;
			}

			try {
				const ref = doc(db, 'users', user.uid);
				const snap = await getDoc(ref);

				if (snap.exists()) {
					setUserProfile({ id: snap.id, ...snap.data() });
				} else {
					setUserProfile(null);
				}
			} catch (err) {
				console.error('Error loading user profile:', err);
				setUserProfile(null);
			} finally {
				setLoading(false);
			}
		});

		return () => unsub();
	}, []);

	const isAdmin = !!userProfile && userProfile.role === 'admin';

	if (loading) {
		return <div className="center">Loading...</div>;
	}

	return (
		<AuthContext.Provider value={{ currentUser, userProfile, isAdmin }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
