-- Create sale_items table to track individual items in a sale
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

-- Enable RLS
alter table public.sale_items enable row level security;

-- Create policies
create policy "Enable read access for authenticated users"
    on public.sale_items for select
    to authenticated
    using (true);

create policy "Enable insert access for authenticated users"
    on public.sale_items for insert
    to authenticated
    with check (true);
