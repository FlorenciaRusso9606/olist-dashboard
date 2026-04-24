import { Request, Response, NextFunction } from 'express';
import { GetKpis } from '../../../application/usecases/GetKpis';
import { kpiQuerySchema, parseQuery, toSalesFilters } from '../validation/schemas';

export class KpiController {
  constructor(private readonly getKpis: GetKpis) {}

   handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseQuery(kpiQuerySchema, req.query);
      const filters = toSalesFilters(parsed);
      const result = await this.getKpis.execute(filters);

      res.status(200).json({
        success: true,
        data: {
          ...result,
          cancellationRatePct:    Number((result.cancellationRate * 100).toFixed(2)),
          onTimeDeliveryRatePct:  Number((result.onTimeDeliveryRate * 100).toFixed(2)),
        },
        filters: {
          from: parsed.from,
          to:   parsed.to,
        },
      });
    } catch (err) {
      next(err); 
    }
  };
}