import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const Login = () => {
  // React hook to navigate to pages in the react app
  const navigate = useNavigate();

  // Form state data and handlerFunction
  // which handles the change in state of the form
  const [formData, setFormData] = useState({
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

  // handler Function to handle the login opertion
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      setLoggedIn(true);
    } catch (err) {
      console.log(err);
      if (err.response && err.response.data) {
        setError(`${err.response.data.message}`);
      } else {
        setError(`Error logging in!`);
      }
    }
  };

  return (
    <div>
      <h2>Sign In</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>

      <div>
        Don't have an account?{" "}
        <div className="link" onClick={() => navigate("/signup")}>
          Sign up here
        </div>
      </div>
    </div>
  );
};

export default Login;
