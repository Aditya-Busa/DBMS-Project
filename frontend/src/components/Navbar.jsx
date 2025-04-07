import React from 'react';
import { Link } from 'react-router';
import '../css/Navbar.css';
import logo from './Logo.png'

const Nav = () => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        {/* Adjust the path if needed */}
        <img src= {logo} alt="Logo" className="logo" />
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
