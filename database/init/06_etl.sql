SET work_mem = '256MB';
SET maintenance_work_mem = '256MB';

INSERT INTO clean.customers
SELECT DISTINCT ON (customer_id)
    customer_id,
    customer_unique_id,
    customer_zip_code_prefix,
    LOWER(TRIM(customer_city))  AS customer_city,
    UPPER(TRIM(customer_state)) AS customer_state
FROM raw.customers
WHERE customer_id IS NOT NULL AND customer_id <> ''
ORDER BY customer_id
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO clean.products
SELECT DISTINCT ON (p.product_id)
    p.product_id,
    p.product_category_name,
    t.product_category_name_english,
    NULLIF(p.product_weight_g, '')::NUMERIC      AS product_weight_g,
    NULLIF(p.product_length_cm, '')::NUMERIC     AS product_length_cm,
    NULLIF(p.product_height_cm, '')::NUMERIC     AS product_height_cm,
    NULLIF(p.product_width_cm, '')::NUMERIC      AS product_width_cm,
    NULLIF(p.product_photos_qty, '')::INTEGER    AS product_photos_qty
FROM raw.products p
LEFT JOIN raw.product_category_translation t
    ON p.product_category_name = t.product_category_name
WHERE p.product_id IS NOT NULL AND p.product_id <> ''
ORDER BY p.product_id
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO clean.sellers
SELECT DISTINCT ON (seller_id)
    seller_id, seller_zip_code_prefix,
LOWER(TRIM(seller_city))  AS seller_city,
UPPER(TRIM(seller_state)) AS seller_state
FROM raw.sellers
WHERE seller_id IS NOT NULL AND seller_id <> ''
ORDER BY seller_id
ON CONFLICT (seller_id) DO NOTHING;

INSERT INTO clean.orders
SELECT DISTINCT ON (order_id)
    order_id, customer_id, order_status,
    NULLIF(order_purchase_timestamp, '')::TIMESTAMP        AS order_purchase_timestamp,
    NULLIF(order_approved_at, '')::TIMESTAMP               AS order_approved_at,
    NULLIF(order_delivered_carrier_date, '')::TIMESTAMP    AS order_delivered_carrier_date,
    NULLIF(order_delivered_customer_date, '')::TIMESTAMP   AS order_delivered_customer_date,
    NULLIF(order_estimated_delivery_date, '')::TIMESTAMP   AS order_estimated_delivery_date
FROM raw.orders
WHERE order_id IS NOT NULL AND order_id <> ''
  AND customer_id IS NOT NULL AND customer_id <> ''
  ORDER BY order_id
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO clean.order_items
SELECT DISTINCT ON (order_id, order_item_id::INTEGER)
    order_id, order_item_id::INTEGER        AS order_item_id, product_id, seller_id,
    NULLIF(shipping_limit_date, '')::TIMESTAMP,
   NULLIF(price, '')::NUMERIC    AS price,
    NULLIF(freight_value, '')::NUMERIC AS freight_value
FROM raw.order_items
WHERE order_id IS NOT NULL AND order_id <> ''
  AND order_item_id IS NOT NULL
  AND price IS NOT NULL AND price <> ''
  AND freight_value IS NOT NULL AND freight_value <> ''
  ORDER BY order_id, order_item_id::INTEGER
ON CONFLICT (order_id, order_item_id) DO NOTHING;

INSERT INTO clean.order_payments
SELECT DISTINCT ON (order_id, payment_sequential::INTEGER)
    order_id, payment_sequential::INTEGER, payment_type,
    COALESCE(NULLIF(payment_installments, '')::INTEGER, 1),
    NULLIF(payment_value, '')::NUMERIC
FROM raw.order_payments
WHERE order_id IS NOT NULL AND order_id <> ''
  AND payment_value IS NOT NULL AND payment_value <> ''
  ORDER BY order_id, payment_sequential::INTEGER
ON CONFLICT (order_id, payment_sequential) DO NOTHING;

INSERT INTO clean.order_reviews
SELECT DISTINCT ON (review_id)
    review_id, order_id,
    NULLIF(review_score, '')::INTEGER,
    NULLIF(review_creation_date, '')::TIMESTAMP,
    NULLIF(review_answer_timestamp, '')::TIMESTAMP
FROM raw.order_reviews
WHERE review_id IS NOT NULL AND review_id <> ''
  AND order_id IS NOT NULL AND order_id <> ''
  ORDER BY review_id
ON CONFLICT (review_id) DO NOTHING;


-- dim_date
INSERT INTO dwh.dim_date
SELECT DISTINCT
    purchase_date                                     AS date_id,
    EXTRACT(YEAR FROM purchase_date)::INTEGER         AS year,
    EXTRACT(QUARTER FROM purchase_date)::INTEGER      AS quarter,
    EXTRACT(MONTH FROM purchase_date)::INTEGER        AS month,
    TRIM(TO_CHAR(purchase_date, 'Month'))        AS month_name,
    EXTRACT(WEEK FROM purchase_date)::INTEGER         AS week,
    EXTRACT(DOW FROM purchase_date)::INTEGER          AS day_of_week,
   TRIM(TO_CHAR(purchase_date, 'Day')) AS day_name,
    (EXTRACT(DOW FROM purchase_date) IN (0,6))        AS is_weekend
