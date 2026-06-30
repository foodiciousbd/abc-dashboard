'use client'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

export default function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${highlight ? 'text-indigo-700' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
