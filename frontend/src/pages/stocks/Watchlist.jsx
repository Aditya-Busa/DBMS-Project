// src/pages/stocks/Watchlist.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/config";
import "../../css/Watchlist.css";
import NavBar from "../../components/Nav2";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user.userId || user.id;
  const navigate = useNavigate();

  const fetchWatchlist = useCallback(() => {
    if (!userId) return;
    fetch(`${apiUrl}/api/watchlist/${userId}`)
      .then((res) => res.json())
      .then((data) => setWatchlist(data))
      .catch((err) => console.error("Failed to fetch watchlist", err));
  }, [userId]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const removeFromWatchlist = (stockId) => {
    if (!userId) return;

    fetch(`${apiUrl}/api/watchlist/remove`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, stockId })
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        fetchWatchlist();
      })
      .catch((err) => {
        console.error("Error removing from watchlist", err);
        alert("Error removing stock from watchlist");
      });
  };

  return (
    <>
      <NavBar />
      <div className="watchlist-container">
        <h2>My Watchlist</h2>
        {watchlist.length === 0 ? (
          <p>No stocks in your watchlist.</p>
        ) : (
          <div className="w-stock-list">
            {watchlist.map((stock) => (
              <div className="w-stock-card" key={stock.stock_id}>
                {/* Clickable stock info */}
                <div
                  className="w-stock-info"
                  style={{ cursor: "pointer", flex: 1 }}
                  onClick={() => navigate(`/stocks/${stock.stock_id}`)}
                >
                  <div className="w-stock-name">{stock.company_name}</div>
                  <div className="w-stock-symbol">{stock.symbol}</div>
                </div>

                {/* Remove Button */}
                <button
                  className="w-remove-button"
                  onClick={() => removeFromWatchlist(stock.stock_id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Watchlist;