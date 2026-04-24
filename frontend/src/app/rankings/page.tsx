'use client';

import { useState } from 'react';
import { Filters } from '../../components/Filters';
import { ProductsTable } from '../../components/ProductsTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useRankings } from '../../hooks/useRankings';
import { DashboardFilters } from '../../types/api';

const DEFAULT_FILTERS: DashboardFilters = {
  from: '2017-01-01',
  to:   '2018-12-31',
};

export default function RankingsPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [metric, setMetric]   = useState<'gmv' | 'revenue'>('revenue');

  const rankings = useRankings(filters, metric, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rankings de productos</h1>
        <p className="text-sm text-gray-500 mt-1">Top 20 productos por GMV o Revenue</p>
      </div>

      <Filters filters={filters} onChange={setFilters} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {rankings.isPending && <LoadingSpinner />}
        {rankings.isError   && <ErrorMessage message={rankings.error.message} onRetry={() => rankings.refetch()} />}
        {rankings.data && (
          <ProductsTable
            data={rankings.data}
            metric={metric}
            onMetricChange={setMetric}
          />
        )}
      </div>
    </div>
  );
}