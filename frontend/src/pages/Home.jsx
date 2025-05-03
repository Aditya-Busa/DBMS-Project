// src/pages/Home.jsx
import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import '../css/Home.css';

const Home = () => {
  const [showGuide, setShowGuide] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Nav />
      <div className="home-container">
        <h1>All things finance, right here.</h1>
        <p>Built for a growing India.</p>

        {!showGuide ? (
          <button className="get-started-btn" onClick={() => setShowGuide(true)}>
            Get started
          </button>
        ) : (
          <div className="guide-box">
            <h2>Welcome to FinTrade 🚀</h2>
            <ul>
              <li>🔍 Explore trending or all available stocks.</li>
              <li>📈 See real-time prices and trade activity.</li>
              <li>🧾 Add stocks to your Watchlist and track them easily.</li>
              <li>📨 Get notified about significant price changes.</li>
              <li>🛒 Place Buy or Sell orders instantly at current market price.</li>
              <li>📂 View your active and completed orders anytime.</li>
              <li>📋 Access your full transaction log for security and transparency.</li>
              <li>📊 Use the Dashboard to analyze your portfolio and performance.</li>
            </ul>
            <p className="onboard-tip">Ready to start your journey?</p>
            <div className="auth-buttons">
              <button className='nav-btn' onClick={() => navigate('/register')}>Register</button>
              <button className='nav-btn' onClick={() => navigate('/login')}>Login</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;