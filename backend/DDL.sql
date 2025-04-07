-- =============================================
-- Stock Market Application - Complete Database Schema (with DROP commands)
-- =============================================

-- ==================== DROP ENUM TYPES ====================
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS transaction_direction CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- ==================== ENUM TYPES ====================
CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop');
CREATE TYPE order_status AS ENUM ('pending', 'filled', 'cancelled', 'expired');
CREATE TYPE transaction_direction AS ENUM ('buy', 'sell');
CREATE TYPE notification_type AS ENUM (
    'order_filled',
    'price_alert',
    'system',
    'dividend',
    'news',
    'account'
);

-- ==================== DROP TABLES ====================
DROP TABLE IF EXISTS portfolio_summary;
DROP TABLE IF EXISTS user_activity;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS event_log;
DROP TABLE IF EXISTS migrations;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS price_alerts;
DROP TABLE IF EXISTS watchlist_items;
DROP TABLE IF EXISTS watchlists;
DROP TABLE IF EXISTS cash_transactions;
DROP TABLE IF EXISTS user_balances;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS user_holdings;
DROP TABLE IF EXISTS stock_prices;
DROP TABLE IF EXISTS stocks;
DROP TABLE IF EXISTS users;

-- ============== CORE TABLES ==============

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE stocks (
    stock_id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    current_price DECIMAL(15,4) NOT NULL,
    price_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sector VARCHAR(100),
    industry VARCHAR(100),
    exchange VARCHAR(50),
    ipo_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    website VARCHAR(255)
);

-- ============== MARKET DATA ==============

CREATE TABLE stock_prices (
    price_id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER NOT NULL REFERENCES stocks(stock_id),
    price DECIMAL(15,4) NOT NULL,
    volume BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    open_price DECIMAL(15,4),
    high_price DECIMAL(15,4),
    low_price DECIMAL(15,4),
    close_price DECIMAL(15,4),
    CONSTRAINT valid_price CHECK (price > 0)
);

-- ============== USER HOLDINGS ==============

CREATE TABLE user_holdings (
    holding_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    stock_id INTEGER NOT NULL REFERENCES stocks(stock_id),
    total_shares DECIMAL(15,4) NOT NULL DEFAULT 0,
    total_investment DECIMAL(15,4) NOT NULL DEFAULT 0,
    average_cost_basis DECIMAL(15,4) GENERATED ALWAYS AS (
        CASE WHEN total_shares = 0 THEN 0 
        ELSE total_investment / total_shares 
        END
    ) STORED,
    current_value DECIMAL(15,4) GENERATED ALWAYS AS (
        total_shares * (SELECT current_price FROM stocks WHERE stock_id = user_holdings.stock_id)
    ) STORED,
    unrealized_pnl DECIMAL(15,4) GENERATED ALWAYS AS (
        current_value - total_investment
    ) STORED,
    unrealized_pnl_percent DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN total_investment = 0 THEN 0 
        ELSE (current_value - total_investment) / total_investment * 100 
        END
    ) STORED,
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    UNIQUE (user_id, stock_id)
);

-- ============== TRANSACTION SYSTEM ==============

CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    stock_id INTEGER NOT NULL REFERENCES stocks(stock_id),
    direction transaction_direction NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    price_per_share DECIMAL(15,4) NOT NULL,
    commission DECIMAL(15,4) DEFAULT 0,
    total_amount DECIMAL(15,4) GENERATED ALWAYS AS (
        quantity * price_per_share + commission
    ) STORED,
    transaction_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_price CHECK (price_per_share > 0)
);

