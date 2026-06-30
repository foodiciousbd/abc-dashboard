import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export interface StockCheck {
  id: string
  created_at: string
  outlet: string
  product: string
  expected_qty: number
  actual_qty: number
  variance: number
  variance_pct: number
  logged_by: string
  status: string
}
