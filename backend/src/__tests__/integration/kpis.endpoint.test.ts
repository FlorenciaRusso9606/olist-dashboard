import request from 'supertest';
import { createApp } from '../../app';
import { SalesRepository } from '../../domain/ports/SalesRepository';
import { KpiResult } from '../../domain/entities/KpiResult';
import { ProductRanking } from '../../domain/entities/ProductRanking';
import { RevenueTrend } from '../../domain/entities/RevenueTrend';

const mockKpiResult: KpiResult = {
  gmv:                1000,
  revenue:            900,
  orders:             10,
  aov:                90,
  itemsPerOrder:      2,
  cancellationRate:   0.05,
  onTimeDeliveryRate: 0.85,
  totalFreight:       150,
};

// Mock 
const mockRepo: SalesRepository = {
  getKpis:         jest.fn().mockResolvedValue(mockKpiResult),
  getRevenueTrend: jest.fn().mockResolvedValue({ grain: 'day', data: [] } as RevenueTrend),
  getTopProducts:  jest.fn().mockResolvedValue([] as ProductRanking[]),
};

const app = createApp(mockRepo);

afterEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/kpis — integración', () => {

  it('debería responder 200 con la estructura correcta', async () => {
    const res = await request(app)
      .get('/api/kpis')
      .query({ from: '2017-01-01', to: '2017-12-31' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data).toHaveProperty('gmv');
    expect(data).toHaveProperty('revenue');
    expect(data).toHaveProperty('orders');
    expect(data).toHaveProperty('aov');
    expect(data).toHaveProperty('itemsPerOrder');
    expect(data).toHaveProperty('cancellationRate');
    expect(data).toHaveProperty('onTimeDeliveryRate');
    expect(data).toHaveProperty('cancellationRatePct');
    expect(data).toHaveProperty('onTimeDeliveryRatePct');
    expect(typeof data.gmv).toBe('number');
    expect(typeof data.orders).toBe('number');
  });

  it('debería responder 400 cuando faltan parámetros obligatorios', async () => {
    const res = await request(app).get('/api/kpis');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debería responder 422 cuando from es posterior a to', async () => {
    const res = await request(app)
      .get('/api/kpis')
      .query({ from: '2017-12-31', to: '2017-01-01' });

    expect(res.status).toBe(422);
  });

  it('debería responder 422 cuando el rango supera 730 días', async () => {
    const res = await request(app)
      .get('/api/kpis')
      .query({ from: '2015-01-01', to: '2018-01-02' });

    expect(res.status).toBe(422);
  });

  it('debería responder 200 con filtros opcionales', async () => {
    const res = await request(app)
      .get('/api/kpis')
      .query({
        from:            '2017-01-01',
        to:              '2017-12-31',
        orderStatus:     'delivered',
        productCategory: 'electronics',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});