FROM (
    SELECT order_purchase_timestamp::DATE AS purchase_date
    FROM clean.orders
    WHERE order_purchase_timestamp IS NOT NULL
) dates
ON CONFLICT (date_id) DO NOTHING;

-- dim_customer
INSERT INTO dwh.dim_customer
SELECT customer_id, customer_unique_id, customer_city,
       customer_state, customer_zip_code_prefix
FROM clean.customers
ON CONFLICT (customer_id) DO NOTHING;

-- dim_product
INSERT INTO dwh.dim_product
SELECT
    product_id,
    product_category_name,
    product_category_name_english,
    product_weight_g,
    CASE
        WHEN product_length_cm IS NOT NULL
         AND product_height_cm IS NOT NULL
         AND product_width_cm  IS NOT NULL
        THEN product_length_cm * product_height_cm * product_width_cm
        ELSE NULL
    END AS product_volume_cm3
FROM clean.products
ON CONFLICT (product_id) DO NOTHING;

-- dim_seller
INSERT INTO dwh.dim_seller
SELECT seller_id, seller_city, seller_state, seller_zip_code_prefix
FROM clean.sellers
ON CONFLICT (seller_id) DO NOTHING;

-- dim_order
INSERT INTO dwh.dim_order (
    order_id,
    order_status,
    order_purchase_timestamp,
    order_delivered_customer_date,
    order_estimated_delivery_date,
    delivery_days,
    delivery_delay_days,
    review_score
)
SELECT
    o.order_id,
    o.order_status,
    o.order_purchase_timestamp,
    o.order_delivered_customer_date,
    o.order_estimated_delivery_date,
    CASE
        WHEN o.order_delivered_customer_date IS NOT NULL
        THEN EXTRACT(DAY FROM (
            o.order_delivered_customer_date - o.order_purchase_timestamp
        ))::INTEGER
        ELSE NULL
    END AS delivery_days,

    CASE
        WHEN o.order_delivered_customer_date IS NOT NULL
         AND o.order_estimated_delivery_date IS NOT NULL
        THEN EXTRACT(DAY FROM (
            o.order_delivered_customer_date - o.order_estimated_delivery_date
        ))::INTEGER
        ELSE NULL
    END AS delivery_delay_days,
    r.review_score AS review_score
FROM clean.orders o
LEFT JOIN clean.order_reviews r ON o.order_id = r.order_id
ON CONFLICT (order_id) DO NOTHING;

-- fact_sales
INSERT INTO dwh.fact_sales
WITH order_totals AS (
    SELECT
        oi.order_id,
        SUM(oi.price)         AS sum_prices,
        SUM(op.payment_value) AS total_payment
    FROM clean.order_items oi
    JOIN clean.order_payments op ON oi.order_id = op.order_id
    GROUP BY oi.order_id
),
dominant_payment AS (
    SELECT DISTINCT ON (order_id)
        order_id, payment_type, payment_installments
    FROM clean.order_payments
    ORDER BY order_id, payment_value DESC
),
item_count AS (
    SELECT order_id, COUNT(*) AS total_items
    FROM clean.order_items
    GROUP BY order_id
)
SELECT
    oi.order_id,
    oi.order_item_id,
    o.order_purchase_timestamp::DATE          AS date_id,
    o.customer_id,
    oi.product_id,
    oi.seller_id,
    oi.price          AS item_price,
    oi.freight_value,
    CASE
        WHEN ot.sum_prices > 0
        THEN ROUND(ot.total_payment * (oi.price / ot.sum_prices), 2)
        ELSE 0
    END                                       AS payment_value_allocated,
    (o.order_status = 'delivered')            AS is_delivered,
    -- is_canceled: includes 'canceled' and 'unavailable' (see README)
    (o.order_status IN ('canceled', 'unavailable')) AS is_canceled,
    CASE
        WHEN o.order_delivered_customer_date IS NOT NULL
         AND o.order_estimated_delivery_date IS NOT NULL
        THEN o.order_delivered_customer_date <= o.order_estimated_delivery_date
        ELSE NULL
    END                                       AS is_on_time,
    ic.total_items::INTEGER                   AS order_item_count,
    dp.payment_type,
    dp.payment_installments
FROM clean.order_items oi
JOIN clean.orders o
    ON oi.order_id = o.order_id
    AND o.order_purchase_timestamp IS NOT NULL
JOIN order_totals ot
    ON oi.order_id = ot.order_id
    AND ot.sum_prices > 0
JOIN item_count ic
    ON oi.order_id = ic.order_id
LEFT JOIN dominant_payment dp
    ON oi.order_id = dp.order_id
WHERE EXISTS (SELECT 1 FROM dwh.dim_product  WHERE product_id  = oi.product_id)
  AND EXISTS (SELECT 1 FROM dwh.dim_customer WHERE customer_id = o.customer_id)
ON CONFLICT (order_id, order_item_id) DO NOTHING;