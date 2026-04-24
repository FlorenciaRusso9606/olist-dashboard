#!/bin/bash
set -e

CSV_DIR="/csvs"
PSQL="psql -U $POSTGRES_USER -d $POSTGRES_DB"

echo "========================================="
echo "Cargando CSV de Olist en raw.*"
echo "========================================="

load() {
    local file="$1"
    local table="$2"
    local path="$CSV_DIR/$file"

    if [ ! -f "$path" ]; then
        echo "$file no encontrado — saltando $table"
        return 0
    fi

    echo -n "  → $table... "
    $PSQL -c "\COPY $table FROM '$path' CSV HEADER ENCODING 'UTF8';"
    COUNT=$($PSQL -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' \n')
    echo " $COUNT filas"
}

load "olist_orders_dataset.csv"              "raw.orders"
load "olist_order_items_dataset.csv"         "raw.order_items"
load "olist_order_payments_dataset.csv"      "raw.order_payments"
load "olist_customers_dataset.csv"           "raw.customers"
load "olist_products_dataset.csv"            "raw.products"
load "olist_sellers_dataset.csv"             "raw.sellers"
load "product_category_name_translation.csv" "raw.product_category_translation"
load "olist_order_reviews_dataset.csv"       "raw.order_reviews"

echo ""
echo "========================================="
echo "Verificando datos antes de correr ETL"
echo "========================================="

ORDER_COUNT=$($PSQL -t -c "SELECT COUNT(*) FROM raw.orders;" | tr -d ' \n')
echo "  raw.orders: $ORDER_COUNT filas"

if [ "$ORDER_COUNT" -gt "0" ]; then
    echo ""
    echo "========================================="
    echo "Corriendo ETL: raw → clean → dwh"
    echo "========================================="
    $PSQL -f /docker-entrypoint-initdb.d/06_etl.sql
    echo ""
    FACT_COUNT=$($PSQL -t -c "SELECT COUNT(*) FROM dwh.fact_sales;" | tr -d ' \n')
    echo " ETL completo — dwh.fact_sales: $FACT_COUNT filas"
else
    echo " raw.orders vacío — ETL no ejecutado"
    echo "  Poné los CSV en database/csvs/ y corré:"
    echo "  docker compose down -v && docker compose up"
fi

echo "========================================="