// src/pages/stocks/StockDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../../config/config";
import "../../css/Explore.css";

const StockDetail = () => {
  const { stockId } = useParams();
  const [stock, setStock] = useState(null);
  const [buyBook, setBuyBook] = useState([]);
  const [sellBook, setSellBook] = useState([]);
  const [orderForm, setOrderForm] = useState({ type: "buy", quantity: "", price: "" });

  useEffect(() => {
    // fetch stock info
    fetch(`${apiUrl}/api/stocks/${stockId}`)
      .then(res => res.json())
      .then(setStock);
    // fetch order book
    fetch(`${apiUrl}/api/orders/book/${stockId}`)
      .then(res => res.json())
      .then(data => {
        setBuyBook(data.buyOrders);
        setSellBook(data.sellOrders);
      });
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
      // refresh book
      const book = await fetch(`${apiUrl}/api/orders/book/${stockId}`).then(r => r.json());
      setBuyBook(book.buyOrders);
      setSellBook(book.sellOrders);
    } else {
      alert(data.message || "Error placing order");
    }
  };

  if (!stock) return <p>Loading...</p>;

  return (
    <div className="explore-container">
      <h2>{stock.company_name} ({stock.symbol})</h2>
      <p>Last Price: ${stock.current_price}</p>

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
  );
};

export default StockDetail;