CREATE TABLE orders (
    order_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    stock_id INTEGER NOT NULL REFERENCES stocks(stock_id),
    type order_type NOT NULL,
    status order_status DEFAULT 'pending',
    direction transaction_direction NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    limit_price DECIMAL(15,4),
    stop_price DECIMAL(15,4),
    time_in_force VARCHAR(10) DEFAULT 'GTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    filled_quantity DECIMAL(15,4) DEFAULT 0,
    average_fill_price DECIMAL(15,4),
    transaction_id BIGINT REFERENCES transactions(transaction_id),
    CONSTRAINT valid_order_quantity CHECK (quantity > 0),
    CONSTRAINT valid_limit_price CHECK (
        (type = 'limit' AND limit_price IS NOT NULL) OR 
        (type IN ('market', 'stop') AND limit_price IS NULL)
    )
);

-- ============== ACCOUNT SYSTEM ==============

CREATE TABLE user_balances (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
    cash_balance DECIMAL(15,4) NOT NULL DEFAULT 0,
    buying_power DECIMAL(15,4) GENERATED ALWAYS AS (cash_balance * 1) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    amount DECIMAL(15,4) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (
        transaction_type IN ('deposit', 'withdrawal', 'dividend', 'interest', 'transfer')
    ),
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed',
    reference_id VARCHAR(100)
);

-- ============== WATCHLISTS & ALERTS ==============

CREATE TABLE watchlists (
    watchlist_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_default BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE
);

CREATE TABLE watchlist_items (
    watchlist_id INTEGER NOT NULL REFERENCES watchlists(watchlist_id),
    stock_id INTEGER NOT NULL REFERENCES stocks(stock_id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (watchlist_id, stock_id)
);

CREATE TABLE price_alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    stock_id INTEGER NOT NULL REFERENCES stocks(stock_id),
    target_price DECIMAL(15,4) NOT NULL,
    direction VARCHAR(5) CHECK (direction IN ('above', 'below')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_target_price CHECK (target_price > 0)
);

-- ============== NOTIFICATION SYSTEM ==============

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    priority SMALLINT DEFAULT 3
);

-- ============== PERFORMANCE INDEXES ==============

CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_sector ON stocks(sector);
CREATE INDEX idx_stocks_industry ON stocks(industry);
CREATE INDEX idx_stock_prices_stock_id ON stock_prices(stock_id);
CREATE INDEX idx_stock_prices_timestamp ON stock_prices(timestamp);
CREATE INDEX idx_user_holdings_user ON user_holdings(user_id);
CREATE INDEX idx_user_holdings_stock ON user_holdings(stock_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_stock ON transactions(stock_id);
CREATE INDEX idx_transactions_time ON transactions(transaction_time);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stock ON orders(stock_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(user_id) WHERE is_active = TRUE;

-- ============== AUDIT & SYSTEM TABLES ==============

CREATE TABLE migrations (
    migration_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_log (
    event_id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(user_id),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    notification_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============== VIEWS ==============

CREATE VIEW portfolio_summary AS
SELECT 
    u.user_id,
    COUNT(uh.stock_id) AS total_holdings,
    SUM(uh.current_value) AS portfolio_value,
    SUM(uh.unrealized_pnl) AS total_pnl,
    ub.cash_balance,
    (SUM(uh.current_value) + ub.cash_balance) AS net_worth
FROM 
    users u
LEFT JOIN 
    user_holdings uh ON u.user_id = uh.user_id
LEFT JOIN 
    user_balances ub ON u.user_id = ub.user_id
GROUP BY 
    u.user_id, ub.cash_balance;

CREATE VIEW user_activity AS
SELECT 
    user_id,
    'transaction' AS activity_type,
    transaction_time AS activity_time,
    CONCAT(direction, ' ', quantity, ' shares of ', 
          (SELECT symbol FROM stocks WHERE stock_id = t.stock_id)) AS description
FROM 
    transactions t
UNION ALL
SELECT 
    user_id,
    'order' AS activity_type,
    created_at AS activity_time,
    CONCAT(direction, ' ', quantity, ' shares of ', 
          (SELECT symbol FROM stocks WHERE stock_id = o.stock_id), ' (', status, ')') AS description
FROM 
    orders o
ORDER BY 
    activity_time DESC;
