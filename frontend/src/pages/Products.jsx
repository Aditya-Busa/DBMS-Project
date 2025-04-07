import React from "react";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/Products.css";

const Products = () => {
  // make this true if you want to search the products
  // while typing: for every character type the product list
  // will be updated
  const fastUpdate = false;
  const all_items_visible_at_the_start = false;

  // React hook to navigate to pages in the react app
  const navigate = useNavigate();

  // useEffect to check if user is already loggedIn
  // if not then redirect the user to the login page
  // if logged in then fetch the products
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
        fetchProducts();
      } catch (err) {
        console.log(err);
        navigate("/login");
      }
    };
    checkStatus();
  }, []);

  /////////////////////
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${apiUrl}/list-products`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      console.log(data.message);
      setProducts(data.products);
    } catch (err) {
      console.error(err);
      setError("Error in fetching the products list!");
    }
  };
  // //////////////////////
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [keyword, setKeyword] = useState("");
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState("");

  // //////////////////////
  const handleQuantityChange = (productId, change) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change),
    }));
  };

  const addToCart = async (productId) => {
    const quantity = quantities[productId] || 0;
    if (quantity === 0) {
      setMessage("Please select a quantity greater than 0");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId, quantity: quantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item to cart");
      }

      const data = await response.json();
      console.log(data.message);
      setMessage(data.message);

      // Reset quantity after successful addition
      setQuantities((prev) => ({
        ...prev,
        [productId]: 0,
      }));
    } catch (err) {
      console.log(err);
      setMessage("Error adding to cart");
    }
  };

  const filteredProducts =
    searchTerm === "" && !all_items_visible_at_the_start
      ? []
      : products.filter((product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(keyword);
  };
  return (
    <>
      <Navbar />
      <div className="products-container">
        <h1>Product List</h1>
        {message && <div className="message">{message}</div>}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by product name..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (fastUpdate) {
                  setSearchTerm(e.target.value);
                }
              }}
              className="search-input"
            />
            <button type="submit">Search</button>
          </form>
        </div>
        <table className="products-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Stock Available</th>
              <th>Quantity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_id}</td>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td className="stock-cell">
                  <span
                    className={`stock-badge ${
                      product.stock_quantity < 5 ? "low-stock" : ""
                    }`}
                  >
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="quantity-cell">
                  <button
                    onClick={() => handleQuantityChange(product.product_id, -1)}
                  >
                    -
                  </button>
                  <span>{quantities[product.product_id] || 0}</span>
                  <button
                    onClick={() => handleQuantityChange(product.product_id, 1)}
                  >
                    +
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => addToCart(product.product_id)}
                    className="add-to-cart-btn"
                    disabled={product.stock_quantity === 0}
                  >
                    {product.stock_quantity === 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Products;
