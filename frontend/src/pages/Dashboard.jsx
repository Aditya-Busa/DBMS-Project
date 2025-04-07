import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";

const Dashboard = () => {
  // React hook to navigate to pages in the react app
  const navigate = useNavigate();

  // useEffect to check if user is already loggedIn
  // if not then redirect the user to the login page
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
        setUsername(data.username);
      } catch (err) {
        console.log(err);
        navigate("/login");
      }
    };
    checkStatus();
  }, []);

  const [username, setUsername] = useState("User");
  return (
    <div>
      <Navbar />
      <h1>Hi {username}!</h1>
      <div>Welcome to the Ecommerce App</div>
    </div>
  );
};

export default Dashboard;
