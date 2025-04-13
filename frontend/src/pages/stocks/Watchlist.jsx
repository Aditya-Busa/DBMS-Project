// src/pages/stocks/Watchlist.jsx
import React, { useEffect, useState } from "react";
import { apiUrl } from "../../config/config";
import "../../css/Explore.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user.id;

  useEffect(() => {
    if (!userId) return;
    fetch(`${apiUrl}/api/watchlist/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setWatchlist(data);
      })
      .catch((err) => console.error("Failed to fetch watchlist", err));
  }, [userId]);

  return (
    <div className="explore-container">
      <h2>My Watchlist</h2>
      {watchlist.length === 0 ? (
        <p>No stocks in your watchlist.</p>
      ) : (
        <div className="stock-list">
          {watchlist.map((stock) => (
            <div className="stock-card" key={stock.stock_id}>
              <div className="stock-name">{stock.company_name}</div>
              <div className="stock-symbol">{stock.symbol}</div>
              <div className="stock-price">${stock.current_price}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
