import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

export interface SaleRow {
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

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'sales_dashboard_sample.xlsx')
    const buffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheet = workbook.Sheets['Sales_Data']
    const rawData = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' })

    const data: SaleRow[] = (rawData as Record<string, unknown>[]).map((row) => {
      const qty = Number(row['quantity'] ?? 0)
      const price = Number(row['unit_price'] ?? 0)
      const disc = Number(row['discount_pct'] ?? 0)
      const rawAmt = Number(row['amount'])
      const amount = !isNaN(rawAmt) && rawAmt > 0
        ? rawAmt
        : Math.round(qty * price * (1 - disc / 100) * 100) / 100
      return {
        order_id: String(row['order_id'] ?? ''),
        date: String(row['date'] ?? '').substring(0, 10),
        outlet: String(row['outlet'] ?? ''),
        product: String(row['product'] ?? ''),
        category: String(row['category'] ?? ''),
        quantity: qty,
        unit_price: price,
        discount_pct: disc,
        amount,
        payment_method: String(row['payment_method'] ?? ''),
      }
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 })
  }
}
