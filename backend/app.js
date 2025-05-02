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
  user: "postgres",
  host: "localhost",   
  database: "dbms_project",
  password: "Aditya@2005",
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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1;", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3) RETURNING user_id, username;
    `;

    const personalInfoQuery = `
    INSERT INTO personal_information (user_id)
    VALUES ($1)
    RETURNING info_id;
  `;

    const result = await pool.query(insertQuery, [username, email, hashedPassword]);

    const id = result.rows[0].user_id
    req.session.userId = id;
    req.session.username = result.rows[0].username;
    const info = await pool.query(personalInfoQuery, [id]);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.rows[0].user_id,
        username: result.rows[0].username
      }
    });
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
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/api/stocks/top", async (req, res) => {
  try {
    console.log("hi");
    const result = await pool.query(
      "SELECT stock_id, symbol, company_name, current_price FROM stocks ORDER BY current_price DESC LIMIT 4"
    );
    console.log(result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching top stocks:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/stocks/search", async (req, res) => {
  const query = req.query.q?.toLowerCase() || "";
  try {
    const result = await pool.query(
      "SELECT * FROM stocks WHERE LOWER(symbol) LIKE $1 OR LOWER(company_name) LIKE $1",
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

app.post("/api/stocks/buy", async (req, res) => {
  const { userId, stockId, quantity } = req.body;
  try {
    // 1. Fetch current stock price.
    const stockResult = await pool.query(
      'SELECT current_price FROM stocks WHERE stock_id = $1',
      [stockId]
    );
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: "Stock not found" });
    }
    let currentPrice = stockResult.rows[0].current_price;
    
    // 2. Simulate a price change: for example, increase by 0.1% per unit bought.
    const newPrice = currentPrice * (1 + (0.001 * quantity));
    
    // 3. Insert the buy order into Orders table.
    await pool.query(
      "INSERT INTO orders (user_id, stock_id, order_type, quantity, price_per_share) VALUES ($1, $2, 'buy', $3, $4)",
      [userId, stockId, quantity, currentPrice]
    );
    
    // 4. Update the stock's price in the Stocks table.
    await pool.query(
      'UPDATE stocks SET current_price = $1 WHERE stock_id = $2',
      [newPrice, stockId]
    );
    
    res.json({ message: "Buy order executed", newPrice });
  } catch (err) {
    console.error("Error executing buy order:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// GET endpoint to retrieve a user's watchlist stocks
// Example Express route (Node.js + PostgreSQL)
app.get("/api/watchlist/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT s.stock_id, s.symbol, s.company_name, s.current_price
      FROM watchlist w
      JOIN stocks s ON w.stock_id = s.stock_id
      WHERE w.user_id = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});


// POST endpoint to add a stock to the watchlist
app.post("/api/watchlist/add", async (req, res) => {
  const { userId, stockId } = req.body;
  try {
   // Check if the stock is already in the watchlist
   const checkQuery = `
   SELECT * FROM watchlist WHERE user_id = $1 AND stock_id = $2
 `;
 const existing = await pool.query(checkQuery, [userId, stockId]);

 if (existing.rows.length > 0) {
   return res.status(409).json({ message: "Stock already in watchlist" });
 }


 // Insert into watchlist
 const insertQuery = `
   INSERT INTO watchlist (user_id, stock_id)
   VALUES ($1, $2)
 `;
 await pool.query(insertQuery, [userId, stockId]);
 res.status(200).json({ message: "Stock added to watchlist" });
} catch (err) {
 console.error("Add to watchlist error:", err);
 res.status(500).json({ message: "Internal server error" });
}
});

// Remove stock from watchlist
app.delete("/api/watchlist/remove", async (req, res) => {
  const { userId, stockId } = req.body;

  if (!userId || !stockId) {
    return res.status(400).json({ message: "Missing userId or stockId" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM watchlist WHERE user_id = $1 AND stock_id = $2 RETURNING *",
      [userId, stockId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Stock not found in watchlist" });
    }

    res.status(200).json({ message: "Stock removed from watchlist" });
  } catch (err) {
    console.error("Error removing from watchlist:", err);
    res.status(500).json({ message: "Failed to remove stock from watchlist" });
  }
});

// GET stock detail
app.get("/api/stocks/:stockId", async (req, res) => {
  const { stockId } = req.params;
  const result = await pool.query(
    "SELECT stock_id, symbol, company_name, current_price FROM Stocks WHERE stock_id = $1",
    [stockId]
  );
  if (!result.rows.length) return res.status(404).json({ message: "Not found" });
  res.json(result.rows[0]);
});

// GET order book top 3
app.get("/api/orders/book/:stockId", async (req, res) => {
  const { stockId } = req.params;
  // top 3 sell: lowest price first
  const sell = await pool.query(
    `SELECT order_id, quantity, price_per_share
     FROM orders
     WHERE stock_id=$1 AND status='open' AND order_type='sell'
     ORDER BY price_per_share ASC, created_at ASC
     LIMIT 3`, [stockId]
  );
  // top 3 buy: highest price first
  const buy = await pool.query(
    `SELECT order_id, quantity, price_per_share
     FROM orders
     WHERE stock_id=$1 AND status='open' AND order_type='buy'
     ORDER BY price_per_share DESC, created_at ASC
     LIMIT 3`, [stockId]
  );
  res.json({ sellOrders: sell.rows, buyOrders: buy.rows });
});

app.post("/api/orders", async (req, res) => {
  const { userId, stockId, orderType, quantity, pricePerShare } = req.body;
  
  try {
    await pool.query('BEGIN'); // Start transaction

    // 1. Insert the new order
    const orderResult = await pool.query(
      `INSERT INTO orders
         (user_id, stock_id, order_type, quantity, price_per_share, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING order_id, status`,
      [userId, stockId, orderType, quantity, pricePerShare]
    );

    const newOrder = orderResult.rows[0];
    
    // 2. Try to match orders
    if (orderType === 'sell') {
      await matchSellOrder(newOrder.order_id, stockId, pricePerShare, quantity, userId);
    } else { // buy order
      await matchBuyOrder(newOrder.order_id, stockId, pricePerShare, quantity, userId);
    }

    await pool.query('COMMIT'); // Commit transaction if all succeeds
    
    // 3. Get updated order status (might have changed during matching)
    const updatedOrder = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1', 
      [newOrder.order_id]
    );
    
    res.json({ 
      message: "Order processed", 
      order: updatedOrder.rows[0] 
    });

  } catch (err) {
    await pool.query('ROLLBACK'); // Rollback on error
    console.error("Order error", err);
    res.status(500).json({ message: "Failed to process order" });
  }
});

// Helper function to match sell orders with existing buy orders
async function matchSellOrder(sellOrderId, stockId, askPrice, askQuantity, sellerId) {
  // Get matching buy orders (highest price first)
  const { rows: buyOrders } = await pool.query(
    `SELECT * FROM orders 
     WHERE stock_id = $1 AND order_type = 'buy' AND status = 'open'
       AND price_per_share >= $2
     ORDER BY price_per_share DESC, created_at ASC`,
    [stockId, askPrice]
  );

  let remainingQuantity = askQuantity;
  
  for (const buyOrder of buyOrders) {
    if (remainingQuantity <= 0) break;
    
    const matchedQuantity = Math.min(remainingQuantity, buyOrder.quantity);
    // const matchedPrice = buyOrder.price_per_share; // Use buyer's price
    const matchedPrice = askPrice // TODO (Using the price which is lower (convention))
    
    // Execute the trade
    await executeTrade(
      buyOrder.order_id,
      sellOrderId,
      stockId,
      matchedQuantity,
      matchedPrice,
      buyOrder.user_id,
      sellerId
    );

    //TODO
    console.log(`Changed current_price to ${matchedPrice}`);
    await pool.query(
      'UPDATE stocks SET current_price = $1 WHERE stock_id = $2',
      [matchedPrice, stockId]
    );

    
    remainingQuantity -= matchedQuantity;
  }

  // Update sell order status if fully/partially matched
  if (remainingQuantity < askQuantity) {
    if (remainingQuantity > 0) {
      await pool.query(
        'UPDATE orders SET quantity = $1 WHERE order_id = $2',
        [remainingQuantity, sellOrderId]
      );
    } else {
      await pool.query(
        'UPDATE orders SET status = \'executed\' WHERE order_id = $1',
        [sellOrderId]
      );
    }
  }
}

// Helper function to match buy orders with existing sell orders
async function matchBuyOrder(buyOrderId, stockId, bidPrice, bidQuantity, buyerId) {
  // Get matching sell orders (lowest price first)
  const { rows: sellOrders } = await pool.query(
    `SELECT * FROM orders 
     WHERE stock_id = $1 AND order_type = 'sell' AND status = 'open'
       AND price_per_share <= $2
     ORDER BY price_per_share ASC, created_at ASC`,
    [stockId, bidPrice]
  );

  let remainingQuantity = bidQuantity;
  
  for (const sellOrder of sellOrders) {
    if (remainingQuantity <= 0) break;
    
    const matchedQuantity = Math.min(remainingQuantity, sellOrder.quantity);
    const matchedPrice = sellOrder.price_per_share; // Use seller's price
    
    // Execute the trade
    await executeTrade(
      buyOrderId,
      sellOrder.order_id,
      stockId,
      matchedQuantity,
      matchedPrice,
      buyerId,
      sellOrder.user_id
    );

    //TODO
    console.log(`Changed current_price to ${matchedPrice}`);
    await pool.query(
      'UPDATE stocks SET current_price = $1 WHERE stock_id = $2',
      [matchedPrice, stockId]
    );
    
    remainingQuantity -= matchedQuantity;
  }

  // Update buy order status if fully/partially matched
  if (remainingQuantity < bidQuantity) {
    if (remainingQuantity > 0) {
      await pool.query(
        'UPDATE orders SET quantity = $1 WHERE order_id = $2',
        [remainingQuantity, buyOrderId]
      );
    } else {
      await pool.query(
        'UPDATE orders SET status = \'executed\' WHERE order_id = $1',
        [buyOrderId]
      );
    }
  }
}

// Helper function to execute a trade between two orders
async function executeTrade(buyOrderId, sellOrderId, stockId, quantity, price, buyerId, sellerId) {
  // 1. Record the transaction
  await pool.query(
    `INSERT INTO transactions 
       (buy_order_id, sell_order_id, stock_id, quantity, price_per_share)
     VALUES ($1, $2, $3, $4, $5)`,
    [buyOrderId, sellOrderId, stockId, quantity, price]
  );

  // 2. Update buyer's holdings - using proper conflict target
  await pool.query(
    `INSERT INTO holdings 
       (user_id, stock_id, quantity, avg_price)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT ON CONSTRAINT holdings_user_id_stock_id_key
     DO UPDATE SET 
       quantity = holdings.quantity + EXCLUDED.quantity,
       avg_price = (holdings.avg_price * holdings.quantity + EXCLUDED.avg_price * EXCLUDED.quantity) / 
                   (holdings.quantity + EXCLUDED.quantity)`,
    [buyerId, stockId, quantity, price]
  );

  // 3. Update seller's holdings
  await pool.query(
    `UPDATE holdings SET quantity = quantity - $1
     WHERE user_id = $2 AND stock_id = $3`,
    [quantity, sellerId, stockId]
  );

  // 4. Update the stock's current price
  await pool.query(
    'UPDATE stocks SET current_price = $1 WHERE stock_id = $2',
    [price, stockId]
  );

  // 5. Update the buy order status
  const buyOrder = await pool.query(
    'SELECT quantity FROM orders WHERE order_id = $1',
    [buyOrderId]
  );
  
  if (buyOrder.rows[0].quantity <= quantity) {
    await pool.query(
      'UPDATE orders SET status = \'executed\' WHERE order_id = $1',
      [buyOrderId]
    );
  } else {
    await pool.query(
      'UPDATE orders SET quantity = quantity - $1 WHERE order_id = $2',
      [quantity, buyOrderId]
    );
  }

  // 6. Update the sell order status
  const sellOrder = await pool.query(
    'SELECT quantity FROM orders WHERE order_id = $1',
    [sellOrderId]
  );
  
  if (sellOrder.rows[0].quantity <= quantity) {
    await pool.query(
      'UPDATE orders SET status = \'executed\' WHERE order_id = $1',
      [sellOrderId]
    );
  } else {
    await pool.query(
      'UPDATE orders SET quantity = quantity - $1 WHERE order_id = $2',
      [quantity, sellOrderId]
    );
  }
}

app.post('/api/stocks/buy', async (req, res) => {
  const { userId, stockId, quantity } = req.body;

  if (!userId || !stockId || !quantity) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Get the best (lowest price) available sell order for this stock
    const [sellOrder] = await pool.query(
      `SELECT * FROM orders
       WHERE stock_id = $1 AND order_type = 'sell' AND status = 'open'
       ORDER BY price ASC, created_at ASC LIMIT 1`,
      [stockId]
    );

    if (sellOrder.rowCount === 0) {
      return res.status(404).json({ error: 'No matching sell order found' });
    }

    const bestSell = sellOrder.rows[0];

    // Determine matched quantity (either full or partial match)
    const matchedQty = Math.min(quantity, bestSell.quantity);

    // Insert transaction (optional but good for records)
    await pool.query(
      `INSERT INTO transactions (buyer_id, seller_id, stock_id, quantity, price, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, bestSell.user_id, stockId, matchedQty, bestSell.price]
    );

    // Update the stock's current price
    await pool.query(
      `UPDATE stocks SET current_price = $1 WHERE id = $2`,
      [bestSell.price, stockId]
    );

    // Reduce quantity or close sell order
    if (matchedQty === bestSell.quantity) {
      await pool.query(`UPDATE orders SET status = 'filled' WHERE id = $1`, [bestSell.id]);
    } else {
      await pool.query(
        `UPDATE orders SET quantity = quantity - $1 WHERE id = $2`,
        [matchedQty, bestSell.id]
      );
    }

    // Record the buy order as filled
    await pool.query(
      `INSERT INTO orders (user_id, stock_id, order_type, quantity, price, status, created_at)
       VALUES ($1, $2, 'buy', $3, $4, 'filled', NOW())`,
      [userId, stockId, matchedQty, bestSell.price]
    );

    res.json({ message: 'Buy order matched', newPrice: bestSell.price });

  } catch (err) {
    console.error('Error executing buy order:', err);
    res.status(500).json({ error: 'Server error processing buy order' });
  }
});

