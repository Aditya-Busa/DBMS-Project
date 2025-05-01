// src/pages/stocks/Explore.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/config";
import "../../css/Explore.css";
import NavBar from "../../components/Nav2";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [topTradedStocks, setTopTradedStocks] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user.id;

  useEffect(() => {
    fetch(`${apiUrl}/api/stocks/top`)
      .then((res) => res.json())
      .then((data) => setTopTradedStocks(data))
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

  const handleBuy = (stockId) => {
    if (!userId) {
      alert("Please log in to buy stocks.");
      return;
    }
    const quantity = prompt("Enter quantity to buy:");
    if (!quantity) return;

    fetch(`${apiUrl}/api/stocks/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, stockId, quantity: parseInt(quantity) })
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Buy order executed. New Price: $" + data.newPrice.toFixed(2));
      })
      .catch((err) => console.error("Error in buy order", err));
  };

  const addToWatchlist = (stockId) => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || !user.userId) {
      alert("Please log in to add stocks to your watchlist.");
      return;
    }

    fetch(`${apiUrl}/api/watchlist/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: user.userId, stockId })
    })
      .then((res) => {
        if (res.status === 409) {
          return res.json().then(data => { throw new Error(data.message); });
        }
        return res.json();
      })
      .then((data) => alert(data.message))
      .catch((err) => {
        console.error("Error adding to watchlist", err);
        alert(err.message || "Error adding to watchlist");
      });
  };

  return (
    <div className="explore-container">
      <NavBar />

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
              <button onClick={() => handleBuy(searchResult.stock_id)}>Buy</button>
              <button onClick={() => addToWatchlist(searchResult.stock_id)}>
                Add to Watchlist
              </button>
            </div>
          )}
        </div>
      )}

      <h3 className="top-heading">Top 4 Most Traded Stocks</h3>
      <div className="stock-list">
        {topTradedStocks.length > 0 ? (
          topTradedStocks.map((stock) => (
            <div className="stock-card" key={stock.stock_id}>
              <div className="stock-name">{stock.company_name}</div>
              <div className="stock-symbol">{stock.symbol}</div>
              <div className="stock-price">${stock.current_price}</div>
              <button onClick={() => handleBuy(stock.stock_id)}>Buy</button>
              <button onClick={() => addToWatchlist(stock.stock_id)}>
                Add to Watchlist
              </button>
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
