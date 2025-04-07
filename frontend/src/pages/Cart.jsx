import React from "react";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/Cart.css";

const Cart = () => {
  // React hook to navigate to pages in the react app
  const navigate = useNavigate();

  // useEffect to check if user is already loggedIn
  // if not then redirect the user to the login page
  // if logged in then fetch cart
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
        fetchCart();
      } catch (err) {
        console.log(err);
        navigate("/login");
      }
    };

    checkStatus();
  }, []);

  /////////// states ////////////
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const [pincode, setPincode] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  ////////////////////
  const fetchCart = async () => {
    try {
      const response = await fetch(`${apiUrl}/display-cart`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      console.log(data.message);
      setCart(data.cart);
      setTotalPrice(data.totalPrice);
    } catch (err) {
      console.log(err);
      setError("Failed to fetch cart");
    }
  };

  const updateQuantity = async (
    productId,
    change,
    currentQuantity,
    stockQuantity
  ) => {
    const newQuantity = currentQuantity + change;

    // Validate quantity bounds
    if (newQuantity < 1 || newQuantity > stockQuantity) {
      setMessage(
        newQuantity < 1
          ? "Quantity cannot be less than 1"
          : "Cannot exceed available stock"
      );
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/update-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId, quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cart");
      }

      const data = await response.json();
      setMessage("Cart updated successfully");
      fetchCart(); // Refresh cart data
      console.log(data.message);
    } catch (err) {
      console.log(err);
      setMessage("Error updating cart");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await fetch(`${apiUrl}/remove-from-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove item from cart");
      }

      const data = await response.json();
      setMessage(data.message);
      fetchCart(); // Refresh cart after removing item
    } catch (err) {
      setMessage("Error removing item from cart");
      console.error("Error:", err);
    }
  };

  const handleCheckout = async () => {
    // Validate address fields
    if (!pincode || !street || !city || !state) {
      setMessage("Please fill in all address fields");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address: {
            street,
            city,
            state,
            pincode,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const data = await response.json();
      setMessage(data.message);
      // Clear cart display after successful order
      setCart([]);
      setTotalPrice(0);
      // Navigate to order confirmation
      console.log(data.message);
      navigate("/order-confirmation");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error placing order");
      console.log(err);
    }
  };

  const handlePinCodeChange = async (e) => {
    setPincode(e.target.value);

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${e.target.value}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pincode details");
    }

    const data = await response.json();

    if (data[0].Status === "Success") {
      console.log("success");
      setState(data[0].PostOffice[0].State);
      setCity(data[0].PostOffice[0].Name);
    } else {
      console.log("failure");
      setState("");
      setCity("");
    }
  };

  if (error) {
    return <div className="cart-error">{error}</div>;
  }
  return (
    <>
      <Navbar />
      <div className="cart-container">
        <h1>Your Cart</h1>
        {message && <div className="cart-message">{message}</div>}
        {cart.length === 0 ? (
          <p className="empty-cart-message">Your cart is empty</p>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock Available</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.item_id}>
                    <td>{item.name}</td>
                    <td>${item.price}</td>
                    <td>{item.stock_quantity}</td>
                    <td className="quantity-cell">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            -1,
                            item.quantity,
                            item.stock_quantity
                          )
                        }
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            1,
                            item.quantity,
                            item.stock_quantity
                          )
                        }
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </td>
                    <td>${item.total_price}</td>
                    <td>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form>
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={pincode}
                placeholder="Enter pincode"
                onChange={handlePinCodeChange}
              />
              <label>Street</label>
              <input
                type="text"
                name="street"
                value={street}
                placeholder="Enter street"
                onChange={(e) => setStreet(e.target.value)}
              />
              <label>City</label>
              <input
                type="text"
                value={city}
                placeholder="Enter city"
                readOnly
              />
              <label>State</label>
              <input
                type="text"
                value={state}
                placeholder="Enter state"
                readOnly
              />
            </form>
            <div className="cart-total">
              <h3>Total: ${totalPrice}</h3>
              <button
                onClick={handleCheckout}
                className="checkout-btn"
                disabled={cart.length === 0}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Cart;
