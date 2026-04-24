import { GetRevenueTrend } from '../../application/usecases/GetRevenueTrend';
import { SalesRepository } from '../../domain/ports/SalesRepository';
import { KpiResult } from '../../domain/entities/KpiResult';
import { RevenueTrend, TrendGrain } from '../../domain/entities/RevenueTrend';
import { ProductRanking } from '../../domain/entities/ProductRanking';
import { SalesFilters } from '../../domain/filters/SalesFilters';

const mockTrend: RevenueTrend = {
  grain: 'day',
  data: [
    { period: '2017-01-01', revenue: 500, orders: 5, gmv: 550 },
    { period: '2017-01-02', revenue: 750, orders: 8, gmv: 800 },
  ],
};

const mockRepository: SalesRepository = {
  getKpis:         jest.fn().mockResolvedValue({} as KpiResult),
  getRevenueTrend: jest.fn().mockResolvedValue(mockTrend),
  getTopProducts:  jest.fn().mockResolvedValue([] as ProductRanking[]),
};

function makeFilters(overrides: Partial<SalesFilters> = {}): SalesFilters {
  return {
    from: new Date('2017-01-01'),
    to:   new Date('2017-01-31'),
    ...overrides,
  };
}

describe('GetRevenueTrend', () => {
  let useCase: GetRevenueTrend;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetRevenueTrend(mockRepository);
  });

  it('debería retornar la tendencia con grain "day"', async () => {
    const filters = makeFilters();
    const result  = await useCase.execute(filters, 'day');

    expect(result).toEqual(mockTrend);
    expect(mockRepository.getRevenueTrend).toHaveBeenCalledWith(filters, 'day');
  });

  it('debería retornar la tendencia con grain "week"', async () => {
    const filters = makeFilters();
    const result  = await useCase.execute(filters, 'week');

    expect(result).toEqual(mockTrend);
    expect(mockRepository.getRevenueTrend).toHaveBeenCalledWith(filters, 'week');
  });

  it('debería lanzar error con grain inválido', async () => {
    const filters = makeFilters();

    await expect(
      useCase.execute(filters, 'month' as TrendGrain)
    ).rejects.toThrow();
  });
   it('debería lanzar error cuando "from" es posterior a "to"', async () => {
    const filters = makeFilters({
      from: new Date('2017-12-31'),
      to: new Date('2017-01-01'),
    });
 
    await expect(useCase.execute(filters, 'day')).rejects.toThrow();
    expect(mockRepository.getRevenueTrend).not.toHaveBeenCalled();
  });
 
  it('debería llamar al repositorio exactamente una vez por ejecución', async () => {
    const filters = makeFilters();
    await useCase.execute(filters, 'day');
 
    expect(mockRepository.getRevenueTrend).toHaveBeenCalledTimes(1);
    expect(mockRepository.getKpis).not.toHaveBeenCalled();
    expect(mockRepository.getTopProducts).not.toHaveBeenCalled();
  });
});