// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Explore from "./pages/stocks/Explore";
import Dashboard from "./pages/stocks/Dashboard";
import Watchlist from "./pages/stocks/Watchlist"; // New Watchlist page

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/stocks/explore" element={<Explore />} />
      <Route path="/stocks/dashboard" element={<Dashboard />} />
      <Route path="/stocks/watchlist" element={<Watchlist />} />
    </Routes>
  );
}

export default App;
