'use client';

import { DashboardFilters } from '../types/api';

interface Props {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const ORDER_STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'delivered',  label: 'Entregado' },
  { value: 'shipped',    label: 'En camino' },
  { value: 'processing', label: 'Procesando' },
  { value: 'canceled',   label: 'Cancelado' },
  { value: 'unavailable',label: 'No disponible' },
];

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'health_beauty',        label: 'Belleza y salud' },
  { value: 'bed_bath_table',       label: 'Hogar' },
  { value: 'sports_leisure',       label: 'Deportes' },
  { value: 'computers_accessories',label: 'Computación' },
  { value: 'furniture_decor',      label: 'Muebles' },
  { value: 'housewares',           label: 'Artículos del hogar' },
  { value: 'watches_gifts',        label: 'Relojes y regalos' },
  { value: 'telephony',            label: 'Telefonía' },
  { value: 'toys',                 label: 'Juguetes' },
];

export function Filters({ filters, onChange }: Props) {
  const set = (key: keyof DashboardFilters, value: string) =>
    onChange({ ...filters, [key]: value || undefined });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Desde</label>
        <input
          type="date"
          value={filters.from}
          onChange={e => set('from', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Hasta</label>
        <input
          type="date"
          value={filters.to}
          onChange={e => set('to', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Categoría</label>
        <select
          value={filters.productCategory ?? ''}
          onChange={e => set('productCategory', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Estado de orden</label>
        <select
          value={filters.orderStatus ?? ''}
          onChange={e => set('orderStatus', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ORDER_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}