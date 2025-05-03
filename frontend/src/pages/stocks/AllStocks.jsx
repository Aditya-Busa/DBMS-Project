import React, { useEffect, useState } from "react";
import { apiUrl } from "../../config/config";
import { Link } from "react-router-dom";
import "../../css/AllStocks.css";
import NavBar from "../../components/Nav2";

const AllStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [addedWatchlist, setAddedWatchlist] = useState(new Set());

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user?.id;

  // Fetch all stocks every 100ms
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/stocks/all`);
        const data = await res.json();
        setStocks(data);
      } catch (err) {
        console.error("Error fetching all stocks:", err);
      }
    };

    fetchStocks(); // Initial fetch
    const interval = setInterval(fetchStocks, 100); // Re-fetch every 100ms

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (!userId) return;
  
    fetch(`${apiUrl}/api/watchlist/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const watchlistSet = new Set(data.map(item => item.stock_id));
        setAddedWatchlist(watchlistSet);
      })
      .catch((err) => {
        console.error("Failed to fetch watchlist", err);
      });
  }, [userId]);

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

  return (
    <div className="all-container">
      <NavBar />

      <h2>All Stocks</h2>

      <div className="stock-list">
        {stocks.length > 0 ? (
          stocks.map((stock) => (
            <Link to={`/stocks/${stock.stock_id}`} className="stock-card" key={stock.stock_id}>
              <div className="stock-name">{stock.company_name}</div>
              <div className="stock-symbol">{stock.symbol}</div>
              <div className="stock-price">${stock.current_price}</div>
              <div className="stock-count">{stock.count} trades</div>
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
          ))
        ) : (
          <p>No stocks found.</p>
        )}
      </div>
    </div>
  );
};

export default AllStocks;