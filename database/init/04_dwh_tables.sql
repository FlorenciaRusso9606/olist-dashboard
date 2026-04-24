-- ─── dwh ────────────────────────────────────────────

-- ── DIMENSION: date ────────────────────────────────────────────────
-- It allows you to filter and group by year, month, quarter, day of the week without performing calculations in each query
CREATE TABLE IF NOT EXISTS dwh.dim_date (
    date_id      DATE PRIMARY KEY,   -- ex:2018-07-04
    year         INTEGER NOT NULL,
    quarter      INTEGER NOT NULL,   -- 1 to 4
    month        INTEGER NOT NULL,   -- 1 to 12
    month_name   TEXT NOT NULL,      -- 'July'
    week         INTEGER NOT NULL,   -- week of the year(1-53)
    day_of_week  INTEGER NOT NULL,   -- 0=sunday, 6=saturday
    day_name     TEXT NOT NULL,      -- 'Wednesday'
    is_weekend   BOOLEAN NOT NULL
);

-- ── DIMENSION: client ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dwh.dim_customer (
    customer_id              TEXT PRIMARY KEY,
    customer_unique_id       TEXT NOT NULL,
    customer_city            TEXT,
    customer_state           TEXT,
    customer_zip_code_prefix TEXT
);

-- ── DIMENSION: product ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dwh.dim_product (
    product_id                    TEXT PRIMARY KEY,
    product_category_name         TEXT,
    product_category_name_english TEXT,
    product_weight_g              NUMERIC(10, 2),
    product_volume_cm3            NUMERIC(10, 2)   
);

-- ── DIMENSION: order ─────────────────────────────────────────────────
-- Stores order attributes that are not metrics
CREATE TABLE IF NOT EXISTS dwh.dim_order (
    order_id                      TEXT PRIMARY KEY,
    order_status                  TEXT NOT NULL,
    order_purchase_timestamp      TIMESTAMP,
    order_delivered_customer_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP,
    delivery_days                 INTEGER,
    delivery_delay_days           INTEGER,
    review_score                  INTEGER
);

-- ── DIMENSION: seller ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dwh.dim_seller (
    seller_id               TEXT PRIMARY KEY,
    seller_city             TEXT,
    seller_state            TEXT,
    seller_zip_code_prefix  TEXT
);
-- ── FACT_SALES ───────────────────────────────────────────
-- GRAIN: 1 row per order_item (order_id + order_item_id)
-- PURPOSE: enable sales analysis across time, customer, product, seller
-- NOTE: payment_value is prorated from order level (Option A)
CREATE TABLE IF NOT EXISTS dwh.fact_sales (
    order_id              TEXT NOT NULL,
    order_item_id         INTEGER NOT NULL,

    -- Foreign keys to dimensions
    date_id               DATE NOT NULL,
    customer_id           TEXT NOT NULL,
    product_id            TEXT NOT NULL,
    seller_id             TEXT NOT NULL,

    -- Metrics: item level (come directly from order_items CSV)
    item_price            NUMERIC(10, 2) NOT NULL,              
    freight_value         NUMERIC(10, 2) NOT NULL,

    -- Metric: payment allocated to this item (Option A: prorated by price ratio)
    -- Formula: order_total_payment × (item_price / sum_of_all_prices_in_order)
    payment_value_allocated NUMERIC(10, 2) NOT NULL,

    -- Metrics: order-level flags (same value repeated for all items in same order)
    -- is_delivered: order_status = 'delivered'
    is_delivered          BOOLEAN NOT NULL DEFAULT FALSE,
   -- is_canceled: order_status IN ('canceled', 'unavailable')
-- 'unavailable' is included because it represents orders that could not be processed
-- Documented in the README section "Defining KPIs"
    is_canceled           BOOLEAN NOT NULL DEFAULT FALSE,
    -- is_on_time: delivered before or on estimated date (NULL if not delivered)
    is_on_time            BOOLEAN,

    -- Denormalized order context (simplification: dominant payment method)
    order_item_count      INTEGER NOT NULL,
    payment_type          TEXT,
    payment_installments  INTEGER,

    PRIMARY KEY (order_id, order_item_id),

    FOREIGN KEY (date_id)     REFERENCES dwh.dim_date(date_id),
    FOREIGN KEY (customer_id) REFERENCES dwh.dim_customer(customer_id),
    FOREIGN KEY (product_id)  REFERENCES dwh.dim_product(product_id),
    FOREIGN KEY (order_id)    REFERENCES dwh.dim_order(order_id),
    FOREIGN KEY (seller_id)   REFERENCES dwh.dim_seller(seller_id)
);

-- Indexes 
CREATE INDEX IF NOT EXISTS idx_fact_sales_date     ON dwh.fact_sales(date_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_customer ON dwh.fact_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_product  ON dwh.fact_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_seller   ON dwh.fact_sales(seller_id);