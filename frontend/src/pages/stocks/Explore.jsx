// src/pages/stocks/Explore.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../../config/config";
import "../../css/Explore.css";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [topTradedStocks, setTopTradedStocks] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If you are using a proxy, this URL is sufficient:

    console.log("I am here");

    fetch(`${apiUrl}/api/stocks/top`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched stocks:", data);
        setTopTradedStocks(data);
      })
      .catch((err) => console.error("Failed to fetch stocks", err));
  }, []);

  const handleSearch = () => {
    const found = topTradedStocks.find(
      (stock) =>
        stock.symbol.toLowerCase() === searchQuery.toLowerCase() ||
        stock.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResult(found || "No stock found");
  };

  return (
    <div className="explore-container">
      <nav className="navbar">
        <div className="nav-logo">Grow</div>
        <div className="nav-links">
          <Link to="/stocks/explore">Explore</Link>
          <Link to="/stocks/dashboard">Dashboard</Link>
        </div>
      </nav>

      <h2>Explore Stocks</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for a stock..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {searchResult && (
        <div className="search-result">
          {typeof searchResult === "string" ? (
            <p>{searchResult}</p>
          ) : (
            <div className="stock-card">
              <div className="stock-name">{searchResult.company_name}</div>
              <div className="stock-symbol">{searchResult.symbol}</div>
              <div className="stock-price">${searchResult.current_price}</div>
            </div>
          )}
        </div>
      )}

      <h3 className="top-heading">Top 4 Most Traded Stocks</h3>
      <div className="stock-list">
        {topTradedStocks.length > 0 ? (
          topTradedStocks.map((stock) => (
            <div className="stock-card" key={stock.symbol}>
              <div className="stock-name">{stock.company_name}</div>
              <div className="stock-symbol">{stock.symbol}</div>
              <div className="stock-price">${stock.current_price}</div>
            </div>
          ))
        ) : (
          <p>No stocks available.</p>
        )}
      </div>

      <button
        className="dashboard-btn"
        onClick={() => navigate("/stocks/dashboard")}
      >
        Go to My Dashboard
      </button>
    </div>
  );
};

export default Explore;
