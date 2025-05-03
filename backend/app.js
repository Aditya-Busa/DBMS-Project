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
    const result = await pool.query(`
      SELECT stock_id, symbol, company_name, current_price, count
      FROM stocks
      ORDER BY count DESC
      LIMIT 4
    `);
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

app.get("/api/stocks/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT stock_id, symbol, company_name, current_price, count
      FROM stocks
      ORDER BY company_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all stocks:", err);
    res.status(500).json({ message: "Error fetching all stocks" });
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
    if(orderType === 'buy'){
      const balRes = await pool.query(
        "SELECT balance FROM users WHERE user_id = $1",
        [userId]
      );
      const balance = parseFloat(balRes.rows[0]?.balance || 0);
      if (balance < pricePerShare*quantity) return res.status(400).json({ message: "Insufficient funds for Buy" });
    }

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
    
    await pool.query(
      'UPDATE stocks SET current_price = $1, count = count + $3 WHERE stock_id = $2',
      [matchedPrice, stockId, matchedQuantity]
    );
    remainingQuantity -= matchedQuantity;
  }
  
  // Update sell order status if fully/partially matched
  // if (remainingQuantity < askQuantity) {
  //   if (remainingQuantity > 0) {
  //     await pool.query(
  //       'UPDATE orders SET quantity = $1 WHERE order_id = $2',
  //       [remainingQuantity, sellOrderId]
  //     );
  //   } else {
  //     await pool.query(
  //       'UPDATE orders SET status = \'executed\' WHERE order_id = $1',
  //       [sellOrderId]
  //     );
  //   }
  // }
}

