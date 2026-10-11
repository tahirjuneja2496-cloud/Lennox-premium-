import { Product, Category, Order, CustomerProfile, Coupon, Review, StoreSettings } from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS
} from '../data/initialData';
import {
  getProductsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  seedProductsToSupabase,
  uploadImageToSupabase,
  getOrdersFromSupabase,
  saveOrderToSupabase,
  updateOrderInSupabase,
  getCouponsFromSupabase,
  saveCouponToSupabase,
  deleteCouponFromSupabase,
  isSupabaseConnected,
  isTableMissingError,
  COUPON_MIGRATION_SQL
} from '../db/supabase';

let cachedAdminToken: string | null = null;

export const setAdminToken = (token: string | null) => {
  cachedAdminToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('atelierv_adm_token', token);
      sessionStorage.setItem('atelierv_adm_token', token);
    } else {
      localStorage.removeItem('atelierv_adm_token');
      sessionStorage.removeItem('atelierv_adm_token');
    }
  }
};

export const getAdminToken = (): string | null => {
  if (!cachedAdminToken && typeof window !== 'undefined') {
    cachedAdminToken = localStorage.getItem('atelierv_adm_token') || sessionStorage.getItem('atelierv_adm_token');
  }
  return cachedAdminToken;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Database connection state monitor for admin feedback
let lastSupabaseStatus: {
  connected: boolean;
  tableMissing: boolean;
  error?: string;
} = {
  connected: isSupabaseConnected(),
  tableMissing: false
};

export const getSupabaseStatus = () => lastSupabaseStatus;

let memoryCachedProducts: Product[] | null = null;

export const api = {
  // Settings
  async getSettings(): Promise<StoreSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return INITIAL_SETTINGS;
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return { ...INITIAL_SETTINGS, ...settings };
  },

  // Products (Direct Supabase Sync - Works on Vercel, phones, and everywhere)
  async getProducts(): Promise<Product[]> {
    // 1. Direct Supabase Query (source of truth across all devices)
    const spResult = await getProductsFromSupabase();
    lastSupabaseStatus = {
      connected: spResult.connected,
      tableMissing: spResult.tableMissing,
      error: spResult.error
    };

    if (spResult.error) {
      console.error('[Atelier V] Supabase getProducts error:', spResult.error);
    }

    if (spResult.products && spResult.products.length > 0) {
      memoryCachedProducts = spResult.products;
      return spResult.products;
    }

    // 2. If table exists but has 0 products, auto-seed Supabase with catalog
    if (spResult.connected && !spResult.tableMissing && !spResult.error && spResult.products && spResult.products.length === 0) {
      await seedProductsToSupabase(INITIAL_PRODUCTS);
      const recheck = await getProductsFromSupabase();
      if (recheck.products && recheck.products.length > 0) {
        memoryCachedProducts = recheck.products;
        return recheck.products;
      }
    }

    // 3. Optional local backend check
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          memoryCachedProducts = data;
          return data;
        }
      }
    } catch {
      // Continue
    }

    if (memoryCachedProducts && memoryCachedProducts.length > 0) {
      return memoryCachedProducts;
    }

    return INITIAL_PRODUCTS;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const newId = (product.id && typeof product.id === 'string' && product.id.trim())
      ? product.id.trim()
      : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const fullProduct: Product = {
      id: newId,
      sku: (product.sku && product.sku.trim()) || `SKU-${Date.now()}`,
      slug: (product.slug && product.slug.trim()) || ((product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `product-${Date.now()}`),
      name: (product.name && product.name.trim()) || 'New Creation',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      category: product.category || 'Lighting & Objects',
      subcategory: product.subcategory || undefined,
      brand: product.brand || 'Atelier V Editions',
      tags: Array.isArray(product.tags) ? product.tags : [],
      price: Number(product.price || 0),
      originalPrice: Number(product.originalPrice || product.price || 0),
      discountPercent: Number(product.discountPercent || 0),
      stock: Number(product.stock ?? 1),
      lowStockThreshold: Number(product.lowStockThreshold || 3),
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : ['/images/product_sculptural_lamp_1790850449675.jpg'],
      featured: Boolean(product.featured),
      bestseller: Boolean(product.bestseller),
      newArrival: Boolean(product.newArrival),
      published: product.published !== false,
      specifications: Array.isArray(product.specifications) ? product.specifications : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
      variantConfig: product.variantConfig || undefined,
      rating: Number(product.rating || 5),
      reviewCount: Number(product.reviewCount || 0),
      seo: product.seo || { metaTitle: '', metaDescription: '', keywords: '' },
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save directly to Supabase
    const spResult = await saveProductToSupabase(fullProduct);
    if (!spResult.success) {
      if (isTableMissingError(spResult.error)) {
        throw new Error("Supabase 'products' table missing in database (relation does not exist in schema).");
      }
      throw new Error(spResult.error || 'Failed to save product to Supabase');
    }

    memoryCachedProducts = null;

    // Also persist through backend API if reachable
    try {
      fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(fullProduct)
      }).catch(() => {});
    } catch {
      // Backend is optional
    }

    return fullProduct;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const updated: Product = {
      ...product,
      id,
      name: product.name || 'Untitled Creation',
      sku: product.sku || `SKU-${id}`,
      slug: product.slug || id,
      category: product.category || 'Lighting & Objects',
      price: Number(product.price ?? 0),
      originalPrice: Number(product.originalPrice ?? product.price ?? 0),
      stock: Number(product.stock ?? 0),
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : ['/images/product_sculptural_lamp_1790850449675.jpg'],
      published: product.published !== false,
      updatedAt: new Date().toISOString()
    } as Product;

    // Update in Supabase
    const spResult = await saveProductToSupabase(updated);
    if (!spResult.success) {
      if (isTableMissingError(spResult.error)) {
        throw new Error("Supabase 'products' table missing in database (relation does not exist in schema).");
      }
      throw new Error(spResult.error || 'Failed to update product in Supabase');
    }

    memoryCachedProducts = null;

    try {
      fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      }).catch(() => {});
    } catch {
      // Backend is optional
    }
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const spResult = await deleteProductFromSupabase(id);
    if (!spResult.success) {
      if (isTableMissingError(spResult.error)) {
        throw new Error("Supabase 'products' table missing in database (relation does not exist).");
      }
      throw new Error(spResult.error || 'Failed to delete product from Supabase');
    }

    memoryCachedProducts = null;

    try {
      fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).catch(() => {});
    } catch {
      // Ignored
    }
    return true;
  },

  async duplicateProduct(id: string): Promise<Product> {
    const products = await this.getProducts();
    const original = products.find(p => p.id === id);
    if (!original) {
      throw new Error('Original product not found');
    }

    const uniqueId = `prod-${Date.now()}`;
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const newSku = `${original.sku}-COPY-${randSuffix}`;
    const newSlug = `${original.slug}-copy-${randSuffix}`;

    const duplicate: Product = {
      ...original,
      id: uniqueId,
      name: `${original.name} (Copy)`,
      sku: newSku,
      slug: newSlug,
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await this.createProduct(duplicate);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return INITIAL_CATEGORIES;
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const newCat: Category = {
      id: cat.id || `cat-${Date.now()}`,
      name: cat.name || 'New Category',
      slug: cat.slug || (cat.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: cat.description || '',
      image: cat.image || '',
      enabled: cat.enabled !== false,
      order: cat.order || 99,
      subcategories: cat.subcategories || []
    };

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCat)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return newCat;
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(cat)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { id, name: cat.name || '', slug: cat.slug || '', description: cat.description || '', image: cat.image || '', enabled: true, order: 1 } as Category;
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch {
      // Fallback
    }
    return true;
  },

  // Orders (Synced with Supabase PostgreSQL)
  async getOrders(): Promise<Order[]> {
    // 1. First attempt to read directly from Supabase
    try {
      const spOrders = await getOrdersFromSupabase();
      if (spOrders && spOrders.length > 0) {
        return spOrders;
      }
    } catch (e) {
      console.warn('Supabase orders fetch note:', e);
    }

    // 2. Fetch from backend API
    try {
      const res = await fetch('/api/orders', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.warn('Orders fetch notice:', err?.message || err);
    }
    return [];
  },

  async createOrder(order: any): Promise<Order> {
    const fullOrder: Order = {
      id: order.id || `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: order.customer,
      items: order.items,
      pricing: order.pricing,
      payment: order.payment,
      status: order.status || 'Pending',
      trackingNumber: order.trackingNumber,
      shippingCarrier: order.shippingCarrier,
      notes: order.notes,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString()
    };

    // 1. Direct Supabase save (Works on Vercel, mobile, preview, everywhere)
    const spResult = await saveOrderToSupabase(fullOrder);
    if (!spResult.success && spResult.error) {
      console.warn('Supabase order insert note:', spResult.error);
    }

    // 2. Notify backend API if available
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullOrder)
      });
    } catch {
      // Backend is optional on static Vercel
    }

    return fullOrder;
  },

  async updateOrder(id: string, update: Partial<Order>): Promise<Order> {
    await updateOrderInSupabase(id, update);

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(update)
      });
      if (res.ok) return await res.json();
    } catch {
      // Supabase is updated
    }
    return { id, ...update } as Order;
  },

  // Customers
  async getCustomers(): Promise<CustomerProfile[]> {
    try {
      const res = await fetch('/api/customers', {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return INITIAL_CUSTOMERS;
  },

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    // 1. Try server endpoint
    try {
      const res = await fetch('/api/coupons', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('atelierv_coupons_cache', JSON.stringify(data));
            } catch {}
          }
          return data;
        }
      }
    } catch (err) {
      console.warn('API getCoupons notice:', err);
    }

    // 2. Direct Supabase read if server is unreachable
    if (isSupabaseConnected()) {
      try {
        const spRes = await getCouponsFromSupabase();
        if (spRes.connected && !spRes.tableMissing && spRes.coupons.length > 0) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('atelierv_coupons_cache', JSON.stringify(spRes.coupons));
            } catch {}
          }
          return spRes.coupons;
        }
      } catch (e) {
        console.warn('Direct Supabase coupon fetch notice:', e);
      }
    }

    // 3. Check client localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('atelierv_coupons_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }

    return INITIAL_COUPONS;
  },

  async getCouponDatabaseStatus(): Promise<{ supabaseConnected: boolean; tableMissing: boolean; count: number; error?: string; migrationSql: string }> {
    try {
      const res = await fetch('/api/coupons/status');
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConnected()) {
      try {
        const sp = await getCouponsFromSupabase();
        return {
          supabaseConnected: sp.connected,
          tableMissing: sp.tableMissing,
          count: sp.coupons.length,
          error: sp.error,
          migrationSql: COUPON_MIGRATION_SQL
        };
      } catch {}
    }

    return {
      supabaseConnected: false,
      tableMissing: true,
      count: 0,
      migrationSql: COUPON_MIGRATION_SQL
    };
  },

  async createCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    const rawCode = coupon.code ? String(coupon.code).trim().toUpperCase() : '';
    if (!rawCode) {
      throw new Error('Coupon code is required');
    }

    const now = new Date().toISOString();
    const newCoupon: Coupon = {
      id: coupon.id || `coup-${Date.now()}`,
      code: rawCode,
      discountType: coupon.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Math.max(0, Number(coupon.discountValue ?? 10)),
      minOrderValue: Math.max(0, Number(coupon.minOrderValue ?? 0)),
      maxDiscount: coupon.maxDiscount !== undefined && coupon.maxDiscount !== null ? Number(coupon.maxDiscount) : undefined,
      startDate: coupon.startDate || now.slice(0, 10),
      expiresAt: coupon.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      usageLimit: Math.max(1, Number(coupon.usageLimit ?? 100)),
      usedCount: 0,
      active: coupon.active !== false,
      createdAt: now,
      updatedAt: now
    };

    // 1. Direct Supabase save if client connected
    if (isSupabaseConnected()) {
      try {
        const spRes = await saveCouponToSupabase(newCoupon);
        if (spRes.error && !spRes.tableMissing) {
          console.warn('[Atelier V] Supabase coupon save notice:', spRes.error);
        }
      } catch (e) {
        console.warn('[Atelier V] Client Supabase coupon save notice:', e);
      }
    }

    // 2. Server API call
    let serverSaved: Coupon = newCoupon;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCoupon)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to create coupon (HTTP ${res.status})`);
      }
      serverSaved = await res.json();
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
      console.warn('Server coupon create warning, retaining local persistence:', err);
    }

    // 3. Update localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('atelierv_coupons_cache');
        const list: Coupon[] = cached ? JSON.parse(cached) : [];
        const filtered = list.filter(c => c.code.toUpperCase() !== serverSaved.code.toUpperCase());
        localStorage.setItem('atelierv_coupons_cache', JSON.stringify([serverSaved, ...filtered]));
      } catch {}
    }

    return serverSaved;
  },

  async updateCoupon(id: string, coupon: Partial<Coupon>): Promise<Coupon> {
    const cleanId = String(id).trim();

    // 1. Update in Supabase
    if (isSupabaseConnected()) {
      try {
        await saveCouponToSupabase({ id: cleanId, ...coupon } as Coupon);
      } catch (e) {
        console.warn('Supabase coupon update notice:', e);
      }
    }

    // 2. Server API call
    let updated: Coupon = { id: cleanId, ...coupon } as Coupon;
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(coupon)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update coupon (HTTP ${res.status})`);
      }
      updated = await res.json();
    } catch (err: any) {
      console.warn('Server coupon update notice:', err);
    }

    // 3. Update localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('atelierv_coupons_cache');
        if (cached) {
          const list: Coupon[] = JSON.parse(cached);
          const mapped = list.map(c => (c.id === cleanId || c.code.toUpperCase() === (coupon.code || '').toUpperCase() ? { ...c, ...updated } : c));
          localStorage.setItem('atelierv_coupons_cache', JSON.stringify(mapped));
        }
      } catch {}
    }

    return updated;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const cleanId = String(id).trim();

    // 1. Delete in Supabase
    if (isSupabaseConnected()) {
      try {
        await deleteCouponFromSupabase(cleanId);
      } catch (e) {
        console.warn('Supabase coupon delete notice:', e);
      }
    }

    // 2. Server API call
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to delete coupon (HTTP ${res.status})`);
      }
    } catch (err: any) {
      console.warn('Server coupon delete notice:', err);
    }

    // 3. Update localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('atelierv_coupons_cache');
        if (cached) {
          const list: Coupon[] = JSON.parse(cached);
          const filtered = list.filter(c => c.id !== cleanId && c.code.toUpperCase() !== cleanId.toUpperCase());
          localStorage.setItem('atelierv_coupons_cache', JSON.stringify(filtered));
        }
      } catch {}
    }

    return true;
  },

  async validateCoupon(code: string, cartTotal: number): Promise<{ valid: boolean; code: string; discountAmount: number; discountType: string; discountValue: number; minOrderValue?: number; maxDiscount?: number }> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      throw new Error('Please enter a promotional code');
    }

    // 1. Try server-side validation (authoritative)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, subtotal: cartTotal, cartTotal })
      });
      if (res.ok) {
        return await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid or expired promotional code');
      }
    } catch (err: any) {
      // If error came from the server rejection (400, 404, etc.), rethrow it immediately
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }

    // 2. Client-side fallback if network offline
    let couponsToCheck: Coupon[] = INITIAL_COUPONS;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('atelierv_coupons_cache');
        if (cached) {
          couponsToCheck = [...JSON.parse(cached), ...INITIAL_COUPONS];
        }
      } catch {}
    }

    const matched = couponsToCheck.find(c => c.code.toUpperCase() === cleanCode);
    if (!matched) {
      throw new Error(`Promotional code '${cleanCode}' is invalid`);
    }
    if (!matched.active) {
      throw new Error(`Promotional code '${cleanCode}' is no longer active`);
    }
    if (matched.startDate && new Date(matched.startDate) > new Date()) {
      throw new Error(`Promotional code '${cleanCode}' will become active on ${matched.startDate}`);
    }
    if (matched.expiresAt && new Date(matched.expiresAt) < new Date()) {
      throw new Error(`Promotional code '${cleanCode}' expired on ${matched.expiresAt}`);
    }
    if (matched.usageLimit && matched.usedCount >= matched.usageLimit) {
      throw new Error(`Promotional code '${cleanCode}' has reached its usage limit`);
    }
    if (matched.minOrderValue && cartTotal < matched.minOrderValue) {
      throw new Error(`Minimum order value of ₹${matched.minOrderValue} required for code '${cleanCode}'`);
    }

    let discountAmount = 0;
    if (matched.discountType === 'percentage') {
      discountAmount = (cartTotal * matched.discountValue) / 100;
      if (matched.maxDiscount && discountAmount > matched.maxDiscount) {
        discountAmount = matched.maxDiscount;
      }
    } else {
      discountAmount = Math.min(matched.discountValue, cartTotal);
    }

    return {
      valid: true,
      code: matched.code,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      minOrderValue: matched.minOrderValue,
      maxDiscount: matched.maxDiscount
    };
  },

  // Reviews
  async getReviews(productId?: string): Promise<Review[]> {
    try {
      const url = productId ? `/api/reviews?productId=${productId}` : '/api/reviews';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return productId ? INITIAL_REVIEWS.filter(r => r.productId === productId) : INITIAL_REVIEWS;
  },

  async createReview(review: Partial<Review>): Promise<Review> {
    const newRev: Review = {
      id: review.id || `rev-${Date.now()}`,
      productId: review.productId || '',
      customerName: review.customerName || 'Verified Patron',
      verified: review.verified !== false,
      rating: review.rating || 5,
      title: review.title || '',
      comment: review.comment || '',
      images: review.images || [],
      featured: Boolean(review.featured),
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    return newRev;
  },

  async updateReview(id: string, review: Partial<Review>): Promise<Review> {
    return { id, ...review } as Review;
  },

  // File Upload (Direct to Supabase Storage 'product-images' bucket)
  async uploadImage(file: File): Promise<{ url: string; success: boolean }> {
    // Direct Supabase Storage Upload from browser/phone
    const spResult = await uploadImageToSupabase(file.name, file);
    if (spResult.url) {
      return { url: spResult.url, success: true };
    }

    // If direct upload failed with error, try serverless fallback then throw real error
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file from device'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataUrl })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) return { url: data.url, success: true };
      }
    } catch {
      // Fallback failed
    }

    throw new Error(spResult.error || 'Failed to upload image to Supabase Storage (bucket: product-images)');
  },

  // Admin Auth (Universal for Vercel, any phone, tablet, browser, or preview)
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token: string; admin: any }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Direct credential validation (Works on Vercel production with zero backend serverless failure)
    const isEmailValid = cleanEmail === 'tahirjuneja2496@gmail.com' || cleanEmail === 'admin' || cleanEmail === 'admin@atelierv.com';
    const isPassValid = cleanPass === 'kaif@#9650';

    if (isEmailValid && isPassValid) {
      const token = `adm_sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const adminData = {
        id: 'adm-01',
        name: 'Executive Concierge',
        email: 'tahirjuneja2496@gmail.com',
        role: 'Super Admin'
      };
      setAdminToken(token);

      // Also notify backend in background if available
      try {
        fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPass })
        }).catch(() => {});
      } catch {
        // Backend optional
      }

      return {
        success: true,
        token,
        admin: adminData
      };
    }

    // 2. Server authentication attempt if custom credentials were changed on backend
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setAdminToken(data.token);
        }
        return data;
      }
    } catch {
      // Continue to rejection
    }

    throw new Error('Invalid email or password');
  },

  async adminLogout(): Promise<void> {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch {
      // Ignored
    } finally {
      setAdminToken(null);
    }
  }
};
