// src/components/Nav.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Nav.css';

const Nav = () => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src="/assets/logo.png" alt="Logo" className="logo" />
        <span className="brand-name">Grow</span>
      </div>
      <div className="nav-center">
        <input type="text" placeholder="Search..." className="search-input" />
      </div>
      <div className="nav-right">
        <Link to="/login">
          <button className="nav-btn">Login</button>
        </Link>
        <Link to="/register">
          <button className="nav-btn">Register</button>
        </Link>
      </div>
    </nav>
  );
};

export default Nav;