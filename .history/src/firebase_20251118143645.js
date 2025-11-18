// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDzd-xhRK_fqf6VZCmbv3Z2wDi0S3VjDNI",
	authDomain: "nightshiftdev-3875b.firebaseapp.com",
	projectId: "nightshiftdev-3875b",
	storageBucket: "nightshiftdev-3875b.firebasestorage.app",
	messagingSenderId: "171175883514",
	appId: "1:171175883514:web:c53deed8f9cc8cbe6f4f43",
	measurementId: "G-C8HX1Y7DG4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);