async function sendNotification(userId, message) {
  await pool.query(
    `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
    [userId, message]
  );
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

    await pool.query(
      'UPDATE stocks SET current_price = $1, count = count + $3 WHERE stock_id = $2',
      [matchedPrice, stockId, matchedQuantity]
    );
    
    remainingQuantity -= matchedQuantity;
  }

  // Update buy order status if fully/partially matched
  // if (remainingQuantity < bidQuantity) {
  //   if (remainingQuantity > 0) {
  //     await pool.query(
  //       'UPDATE orders SET quantity = $1 WHERE order_id = $2',
  //       [remainingQuantity, buyOrderId]
  //     );
  //   } else {
  //     await pool.query(
  //       'UPDATE orders SET status = \'executed\' WHERE order_id = $1',
  //       [buyOrderId]
  //     );
  //   }
  // }
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
  
  // 2. Update buyer's holdings
  const buyerHoldings = await pool.query(
    'SELECT * FROM holdings WHERE user_id = $1 AND stock_id = $2',
    [buyerId, stockId]
  );

  if (buyerHoldings.rows.length > 0) {
    // Update existing holding
    await pool.query(
      `UPDATE holdings SET 
        quantity = quantity + $1,
        avg_price = CASE 
          WHEN quantity + $1 = 0 THEN 0
          ELSE (CAST(avg_price AS NUMERIC) * quantity + CAST($2 AS NUMERIC) * $1) / (quantity + $1) 
        END
      WHERE user_id = $3 AND stock_id = $4;`,
      [quantity, parseFloat(price), buyerId, stockId]
    );    
  } else {
    // Create new holding
    await pool.query(
      `INSERT INTO holdings 
        (user_id, stock_id, quantity, avg_price)
      VALUES ($1, $2, $3, $4)`,
      [buyerId, stockId, quantity, price]
    );
  }

  // 3. Update seller's holdings
  const sellerHoldings = await pool.query(
    'SELECT * FROM holdings WHERE user_id = $1 AND stock_id = $2',
    [sellerId, stockId]
  );

  if (sellerHoldings.rows.length > 0) {
    // Update existing holding (can go negative for short selling)
    const result = await pool.query(
      `WITH updated AS (
         UPDATE holdings
         SET quantity = quantity - $1
         WHERE user_id = $2 AND stock_id = $3
         RETURNING quantity
       )
       SELECT quantity FROM updated;`,
      [quantity, sellerId, stockId]
    );
    
    // Optional: Check if quantity is 0 and delete the holding
    if (result.rows[0].quantity === 0 ) {
      await pool.query(
        'DELETE FROM holdings WHERE user_id = $1 AND stock_id = $2 AND quantity = 0',
        [sellerId, stockId]
      );
    }
  } else {
    // Create new short position (negative quantity)
    await pool.query(
      `INSERT INTO holdings 
        (user_id, stock_id, quantity, avg_price)
      VALUES ($1, $2, $3, $4)`,
      [sellerId, stockId, -quantity, price]
    );
  }

  await sendNotification(buyerId, `Bought ${quantity} shares of stock ${stockId} at ₹${price}`);
  await sendNotification(sellerId, `Sold ${quantity} shares of stock ${stockId} at ₹${price}`);

  // 4. Update the stock's current price
  // await pool.query(
  //   'UPDATE stocks SET current_price = $1 WHERE stock_id = $2',
  //   [price, stockId]
  // );

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

// 7. Update the balance of the users
  let Total_amount = parseFloat((price * quantity).toFixed(2));
  await pool.query(
    `UPDATE users SET balance = balance - $1 WHERE user_id = $2`,
    [Total_amount, buyerId]
  );
  await pool.query(
    `UPDATE users SET balance = balance + $1 WHERE user_id = $2`,
    [Total_amount, sellerId]
  );
}

// app.post('/api/stocks/buy', async (req, res) => {
//   const { userId, stockId, quantity } = req.body;

//   if (!userId || !stockId || !quantity) {
//     return res.status(400).json({ error: 'Missing parameters' });
//   }

//   try {
//     // Get the best (lowest price) available sell order for this stock
//     const [sellOrder] = await pool.query(
//       `SELECT * FROM orders
//        WHERE stock_id = $1 AND order_type = 'sell' AND status = 'open'
//        ORDER BY price ASC, created_at ASC LIMIT 1`,
//       [stockId]
//     );

//     if (sellOrder.rowCount === 0) {
//       return res.status(404).json({ error: 'No matching sell order found' });
//     }

//     const bestSell = sellOrder.rows[0];

//     // Determine matched quantity (either full or partial match)
//     const matchedQty = Math.min(quantity, bestSell.quantity);

//     // Insert transaction (optional but good for records)
//     await pool.query(
//       `INSERT INTO transactions (buyer_id, seller_id, stock_id, quantity, price, created_at)
//        VALUES ($1, $2, $3, $4, $5, NOW())`,
//       [userId, bestSell.user_id, stockId, matchedQty, bestSell.price]
//     );

//     // Update the stock's current price
//     await pool.query(
//       `UPDATE stocks SET current_price = $1 WHERE id = $2`,
//       [bestSell.price, stockId]
//     );

//     // Reduce quantity or close sell order
//     if (matchedQty === bestSell.quantity) {
//       await pool.query(`UPDATE orders SET status = 'filled' WHERE id = $1`, [bestSell.id]);
//     } else {
//       await pool.query(
//         `UPDATE orders SET quantity = quantity - $1 WHERE id = $2`,
//         [matchedQty, bestSell.id]
//       );
//     }

//     // Record the buy order as filled
//     await pool.query(
//       `INSERT INTO orders (user_id, stock_id, order_type, quantity, price, status, created_at)
//        VALUES ($1, $2, 'buy', $3, $4, 'filled', NOW())`,
//       [userId, stockId, matchedQty, bestSell.price]
//     );

//     res.json({ message: 'Buy order matched', newPrice: bestSell.price });

//   } catch (err) {
//     console.error('Error executing buy order:', err);
//     res.status(500).json({ error: 'Server error processing buy order' });
//   }
// });

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

    // Start trading simulation loop with safety
    while (true) {
      try {
        // 1. Generate random parameters with validation
        const userId = randomInt(1, 20);
        const stockId = stockIds[randomInt(0, stockIds.length - 1)]; // Random stock
        // const stockId = 6; // NVIDIA (for testing)
        
        // 2. Get current price with error handling
        const ltpResult = await pool.query(
          'SELECT current_price FROM stocks WHERE stock_id = $1',
          [stockId]
        );

        if (ltpResult.rows.length === 0) {
          console.warn(`Stock ID ${stockId} not found. Skipping...`);
          await delay(1000);
          continue;
        }

        const ltp = parseFloat(ltpResult.rows[0].current_price);
        if (isNaN(ltp)) {
          console.warn(`Invalid price for stock ${stockId}. Skipping...`);
          await delay(1000);
          continue;
        }

        // 3. Generate order parameters
        const orderType = Math.random() < 0.5 ? 'buy' : 'sell';
        const quantity = randomInt(1, 10); // More realistic quantities
        
        // More realistic price fluctuations (1% -2%)
        const priceDelta = orderType === 'sell' 
          ? randomFloat(-0.01, 0.02) 
          : randomFloat(-0.02, 0.01);
        
        const pricePerShare = parseFloat((ltp * (1 + priceDelta)).toFixed(2));

        // 4. Validate all parameters before submitting
        if (!userId || !stockId || !quantity || !pricePerShare) {
          console.warn("Invalid order parameters generated. Skipping...");
          await delay(1000);
          continue;
        }

        // 5. Submit order with proper error handling
        const response = await axios.post('http://localhost:4000/api/orders', {
          userId,
          stockId,
          orderType,
          quantity,
          pricePerShare
        }, {
          timeout: 500 // 5 second timeout
        });

        console.log(`[BOT] ${orderType.toUpperCase()} | User ${userId} | Stock ${stockId} | Qty ${quantity} | Price ₹${pricePerShare} | Status: ${response.data.message || 'Success'}`);

      } catch (err) {
        console.error("Bot order error:", err.response?.data?.message || err.message);
      }

      // Randomized delay between 0.5-2 seconds to simulate realistic trading
      await delay(randomInt(50, 200));
    }

  } catch (err) {
    console.error("Fatal error in trading simulation:", err);
    process.exit(1); // Exit if we can't recover
  }
}

