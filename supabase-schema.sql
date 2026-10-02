-- =========================================================================
-- SUPABASE DATABASE & STORAGE CONFIGURATION FOR ATELIER V E-COMMERCE
-- =========================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create orders table for persistent database storage
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

-- Index for ordering by creation date
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- 2. Enable Row Level Security (RLS) on orders
alter table public.orders enable row level security;

-- 3. Policy: Service Role has full access (used by server.ts backend)
create policy "Allow service role full access to orders"
  on public.orders
  for all
  using (true)
  with check (true);

-- 4. Policy: Allow storefront to insert new orders
create policy "Allow public order placement"
  on public.orders
  for insert
  with check (true);

-- =========================================================================
-- SUPABASE STORAGE: Product Images Bucket Setup
-- =========================================================================

-- 5. Create storage bucket for product images (public read access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- 6. Storage RLS: Allow public view/download of product images
create policy "Public Access to Product Images"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

-- 7. Storage RLS: Allow uploads to Product Images bucket
create policy "Allow uploads to Product Images"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' );

-- 8. Storage RLS: Allow updates and deletions to Product Images
create policy "Allow updates to Product Images"
  on storage.objects for update
  using ( bucket_id = 'product-images' );
