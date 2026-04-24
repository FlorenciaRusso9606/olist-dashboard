import { Request, Response, NextFunction } from 'express';
import { GetTopProducts } from '../../../application/usecases/GetTopProducts';
import { rankingsQuerySchema, parseQuery, toSalesFilters } from '../validation/schemas';

export class RankingsController {
  constructor(private readonly getTopProducts: GetTopProducts) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseQuery(rankingsQuerySchema, req.query);
      const filters = toSalesFilters(parsed);
      const result = await this.getTopProducts.execute(filters,  parsed.metric ?? 'revenue', parsed.limit ?? 10);

      res.status(200).json({
        success: true,
        data: result,
      meta: {
    metric: parsed.metric ?? 'revenue',
    limit:  parsed.limit ?? 10,
    count:  result.length,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}