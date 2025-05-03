import React, { useEffect, useState } from "react";
import { apiUrl } from "../../config/config";
import { Link } from "react-router-dom";
import "../../css/AllStocks.css";
import NavBar from "../../components/Nav2";

const AllStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [addedWatchlist, setAddedWatchlist] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user?.id;

  // Fetch all stocks every 100ms
  useEffect(() => {
    let interval;
  
    const fetchStocks = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/stocks/all`);
        const data = await res.json();
        if (searchQuery.trim() === "") {
          setStocks(data); // Don't update while searching
        }
      } catch (err) {
        console.error("Failed to fetch stocks", err);
      }
    };
  
    fetchStocks(); // initial fetch
  
    interval = setInterval(fetchStocks, 100); // update only if not searching
  
    return () => clearInterval(interval);
  }, [searchQuery]); // run effect when searchQuery changes
  

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

  // Filter stocks based on search query
  const filteredStocks = stocks.filter((stock) =>
    stock.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="all-container">
      <NavBar />

      <h2>All Stocks</h2>

      <input
        type="text"
        placeholder="Search by company name or symbol..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "300px", fontSize: "1rem" }}
      />

      <div className="stock-list">
        {filteredStocks.length > 0 ? (
          filteredStocks.map((stock) => (
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
