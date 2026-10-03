import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Order, Product } from '../types/index.ts';

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

// Hardcoded fallback matches the user's project (public anon key is safe for client code)
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

// =========================================================================
// SUPABASE STORAGE: Product Image Uploads
// =========================================================================

/**
 * Upload product image (base64 dataUrl, binary Buffer, or browser File) directly to Supabase Storage.
 * Returns the public URL of the uploaded image on Supabase CDN.
 */
export async function uploadImageToSupabase(
  filename: string,
  fileOrData: any
): Promise<string | null> {
  if (!client) return null;
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
      console.warn('[Atelier V] Supabase Storage upload notice:', error.message);
      return null;
    }

    const { data: urlData } = client.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      console.log('[Atelier V] Uploaded image to Supabase Storage CDN:', urlData.publicUrl);
      return urlData.publicUrl;
    }
    return null;
  } catch (err: any) {
    console.warn('[Atelier V] Supabase Storage upload error:', err?.message || err);
    return null;
  }
}

// =========================================================================
// SUPABASE DATABASE: Products System
// =========================================================================

export function mapSupabaseToProduct(row: any): Product {
  if (row.data && typeof row.data === 'object' && row.data.name) {
    return {
      ...row.data,
      id: row.id || row.data.id,
      sku: row.sku || row.data.sku,
      slug: row.slug || row.data.slug,
      name: row.name || row.data.name,
      price: Number(row.price ?? row.data.price ?? 0),
      originalPrice: Number(row.original_price ?? row.data.originalPrice ?? row.price ?? 0),
      stock: Number(row.stock ?? row.data.stock ?? 0),
      category: row.category || row.data.category || 'Objects',
      published: row.published !== undefined ? Boolean(row.published) : Boolean(row.data.published ?? true),
      images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (row.data.images || []),
      createdAt: row.created_at || row.data.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || row.data.updatedAt || new Date().toISOString()
    };
  }

  return {
    id: row.id,
    sku: row.sku || `SKU-${row.id}`,
    slug: row.slug || `creation-${row.id}`,
    name: row.name || 'Untitled Creation',
    shortDescription: row.short_description || row.shortDescription || '',
    description: row.description || '',
    category: row.category || 'Objects',
    subcategory: row.subcategory || undefined,
    brand: row.brand || 'Atelier V',
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
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || row.reviewCount || 0),
    seo: row.seo || { metaTitle: '', metaDescription: '', keywords: '' },
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapProductToSupabase(p: Product): Record<string, any> {
  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    short_description: p.shortDescription || '',
    description: p.description || '',
    category: p.category,
    subcategory: p.subcategory || null,
    brand: p.brand || 'Atelier V',
    tags: p.tags || [],
    price: p.price,
    original_price: p.originalPrice || p.price,
    discount_percent: p.discountPercent || 0,
    stock: p.stock,
    low_stock_threshold: p.lowStockThreshold || 3,
    images: p.images || [],
    featured: Boolean(p.featured),
    bestseller: Boolean(p.bestseller),
    new_arrival: Boolean(p.newArrival),
    published: p.published !== false,
    specifications: p.specifications || [],
    variants: p.variants || [],
    rating: p.rating || 5,
    review_count: p.reviewCount || 0,
    seo: p.seo || {},
    data: p,
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
      const isMissing = error.message.includes('PGRST205') || error.message.includes('does not exist');
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

    return {
      products: data.map(mapSupabaseToProduct),
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
export async function saveProductToSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    const row = mapProductToSupabase(product);
    const { error } = await client.from('products').upsert(row);

    if (error) {
      console.warn('[Atelier V] Supabase saveProduct notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
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
