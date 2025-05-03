import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../../config/config";
import NavBar from "../../components/Nav2";
import { Line } from "react-chartjs-2";
import "../../css/StockDetail.css";

// Chart.js related imports
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale
} from 'chart.js';
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale
);

const StockDetail = () => {
  const { stockId } = useParams();
  const [stock, setStock] = useState(null);
  const [buyBook, setBuyBook] = useState([]);
  const [sellBook, setSellBook] = useState([]);
  const [orderForm, setOrderForm] = useState({ type: "buy", quantity: "", price: "" });
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        const [stockRes, bookRes, historyRes] = await Promise.all([
          fetch(`${apiUrl}/api/stocks/${stockId}`).then(res => res.json()),
          fetch(`${apiUrl}/api/orders/book/${stockId}`).then(res => res.json()),
          fetch(`${apiUrl}/api/stocks/price-history/${stockId}`).then(res => res.json())
        ]);

        if (isMounted) {
          setStock(stockRes);
          setBuyBook(bookRes.buyOrders);
          setSellBook(bookRes.sellOrders);
          
          if (historyRes && historyRes.price_history) {
            // Create timestamps for each price point (assuming 5 second intervals)
            const historyWithTimestamps = historyRes.price_history.map((price, index) => ({
              price,
              // Current time minus (number of points - index) * 5 seconds
              timestamp: new Date(Date.now() - (historyRes.price_history.length - index - 1) * 5000)
            }));
            setPriceHistory(historyWithTimestamps);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAllData();  // initial fetch
    const interval = setInterval(fetchAllData, 5000);  // Poll every 5 seconds to match price updates

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
      
      // Refresh stock price
      fetch(`${apiUrl}/api/stocks/${stockId}`)
        .then(res => res.json())
        .then(setStock);
    } else {
      alert(data.message || "Error placing order");
    }
  };

  // Chart data configuration
  const maxValue = Math.floor(stock?.current_price * 1.5);
  const minValue = Math.floor(stock?.current_price * 0.5);
  const chartData = {
    labels: priceHistory.map((_, index) => {
      // Display time in HH:MM:SS format
      const date = new Date(Date.now() - (priceHistory.length - index - 1) * 5000);
      return date.toLocaleTimeString();
    }),
    datasets: [
      {
        label: 'Price History (5s intervals)',
        data: priceHistory.map(item => item.price),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows custom sizing via CSS
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Stock Price History',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Price: ₹${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        min: minValue, // Set minimum value
        max: maxValue,
        title: {
          display: true,
          text: 'Price (₹)',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return '₹' + value;
          }
        }
      }
    }
  };
  if (!stock) return <p>Loading...</p>;

// In your StockDetail.jsx
return (
  <div className="temp">
    <NavBar />
    <div className="stock-detail-container">
      <div className="stock-header">
        <h1 className="stock-title">{stock.company_name} ({stock.symbol})</h1>
        <div className="stock-price">₹{stock.current_price}</div>
      </div>

      <div className="chart-container">
        <div className="current-price">
        Current Price: {stock.current_price != null && !isNaN(Number(stock.current_price))
      ? Number(stock.current_price).toFixed(2)
      : 'N/A'
      }
        </div>
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="order-book-container">
        <div className="order-book sell-orders">
          <h3>Top 3 Sell Orders</h3>
          <ul>
            {sellBook.map(o => (
              <li key={o.order_id}>
                <span>{o.quantity} shares</span>
                <span>₹{o.price_per_share}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="order-book buy-orders">
          <h3>Top 3 Buy Orders</h3>
          <ul>
            {buyBook.map(o => (
              <li key={o.order_id}>
                <span>{o.quantity} shares</span>
                <span>₹{o.price_per_share}</span>
              </li>
            ))}
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
  </div>
);

  };

export default StockDetail;