app.get("/api/profile", isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, username, email, phone, dob, pan, gender, marital_status, client_code FROM 
      personal_information natural join users WHERE users.user_id = $1 and users.user_id = personal_information.user_id`,
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      username: user.username,
      email: user.email,
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '*$2') : null,
      dob: user.dob,
      pan: user.pan,
      gender: user.gender,
      maritalStatus: user.marital_status,
      clientCode: user.user_id
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// UPDATE user profile
app.put("/api/profile", isAuthenticated, async (req, res) => {
  const { 
    phone, 
    dob, 
    pan, 
    gender, 
    maritalStatus 
  } = req.body;

  try {
    const updateQuery = `
      UPDATE personal_information
      SET 
        phone = COALESCE($1, phone),
        dob = COALESCE($2, dob),
        pan = COALESCE($3, pan),
        gender = COALESCE($4, gender),
        marital_status = COALESCE($5, marital_status)
      WHERE user_id = $6
      RETURNING *;
    `;
    
    const result = await pool.query(updateQuery, [
      phone,
      dob,
      pan,
      gender,
      maritalStatus,
      req.session.userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = result.rows[0];
    res.json({
      message: "Profile updated successfully",
      user: {
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        pan: updatedUser.pan,
        gender: updatedUser.gender,
        maritalStatus: updatedUser.marital_status
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// TODO EVERYTHING FROM HERE

const axios = require('axios');

// Helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

async function simulateBotTrading() {
  try {
    // Fetch all available stock IDs at startup
    const stockResult = await pool.query('SELECT stock_id FROM stocks');
    const stockIds = stockResult.rows.map(row => row.stock_id);

    if (stockIds.length === 0) {
      console.error("No stocks found in database.");
      return;
    }

    // Start infinite trading simulation loop
    while (true) {
      try {
        const userId = randomInt(1, 20);
        // const stockId = stockIds[randomInt(0, stockIds.length - 1)];
        const stockId = 7 // NVIDIA (for testing)

        // Get current price (LTP) for selected stock
        const ltpResult = await pool.query(
          'SELECT current_price FROM stocks WHERE stock_id = $1',
          [stockId]
        );

        if (ltpResult.rows.length === 0) {
          console.warn(`Stock ID ${stockId} not found.`);
          continue;
        }

        const ltp = parseFloat(ltpResult.rows[0].current_price);
        const orderType = Math.random() < 0.5 ? 'buy' : 'sell';
        const quantity = randomInt(1, 2);

        let priceDelta;
        if (orderType === 'sell') {
          priceDelta = randomFloat(-0.005, 0.01); // -0.5% to +1%
        } else {
          priceDelta = randomFloat(-0.01, 0.005); // -1% to +0.5%
        }

        const pricePerShare = parseFloat((ltp * (1 + priceDelta)).toFixed(2));

        // Submit order to your API
        await axios.post('http://localhost:4000/api/orders', {
          userId,
          stockId,
          orderType,
          quantity,
          pricePerShare
        });

        console.log(`[BOT] ${orderType.toUpperCase()} | User ${userId} | Stock ${stockId} | Qty ${quantity} | Price ₹${pricePerShare}`);

      } catch (err) {
        console.error("Bot order error:", err.message);
      }

      await new Promise(res => setTimeout(res, 1000)); // Wait 1 second
    }

  } catch (err) {
    console.error("Error initializing bot trading:", err.message);
  }
}

// Start bot trading simulation on server start
simulateBotTrading();
