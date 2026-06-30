'use client'

import { useEffect, useState } from 'react'
import { supabase, type StockCheck } from '@/lib/supabase'

const OUTLETS = ['Mid Valley', 'Pavilion KL', 'Jaya Shopping Centre', 'KSL City JB']

const PRODUCTS = [
  'Bottled Herbal Tea 500ml',
  'Chrysanthemum Tea',
  'Cooling Herbal Tea',
  'Detox Herbs Powder',
  'Herbal Soup Powder',
  'Premium Herbal Jelly',
  'Mango Herbal Jelly',
  'Original Herbal Jelly',
]

// Business rule thresholds
const VARIANCE_PCT_THRESHOLD = 5   // 5%
const VARIANCE_UNIT_THRESHOLD = 10 // 10 units

function isFlagged(row: StockCheck) {
  return Math.abs(row.variance_pct) > VARIANCE_PCT_THRESHOLD || Math.abs(row.variance) > VARIANCE_UNIT_THRESHOLD
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function StockTracker() {
  const [rows, setRows] = useState<StockCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    outlet: OUTLETS[0],
    product: PRODUCTS[0],
    expected_qty: '',
    actual_qty: '',
    logged_by: '',
  })
  const [formError, setFormError] = useState('')

  // Load initial data
  useEffect(() => {
    supabase
      .from('stock_checks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('stock_checks_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_checks' },
        (payload) => {
          setRows((prev) => [payload.new as StockCheck, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const expected = parseInt(form.expected_qty)
    const actual = parseInt(form.actual_qty)
    if (!form.logged_by.trim()) { setFormError('Please enter your name.'); return }
    if (isNaN(expected) || expected < 0) { setFormError('Expected quantity must be a number.'); return }
    if (isNaN(actual) || actual < 0) { setFormError('Actual quantity must be a number.'); return }

    const variance = actual - expected
    const variance_pct = expected > 0 ? Math.round((variance / expected) * 10000) / 100 : 0
    const flagged = Math.abs(variance_pct) > VARIANCE_PCT_THRESHOLD || Math.abs(variance) > VARIANCE_UNIT_THRESHOLD
    const status = flagged ? 'Check this' : 'OK'

    setSubmitting(true)
    const { error } = await supabase.from('stock_checks').insert({
      outlet: form.outlet,
      product: form.product,
      expected_qty: expected,
      actual_qty: actual,
      variance,
      variance_pct,
      logged_by: form.logged_by.trim(),
      status,
    })
    setSubmitting(false)

    if (error) {
      setFormError('Could not save. Please try again.')
      return
    }

    setForm((f) => ({ ...f, expected_qty: '', actual_qty: '' }))
    setShowForm(false)
  }

  const flaggedCount = rows.filter(isFlagged).length

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Stock Check Log</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Live · {rows.length} entries
            {flaggedCount > 0 && (
              <span className="ml-2 text-red-500 font-medium">{flaggedCount} need review</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Log Stock Check'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-5 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Outlet</label>
            <select name="outlet" value={form.outlet} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {OUTLETS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
            <select name="product" value={form.product} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Expected Qty</label>
            <input type="number" name="expected_qty" value={form.expected_qty} onChange={handleChange} min="0" placeholder="e.g. 100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Actual Qty</label>
            <input type="number" name="actual_qty" value={form.actual_qty} onChange={handleChange} min="0" placeholder="e.g. 88"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Your Name</label>
            <input type="text" name="logged_by" value={form.logged_by} onChange={handleChange} placeholder="e.g. Ahmad"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="col-span-2 sm:col-span-3 flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
              {submitting ? 'Saving…' : 'Save Entry'}
            </button>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <p className="text-xs text-gray-400 ml-auto">
              Flagged if variance &gt; {VARIANCE_PCT_THRESHOLD}% or &gt; {VARIANCE_UNIT_THRESHOLD} units
            </p>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Loading entries…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No stock checks logged yet. Click "+ Log Stock Check" to add one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Outlet</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Expected</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Variance</th>
                <th className="px-4 py-3 text-right">Var %</th>
                <th className="px-4 py-3 text-left">Logged by</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const flagged = isFlagged(row)
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-50 ${flagged ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3 text-gray-700">{row.outlet}</td>
                    <td className="px-4 py-3 text-gray-700">{row.product}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.expected_qty}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.actual_qty}</td>
                    <td className={`px-4 py-3 text-right font-medium ${flagged ? 'text-red-600' : row.variance === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                      {row.variance > 0 ? '+' : ''}{row.variance}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${flagged ? 'text-red-600' : 'text-gray-500'}`}>
                      {row.variance_pct > 0 ? '+' : ''}{row.variance_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.logged_by}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        flagged ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {flagged ? '⚠ Check this' : '✓ OK'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
