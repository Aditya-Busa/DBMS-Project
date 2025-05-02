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
      </div>
    </>
  );
};

export default Home;
