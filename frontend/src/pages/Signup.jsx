import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const Signup = () => {
  // React hook to navigate to pages in the react app
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  // useEffect checks if the user is already logged in
  // if already loggedIn then it will simply navigate to the dashboard
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
        navigate("/dashboard");
      } catch (err) {
        console.log(err);
      }
    };
    checkStatus();
  }, [loggedIn]);

  // Form state data and handlerFunction
  // which handles the change in state of the form
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Error state data
  // It is used to display errors (if any)
  // such as "Invalid Credentials"
  const [error, setError] = useState("");

  // handler Function to handle the signup opertion
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      if (err.response && err.response.data) {
        setError(`${err.response.data.message}`);
      } else {
        setError(`Error signing up!`);
      }
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <div>
        Already have an account?{" "}
        <div className="link" onClick={() => navigate("/login")}>
          Login here
        </div>
      </div>
    </div>
  );
};

export default Signup;
