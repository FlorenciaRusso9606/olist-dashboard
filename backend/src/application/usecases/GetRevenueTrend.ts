import { SalesRepository } from '../../domain/ports/SalesRepository';
import { SalesFilters } from '../../domain/filters/SalesFilters';
import { RevenueTrend, TrendGrain } from '../../domain/entities/RevenueTrend';

const VALID_GRAINS: TrendGrain[] = ['day', 'week'];

export class GetRevenueTrend {
  constructor(private readonly salesRepository: SalesRepository) {}

  async execute(filters: SalesFilters, grain: TrendGrain): Promise<RevenueTrend> {
    if (!VALID_GRAINS.includes(grain)) {
      throw new Error(`Grain inválido: ${grain}. Valores aceptados: day, week`);
    }

    if (filters.from > filters.to) {
      throw new Error('"from" debe ser anterior a "to"');
    }

    return this.salesRepository.getRevenueTrend(filters, grain);
  }
}