'use client';

import { useState } from 'react';
import { Filters } from '../components/Filters';
import { KpiCard } from '../components/KpiCard';
import { TrendChart } from '../components/TrendChart';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useKpis } from '../hooks/useKpis';
import { useTrend } from '../hooks/useTrend';
import { DashboardFilters } from '../types/api';

const DEFAULT_FILTERS: DashboardFilters = {
  from: '2017-01-01',
  to:   '2018-12-31',
};

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => n.toLocaleString('pt-BR');

export default function OverviewPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [grain, setGrain]     = useState<'day' | 'week'>('week');

  const kpis  = useKpis(filters);
  const trend = useTrend(filters, grain);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Métricas comerciales de Olist</p>
      </div>

      <Filters filters={filters} onChange={setFilters} />

      {kpis.isPending && <LoadingSpinner />}
      {kpis.isError   && <ErrorMessage message={kpis.error.message} onRetry={() => kpis.refetch()} />}
      {kpis.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="GMV"                 value={fmtBRL(kpis.data.gmv)}              subtitle="Valor bruto de mercancía" color="blue" />
          <KpiCard title="Revenue"             value={fmtBRL(kpis.data.revenue)}          subtitle="Pagos recibidos"          color="green" />
          <KpiCard title="Órdenes"             value={fmtNum(kpis.data.orders)}           subtitle="Órdenes únicas"           color="purple" />
          <KpiCard title="AOV"                 value={fmtBRL(kpis.data.aov)}              subtitle="Valor promedio de orden"  color="amber" />
          <KpiCard title="Ítems por orden"     value={kpis.data.itemsPerOrder.toFixed(2)} subtitle="Promedio de ítems"        color="blue" />
          <KpiCard title="Tasa de cancelación" value={`${kpis.data.cancellationRatePct}%`} subtitle="Sobre total de órdenes"  color="red" />
          <KpiCard title="Entrega a tiempo"    value={`${kpis.data.onTimeDeliveryRatePct}%`} subtitle="Sobre órdenes entregadas" color="green" />
          <KpiCard title="Flete total"         value={fmtBRL(kpis.data.totalFreight)}     subtitle="Costo de envíos"          color="amber" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Tendencia de Revenue y Órdenes</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setGrain('week')}
              className={`px-3 py-1 rounded text-xs font-medium ${grain === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setGrain('day')}
              className={`px-3 py-1 rounded text-xs font-medium ${grain === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Diario
            </button>
          </div>
        </div>

        {trend.isPending && <LoadingSpinner />}
        {trend.isError   && <ErrorMessage message={trend.error.message} onRetry={() => trend.refetch()} />}
        {trend.data && <TrendChart data={trend.data} grain={grain} />}
      </div>
    </div>
  );
}