import { GetTopProducts } from '../../application/usecases/GetTopProducts';
import { SalesRepository } from '../../domain/ports/SalesRepository';
import { KpiResult } from '../../domain/entities/KpiResult';
import { RevenueTrend } from '../../domain/entities/RevenueTrend';
import { ProductRanking } from '../../domain/entities/ProductRanking';
import { SalesFilters } from '../../domain/filters/SalesFilters';

const mockRankings: ProductRanking[] = [
  {
    productId: 'prod-1',
    productCategoryName: 'eletronicos',
    productCategoryNameEnglish: 'electronics',
    gmv: 5000,
    revenue: 4500,
    itemsSold: 50,
    rank: 1,
  },
  {
    productId: 'prod-2',
    productCategoryName: 'moveis',
    productCategoryNameEnglish: 'furniture',
    gmv: 3000,
    revenue: 2800,
    itemsSold: 30,
    rank: 2,
  },
];

const mockRepository: SalesRepository = {
  getKpis:         jest.fn().mockResolvedValue({} as KpiResult),
  getRevenueTrend: jest.fn().mockResolvedValue({} as RevenueTrend),
  getTopProducts:  jest.fn().mockResolvedValue(mockRankings),
};

function makeFilters(overrides: Partial<SalesFilters> = {}): SalesFilters {
  return {
    from: new Date('2017-01-01'),
    to:   new Date('2017-06-30'),
    ...overrides,
  };
}

describe('GetTopProducts', () => {
  let useCase: GetTopProducts;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetTopProducts(mockRepository);
  });

  it('debería retornar rankings por GMV', async () => {
    const result = await useCase.execute(makeFilters(), 'gmv', 10);

    expect(result).toEqual(mockRankings);
    expect(mockRepository.getTopProducts).toHaveBeenCalledWith(makeFilters(), 'gmv', 10);
  });

  it('debería retornar rankings por revenue', async () => {
    const result = await useCase.execute(makeFilters(), 'revenue', 5);

    expect(result).toEqual(mockRankings);
    expect(mockRepository.getTopProducts).toHaveBeenCalledWith(makeFilters(), 'revenue', 5);
  });

  it('debería lanzar error si limit es 0 o negativo', async () => {
    await expect(
      useCase.execute(makeFilters(), 'gmv', 0)
    ).rejects.toThrow();
  });
});