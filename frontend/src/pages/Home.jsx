import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

// This component simply checks
// if the user is logged in, it navigates to the dashboard
// else to the login page

const Home = () => {
  const navigate = useNavigate();
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
        navigate("/login");
      }
    };
    checkStatus();
  }, []);
  return <div>HomePage</div>;
};

export default Home;
