import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../../config/config";
import NavBar from "../../components/Nav2";
import "../../css/Explore.css";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [topTradedStocks, setTopTradedStocks] = useState([]);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [addedWatchlist, setAddedWatchlist] = useState(new Set());
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user?.id;

  useEffect(() => {
    const fetchTopStocks = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/stocks/top`);
        const data = await res.json();
        if (searchQuery.trim() === "") {
          setTopTradedStocks(data);
        }
      } catch (err) {
        console.error("Failed to fetch stocks", err);
      }
    };

    const fetchTopGainersAndLosers = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/top-gainers-losers`);
        const data = await res.json();
        setTopGainers(data.topGainers);
        setTopLosers(data.topLosers);
      } catch (err) {
        console.error("Failed to fetch top gainers and losers", err);
      }
    };

    fetchTopStocks(); // Initial fetch
    fetchTopGainersAndLosers(); // Fetch gainers and losers

    const interval = setInterval(() => {
      fetchTopStocks();
      fetchTopGainersAndLosers();
    }, 100);

    return () => clearInterval(interval);
  }, [searchQuery]);

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStocks(topTradedStocks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = topTradedStocks.filter(stock =>
        stock.company_name.toLowerCase().includes(query) ||
        stock.symbol.toLowerCase().includes(query)
      );
      setFilteredStocks(filtered);
    }
  }, [searchQuery, topTradedStocks]);

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
      <div className="stock-trade-count">{stock.count} trades</div>
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
      <NavBar />
      <div className="explore-content">
        <h2>Explore Stocks</h2>
  
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for a stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
  
        {/* Most Traded Stocks Section */}
        <div className="section-container">
          <h3 className="top-heading">
            {searchQuery ? "Search Results" : "Top 4 Most Traded Stocks"}
          </h3>
          <div className="stock-list">
            {filteredStocks.length > 0 ? (
              filteredStocks.map(renderStockCard)
            ) : (
              <p>No stocks found.</p>
            )}
          </div>
        </div>
  
        {/* Top Gainers and Losers Section */}
        <div className="section-container">
          <h3>Top Gainers</h3>
          <div className="stock-list">
            {topGainers.map((stock) => renderStockCard(stock))}
          </div>
        </div>
  
        <div className="section-container">
          <h3>Top Losers</h3>
          <div className="stock-list">
            {topLosers.map((stock) => renderStockCard(stock))}
          </div>
        </div>
  
        <div className="button-group">
          <button className="dashboard-btn" onClick={() => navigate("/stocks/dashboard")}>
            Go to My Dashboard
          </button>
          <button className="dashboard-btn" onClick={() => navigate("/stocks/all")}>
            View All Stocks
          </button>
        </div>
      </div>
    </div>
  );
};

export default Explore;