// Helper functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start bot trading simulation on server start
simulateBotTrading();

app.get("/api/stocks/candlestick/:stockId", async (req, res) => {
  const stockId = req.params.stockId;

  try {
    const result = await pool.query(
      `WITH hourly AS (
         SELECT
           DATE_TRUNC('hour', created_at) AS time,
           MIN(price_per_share) AS low,
           MAX(price_per_share) AS high
         FROM orders
         WHERE stock_id = $1
           AND status = 'executed'
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE_TRUNC('hour', created_at)
       )
       SELECT
         h.time,
         h.low,
         h.high,
         (
           SELECT price_per_share
           FROM orders o2
           WHERE o2.stock_id = $1
             AND o2.status = 'executed'
             AND DATE_TRUNC('hour', o2.created_at) = h.time
           ORDER BY o2.created_at ASC
           LIMIT 1
         ) AS open,
         (
           SELECT price_per_share
           FROM orders o3
           WHERE o3.stock_id = $1
             AND o3.status = 'executed'
             AND DATE_TRUNC('hour', o3.created_at) = h.time
           ORDER BY o3.created_at DESC
           LIMIT 1
         ) AS close
       FROM hourly h
       ORDER BY h.time DESC;`,
      [stockId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
    res.status(500).json({ message: "Failed to fetch candlestick data" });
  }
});


// GET wallet balance
app.get("/api/wallet/balance", isAuthenticated, async (req, res) => {
  const { userId } = req.session;
  const result = await pool.query(
    "SELECT balance FROM users WHERE user_id = $1",
    [userId]
  );
  res.json({ balance: result.rows[0]?.balance || 0 });
});

// GET wallet_transactions
app.get("/api/wallet/transactions", isAuthenticated, async (req, res) => {
  const { userId } = req.session;
  const result = await pool.query(
    `SELECT transaction_id, transaction_type, amount, created_at
     FROM wallet_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  res.json({ transactions: result.rows });
});

// GET transactions
app.get("/api/transactions", isAuthenticated, async (req, res) => {
  const { userId } = req.session;
  const result = await pool.query(
    `
    SELECT
      t.transaction_id,
      CASE
        WHEN o.order_id = t.buy_order_id  THEN 'buy'
        ELSE 'sell'
      END AS transaction_type,
      CASE
        WHEN o.order_id = t.buy_order_id  THEN -(t.quantity * t.price_per_share)
        ELSE  (t.quantity * t.price_per_share)
      END AS amount,
      t.executed_at
    FROM transactions AS t
    JOIN orders       AS o
      ON o.order_id IN (t.buy_order_id, t.sell_order_id)
    WHERE o.user_id = $1
    ORDER BY t.executed_at DESC;
    `,
    [userId]
  );
  res.json({ transactions: result.rows });
});

// POST deposit
app.post("/api/wallet/deposit", isAuthenticated, async (req, res) => {
  const { userId } = req.session;
  const { amount } = req.body;
  await pool.query("BEGIN");
  await pool.query(
    `UPDATE users SET balance = balance + $1 WHERE user_id = $2`,
    [amount, userId]
  );
  await pool.query(
    `INSERT INTO wallet_transactions (user_id, transaction_type, amount) VALUES ($1,'deposit',$2)`,
    [userId, amount]
  );
  await pool.query("COMMIT");
  res.json({ message: "Deposited" });
});

// POST withdraw
app.post("/api/wallet/withdraw", isAuthenticated, async (req, res) => {
  const { userId } = req.session;
  const { amount } = req.body;
  const balRes = await pool.query(
    "SELECT balance FROM users WHERE user_id = $1",
    [userId]
  );
  const balance = parseFloat(balRes.rows[0]?.balance || 0);
  if (balance < amount) return res.status(400).json({ message: "Insufficient funds" });
  await pool.query("BEGIN");
  await pool.query(
    `UPDATE users SET balance = balance - $1 WHERE user_id = $2`,
    [amount, userId]
  );
  await pool.query(
    `INSERT INTO wallet_transactions (user_id, transaction_type, amount) VALUES ($1,'withdraw',$2)`,
    [userId, amount]
  );
  await pool.query("COMMIT");
  res.json({ message: "Withdrawn" });
});

app.get("/api/holdings/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT h.stock_id, h.quantity, h.avg_price,
             s.company_name, s.symbol, s.current_price
      FROM holdings h
      JOIN stocks s ON h.stock_id = s.stock_id
      WHERE h.user_id = $1
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching holdings", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET active orders of a user
app.get("/api/orders/active/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query(
      `SELECT o.order_id, o.stock_id, o.order_type, o.quantity, o.price_per_share, s.company_name, s.symbol
       FROM orders o
       JOIN stocks s ON o.stock_id = s.stock_id
       WHERE o.user_id = $1 AND o.status = 'open'
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching active orders:", err);
    res.status(500).send("Error fetching active orders");
  }
});

// Get latest notifications for logged-in user
app.get("/api/notifications", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const result = await pool.query(`
      SELECT notification_id, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

// Mark a notification as read
app.post("/api/notifications/read", isAuthenticated, async (req, res) => {
  const { notificationId } = req.body;
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, req.session.userId]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Error" });
  }
});

// Get user's order history
app.get("/api/history", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const result = await pool.query(
      `
      SELECT 
        t.transaction_id,
        CASE 
          WHEN o_buyer.user_id = $1 THEN 'buy'
          WHEN o_seller.user_id = $1 THEN 'sell'
        END AS order_type,
        t.quantity,
        t.price_per_share,
        t.executed_at,
        s.symbol AS stock_symbol
      FROM transactions t
      JOIN orders o_buyer ON t.buy_order_id = o_buyer.order_id
      JOIN orders o_seller ON t.sell_order_id = o_seller.order_id
      JOIN stocks s ON t.stock_id = s.stock_id
      WHERE o_buyer.user_id = $1 OR o_seller.user_id = $1
      ORDER BY t.executed_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching order history:", err);
    res.status(500).json({ message: "Error fetching history" });
  }
});

app.delete("/api/notifications/clear", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  
  try {
    await pool.query(
      "DELETE FROM notifications WHERE user_id = $1",
      [userId]
    );
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});


async function checkWatchlistNotifications() {
  const res = await pool.query(`
    SELECT w.user_id, w.stock_id, s.symbol, s.current_price AS current_price,
      sp.price AS old_price
    FROM watchlist w
    JOIN stocks s ON s.stock_id = w.stock_id
    JOIN stock_price_history sp ON sp.stock_id = w.stock_id
  `);

  for (const row of res.rows) {
    const change = ((row.current_price - row.old_price) / row.old_price) * 100;
    if (Math.abs(change) >= 2) {
      const message = `Stock ${row.symbol} has ${change > 0 ? "increased" : "decreased"} by ${change.toFixed(2)}% in the last 20 seconds.`;
      await sendNotification(row.user_id, message);
    }
  }
}

async function checkHoldingNotifications() {
  const res = await pool.query(`
    SELECT p.user_id, p.stock_id, s.symbol, s.current_price AS current_price, p.avg_price
    FROM holdings p
    JOIN stocks s ON s.stock_id = p.stock_id
  `);

  for (const row of res.rows) {
    const drop = ((row.average_price - row.current_price) / row.average_price) * 100;
    if (drop >= 2) {
      const message = `Stock ${row.symbol} in your holdings has dropped by ${drop.toFixed(2)}% from your average price.`;
      await sendNotification(row.user_id, message);
    }
  }
}

async function updateStockPriceHistory() {
  try {
    // Get all stocks with their current prices
    const stocks = await pool.query('SELECT stock_id, current_price FROM stocks');
    
    for (const stock of stocks.rows) {
      // Get or create the price history record for this stock
      let historyResult = await pool.query(
        'SELECT price_history FROM stock_price_history WHERE stock_id = $1',
        [stock.stock_id]
      );

      let history = [];
      if (historyResult.rows.length > 0) {
        // Existing record found - use its history array
        history = historyResult.rows[0].price_history || [];
      } else {
        // No record exists - create a new one
        await pool.query(
          'INSERT INTO stock_price_history (stock_id, price, initial_price) VALUES ($1, $2, $3)',
          [stock.stock_id, stock.current_price, stock.current_price]
        );
      }

      // Add current price to history
      history.push(stock.current_price);

      // Trim to last 50 prices
      if (history.length > 50) {
        history = history.slice(history.length - 50);
      }

      // Update the history in the database
      await pool.query(
        `UPDATE stock_price_history 
         SET price = $1, price_history = $2, timestamp = NOW()
         WHERE stock_id = $3`,
        [stock.current_price, history, stock.stock_id]
      );
    }
  } catch (err) {
    console.error('Error updating price history:', err);
  }
}

async function updatearrayHistory() {
  const stocks = await pool.query(`SELECT stock_id, current_price, price_history FROM stocks`);

  for (const stock of stocks.rows) {
    let history = stock.price_history || [];
    history.push(stock.current_price);

    // Trim to last 50
    if (history.length > 50) {
      history = history.slice(history.length - 50);
    }

    await pool.query(
      `UPDATE stocks SET price_history = $1 WHERE stock_id = $2`,
      [history, stock.stock_id]
    );
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function monitor() {
     while(true){
        await checkWatchlistNotifications();
        await checkHoldingNotifications();
        await updateStockPriceHistory();
          let x = 4;
          while(x > 0){
            updatearrayHistory();
            await sleep(5000);
            x = x-1;
          }
     }
}

// Get price history for a stock
app.get("/api/stocks/price-history/:stockId", async (req, res) => {
  const { stockId } = req.params;
  try {
    const result = await pool.query(
      "SELECT price_history FROM stock_price_history WHERE stock_id = $1",
      [stockId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Stock not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching price history:", err);
    res.status(500).json({ message: "Failed to fetch price history" });
  }
});

monitor();