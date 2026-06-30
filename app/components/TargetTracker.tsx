'use client'

const MONTHLY_TARGETS: Record<string, number> = {
  'Mid Valley': 85000,
  'Pavilion KL': 95000,
  'Jaya Shopping Centre': 60000,
  'KSL City JB': 65000,
}

interface OutletMonth {
  outlet: string
  month: string
  sales: number
}

interface Props {
  data: OutletMonth[]
  months: string[]
}

export default function TargetTracker({ data, months }: Props) {
  const outlets = Object.keys(MONTHLY_TARGETS)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Target vs Actual</h2>
      <div className="space-y-4">
        {outlets.map((outlet) => {
          const target = MONTHLY_TARGETS[outlet]
          const relevantMonths = months.length > 0 ? months : []
          const monthCount = relevantMonths.length || 1
          const totalTarget = target * monthCount
          const totalActual = data
            .filter((d) => d.outlet === outlet && (relevantMonths.length === 0 || relevantMonths.includes(d.month)))
            .reduce((sum, d) => sum + d.sales, 0)
          const pct = Math.min((totalActual / totalTarget) * 100, 100)
          const ahead = totalActual >= totalTarget

          return (
            <div key={outlet}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{outlet}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    RM {totalActual.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / RM {totalTarget.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      ahead ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {ahead ? '▲ Ahead' : '▼ Behind'}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${ahead ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}% of target reached</p>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Monthly targets: Mid Valley RM 85k · Pavilion KL RM 95k · Jaya SC RM 60k · KSL JB RM 65k
      </p>
    </div>
  )
}
