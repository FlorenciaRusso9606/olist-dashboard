import { SalesRepository } from '../../domain/ports/SalesRepository';
import { SalesFilters } from '../../domain/filters/SalesFilters';
import { ProductRanking } from '../../domain/entities/ProductRanking';

export class GetTopProducts {
  constructor(private readonly salesRepository: SalesRepository) {}

  async execute(
    filters: SalesFilters,
    metric: 'gmv' | 'revenue',
    limit: number
  ): Promise<ProductRanking[]> {
    if (limit <= 0) {
      throw new Error('El límite debe ser mayor a 0');
    }

    const safeLimit = Math.min(limit, 50);
    return this.salesRepository.getTopProducts(filters, metric, safeLimit);
  }
}