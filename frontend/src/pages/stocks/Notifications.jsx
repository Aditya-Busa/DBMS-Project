import React, { useEffect, useState } from "react";
import { apiUrl } from "../../config/config";
import NavBar from "../../components/Nav2";
import "../../css/Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/api/notifications`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error("Fetch notifications failed:", err));
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`${apiUrl}/api/notifications/read`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <>
    <NavBar/>
    <div className="notifications-container">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((n) => (
            <li key={n.notification_id} className={n.is_read ? "read" : "unread"}>
              <div>
                <span>{n.message}</span>
                <small>{new Date(n.created_at).toLocaleString()}</small>
              </div>
              {!n.is_read && (
                <button onClick={() => markAsRead(n.notification_id)}>Mark as Read</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
};

export default Notifications;
