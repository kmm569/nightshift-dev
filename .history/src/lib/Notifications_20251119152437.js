// src/lib/notifications.js
import {
	collection,
	doc,
	addDoc,
	updateDoc,
	writeBatch,
	getDocs,
	query,
	where,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

function notificationsCol(userId) {
	return collection(db, "users", userId, "notifications");
}

export async function createNotification(userId, data) {
	if (!userId) return;

	const colRef = notificationsCol(userId);

	await addDoc(colRef, {
		...data,
		read: false,
		createdAt: serverTimestamp(),
	});
}

export async function markNotificationRead(userId, notificationId) {
	if (!userId || !notificationId) return;

	const ref = doc(db, "users", userId, "notifications", notificationId);
	await updateDoc(ref, {
		read: true,
	});
}

export async function markAllNotificationsRead(userId) {
	if (!userId) return;

	const colRef = notificationsCol(userId);
	const q = query(colRef, where("read", "==", false));
	const snap = await getDocs(q);

	if (snap.empty) return;

	const batch = writeBatch(db);
	snap.forEach((d) => {
		batch.update(d.ref, { read: true });
	});

	await batch.commit();
}
