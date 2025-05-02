// src/components/NavBar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/Nav2.css";
import { FiBell, FiSearch, FiShoppingCart } from "react-icons/fi";
import { BsWallet2 } from "react-icons/bs";
import { FaChevronDown } from "react-icons/fa";
import logo from './Logo.png';
import { apiUrl } from "../config/config";

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
          className={`nav-link ${
            location.pathname.includes("explore") ? "active" : ""
          }`}
        >
          Explore
        </Link>
        <Link
          to="/stocks/dashboard"
          className={`nav-link ${
            location.pathname.includes("dashboard") ? "active" : ""
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/stocks/watchlist"
          className={`nav-link ${
            location.pathname.includes("watchlist") ? "active" : ""
          }`}
        >
          Watchlist
        </Link>
      </div>

      <div className="nav-center">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search Groww..."
            className="search-input"
          />
        </div>
      </div>

      <div className="nav-right">
        <FiBell className="nav-icon" />
        
        {/* PREVIOUS CODE <BsWallet2 className="nav-icon" /> */}

        <Link
          to="/wallet"
          className={`nav-link ${
            location.pathname === "/wallet" ? "active" : ""
          }`}
        >
          <BsWallet2 className="nav-icon" />
        </Link>

        <FiShoppingCart className="nav-icon" />
        
          <Link
            to= "/profile"
            className={`nav-link ${
            location.pathname.includes("profile") ? "active" : ""
          }`}
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
