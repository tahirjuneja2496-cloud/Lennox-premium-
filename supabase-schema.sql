-- =========================================================================
-- COMPLETE SUPABASE SCHEMA & STORAGE FOR ATELIER V E-COMMERCE
-- Project: zgmvnskuusopqdrmqvox
-- Dashboard URL: https://supabase.com/dashboard/project/zgmvnskuusopqdrmqvox/sql/new
-- =========================================================================

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  sku text not null,
  slug text not null,
  name text not null,
  short_description text default '',
  description text default '',
  category text not null default 'Objects',
  subcategory text,
  brand text default 'Atelier V',
  tags text[] default '{}'::text[],
  price numeric(10,2) not null default 0.00,
  original_price numeric(10,2) not null default 0.00,
  discount_percent numeric(5,2) not null default 0.00,
  stock integer not null default 0,
  low_stock_threshold integer not null default 3,
  images text[] default '{}'::text[],
  featured boolean not null default false,
  bestseller boolean not null default false,
  new_arrival boolean not null default false,
  published boolean not null default true,
  specifications jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  rating numeric(3,2) not null default 5.00,
  review_count integer not null default 0,
  seo jsonb not null default '{"metaTitle": "", "metaDescription": "", "keywords": ""}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for lightning-fast queries across devices
create index if not exists idx_products_created_at on public.products (created_at desc);
create index if not exists idx_products_published on public.products (published);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_sku on public.products (sku);

-- Enable RLS for products
alter table public.products enable row level security;

-- Drop any existing product policies to prevent conflicts
drop policy if exists "Allow public read products" on public.products;
drop policy if exists "Allow public insert products" on public.products;
drop policy if exists "Allow public update products" on public.products;
drop policy if exists "Allow public delete products" on public.products;
drop policy if exists "Allow service role all products" on public.products;

-- Create comprehensive product policies
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow public insert products" on public.products for insert with check (true);
create policy "Allow public update products" on public.products for update using (true) with check (true);
create policy "Allow public delete products" on public.products for delete using (true);
create policy "Allow service role all products" on public.products for all using (true) with check (true);


-- 2. ORDERS TABLE
create table if not exists public.orders (
  id text primary key,
  customer jsonb not null,
  items jsonb not null,
  pricing jsonb not null,
  payment jsonb not null,
  status text not null default 'Pending',
  tracking_number text,
  shipping_carrier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders (created_at desc);
alter table public.orders enable row level security;

drop policy if exists "Allow service role full access to orders" on public.orders;
drop policy if exists "Allow public order placement" on public.orders;
drop policy if exists "Allow public order viewing" on public.orders;
drop policy if exists "Allow public order updates" on public.orders;

create policy "Allow service role full access to orders" on public.orders for all using (true) with check (true);
create policy "Allow public order placement" on public.orders for insert with check (true);
create policy "Allow public order viewing" on public.orders for select using (true);
create policy "Allow public order updates" on public.orders for update using (true) with check (true);


-- 3. ORDER ITEMS TABLE (Ledger)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text,
  product_name text not null,
  sku text not null,
  variant_id text,
  variant_name text,
  image text not null default '',
  price numeric(10,2) not null,
  quantity integer not null default 1,
  subtotal numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items (order_id);
alter table public.order_items enable row level security;

drop policy if exists "Allow service role full access to order_items" on public.order_items;
drop policy if exists "Allow public insert order_items" on public.order_items;
drop policy if exists "Allow public read order_items" on public.order_items;

create policy "Allow service role full access to order_items" on public.order_items for all using (true) with check (true);
create policy "Allow public insert order_items" on public.order_items for insert with check (true);
create policy "Allow public read order_items" on public.order_items for select using (true);


-- 4. STORAGE BUCKET: product-images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update set public = true;

drop policy if exists "Public Access to Product Images" on storage.objects;
create policy "Public Access to Product Images"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

drop policy if exists "Allow uploads to Product Images" on storage.objects;
create policy "Allow uploads to Product Images"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' );

drop policy if exists "Allow updates to Product Images" on storage.objects;
create policy "Allow updates to Product Images"
  on storage.objects for update
  using ( bucket_id = 'product-images' );

drop policy if exists "Allow deletes to Product Images" on storage.objects;
create policy "Allow deletes to Product Images"
  on storage.objects for delete
  using ( bucket_id = 'product-images' );
