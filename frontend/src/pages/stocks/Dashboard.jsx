import React, { useEffect, useState, useCallback } from "react";
import { apiUrl } from "../../config/config";
import "../../css/Dashboard.css";
import NavBar from "../../components/Nav2";

const Dashboard = () => {
  const [holdings, setHoldings] = useState([]);
  const [netInvested, setNetInvested] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user.userId || user.id;

  const fetchData = useCallback(() => {
    if (!userId) return;

    // Fetch holdings
    fetch(`${apiUrl}/api/holdings/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        let totalInvested = 0;
        let totalProfit = 0;

        const sanitizedHoldings = data.map((stock) => {
          const avgPrice = parseFloat(stock.avg_price) || 0;
          const currentPrice = parseFloat(stock.current_price) || 0;
          const quantity = parseInt(stock.quantity) || 0;

          const invested = quantity * avgPrice;
          const currentValue = quantity * currentPrice;
          const profit = currentValue - invested;

          totalInvested += invested;
          totalProfit += profit;

          return {
            ...stock,
            avgPrice,
            currentPrice,
            invested,
            profit,
          };
        });

        setHoldings(sanitizedHoldings);
        setNetInvested(totalInvested);
        setNetProfit(totalProfit);
      })
      .catch((err) => console.error("Failed to fetch holdings", err));

    // Fetch active orders
    fetch(`${apiUrl}/api/orders/active/${userId}`)
      .then((res) => res.json())
      .then((orders) => {
        setBuyOrders(orders.filter((o) => o.order_type === "buy"));
        setSellOrders(orders.filter((o) => o.order_type === "sell"));
      })
      .catch((err) => console.error("Failed to fetch active orders", err));
  }, [userId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 200);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <>
    <NavBar />
      <div className="dashboard-container">
        <div className="dashboard-section">
          <h2>My Holdings</h2>
            {holdings.length === 0 ? (
            <p>No holdings to show.</p>
          ) : (
            <>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Avg. Price</th>
                    <th>Current Price</th>
                    <th>Invested</th>
                    <th>Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((stock) => (
                    <tr key={stock.stock_id}>
                      <td>{stock.company_name}</td>
                      <td>{stock.symbol}</td>
                      <td>{stock.quantity}</td>
                      <td>₹{stock.avgPrice.toFixed(2)}</td>
                      <td>₹{stock.currentPrice.toFixed(2)}</td>
                      <td>₹{stock.invested.toFixed(2)}</td>
                      <td className={stock.profit >= 0 ? "profit" : "loss"}>
                        ₹{stock.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="summary">
                <p><strong>Total Invested:</strong> ₹{netInvested.toFixed(2)}</p>
                <p>
                  <strong>Net Profit/Loss:</strong>{" "}
                  <span className={netProfit >= 0 ? "profit" : "loss"}>
                    ₹{netProfit.toFixed(2)}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Active Buy Orders</h2>
            {buyOrders.length === 0 ? (
            <p>No active buy orders.</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price/Share</th>
                </tr>
              </thead>
              <tbody>
                {buyOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>{order.company_name}</td>
                    <td>{order.symbol}</td>
                    <td>{order.quantity}</td>
                    <td>₹{parseFloat(order.price_per_share).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Active Sell Orders</h2>
            {sellOrders.length === 0 ? (
            <p>No active sell orders.</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price/Share</th>
                </tr>
              </thead>
              <tbody>
                {sellOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>{order.company_name}</td>
                    <td>{order.symbol}</td>
                    <td>{order.quantity}</td>
                    <td>₹{parseFloat(order.price_per_share).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;