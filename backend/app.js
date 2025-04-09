/* eslint-disable no-undef */
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 4000;

// PostgreSQL connection
const pool = new Pool({
  user: "test",
  host: "localhost",
  database: "project",
  password: "test",
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Middleware to check if user is authenticated
// eslint-disable-next-line no-unused-vars
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// REGISTER
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
 
  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1;", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Email is already registered." });
    }
    console.log(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    // eslint-disable-next-line no-unused-vars
    const now = new Date(); 

    const insertQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3) RETURNING user_id, username;
    `;
    const result = await pool.query(insertQuery, [
      username,
      email,
      hashedPassword
    ]);
    console.log("hi");
    req.session.userId = result.rows[0].user_id;
    req.session.username = result.rows[0].username;

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Error signing up" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1;", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    
    // Update last login timestamp
    await pool.query("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE user_id = $1", [user.user_id]);
   
    req.session.userId = user.user_id;
    req.session.username = user.username;

    res.status(201).json({
      message: "Login successful",
      username: user.username,
      userId: user.user_id,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

// CHECK IF LOGGED IN
app.get("/isLoggedIn", (req, res) => {
  if (req.session.userId) {
    res.status(201).json({
      message: "Logged in",
      username: req.session.username,
    });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Failed to log out" });
    res.clearCookie("connect.sid");
    res.status(201).json({ message: "Logged out successfully" });
  });
});

app.get("/api/stocks/top", async (req, res) => {
  try {
    console.log("hi");
    const result = await pool.query(
      "SELECT symbol, company_name, current_price FROM Stocks ORDER BY current_price DESC LIMIT 4"
    );
    console.log(result);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching top stocks:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
