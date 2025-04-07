import React from "react";
import { useNavigate } from "react-router";

const Navbar = () => {
  const navigate = useNavigate();

  // handler Function for the logout operation
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ }),
        credentials: "include", 
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }
      const data = await response.json();
      console.log(data.message);
      navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <nav>
      <ul>
        <button
          onClick={() => {
            navigate("/");
          }}
        >
          Home
        </button>
        <button
          onClick={() => {
            navigate("/products");
          }}
        >
          Products
        </button>
        <button
          onClick={() => {
            navigate("/cart");
          }}
        >
          Cart
        </button>
        <button onClick={handleLogout}>Logout</button>
      </ul>
    </nav>
  );
};

export default Navbar;
