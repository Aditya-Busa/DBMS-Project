import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../../config/config";
import NavBar from "../../components/Nav2";
import { Line } from "react-chartjs-2";  // Import Line chart for candlestick data
import "../../css/Explore.css";

// Chart.js related imports
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const StockDetail = () => {
  const { stockId } = useParams();
  const [stock, setStock] = useState(null);
  const [buyBook, setBuyBook] = useState([]);
  const [sellBook, setSellBook] = useState([]);
  const [orderForm, setOrderForm] = useState({ type: "buy", quantity: "", price: "" });
  const [candlestickData, setCandlestickData] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      const [stockRes, bookRes, candlestickRes] = await Promise.all([
        fetch(`${apiUrl}/api/stocks/${stockId}`).then(res => res.json()),
        fetch(`${apiUrl}/api/orders/book/${stockId}`).then(res => res.json()),
        fetch(`${apiUrl}/api/stocks/candlestick/${stockId}`).then(res => res.json()) // Fetch candlestick data
      ]);

      // Log the candlestick data to see its structure
      console.log("Candlestick Data:", candlestickRes);

      if (isMounted) {
        setStock(stockRes);
        setBuyBook(bookRes.buyOrders);
        setSellBook(bookRes.sellOrders);

        // Ensure that candlestickRes is an array
        if (Array.isArray(candlestickRes)) {
          setCandlestickData(candlestickRes);  // Set candlestick data
        } else {
          console.error("Expected candlestick data to be an array.");
        }
      }
    };

    fetchAllData();  // initial fetch

    const interval = setInterval(fetchAllData, 200);  // Poll every 200ms

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [stockId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setOrderForm(frm => ({ ...frm, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const user = JSON.parse(sessionStorage.getItem("user")) || {};
    if (!user.id) { alert("Please login"); return; }

    const payload = {
      userId: user.id,
      stockId: parseInt(stockId, 10),
      orderType: orderForm.type,
      quantity: parseInt(orderForm.quantity, 10),
      pricePerShare: parseFloat(orderForm.price)
    };

    const res = await fetch(`${apiUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert("Order placed");
      // Refresh book
      const book = await fetch(`${apiUrl}/api/orders/book/${stockId}`).then(r => r.json());
      setBuyBook(book.buyOrders);
      setSellBook(book.sellOrders);
      
      // TODO: Stock price wasn't being updated till refresh
      fetch(`${apiUrl}/api/stocks/${stockId}`)
      .then(res => res.json())
      .then(setStock);

    } else {
      alert(data.message || "Error placing order");
    }
  };

  // Check if candlestickData is properly set
  console.log("Candlestick Data in Chart:", candlestickData);

  // Chart data for candlestick (line chart for simplicity)
  const chartData = {
    labels: candlestickData.map(data => data.time),  // X-axis: Time (truncated to the hour)
    datasets: [
      {
        label: 'Stock Price',
        data: candlestickData.map(data => data.close), // Closing prices for the chart
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  if (!stock) return <p>Loading...</p>;

  return (
    <>
      <NavBar />
      <div className="explore-container">
        <h2>{stock.company_name} ({stock.symbol})</h2>
        <p>Last Price: ${stock.current_price}</p>

        {/* Candlestick chart */}
        <div className="chart-container">
          <h3>Candlestick Chart</h3>
          <Line data={chartData} />
        </div>

        <div className="order-book">
          <div>
            <h3>Top 3 Sell Orders</h3>
            <ul>
              {sellBook.map(o => <li key={o.order_id}>{o.quantity} @ ${o.price_per_share}</li>)}
            </ul>
          </div>
          <div>
            <h3>Top 3 Buy Orders</h3>
            <ul>
              {buyBook.map(o => <li key={o.order_id}>{o.quantity} @ ${o.price_per_share}</li>)}
            </ul>
          </div>
        </div>

        <form className="order-form" onSubmit={handleSubmit}>
          <label>
            Type:
            <select name="type" value={orderForm.type} onChange={handleChange}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
          <label>
            Quantity:
            <input
              type="number"
              name="quantity"
              value={orderForm.quantity}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Price:
            <input
              type="number"
              step="0.01"
              name="price"
              value={orderForm.price}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit">Place Order</button>
        </form>
      </div>
    </>
  );
};

export default StockDetail;
