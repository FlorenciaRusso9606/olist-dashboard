import { Prisma } from '@prisma/client';
import prisma from '../db/prismaClient';
import { SalesRepository } from '../../domain/ports/SalesRepository';
import { KpiResult } from '../../domain/entities/KpiResult';
import { ProductRanking } from '../../domain/entities/ProductRanking';
import { RevenueTrend, TrendGrain, RevenueTrendPoint } from '../../domain/entities/RevenueTrend';
import { SalesFilters } from '../../domain/filters/SalesFilters';


type KpiRow = {
  gmv: string;
  revenue: string;
  total_orders: string;
  total_items: string;
  canceled_orders: string;
  delivered_orders: string;
  on_time_orders: string;
  total_freight: string;
};

type TrendRow = {
  period: string;
  revenue: string;
  orders: string;
  gmv: string;
};

type TopProductRow = {
  product_id: string;
  product_category_name: string | null;
  product_category_name_english: string | null;
  gmv: string;
  revenue: string;
  items_sold: string;
};


export class PrismaSalesRepository implements SalesRepository {

  private baseFrom = Prisma.sql`
    FROM dwh.fact_sales f
    JOIN dwh.dim_customer c ON f.customer_id = c.customer_id
    JOIN dwh.dim_product  p ON f.product_id  = p.product_id
    JOIN dwh.dim_order    o ON f.order_id    = o.order_id
  `;

  private buildWhereClause(filters: SalesFilters): Prisma.Sql {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`f.date_id >= ${filters.from}`,
      Prisma.sql`f.date_id <= ${filters.to}`,
    ];

    if (filters.customerState) {
      conditions.push(Prisma.sql`c.customer_state = ${filters.customerState}`);
    }

    if (filters.productCategory) {
      conditions.push(
        Prisma.sql`p.product_category_name_english = ${filters.productCategory}`
      );
    }

    if (filters.orderStatus) {
      conditions.push(Prisma.sql`o.order_status = ${filters.orderStatus}`);
    }

    return Prisma.join(conditions, ' AND ');
  }

  async getKpis(filters: SalesFilters): Promise<KpiResult> {
    const where = this.buildWhereClause(filters);

    const result = await prisma.$queryRaw<KpiRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(f.item_price), 0)                                          AS gmv,
        COALESCE(SUM(f.payment_value_allocated), 0)                             AS revenue,
        COUNT(DISTINCT f.order_id)                                              AS total_orders,
        COUNT(f.order_item_id)                                                  AS total_items,
        COUNT(DISTINCT CASE WHEN f.is_canceled = true THEN f.order_id END)      AS canceled_orders,
        COUNT(DISTINCT CASE WHEN f.is_delivered = true THEN f.order_id END)     AS delivered_orders,
        COUNT(DISTINCT CASE WHEN f.is_on_time = true THEN f.order_id END)       AS on_time_orders,
        COALESCE(SUM(f.freight_value), 0)                                       AS total_freight
      ${this.baseFrom}
      WHERE ${where}
    `);

    const row = result[0];
    if (!row) {
      throw new Error('KPI_QUERY_EMPTY');
    }

    const orders = Number(row.total_orders);
    const revenue = Number(row.revenue);
    const items = Number(row.total_items);
    const deliveredOrders = Number(row.delivered_orders);
    const onTimeOrders = Number(row.on_time_orders);
    const canceledOrders = Number(row.canceled_orders);

    return {
      gmv: Number(row.gmv),
      revenue,
      orders,
      aov: orders > 0 ? revenue / orders : 0,
      itemsPerOrder: orders > 0 ? items / orders : 0,
      cancellationRate: orders > 0 ? canceledOrders / orders : 0,
      onTimeDeliveryRate: deliveredOrders > 0 ? onTimeOrders / deliveredOrders : 0,
      totalFreight: Number(row.total_freight),
    };
  }

  async getRevenueTrend(
    filters: SalesFilters,
    grain: TrendGrain
  ): Promise<RevenueTrend> {
    const where = this.buildWhereClause(filters);

    const periodExpr =
      grain === 'day'
        ? Prisma.sql`f.date_id::TEXT`
        : Prisma.sql`TO_CHAR(DATE_TRUNC('week', f.date_id), 'IYYY-"W"IW')`;

    const rows = await prisma.$queryRaw<TrendRow[]>(Prisma.sql`
      SELECT
        ${periodExpr}                                AS period,
        COALESCE(SUM(f.payment_value_allocated), 0) AS revenue,
        COUNT(DISTINCT f.order_id)                  AS orders,
        COALESCE(SUM(f.item_price), 0)              AS gmv
      ${this.baseFrom}
      WHERE ${where}
      GROUP BY ${periodExpr}
      ORDER BY period ASC
    `);

    const data: RevenueTrendPoint[] = rows.map((row) => ({
      period: row.period,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
      gmv: Number(row.gmv),
    }));

    return { grain, data };
  }

  async getTopProducts(
    filters: SalesFilters,
    metric: 'gmv' | 'revenue',
    limit: number
  ): Promise<ProductRanking[]> {
    const where = this.buildWhereClause(filters);

    const orderCol =
      metric === 'gmv'
        ? Prisma.sql`SUM(f.item_price)`
        : Prisma.sql`SUM(f.payment_value_allocated)`;

    const rows = await prisma.$queryRaw<TopProductRow[]>(Prisma.sql`
      SELECT
        f.product_id,
        p.product_category_name,
        p.product_category_name_english,
        COALESCE(SUM(f.item_price), 0)              AS gmv,
        COALESCE(SUM(f.payment_value_allocated), 0) AS revenue,
        COUNT(f.order_item_id)                      AS items_sold
      ${this.baseFrom}
      WHERE ${where}
      GROUP BY f.product_id, p.product_category_name, p.product_category_name_english
      ORDER BY ${orderCol} DESC
      LIMIT ${limit}
    `);

    return rows.map((row, index) => ({
      productId: row.product_id,
      productCategoryName: row.product_category_name,
      productCategoryNameEnglish: row.product_category_name_english,
      gmv: Number(row.gmv),
      revenue: Number(row.revenue),
      itemsSold: Number(row.items_sold),
      rank: index + 1,
    }));
  }
}