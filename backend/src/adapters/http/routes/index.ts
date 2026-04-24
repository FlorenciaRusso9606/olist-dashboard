import { Router } from 'express';
import { SalesRepository } from '../../../domain/ports/SalesRepository';
import { GetKpis } from '../../../application/usecases/GetKpis';
import { GetRevenueTrend } from '../../../application/usecases/GetRevenueTrend';
import { GetTopProducts } from '../../../application/usecases/GetTopProducts';
import { KpiController } from '../controllers/kpiController';
import { TrendController } from '../controllers/trendController';
import { RankingsController } from '../controllers/rankingsController';

export function createRouter(salesRepo: SalesRepository): Router {
  const router = Router();

  const kpiController      = new KpiController(new GetKpis(salesRepo));
  const trendController    = new TrendController(new GetRevenueTrend(salesRepo));
  const rankingsController = new RankingsController(new GetTopProducts(salesRepo));

  router.get('/kpis',              kpiController.handle);
  router.get('/trend/revenue',     trendController.handle);
  router.get('/rankings/products', rankingsController.handle);

  return router;
}