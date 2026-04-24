-- ─── CLEAN ─────────────────────────────

CREATE TABLE IF NOT EXISTS clean.orders (
    order_id                          TEXT PRIMARY KEY,
    customer_id                       TEXT NOT NULL,
    order_status                      TEXT NOT NULL,
    order_purchase_timestamp          TIMESTAMP,
    order_approved_at                 TIMESTAMP,
    order_delivered_carrier_date      TIMESTAMP,
    order_delivered_customer_date     TIMESTAMP,
    order_estimated_delivery_date     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clean.order_items (
    order_id             TEXT NOT NULL,
    order_item_id        INTEGER NOT NULL,
    product_id           TEXT NOT NULL,
    seller_id            TEXT NOT NULL,
    shipping_limit_date  TIMESTAMP,
    price                NUMERIC(10, 2) NOT NULL,
    freight_value        NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (order_id, order_item_id)
);

CREATE TABLE IF NOT EXISTS clean.order_payments (
    order_id             TEXT NOT NULL,
    payment_sequential   INTEGER NOT NULL,
    payment_type         TEXT NOT NULL,
    payment_installments INTEGER NOT NULL DEFAULT 1,
    payment_value        NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (order_id, payment_sequential)
);

CREATE TABLE IF NOT EXISTS clean.customers (
    customer_id               TEXT PRIMARY KEY,
    customer_unique_id        TEXT NOT NULL,
    customer_zip_code_prefix  TEXT,
    customer_city             TEXT,
    customer_state            TEXT
);

CREATE TABLE IF NOT EXISTS clean.products (
    product_id                    TEXT PRIMARY KEY,
    product_category_name         TEXT,
    product_category_name_english TEXT,      
    product_weight_g              NUMERIC(10, 2),
    product_length_cm             NUMERIC(10, 2),
    product_height_cm             NUMERIC(10, 2),
    product_width_cm              NUMERIC(10, 2),
    product_photos_qty            INTEGER
);

CREATE TABLE IF NOT EXISTS clean.sellers (
    seller_id                TEXT PRIMARY KEY,
    seller_zip_code_prefix   TEXT,
    seller_city              TEXT,
    seller_state             TEXT
);

CREATE TABLE IF NOT EXISTS clean.order_reviews (
    review_id     TEXT PRIMARY KEY,
    order_id      TEXT NOT NULL,
    review_score  INTEGER CHECK (review_score BETWEEN 1 AND 5),
    review_creation_date    TIMESTAMP,
    review_answer_timestamp TIMESTAMP
);