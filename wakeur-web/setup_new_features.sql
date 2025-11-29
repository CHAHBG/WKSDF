-- 1. Update Sales Table to support POS features
alter table public.sales add column if not exists customer_name text;
alter table public.sales add column if not exists status text default 'COMPLETED';

-- 2. Create sale_items table (for detailed transaction tracking)
create table if not exists public.sale_items (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    sale_id uuid references public.sales(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    quantity integer not null,
    unit_price numeric not null,
    total_price numeric not null
);

-- Enable RLS for sale_items
alter table public.sale_items enable row level security;

create policy "Enable read access for authenticated users" on public.sale_items for select to authenticated using (true);
create policy "Enable insert access for authenticated users" on public.sale_items for insert to authenticated with check (true);

-- 3. Create Expenses Table
create table if not exists public.expenses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    shop_id uuid references public.shop_settings(id) on delete cascade,
    type text not null check (type in ('LOCATION', 'WIFI', 'SALARY', 'DEPENSES', 'COMMISSION')),
    amount numeric not null,
    description text,
    expense_date date not null default current_date
);

-- Enable RLS for expenses
alter table public.expenses enable row level security;

create policy "Enable read access for authenticated users" on public.expenses for select to authenticated using (true);
create policy "Enable insert access for authenticated users" on public.expenses for insert to authenticated with check (true);
create policy "Enable update access for authenticated users" on public.expenses for update to authenticated using (true);
create policy "Enable delete access for authenticated users" on public.expenses for delete to authenticated using (true);

-- 4. Create Monthly Financials View
create or replace view public.monthly_financials as
with monthly_sales as (
    select 
        date_trunc('month', created_at)::date as month,
        sum(amount) as total_sales  -- Note: using 'amount' as per user schema
    from public.sales
    where status = 'COMPLETED'
    group by 1
),
monthly_expenses as (
    select 
        date_trunc('month', expense_date)::date as month,
        sum(case when type = 'COMMISSION' then 0 else amount end) as total_expenses,
        sum(case when type = 'COMMISSION' then amount else 0 end) as total_commissions
    from public.expenses
    group by 1
)
select 
    coalesce(s.month, e.month) as month,
    coalesce(s.total_sales, 0) as revenue,
    coalesce(e.total_commissions, 0) as commissions,
    coalesce(e.total_expenses, 0) as expenses,
    (coalesce(s.total_sales, 0) + coalesce(e.total_commissions, 0) - coalesce(e.total_expenses, 0)) as net_revenue
from monthly_sales s
full outer join monthly_expenses e on s.month = e.month
order by month desc;
