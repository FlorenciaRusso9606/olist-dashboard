import { Request, Response, NextFunction } from 'express';
import { GetRevenueTrend } from '../../../application/usecases/GetRevenueTrend';
import { trendQuerySchema, parseQuery, toSalesFilters } from '../validation/schemas';

export class TrendController {
  constructor(private readonly getRevenueTrend: GetRevenueTrend) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseQuery(trendQuerySchema, req.query);
      const filters = toSalesFilters(parsed);
     const result = await this.getRevenueTrend.execute(filters, parsed.grain ?? 'day');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}