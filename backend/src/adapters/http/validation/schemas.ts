import { z } from 'zod';

// Base schema shared by all endpoints with dates
const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato requerido: YYYY-MM-DD'),
  to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato requerido: YYYY-MM-DD'),
  // Optional filters
  customerState:   z.string().length(2).toUpperCase().optional(),
  productCategory: z.string().min(1).optional(),
  orderStatus:     z.string().min(1).optional(),
});

export const kpiQuerySchema = dateRangeSchema;

export const trendQuerySchema = dateRangeSchema.extend({
  grain: z.enum(['day', 'week']).default('day'),
});

export const rankingsQuerySchema = dateRangeSchema.extend({
  metric: z.enum(['gmv', 'revenue']).default('revenue'),
  limit:  z.coerce.number().int().min(1).max(50).default(10),
});

// Function helper: parses query parameters and returns the typed object
export function parseQuery<T>(schema: z.ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError(messages.join(', '));
  }
  return result.data;
}

// Error (HTTP 400)
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Convert query params strings to SalesFilters objects
export function toSalesFilters(parsed: {
  from: string;
  to: string;
  customerState?: string;
  productCategory?: string;
  orderStatus?: string;
}) {
  return {
    from: new Date(parsed.from),
    to:   new Date(parsed.to),
    customerState:   parsed.customerState,
    productCategory: parsed.productCategory,
    orderStatus:     parsed.orderStatus,
  };
}