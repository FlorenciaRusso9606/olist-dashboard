import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { createRouter } from './adapters/http/routes/index';
import { errorHandler } from './adapters/http/middleware/errorHandler';
import { PrismaSalesRepository } from './infrastructure/repositories/PrismaSalesRepository';
import { SalesRepository } from './domain/ports/SalesRepository';

dotenv.config();

export function createApp(salesRepo: SalesRepository = new PrismaSalesRepository()) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', createRouter(salesRepo));
  app.use(errorHandler);

  return app;
}

export const app = createApp();