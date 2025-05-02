// src/pages/stocks/Explore.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../../config/config";
import NavBar from "../../components/Nav2";
import "../../css/Explore.css";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [topTradedStocks, setTopTradedStocks] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [addedWatchlist, setAddedWatchlist] = useState(new Set());
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user?.id;

  useEffect(() => {
    fetch(`${apiUrl}/api/stocks/top`)
      .then((res) => res.json())
      .then((data) => setTopTradedStocks(data))
      .catch((err) => console.error("Failed to fetch stocks", err));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResult(data);
      } else {
        setSearchResult("No stock found");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResult("Error fetching stocks");
    }
  };

  const handleBuy = (stockId) => {
    if (!userId) {
      alert("Please log in to buy stocks.");
      return;
    }

    const quantity = prompt("Enter quantity to buy:");
    const parsedQty = parseInt(quantity);

    if (!parsedQty || parsedQty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    fetch(`${apiUrl}/api/stocks/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, stockId, quantity: parsedQty })
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Buy order executed. New Price: $" + data.newPrice.toFixed(2));
      })
      .catch((err) => console.error("Error in buy order", err));
  };

  const addToWatchlist = (stockId) => {
    if (!userId) {
      alert("Please log in to add stocks to your watchlist.");
      return;
    }

    if (addedWatchlist.has(stockId)) {
      alert("Already added to watchlist.");
      return;
    }

    fetch(`${apiUrl}/api/watchlist/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, stockId })
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Failed to add to watchlist.");
        setAddedWatchlist((prev) => new Set(prev).add(stockId));
      })
      .catch((err) => {
        console.error("Error adding to watchlist", err);
        alert("Error adding to watchlist.");
      });
  };

  const renderStockCard = (stock) => (
    <Link
      to={`/stocks/${stock.stock_id}`}
      className="stock-card"
      key={stock.stock_id}
    >
      <div className="stock-name">{stock.company_name}</div>
      <div className="stock-symbol">{stock.symbol}</div>
      <div className="stock-price">${stock.current_price}</div>
      <button
        disabled={addedWatchlist.has(stock.stock_id)}
        onClick={(e) => {
          e.preventDefault();
          addToWatchlist(stock.stock_id);
        }}
      >
        {addedWatchlist.has(stock.stock_id) ? "Added" : "Add to Watchlist"}
      </button>
    </Link>
  );

  return (
    <div className="explore-container">
      <NavBar/>

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

      {/* 🔍 Search Results */}
      {searchResult !== null && (
        <div className="search-result">
          <h3>Search Results</h3>
          {typeof searchResult === "string" ? (
            <p className="no-results">{searchResult}</p>
          ) : (
            searchResult.map(renderStockCard)
          )}
        </div>
      )}

      {/* 📈 Top 4 Most Traded */}
      <h3 className="top-heading">Top 4 Most Traded Stocks</h3>
      <div className="stock-list">
        {topTradedStocks.length > 0 ? (
          topTradedStocks.map(renderStockCard)
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
