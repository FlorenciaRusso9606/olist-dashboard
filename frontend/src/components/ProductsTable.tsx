'use client';

import { ProductRanking } from '../types/api';

interface Props {
  data: ProductRanking[];
  metric: 'gmv' | 'revenue';
  onMetricChange: (m: 'gmv' | 'revenue') => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export function ProductsTable({ data, metric, onMetricChange }: Props) {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onMetricChange('revenue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            metric === 'revenue'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Por Revenue
        </button>
        <button
          onClick={() => onMetricChange('gmv')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            metric === 'gmv'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Por GMV
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-gray-500 font-medium">#</th>
              <th className="text-left py-3 px-2 text-gray-500 font-medium">Categoría</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">GMV</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Revenue</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Ítems vendidos</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.productId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-400">{row.rank}</td>
                <td className="py-3 px-2 font-medium text-gray-800">
                  {row.productCategoryNameEnglish ?? row.productCategoryName ?? '—'}
                </td>
                <td className="py-3 px-2 text-right text-gray-600">{fmt(row.gmv)}</td>
                <td className="py-3 px-2 text-right text-gray-600">{fmt(row.revenue)}</td>
                <td className="py-3 px-2 text-right text-gray-600">{row.itemsSold.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Sin datos para el período seleccionado
          </div>
        )}
      </div>
    </div>
  );
}