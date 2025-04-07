import React from "react";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/OrderConfirmation.css";

const OrderConfirmation = () => {
  // React hook to navigate to pages in the react app
  const navigate = useNavigate();

  // useEffect to check if user is already loggedIn
  // if not then redirect the user to the login page
  // if logged in then fetch order details
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Not logged in");
        }

        const data = await response.json();
        console.log(data.message);
        fetchOrderConfirmation();
      } catch (err) {
        console.log(err);
        navigate("/login");
      }
    };
    checkStatus();
  }, []);

  ////////////////////////
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrderConfirmation = async () => {
    try {
      // const response = await fetch(`${apiUrl}/order-confirmation`, {
      //   credentials: 'include'
      // });
      const response = await fetch(`${apiUrl}/order-confirmation`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order confirmation");
      }

      const data = await response.json();
      console.log(data);
      console.log(data.message);
      setOrderDetails(data);
    } catch (err) {
      setError("Error fetching order details");
      // console.error(err.response.data.message);
      console.log(err);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!orderDetails) {
    return <div className="loading">Loading order details...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Order Confirmation</h1>

        <p>
          Thank you for your order! Your order has been successfully placed.
        </p>

        <div className="order-details">
          <h3>Order Details</h3>
          <p>
            <strong>Order ID:</strong> {orderDetails.order.order_id}
          </p>
          <p>
            <strong>Order Date:</strong>{" "}
            {new Date(orderDetails.order.order_date).toLocaleString()}
          </p>
          <p>
            <strong>Total Amount:</strong> ${orderDetails.order.total_amount}
          </p>
        </div>

        <h3>Items in Your Order:</h3>
        <table className="order-items-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Price per Item</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.orderItems.map((item) => (
              <tr key={item.product_id}>
                <td>{item.product_id}</td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>${item.price}</td>
                <td>${item.quantity * item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="back-button" onClick={() => navigate("/products")}>
          Continue Shopping
        </button>
      </div>
    </>
  );
};

export default OrderConfirmation;
