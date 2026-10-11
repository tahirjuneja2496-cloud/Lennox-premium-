import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Order, Product, Coupon } from '../types/index.ts';

// -------------------------------------------------------------------------
// Static Vite inlining for production bundles (Vercel, browsers, mobile)
// -------------------------------------------------------------------------
const VITE_URL = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const VITE_KEY = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;
const VITE_BUCKET = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_STORAGE_BUCKET : undefined;

// Fallback for Node.js / Server environments
const NODE_URL = typeof process !== 'undefined' && process.env ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) : undefined;
const NODE_KEY = typeof process !== 'undefined' && process.env ? (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY) : undefined;
const NODE_BUCKET = typeof process !== 'undefined' && process.env ? (process.env.SUPABASE_STORAGE_BUCKET || process.env.VITE_SUPABASE_STORAGE_BUCKET) : undefined;

// Hardcoded fallback matches the user's project (public anon key is safe for client code with RLS)
const DEFAULT_SUPABASE_URL = 'https://zgmvnskuusopqdrmqvox.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbXZuc2t1dXNvcHFkcm1xdm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzYzODYsImV4cCI6MjEwNjUxMjM4Nn0.KSqVO14ofIc86Tp2EApXA0IN27Ef2vVv9kNPI14Q3x4';
const DEFAULT_BUCKET = 'product-images';

const rawUrl = VITE_URL || NODE_URL || DEFAULT_SUPABASE_URL;
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
export const supabaseKey = VITE_KEY || NODE_KEY || DEFAULT_SUPABASE_KEY;
export const SUPABASE_BUCKET_NAME = VITE_BUCKET || NODE_BUCKET || DEFAULT_BUCKET;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`[Atelier V] Connected to Supabase Project: ${supabaseUrl}`);
  } catch (err) {
    console.warn('[Atelier V] Failed to initialize Supabase client:', err);
  }
}

export const isSupabaseConnected = (): boolean => client !== null;
export const getSupabaseClient = (): SupabaseClient | null => client;

/**
 * Accurately check whether an error indicates the relation/table does NOT exist.
 * Never conflates not-null constraints, RLS errors, validation errors, or network errors with missing tables.
 */
export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error.message || '');
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('PGRST205') ||
    msg.includes('42P01') ||
    msg.includes('in the schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

// =========================================================================
// SUPABASE STORAGE: Product Image Uploads
// =========================================================================

/**
 * Upload product image (browser File, binary Buffer, or base64 dataUrl) directly to Supabase Storage.
 * Returns the public URL of the uploaded image on Supabase CDN.
 */
export async function uploadImageToSupabase(
  filename: string,
  fileOrData: any
): Promise<{ url?: string; error?: string }> {
  if (!client) {
    return { error: 'Supabase client not initialized' };
  }
  try {
    let payload: any;
    let contentType = 'image/jpeg';

    if (typeof window !== 'undefined' && fileOrData instanceof File) {
      payload = fileOrData;
      contentType = fileOrData.type || 'image/jpeg';
    } else if (typeof fileOrData === 'string') {
      const matches = fileOrData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        if (typeof Buffer !== 'undefined') {
          payload = Buffer.from(matches[2], 'base64');
        } else {
          const byteCharacters = atob(matches[2]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          payload = new Uint8Array(byteNumbers);
        }
      } else {
        payload = fileOrData;
      }
    } else {
      payload = fileOrData;
    }

    const ext = contentType.split('/')[1] || 'jpg';
    const cleanExt = (ext === 'jpeg' ? 'jpg' : ext).replace(/[^a-zA-Z0-9]/g, '');
    const cleanBaseName = (filename || 'product')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `products/${Date.now()}_${cleanBaseName}.${cleanExt}`;

    const { error } = await client.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(filePath, payload, {
        contentType,
        upsert: true
      });

    if (error) {
      console.warn('[Atelier V] Supabase Storage upload error:', error.message);
      return { error: error.message };
    }

    const { data: urlData } = client.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      console.log('[Atelier V] Uploaded image to Supabase Storage CDN:', urlData.publicUrl);
      return { url: urlData.publicUrl };
    }
    return { error: 'Failed to retrieve public URL from Supabase Storage' };
  } catch (err: any) {
    console.warn('[Atelier V] Supabase Storage upload exception:', err?.message || err);
    return { error: err?.message || 'Storage upload failed' };
  }
}

