import { SalesRepository } from '../../domain/ports/SalesRepository';
import { SalesFilters } from '../../domain/filters/SalesFilters';
import { KpiResult } from '../../domain/entities/KpiResult';

export class GetKpis {
   constructor(private readonly salesRepository: SalesRepository) {}

  async execute(filters: SalesFilters): Promise<KpiResult> {
    const diffMs = filters.to.getTime() - filters.from.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 730) {
      throw new Error('El rango de fechas no puede superar 2 años');
    }

    if (filters.from > filters.to) {
      throw new Error('"from" debe ser anterior a "to"');
    }

    return this.salesRepository.getKpis(filters);
  }
}