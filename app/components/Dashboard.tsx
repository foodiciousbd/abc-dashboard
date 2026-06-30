'use client'

import { useEffect, useState, useMemo } from 'react'
import StatCard from './StatCard'
import SalesByMonth from './SalesByMonth'
import SalesByOutlet from './SalesByOutlet'
import SalesByProduct from './SalesByProduct'
import TargetTracker from './TargetTracker'
import StockTracker from './StockTracker'

interface SaleRow {
  order_id: string
  date: string
  outlet: string
  product: string
  category: string
  quantity: number
  unit_price: number
  discount_pct: number
  amount: number
  payment_method: string
}

const OUTLETS = ['All Outlets', 'Mid Valley', 'Pavilion KL', 'Jaya Shopping Centre', 'KSL City JB']

function fmtRM(v: number) {
  return `RM ${v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('en-MY', { month: 'short', year: 'numeric' })
}

function getMonthKey(dateStr: string) {
  return dateStr.substring(0, 7)
}

const MONTHLY_TARGETS: Record<string, number> = {
  'Mid Valley': 85000,
  'Pavilion KL': 95000,
  'Jaya Shopping Centre': 60000,
  'KSL City JB': 65000,
}

export default function Dashboard() {
  const [tab, setTab] = useState<'sales' | 'stock'>('sales')
  const [allData, setAllData] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [outlet, setOutlet] = useState('All Outlets')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    fetch('/api/sales')
      .then((r) => r.json())
      .then((d: SaleRow[]) => {
        setAllData(d)
        if (d.length) {
          const dates = d.map((r) => r.date).sort()
          setDateFrom(dates[0])
          setDateTo(dates[dates.length - 1])
        }
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    return allData.filter((r) => {
      if (outlet !== 'All Outlets' && r.outlet !== outlet) return false
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      return true
    })
  }, [allData, outlet, dateFrom, dateTo])

  const totalSales = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered])
  const totalOrders = filtered.length
  const avgOrder = totalOrders ? totalSales / totalOrders : 0

  const salesByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of filtered) {
      const key = getMonthKey(r.date)
      map[key] = (map[key] ?? 0) + r.amount
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, sales]) => ({ month: getMonthLabel(key + '-01'), sales: Math.round(sales * 100) / 100 }))
  }, [filtered])

  const salesByOutlet = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of filtered) {
      map[r.outlet] = (map[r.outlet] ?? 0) + r.amount
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([outlet, sales]) => ({ outlet, sales: Math.round(sales * 100) / 100 }))
  }, [filtered])

  const salesByProduct = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of filtered) {
      map[r.product] = (map[r.product] ?? 0) + r.amount
    }
    return Object.entries(map).map(([product, sales]) => ({ product, sales: Math.round(sales * 100) / 100 }))
  }, [filtered])

  const outletMonthData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of allData.filter((r) => {
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      return true
    })) {
      const key = `${r.outlet}::${getMonthKey(r.date)}`
      map[key] = (map[key] ?? 0) + r.amount
    }
    return Object.entries(map).map(([key, sales]) => {
      const [outletName, month] = key.split('::')
      return { outlet: outletName, month, sales }
    })
  }, [allData, dateFrom, dateTo])

  const activeMonths = useMemo(() => {
    const set = new Set<string>()
    for (const r of filtered) set.add(getMonthKey(r.date))
    return [...set].sort()
  }, [filtered])

  const targetSummary = useMemo(() => {
    return Object.entries(MONTHLY_TARGETS).map(([outletName, monthly]) => {
      const totalTarget = monthly * (activeMonths.length || 1)
      const actual = outletMonthData
        .filter((d) => d.outlet === outletName && activeMonths.includes(d.month))
        .reduce((s, d) => s + d.sales, 0)
      return { outlet: outletName, actual: Math.round(actual), target: totalTarget, pct: (actual / totalTarget) * 100 }
    })
  }, [outletMonthData, activeMonths])

  async function handleAnalyze() {
    setAnalyzing(true)
    setAiSummary('')
    setAiError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalSales: Math.round(totalSales),
          totalOrders,
          avgOrder: avgOrder.toFixed(2),
          period: `${dateFrom} to ${dateTo}`,
          outlet,
          salesByOutlet,
          topProducts: [...salesByProduct].sort((a, b) => b.sales - a.sales).slice(0, 5),
          targets: targetSummary,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setAiError('Could not reach the AI. Please check your API key and try again.')
      } else {
        setAiSummary(data.summary)
      }
    } catch {
      setAiError('Something went wrong. Please try again.')
    }
    setAnalyzing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ABC SDN BHD</h1>
            <p className="text-xs text-gray-400 mt-0.5">Management Dashboard</p>
          </div>
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        {/* Tab switcher */}
        <div className="max-w-7xl mx-auto mt-3 flex gap-1">
          <button
            onClick={() => setTab('sales')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg ${tab === 'sales' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Sales Dashboard
          </button>
          <button
            onClick={() => setTab('stock')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg ${tab === 'stock' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Stock Check
          </button>
        </div>
      </div>

      {/* Stock Check Tab */}
      {tab === 'stock' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <StockTracker />
        </div>
      )}

      {/* Sales Tab */}
      {tab === 'sales' && <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Outlet</label>
            <select
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              {OUTLETS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const dates = allData.map((r) => r.date).sort()
              setDateFrom(dates[0])
              setDateTo(dates[dates.length - 1])
              setOutlet('All Outlets')
            }}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
          <div className="ml-auto flex items-end gap-3">
            <p className="text-xs text-gray-400">
              Showing {filtered.length.toLocaleString()} transactions
            </p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <span>✦</span>
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Sales"
            value={fmtRM(totalSales)}
            sub={`${activeMonths.length} month${activeMonths.length !== 1 ? 's' : ''} selected`}
            highlight
          />
          <StatCard
            label="Total Orders"
            value={totalOrders.toLocaleString()}
            sub="Transactions in period"
          />
          <StatCard
            label="Avg. Order Value"
            value={fmtRM(avgOrder)}
            sub="Per transaction"
          />
        </div>

        {/* AI Summary Card */}
        {(aiSummary || aiError) && (
          <div className="bg-white border border-indigo-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-indigo-500 text-lg">✦</span>
              <h2 className="text-sm font-semibold text-gray-800">AI Management Summary</h2>
              <span className="ml-auto text-xs text-gray-400">Based on current filter selection</span>
            </div>
            {aiError ? (
              <p className="text-sm text-red-500">{aiError}</p>
            ) : (
              <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                {aiSummary.split('\n').filter(Boolean).map((line, i) => {
                  const parts = line.split(/\*\*(.*?)\*\*/g)
                  return (
                    <p key={i}>
                      {parts.map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </p>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SalesByMonth data={salesByMonth} />
          <SalesByOutlet data={salesByOutlet} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SalesByProduct data={salesByProduct} />
          <TargetTracker data={outletMonthData} months={activeMonths} />
        </div>
      </div>}
    </div>
  )
}
