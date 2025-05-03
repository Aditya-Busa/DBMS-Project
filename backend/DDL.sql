-- Drop in reverse dependency order
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS personal_information;
DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS holdings;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS stocks;
DROP TABLE IF EXISTS users;

-- Table for Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    balance NUMERIC(10,2) DEFAULT 0.00
);

-- Table for Stocks
CREATE TABLE stocks (
    stock_id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    current_price NUMERIC(10,2) NOT NULL,
    market VARCHAR(50) NOT NULL,
    count INT DEFAULT 0
);

-- Table for Orders
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    stock_id INT NOT NULL,
    order_type VARCHAR(4) CHECK (order_type IN ('buy', 'sell')) NOT NULL,
    quantity INT NOT NULL,
    price_per_share NUMERIC(10,2) NOT NULL,
    status VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'executed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id)
);

-- Table for Holdings
CREATE TABLE holdings (
    holding_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    stock_id INT NOT NULL,
    quantity INT NOT NULL,
    avg_price NUMERIC(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id),
    UNIQUE(user_id, stock_id)
);

-- Table for Transactions
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    buy_order_id INT,
    sell_order_id INT,
    stock_id INT NOT NULL,
    quantity INT NOT NULL,
    price_per_share NUMERIC(10,2) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buy_order_id) REFERENCES orders(order_id),
    FOREIGN KEY (sell_order_id) REFERENCES orders(order_id),
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id)
);

-- Watchlist
CREATE TABLE watchlist (
  watchlist_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  stock_id INT NOT NULL,
  UNIQUE (user_id, stock_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (stock_id) REFERENCES stocks(stock_id)
);

-- Personal Info
CREATE TABLE personal_information (
    info_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    pan VARCHAR(12),
    dob DATE,
    gender VARCHAR(10),
    phone VARCHAR(10),
    marital_status VARCHAR(20),
    client_code VARCHAR(20) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Wallet Transactions
CREATE TABLE wallet_transactions (
  transaction_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_price_history (
  id SERIAL PRIMARY KEY,
  stock_id INT REFERENCES stocks(stock_id),
  price NUMERIC NOT NULL,
  initial_price NUMERIC,
  price_history NUMERIC[],
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_stock_id UNIQUE (stock_id)
);

