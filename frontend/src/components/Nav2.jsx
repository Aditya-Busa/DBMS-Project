// src/components/Nav2.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/Nav2.css";
import { FiBell } from "react-icons/fi";
import { BsWallet2 } from "react-icons/bs";
import { HiOutlineClipboardList } from "react-icons/hi"; 
import { FaChevronDown } from "react-icons/fa";
import logo from "./Logo.png";
import { apiUrl } from "../config/config";

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications on load
  useEffect(() => {
    fetch(`${apiUrl}/api/notifications`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error("Notification fetch error:", err));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout failed");

      sessionStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="groww-navbar">
      <div className="nav-left">
        <img src={logo} alt="Groww Logo" className="nav-logo" />
        <h1 className="nav-brand">Groww</h1>

        <Link
          to="/stocks/explore"
          className={`nav-link ${location.pathname.includes("explore") ? "active" : ""}`}
        >
          Explore
        </Link>
        <Link
          to="/stocks/dashboard"
          className={`nav-link ${location.pathname.includes("dashboard") ? "active" : ""}`}
        >
          Dashboard
        </Link>
        <Link
          to="/stocks/watchlist"
          className={`nav-link ${location.pathname.includes("watchlist") ? "active" : ""}`}
        >
          Watchlist
        </Link>
      </div>

      <div className="nav-right">
        {/* Notification icon */}
        <div className="nav-icon-wrapper" onClick={() => navigate("/notifications")}>
          <FiBell className="nav-icon" title="Notifications" />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>

        <Link
          to="/wallet"
          className={`nav-link ${location.pathname === "/wallet" ? "active" : ""}`}
        >
          <BsWallet2 className="nav-icon" />
        </Link>

        <Link
          to="/history"
          className={`nav-link ${location.pathname === "/history" ? "active" : ""}`}
        >
          <HiOutlineClipboardList className="nav-icon" />
        </Link>

        <Link
          to="/profile"
          className={`nav-link ${location.pathname.includes("profile") ? "active" : ""}`}
        >
          <div className="user-avatar"></div>
        </Link>

        <FaChevronDown className="dropdown-icon" />
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
