// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Explore from "./pages/stocks/Explore";
import Dashboard from "./pages/stocks/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/stocks/explore" element={<Explore />} />
      <Route path="/stocks/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
