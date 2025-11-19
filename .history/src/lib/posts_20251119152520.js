// src/lib/posts.js
import {
	collection,
	doc,
	addDoc,
	getDoc,
	updateDoc,
	serverTimestamp,
	runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";

// collection ref
const postsCol = collection(db, "posts");

export function slugify(title) {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function createPost(data, user) {
	const slug = slugify(data.title);

	const docRef = await addDoc(postsCol, {
		title: data.title,
		slug,
		excerpt: data.excerpt || "",
		content: data.content || "",
		bannerImageUrl: data.bannerImageUrl || "",
		tags: data.tags || [],

		authorId: user.uid,
		authorName: user.displayName || user.email || "Unknown",

		likesCount: 0,
		savesCount: 0,

		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});

	return docRef.id;
}

export async function getPost(postId) {
	const snap = await getDoc(doc(db, "posts", postId));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() };
}

export async function updatePost(postId, data) {
	const ref = doc(db, "posts", postId);
	await updateDoc(ref, {
		...data,
		updatedAt: serverTimestamp(),
	});
}

export async function toggleLike(postId, userId) {
	const postRef = doc(db, "posts", postId);
	const likeRef = doc(db, "posts", postId, "likes", userId);

	let likedNow = false;

	await runTransaction(db, async (tx) => {
		const likeSnap = await tx.get(likeRef);
		const postSnap = await tx.get(postRef);

		if (!postSnap.exists()) {
			throw new Error("Post missing");
		}

		const currentLikes = postSnap.data().likesCount || 0;

		if (likeSnap.exists()) {
			// unlike
			tx.delete(likeRef);
			tx.update(postRef, {
				likesCount: Math.max(currentLikes - 1, 0),
			});
			likedNow = false;
		} else {
			// like
			tx.set(likeRef, {
				userId,
				postId,
				createdAt: serverTimestamp(),
			});
			tx.update(postRef, {
				likesCount: currentLikes + 1,
			});
			likedNow = true;
		}
	});

	return likedNow;
}

export async function toggleSave(postId, userId) {
	const postRef = doc(db, "posts", postId);
	const saveRef = doc(db, "posts", postId, "saves", userId);

	await runTransaction(db, async (tx) => {
		const saveSnap = await tx.get(saveRef);
		const postSnap = await tx.get(postRef);

		if (!postSnap.exists()) {
			throw new Error("Post missing");
		}

		const currentSaves = postSnap.data().savesCount || 0;

		if (saveSnap.exists()) {
			tx.delete(saveRef);
			tx.update(postRef, {
				savesCount: Math.max(currentSaves - 1, 0),
			});
		} else {
			tx.set(saveRef, {
				userId,
				createdAt: serverTimestamp(),
			});
			tx.update(postRef, {
				savesCount: currentSaves + 1,
			});
		}
	});
}

export async function hasUserLiked(postId, userId) {
	const snap = await getDoc(doc(db, "posts", postId, "likes", userId));
	return snap.exists();
}

export async function hasUserSaved(postId, userId) {
	const snap = await getDoc(doc(db, "posts", postId, "saves", userId));
	return snap.exists();
}
