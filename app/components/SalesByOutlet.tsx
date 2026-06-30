'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b']

interface Props {
  data: { outlet: string; sales: number }[]
}

function shortName(name: string) {
  const map: Record<string, string> = {
    'Mid Valley': 'Mid Valley',
    'Pavilion KL': 'Pavilion KL',
    'Jaya Shopping Centre': 'Jaya SC',
    'KSL City JB': 'KSL JB',
  }
  return map[name] ?? name
}

export default function SalesByOutlet({ data }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Sales by Outlet</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barSize={36}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="outlet" tickFormatter={shortName} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            formatter={(v: number) => [`RM ${v.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 'Sales']}
            labelFormatter={shortName}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
          />
          <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
