import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Nav.css';
import logo from './Logo.png';

const Nav = () => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Logo" className="logo" />
        <span className="brand-name">Groww</span>
      </div>

      <div style={{ flex: 1 }} /> {/* Spacer to push nav-right to far right */}

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