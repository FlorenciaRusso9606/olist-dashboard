import { GetKpis } from '../../application/usecases/GetKpis';
import { SalesRepository } from '../../domain/ports/SalesRepository';
import { KpiResult } from '../../domain/entities/KpiResult';
import { SalesFilters } from '../../domain/filters/SalesFilters';
import { RevenueTrend } from '../../domain/entities/RevenueTrend';
import { ProductRanking } from '../../domain/entities/ProductRanking';

const mockKpiResult: KpiResult = {
  gmv: 1000,
  revenue: 900,
  orders: 10,
  aov: 90,
  itemsPerOrder: 2,
  cancellationRate: 0.05,
  onTimeDeliveryRate: 0.85,
  totalFreight: 150,
};

const mockRepository: SalesRepository = {
  getKpis: jest.fn().mockResolvedValue(mockKpiResult),
  getRevenueTrend: jest.fn().mockResolvedValue({} as RevenueTrend),
  getTopProducts: jest.fn().mockResolvedValue([] as ProductRanking[]),
};

function makeFilters(overrides: Partial<SalesFilters> = {}): SalesFilters {
  return {
    from: new Date('2017-01-01'),
    to: new Date('2017-06-30'),
    ...overrides,
  };
}


describe('GetKpis', () => {
  let useCase: GetKpis;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetKpis(mockRepository);
  });

  it('debería retornar KPIs cuando los filtros son válidos', async () => {
    const filters = makeFilters();
    const result = await useCase.execute(filters);

    expect(result).toEqual(mockKpiResult);
    expect(mockRepository.getKpis).toHaveBeenCalledTimes(1);
    expect(mockRepository.getKpis).toHaveBeenCalledWith(filters);
  });

  it('debería lanzar error cuando "from" es posterior a "to"', async () => {
    const filters = makeFilters({
      from: new Date('2017-12-31'),
      to: new Date('2017-01-01'),
    });

    await expect(useCase.execute(filters)).rejects.toThrow('"from" debe ser anterior a "to"');
    expect(mockRepository.getKpis).not.toHaveBeenCalled();
  });

  it('debería lanzar error cuando el rango supera 2 años', async () => {
    const filters = makeFilters({
      from: new Date('2015-01-01'),
      to: new Date('2018-01-02'),
    });

    await expect(useCase.execute(filters)).rejects.toThrow(
      'El rango de fechas no puede superar 2 años',
    );
    expect(mockRepository.getKpis).not.toHaveBeenCalled();
  });

it('debería aceptar un rango de exactamente 730 días (límite válido)', async () => {
  const filters = makeFilters({
    from: new Date('2017-01-01'),
    to:   new Date('2018-12-31'), // 364 días en 2017 + 365 en 2018 = 729 días
  });
  const result = await useCase.execute(filters);
  expect(result).toEqual(mockKpiResult);
      expect(mockRepository.getKpis).toHaveBeenCalledTimes(1);

});

 

  it('debería propagar el error del repositorio si la DB falla', async () => {
    (mockRepository.getKpis as jest.Mock).mockRejectedValueOnce(
      new Error('DB connection failed'),
    );

    const filters = makeFilters();
    await expect(useCase.execute(filters)).rejects.toThrow('DB connection failed');
  });
});