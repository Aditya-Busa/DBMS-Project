import React, { useEffect, useState } from "react";
import "../css/History.css";
import NavBar from "../components/Nav2";
import { apiUrl } from "../config/config";

const History = () => {
  const [orders, setOrders] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchSymbol, setSearchSymbol] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/history`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch history");

        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, []);

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesType =
      filterType === "all" || order.order_type.toLowerCase() === filterType;
    const matchesSymbol = order.stock_symbol
      .toLowerCase()
      .includes(searchSymbol.toLowerCase());

    return matchesType && matchesSymbol;
  });

  return (
    <>
    <NavBar/>
    <div className="history-container">
      <h2>Transaction History</h2>

      {/* Filter Controls */}
      <div className="filter-controls">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>

        <input
          type="text"
          placeholder="Search by stock symbol..."
          value={searchSymbol}
          onChange={(e) => setSearchSymbol(e.target.value)}
        />
      </div>

      <div className="history-list">
        {filteredOrders.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          filteredOrders.map((order, index) => (
            <div className="history-card" key={index}>
              <div className="history-top">
                <span className={`type ${order.order_type}`}>
                  {order.order_type.toUpperCase()}
                </span>
                <span className="stock-name">{order.stock_symbol}</span>
              </div>
              <div className="history-details">
                <span>{order.quantity} shares</span>
                <span>@ ₹{order.price_per_share}</span>
              </div>
              <div className="timestamp">
                {new Date(order.created_at ?? order.executed_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
  );
};

export default History;
