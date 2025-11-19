// src/components/NotificationsBell.jsx
import React, { useEffect, useState, useRef } from "react";
import {
	collection,
	query,
	orderBy,
	onSnapshot,
	limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { markAllNotificationsRead } from "../lib/notifications";

export default function NotificationsBell() {
	const { currentUser } = useAuth();
	const [notifications, setNotifications] = useState([]);
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const containerRef = useRef(null);

	// subscribe to notifications
	useEffect(() => {
		if (!currentUser) {
			setNotifications([]);
			return;
		}

		const colRef = collection(
			db,
			"users",
			currentUser.uid,
			"notifications"
		);
		const q = query(colRef, orderBy("createdAt", "desc"), limit(20));

		const unsub = onSnapshot(q, (snap) => {
			const items = [];
			snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
			setNotifications(items);
		});

		return () => unsub();
	}, [currentUser]);

	// close on outside click
	useEffect(() => {
		function handleClick(e) {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(e.target)) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	if (!currentUser) return null;

	const unreadCount = notifications.filter((n) => !n.read).length;

	const handleToggleOpen = async () => {
		const next = !open;
		setOpen(next);

		if (next && unreadCount > 0) {
			// best-effort mark all as read
			try {
				await markAllNotificationsRead(currentUser.uid);
			} catch (err) {
				console.error("Error marking notifications read:", err);
			}
		}
	};

	const handleNotificationClick = (n) => {
		if (n.postId) {
			navigate(`/blog/${n.postId}`);
		}
	};

	const formatLabel = (n) => {
		const who = n.fromUserName || "Someone";

		if (n.type === "comment_reply") {
			return `${who} replied to your comment on "${n.postTitle || "a post"}"`;
		}
		if (n.type === "post_like") {
			return `${who} liked your post "${n.postTitle || ""}"`;
		}
		if (n.type === "comment_like") {
			return `${who} liked your comment on "${n.postTitle || "a post"}"`;
		}
		return "New activity";
	};

	return (
		<div className="notifications-bell-wrapper" ref={containerRef}>
			<button
				type="button"
				className="notifications-bell-button"
				onClick={handleToggleOpen}
				title="Notifications"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
					<path d="M13.73 21a2 2 0 0 1-3.46 0" />
				</svg>
				{unreadCount > 0 && (
					<span className="notifications-badge">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className="notifications-panel">
					{notifications.length === 0 ? (
						<div className="notifications-empty">
							No notifications yet.
						</div>
					) : (
						<ul className="notifications-list">
							{notifications.map((n) => (
								<li
									key={n.id}
									className={
										n.read
											? "notifications-item notifications-item-read"
											: "notifications-item"
									}
									onClick={() => handleNotificationClick(n)}
								>
									<div className="notifications-item-text">
										{formatLabel(n)}
									</div>
								</li>
							))}
                        </ul>
					)}
				</div>
			)}
		</div>
	);
}
