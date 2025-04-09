-- Table for Users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Stocks
CREATE TABLE Stocks (
    stock_id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    current_price NUMERIC(10,2) NOT NULL,
    market VARCHAR(50) NOT NULL
);

-- Table for Orders
CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    stock_id INT NOT NULL,
    order_type VARCHAR(4) CHECK (order_type IN ('buy', 'sell')) NOT NULL,
    quantity INT NOT NULL,
    price_per_share NUMERIC(10,2) NOT NULL,
    status VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'executed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (stock_id) REFERENCES Stocks(stock_id)
);

-- Table for Holdings
CREATE TABLE Holdings (
    holding_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    stock_id INT NOT NULL,
    quantity INT NOT NULL,
    avg_price NUMERIC(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (stock_id) REFERENCES Stocks(stock_id),
    UNIQUE(user_id, stock_id)
);

-- Table for Transactions
CREATE TABLE Transactions (
    transaction_id SERIAL PRIMARY KEY,
    buy_order_id INT,
    sell_order_id INT,
    stock_id INT NOT NULL,
    quantity INT NOT NULL,
    price_per_share NUMERIC(10,2) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buy_order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (sell_order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (stock_id) REFERENCES Stocks(stock_id)
);