import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Order } from '../types/index.ts';

const rawUrl =
  process.env.SUPABASE_URL ||
  'https://mnlmparjckweabyvepfd.supabase.co';

// Sanitize URL by removing /rest/v1 or trailing slashes
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_PPRKxUcU0-SIGo15oIsUlQ_Cfly-iT-';

export const SUPABASE_BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

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

export const isSupabaseConnected = (): boolean => {
  return client !== null;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  return client;
};

// =========================================================================
// SUPABASE STORAGE: Product Image Uploads
// =========================================================================

/**
 * Upload product image (base64 dataUrl or binary) directly to Supabase Storage.
 * Returns the public URL of the uploaded image on Supabase CDN.
 */
export async function uploadImageToSupabase(
  filename: string,
  dataUrl: string
): Promise<string | null> {
  if (!client) return null;
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const contentType = matches ? matches[1] : 'image/jpeg';
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(dataUrl, 'base64');

    const ext = contentType.split('/')[1] || 'jpg';
    const cleanExt = (ext === 'jpeg' ? 'jpg' : ext).replace(/[^a-zA-Z0-9]/g, '');
    const cleanBaseName = (filename || 'product')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `products/${Date.now()}_${cleanBaseName}.${cleanExt}`;

    let { error } = await client.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        upsert: true
      });

    // If bucket does not exist, attempt auto-creation
    if (error && (error.message?.includes('not found') || error.message?.includes('Bucket'))) {
      try {
        await client.storage.createBucket(SUPABASE_BUCKET_NAME, { public: true });
        const retry = await client.storage
          .from(SUPABASE_BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType,
            upsert: true
          });
        error = retry.error;
      } catch {
        // Ignored
      }
    }

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
// SUPABASE DATABASE: Order System
// =========================================================================

/**
 * Persist order to Supabase orders table
 */
export async function saveOrderToSupabase(order: Order): Promise<boolean> {
  if (!client) return false;
  try {
    const orderRow: Record<string, any> = {
      id: order.id,
      customer: order.customer,
      items: order.items,
      pricing: order.pricing,
      payment: order.payment,
      status: order.status,
      tracking_number: order.trackingNumber || null,
      shipping_carrier: order.shippingCarrier || null,
      notes: order.notes || null,
      created_at: order.createdAt,
      updated_at: order.updatedAt
    };

    const { error } = await client.from('orders').upsert(orderRow);

    if (error) {
      console.warn('[Atelier V] Supabase saveOrder notice:', error.message);
      // Fallback with core columns if specific column names differ
      const coreRow = {
        id: order.id,
        customer: order.customer,
        items: order.items,
        pricing: order.pricing,
        payment: order.payment,
        status: order.status
      };
      const retry = await client.from('orders').upsert(coreRow);
      if (retry.error) {
        console.warn('[Atelier V] Supabase saveOrder retry notice:', retry.error.message);
        return false;
      }
    }
    return true;
  } catch (err: any) {
    console.warn('[Atelier V] Supabase saveOrder error:', err?.message || err);
    return false;
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
