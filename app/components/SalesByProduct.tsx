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

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#ec4899']

interface Props {
  data: { product: string; sales: number }[]
}

export default function SalesByProduct({ data }: Props) {
  const top10 = [...data].sort((a, b) => b.sales - a.sales).slice(0, 10)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Products by Sales</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={top10}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 8, bottom: 0 }}
          barSize={16}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="product"
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={150}
          />
          <Tooltip
            formatter={(v: number) => [`RM ${v.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 'Sales']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
          />
          <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
            {top10.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
