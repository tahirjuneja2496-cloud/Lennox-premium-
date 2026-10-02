-- =========================================================================
-- SUPABASE DATABASE & STORAGE CONFIGURATION FOR ATELIER V E-COMMERCE
-- Project: mnlmparjckweabyvepfd
-- =========================================================================
-- Paste and run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mnlmparjckweabyvepfd/sql/new

-- =========================================================================
-- 1. ORDERS TABLE
-- =========================================================================
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

-- Enable Row Level Security (RLS) on orders
alter table public.orders enable row level security;

-- Policy: Allow service role full access
create policy "Allow service role full access to orders"
  on public.orders
  for all
  using (true)
  with check (true);

-- Policy: Allow placing new orders
create policy "Allow public order placement"
  on public.orders
  for insert
  with check (true);

-- Policy: Allow reading orders
create policy "Allow public order viewing"
  on public.orders
  for select
  using (true);

-- Policy: Allow updating order fulfillment status
create policy "Allow public order updates"
  on public.orders
  for update
  using (true)
  with check (true);

-- =========================================================================
-- 2. PRODUCT IMAGES STORAGE BUCKET
-- =========================================================================

-- Create storage bucket for product images (public read access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update set public = true;

-- Storage Policy: Allow public viewing and downloading of images
drop policy if exists "Public Access to Product Images" on storage.objects;
create policy "Public Access to Product Images"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

-- Storage Policy: Allow uploading new product images
drop policy if exists "Allow uploads to Product Images" on storage.objects;
create policy "Allow uploads to Product Images"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' );

-- Storage Policy: Allow updating existing images
drop policy if exists "Allow updates to Product Images" on storage.objects;
create policy "Allow updates to Product Images"
  on storage.objects for update
  using ( bucket_id = 'product-images' );
