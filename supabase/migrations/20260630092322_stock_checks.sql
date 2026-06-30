-- Stock check log table
CREATE TABLE IF NOT EXISTS stock_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  outlet TEXT NOT NULL,
  product TEXT NOT NULL,
  expected_qty INTEGER NOT NULL,
  actual_qty INTEGER NOT NULL,
  variance INTEGER NOT NULL,
  variance_pct DECIMAL(5,2) NOT NULL,
  logged_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OK'
);

-- Row Level Security: allow reads and inserts for all users
ALTER TABLE stock_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads" ON stock_checks FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON stock_checks FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE stock_checks;
