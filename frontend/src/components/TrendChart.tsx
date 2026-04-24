'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendPoint } from '../types/api';

interface Props {
  data: TrendPoint[];
  grain: 'day' | 'week';
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

export function TrendChart({ data, grain }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Sin datos para el período seleccionado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11 }}
          tickFormatter={v => grain === 'week' ? v.replace('W', 'S') : v.slice(5)}
        />
        <YAxis
          yAxisId="revenue"
          tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          yAxisId="orders"
          orientation="right"
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === 'revenue' ? [fmt(value), 'Revenue'] : [value.toLocaleString(), 'Órdenes']
          }
        />
        <Legend />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="revenue"
        />
        <Line
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="orders"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}