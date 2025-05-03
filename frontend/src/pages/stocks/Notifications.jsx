import React, { useEffect, useState } from "react";
import { apiUrl } from "../../config/config";
import NavBar from "../../components/Nav2";
import "../../css/Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        credentials: "include",
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Fetch notifications failed:", err);
    }
  };

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

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.notification_id);
      
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map(id => 
          fetch(`${apiUrl}/api/notifications/read`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: id }),
          })
        ));
        
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Call the new API endpoint to clear notifications
      const response = await fetch(`${apiUrl}/api/notifications/clear`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        setNotifications([]);
      } else {
        console.error("Failed to clear notifications");
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  return (
    <>
      <NavBar />
      <div className="notifications-container">
        <div className="notifications-header">
          <h2>Notifications</h2>
          <div className="notification-actions">
            <button onClick={markAllAsRead}>Mark All as Read</button>
            <button onClick={clearAllNotifications}>Clear All</button>
          </div>
        </div>
        {notifications.length === 0 ? (
          <p className="no-notifications">No notifications found.</p>
        ) : (
          <div className="notifications-scroll-container">
            <ul className="notifications-list">
              {notifications.map((n) => (
                <li key={n.notification_id} className={n.is_read ? "read" : "unread"}>
                  <div className="notification-content">
                    <span>{n.message}</span>
                    <small>{new Date(n.created_at).toLocaleString()}</small>
                  </div>
                  {!n.is_read && (
                    <button 
                      onClick={() => markAsRead(n.notification_id)}
                      className="mark-read-btn"
                    >
                      Mark as Read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default Notifications;