-- Add JSONB columns for detailed cash and mobile money breakdowns
ALTER TABLE daily_closing_reports 
ADD COLUMN IF NOT EXISTS cash_denominations JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS mobile_money_balances JSONB DEFAULT '{}'::jsonb;

-- Ensure notes column exists
ALTER TABLE daily_closing_reports 
ADD COLUMN IF NOT EXISTS notes TEXT;