// =========================================================================
// SUPABASE DATABASE: Products System
// =========================================================================

export function mapSupabaseToProduct(row: any): Product {
  if (row.data && typeof row.data === 'object' && row.data.name) {
    const d = row.data;
    return {
      ...d,
      id: String(row.id || d.id),
      sku: String(row.sku || d.sku || `SKU-${row.id}`),
      slug: String(row.slug || d.slug || `creation-${row.id}`),
      name: String(row.name || d.name || 'Untitled Creation'),
      shortDescription: String(row.short_description || d.shortDescription || ''),
      description: String(row.description || d.description || ''),
      price: Number(row.price ?? d.price ?? 0),
      originalPrice: Number(row.original_price ?? d.originalPrice ?? row.price ?? d.price ?? 0),
      discountPercent: Number(row.discount_percent ?? d.discountPercent ?? 0),
      stock: Number(row.stock ?? d.stock ?? 0),
      lowStockThreshold: Number(row.low_stock_threshold ?? d.lowStockThreshold ?? 3),
      category: String(row.category || d.category || 'Objects'),
      subcategory: row.subcategory || d.subcategory || undefined,
      brand: String(row.brand || d.brand || 'Atelier V Editions'),
      tags: Array.isArray(row.tags) ? row.tags : (Array.isArray(d.tags) ? d.tags : []),
      published: row.published !== undefined ? Boolean(row.published) : Boolean(d.published !== false),
      featured: row.featured !== undefined ? Boolean(row.featured) : Boolean(d.featured),
      bestseller: row.bestseller !== undefined ? Boolean(row.bestseller) : Boolean(d.bestseller),
      newArrival: row.new_arrival !== undefined 
        ? Boolean(row.new_arrival) 
        : (row.newArrival !== undefined ? Boolean(row.newArrival) : Boolean(d.newArrival !== false)),
      images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (Array.isArray(d.images) && d.images.length > 0 ? d.images : []),
      specifications: Array.isArray(row.specifications) ? row.specifications : (Array.isArray(d.specifications) ? d.specifications : []),
      variants: Array.isArray(row.variants) ? row.variants : (Array.isArray(d.variants) ? d.variants : []),
      variantConfig: row.variant_config || d.variantConfig || undefined,
      rating: Number(row.rating ?? d.rating ?? 5.0),
      reviewCount: Number(row.review_count ?? d.reviewCount ?? 0),
      seo: row.seo || d.seo || { metaTitle: '', metaDescription: '', keywords: '' },
      createdAt: row.created_at || d.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || d.updatedAt || new Date().toISOString()
    };
  }

  return {
    id: String(row.id),
    sku: String(row.sku || `SKU-${row.id}`),
    slug: String(row.slug || `creation-${row.id}`),
    name: String(row.name || 'Untitled Creation'),
    shortDescription: String(row.short_description || row.shortDescription || ''),
    description: String(row.description || ''),
    category: String(row.category || 'Objects'),
    subcategory: row.subcategory || undefined,
    brand: String(row.brand || 'Atelier V'),
    tags: Array.isArray(row.tags) ? row.tags : [],
    price: Number(row.price || 0),
    originalPrice: Number(row.original_price || row.originalPrice || row.price || 0),
    discountPercent: Number(row.discount_percent || row.discountPercent || 0),
    stock: Number(row.stock || 0),
    lowStockThreshold: Number(row.low_stock_threshold || row.lowStockThreshold || 3),
    images: Array.isArray(row.images) ? row.images : [],
    featured: Boolean(row.featured),
    bestseller: Boolean(row.bestseller),
    newArrival: Boolean(row.new_arrival || row.newArrival),
    published: row.published !== false,
    specifications: Array.isArray(row.specifications) ? row.specifications : [],
    variants: Array.isArray(row.variants) ? row.variants : [],
    variantConfig: row.variant_config || row.variantConfig || (row.data && row.data.variantConfig) || undefined,
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || row.reviewCount || 0),
    seo: row.seo || { metaTitle: '', metaDescription: '', keywords: '' },
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapProductToSupabase(p: Product): Record<string, any> {
  const prodId = (p.id && String(p.id).trim()) ? String(p.id).trim() : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    id: prodId,
    sku: String(p.sku || `SKU-${Date.now()}`).trim(),
    slug: String(p.slug || (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim(),
    name: String(p.name || 'New Creation').trim(),
    short_description: p.shortDescription || '',
    description: p.description || '',
    category: p.category || 'Lighting & Objects',
    subcategory: p.subcategory || null,
    brand: p.brand || 'Atelier V Editions',
    tags: Array.isArray(p.tags) ? p.tags : [],
    price: Number(p.price || 0),
    original_price: Number(p.originalPrice || p.price || 0),
    discount_percent: Number(p.discountPercent || 0),
    stock: Number(p.stock ?? 1),
    low_stock_threshold: Number(p.lowStockThreshold || 3),
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [],
    featured: Boolean(p.featured),
    bestseller: Boolean(p.bestseller),
    new_arrival: Boolean(p.newArrival),
    published: p.published !== false,
    specifications: Array.isArray(p.specifications) ? p.specifications : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
    rating: Number(p.rating || 5),
    review_count: Number(p.reviewCount || 0),
    seo: p.seo || {},
    data: { ...p, id: prodId },
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export interface SupabaseProductsResult {
  products: Product[];
  connected: boolean;
  tableMissing: boolean;
  error?: string;
}

/**
 * Retrieve all products from Supabase products table
 */
export async function getProductsFromSupabase(): Promise<SupabaseProductsResult> {
  if (!client) {
    return { products: [], connected: false, tableMissing: false, error: 'Supabase client not initialized' };
  }
  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const isMissing = isTableMissingError(error);
      return {
        products: [],
        connected: true,
        tableMissing: isMissing,
        error: error.message
      };
    }

    if (!data) {
      return { products: [], connected: true, tableMissing: false };
    }

    const mapped = data.map(mapSupabaseToProduct);
    mapped.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return {
      products: mapped,
      connected: true,
      tableMissing: false
    };
  } catch (err: any) {
    return {
      products: [],
      connected: false,
      tableMissing: false,
      error: err?.message || 'Failed to query Supabase products'
    };
  }
}

/**
 * Save or update a product in Supabase products table
 */
export async function saveProductToSupabase(product: Product): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    const row = mapProductToSupabase(product);
    const { data, error } = await client.from('products').upsert(row).select();

    if (error) {
      console.warn('[Atelier V] Supabase saveProduct notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[Atelier V] Supabase saveProduct error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Seed initial catalog to Supabase if table is empty
 */
export async function seedProductsToSupabase(products: Product[]): Promise<number> {
  if (!client || !products.length) return 0;
  let count = 0;
  for (const p of products) {
    try {
      const row = mapProductToSupabase(p);
      const { error } = await client.from('products').upsert(row);
      if (!error) count++;
    } catch {
      // Continue
    }
  }
  return count;
}

/**
 * Delete a product from Supabase products table
 */
export async function deleteProductFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    const { error } = await client.from('products').delete().eq('id', id);
    if (error) {
      console.warn('[Atelier V] Supabase deleteProduct notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Atelier V] Supabase deleteProduct error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

// =========================================================================
// SUPABASE DATABASE: Order System
// =========================================================================

/**
 * Persist order to Supabase orders table
 */
export async function saveOrderToSupabase(order: Order): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    const orderId = order.id || `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = order.createdAt || new Date().toISOString();
    const updatedAt = order.updatedAt || new Date().toISOString();

    const orderRow: Record<string, any> = {
      id: orderId,
      customer: order.customer,
      items: order.items,
      pricing: order.pricing,
      payment: order.payment,
      status: order.status || 'Pending',
      tracking_number: order.trackingNumber || null,
      shipping_carrier: order.shippingCarrier || null,
      notes: order.notes || null,
      created_at: createdAt,
      updated_at: updatedAt
    };

    const { error } = await client.from('orders').upsert(orderRow);

    if (error) {
      console.warn('[Atelier V] Supabase saveOrder notice:', error.message);
      // Fallback with core columns if specific column names differ
      const coreRow = {
        id: orderId,
        customer: order.customer,
        items: order.items,
        pricing: order.pricing,
        payment: order.payment,
        status: order.status || 'Pending'
      };
      const retry = await client.from('orders').upsert(coreRow);
      if (retry.error) {
        console.warn('[Atelier V] Supabase saveOrder retry notice:', retry.error.message);
        return { success: false, error: retry.error.message };
      }
    }

    // Also attempt saving to itemized order_items table if present
    try {
      if (Array.isArray(order.items) && order.items.length > 0) {
        const itemRows = order.items.map((it) => ({
          order_id: orderId,
          product_id: it.productId,
          product_name: it.productName,
          sku: it.sku || '',
          variant_id: it.variantId || null,
          variant_name: it.variantName || null,
          image: it.image || '',
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal || (it.price * it.quantity),
          created_at: createdAt
        }));
        await client.from('order_items').insert(itemRows);
      }
    } catch {
      // Non-blocking itemized ledger
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Atelier V] Supabase saveOrder error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Retrieve all orders from Supabase orders table
 */
export async function getOrdersFromSupabase(): Promise<Order[] | null> {
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[Atelier V] Supabase getOrders notice:', error?.message);
      return null;
    }

    return data.map((row: any) => {
      const customer = row.customer || {
        fullName: row.customer_name || row.fullName || 'Patron',
        mobileNumber: row.mobile_number || row.phone || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        pincode: row.pincode || ''
      };

      const items = Array.isArray(row.items) ? row.items : [];

      const pricing = row.pricing || {
        subtotal: row.subtotal || 0,
        discount: row.discount || 0,
        shipping: row.shipping || 0,
        grandTotal: row.grand_total || row.total_amount || 0
      };

      const payment = row.payment || {
        method: row.payment_method || 'cod',
        status: row.payment_status || 'pending'
      };

      return {
        id: row.id,
        customer,
        items,
        pricing,
        payment,
        status: row.status || 'Pending',
        trackingNumber: row.tracking_number || row.trackingNumber || undefined,
        shippingCarrier: row.shipping_carrier || row.shippingCarrier || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || row.created_at || new Date().toISOString()
      };
    });
  } catch (err: any) {
    console.warn('[Atelier V] Supabase getOrders error:', err?.message || err);
    return null;
  }
}

/**
 * Update an existing order in Supabase
 */
export async function updateOrderInSupabase(
  id: string,
  update: Partial<Order>
): Promise<boolean> {
  if (!client) return false;
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (update.status !== undefined) updateData.status = update.status;
    if (update.trackingNumber !== undefined) updateData.tracking_number = update.trackingNumber;
    if (update.shippingCarrier !== undefined) updateData.shipping_carrier = update.shippingCarrier;
    if (update.notes !== undefined) updateData.notes = update.notes;
    if (update.customer !== undefined) updateData.customer = update.customer;
    if (update.payment !== undefined) updateData.payment = update.payment;

    const { error } = await client
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.warn('[Atelier V] Supabase updateOrder notice:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Atelier V] Supabase updateOrder error:', err?.message || err);
    return false;
  }
}

// =========================================================================
// SUPABASE DATABASE: Coupon & Privilege System
// =========================================================================

export const COUPON_MIGRATION_SQL = `-- Supabase SQL Migration: Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_discount NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies with the same names to allow re-running safely
DROP POLICY IF EXISTS "Allow public select coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow anon insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow anon update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow anon delete coupons" ON public.coupons;

-- Policies for public and anon client access
CREATE POLICY "Allow public select coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow anon insert coupons" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update coupons" ON public.coupons FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete coupons" ON public.coupons FOR DELETE USING (true);
`;

export function mapSupabaseToCoupon(row: any): Coupon {
  if (row.data && typeof row.data === 'object' && row.data.code) {
    const d = row.data;
    return {
      id: String(row.id || d.id),
      code: String(row.code || d.code || '').toUpperCase().trim(),
      discountType: (row.discount_type || d.discountType || 'percentage') as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value ?? d.discountValue ?? 0),
      minOrderValue: Number(row.min_order_value ?? d.minOrderValue ?? 0),
      maxDiscount: row.max_discount !== undefined && row.max_discount !== null 
        ? Number(row.max_discount) 
        : (d.maxDiscount !== undefined && d.maxDiscount !== null ? Number(d.maxDiscount) : undefined),
      startDate: row.start_date || d.startDate || undefined,
      expiresAt: row.expires_at || d.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      usageLimit: Number(row.usage_limit ?? d.usageLimit ?? 100),
      usedCount: Number(row.used_count ?? d.usedCount ?? 0),
      active: row.active !== undefined ? Boolean(row.active) : Boolean(d.active !== false),
      createdAt: row.created_at || d.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || d.updatedAt || new Date().toISOString()
    };
  }

  return {
    id: String(row.id),
    code: String(row.code || '').toUpperCase().trim(),
    discountType: (row.discount_type || row.discountType || 'percentage') as 'percentage' | 'fixed',
    discountValue: Number(row.discount_value ?? row.discountValue ?? 0),
    minOrderValue: Number(row.min_order_value ?? row.minOrderValue ?? 0),
    maxDiscount: row.max_discount !== undefined && row.max_discount !== null 
      ? Number(row.max_discount) 
      : (row.maxDiscount !== undefined && row.maxDiscount !== null ? Number(row.maxDiscount) : undefined),
    startDate: row.start_date || row.startDate || undefined,
    expiresAt: row.expires_at || row.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    usageLimit: Number(row.usage_limit ?? row.usageLimit ?? 100),
    usedCount: Number(row.used_count ?? row.usedCount ?? 0),
    active: row.active !== undefined ? Boolean(row.active) : true,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapCouponToSupabase(c: Coupon): Record<string, any> {
  const coupId = (c.id && String(c.id).trim()) ? String(c.id).trim() : `coup-${Date.now()}`;
  const code = (c.code || '').toUpperCase().trim();
  const now = new Date().toISOString();

  return {
    id: coupId,
    code,
    discount_type: c.discountType || 'percentage',
    discount_value: Number(c.discountValue || 0),
    min_order_value: Number(c.minOrderValue || 0),
    max_discount: c.maxDiscount !== undefined && c.maxDiscount !== null ? Number(c.maxDiscount) : null,
    start_date: c.startDate || now.slice(0, 10),
    expires_at: c.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    usage_limit: Number(c.usageLimit || 100),
    used_count: Number(c.usedCount || 0),
    active: c.active !== false,
    data: { ...c, id: coupId, code },
    created_at: c.createdAt || now,
    updated_at: now
  };
}

export interface SupabaseCouponsResult {
  coupons: Coupon[];
  connected: boolean;
  tableMissing: boolean;
  error?: string;
}

/**
 * Retrieve all coupons from Supabase coupons table
 */
export async function getCouponsFromSupabase(): Promise<SupabaseCouponsResult> {
  if (!client) {
    return { coupons: [], connected: false, tableMissing: false, error: 'Supabase client not initialized' };
  }
  try {
    const { data, error } = await client
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const isMissing = isTableMissingError(error);
      return {
        coupons: [],
        connected: true,
        tableMissing: isMissing,
        error: error.message
      };
    }

    if (!data) {
      return { coupons: [], connected: true, tableMissing: false };
    }

    const mapped = data.map(mapSupabaseToCoupon);
    return {
      coupons: mapped,
      connected: true,
      tableMissing: false
    };
  } catch (err: any) {
    return {
      coupons: [],
      connected: false,
      tableMissing: false,
      error: err?.message || 'Failed to query Supabase coupons'
    };
  }
}

/**
 * Save or update a coupon in Supabase coupons table
 */
export async function saveCouponToSupabase(
  coupon: Coupon
): Promise<{ success: boolean; data?: any; error?: string; tableMissing?: boolean }> {
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    const row = mapCouponToSupabase(coupon);
    const { data, error } = await client.from('coupons').upsert(row).select();

    if (error) {
      const isMissing = isTableMissingError(error);
      console.warn('[Atelier V] Supabase saveCoupon notice:', error.message);
      return { success: false, error: error.message, tableMissing: isMissing };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[Atelier V] Supabase saveCoupon error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Delete a coupon from Supabase coupons table
 */
export async function deleteCouponFromSupabase(
  id: string
): Promise<{ success: boolean; error?: string; tableMissing?: boolean }> {
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    const { error } = await client.from('coupons').delete().eq('id', id);
    if (error) {
      const isMissing = isTableMissingError(error);
      console.warn('[Atelier V] Supabase deleteCoupon notice:', error.message);
      return { success: false, error: error.message, tableMissing: isMissing };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Atelier V] Supabase deleteCoupon error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Increment usage count of a coupon in Supabase
 */
export async function incrementCouponUsageInSupabase(
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!client || !code) return { success: false };
  try {
    const { data, error } = await client
      .from('coupons')
      .select('id, used_count')
      .eq('code', code.toUpperCase().trim())
      .limit(1);

    if (error || !data || data.length === 0) {
      return { success: false, error: error?.message || 'Coupon not found' };
    }

    const currentCount = Number(data[0].used_count || 0);
    const { error: updateErr } = await client
      .from('coupons')
      .update({
        used_count: currentCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', data[0].id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

