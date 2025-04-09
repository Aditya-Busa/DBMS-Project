// src/pages/Home.jsx
import React from 'react'; 
import Nav from '../components/Nav';
import '../css/Home.css';

const Home = () => {
  return (
    <>
      <Nav/>
      <div className="home-container">
        <h1>All things finance, right here.</h1>
        <p>Built for a growing India.</p>
        <button className="get-started-btn">Get started</button>
        <div className="cityscape">
          {/* Replace with an illustration or SVG as needed */}
          <p> Financial City Illustration</p>
        </div>
      </div>
    </>
  );
};

export default Home;
