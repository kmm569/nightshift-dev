// src/lib/comments.js
import {
	doc,
	runTransaction,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export async function toggleCommentLike(postId, commentId, userId) {
	if (!postId || !commentId || !userId) {
		throw new Error("Missing like params");
	}

	const commentRef = doc(db, "posts", postId, "comments", commentId);
	const likeRef = doc(
		db,
		"posts",
		postId,
		"comments",
		commentId,
		"likes",
		userId
	);

	let likedNow = false;

	await runTransaction(db, async (tx) => {
		const commentSnap = await tx.get(commentRef);
		const likeSnap = await tx.get(likeRef);

		if (!commentSnap.exists()) {
			throw new Error("Comment missing");
		}

		const currentLikes = commentSnap.data().likesCount || 0;

		if (likeSnap.exists()) {
			// unlike
			tx.delete(likeRef);
			tx.update(commentRef, {
				likesCount: Math.max(currentLikes - 1, 0),
			});
			likedNow = false;
		} else {
			// like
			tx.set(likeRef, {
				userId,
				postId,
				commentId,
				createdAt: serverTimestamp(),
			});
			tx.update(commentRef, {
				likesCount: currentLikes + 1,
			});
			likedNow = true;
		}
	});

	return likedNow;
}
