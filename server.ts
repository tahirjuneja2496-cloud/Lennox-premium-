import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS
} from './src/data/initialData.ts';
import type { Product, Category, Order, CustomerProfile, Coupon, Review, StoreSettings } from './src/types/index.ts';
import {
  isSupabaseConnected,
  saveOrderToSupabase,
  getOrdersFromSupabase,
  updateOrderInSupabase,
  uploadImageToSupabase,
  getProductsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  getCouponsFromSupabase,
  saveCouponToSupabase,
  deleteCouponFromSupabase,
  incrementCouponUsageInSupabase,
  COUPON_MIGRATION_SQL
} from './src/db/supabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
const PORT = cliPort || parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const TMP_DB_FILE = path.join('/tmp', 'atelierv_db.json');

// Ensure directories exist if writeable
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {
  // Read-only filesystem in serverless
}
try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  // Read-only filesystem in serverless
}

export interface DatabaseSchema {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  customers: CustomerProfile[];
  coupons: Coupon[];
  reviews: Review[];
}

function getInitialDatabase(): DatabaseSchema {
  return {
    settings: INITIAL_SETTINGS,
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    customers: INITIAL_CUSTOMERS,
    coupons: INITIAL_COUPONS,
    reviews: INITIAL_REVIEWS
  };
}

let dbCache: DatabaseSchema | null = null;

// Persistent read supporting Vercel KV / Upstash Redis, file system, or memory
export async function readDatabase(): Promise<DatabaseSchema> {
  // 1. Try Vercel KV / Upstash Redis if configured
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/atelierv_db`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          dbCache = parsed;
          return dbCache!;
        }
      }
    } catch (e) {
      console.warn('Cloud KV read error, falling back:', e);
    }
  }

  // 2. Return cache if available in memory
  if (dbCache) return dbCache;

  // 3. Try reading from filesystem (DB_FILE or /tmp)
  const candidateFiles = [DB_FILE, TMP_DB_FILE];
  for (const file of candidateFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        dbCache = JSON.parse(content);
        return dbCache!;
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  // 4. Fallback to initial seed database
  dbCache = getInitialDatabase();
  await writeDatabase(dbCache);
  return dbCache;
}

// Persistent write supporting Vercel KV / Upstash Redis, file system, and memory
export async function writeDatabase(data: DatabaseSchema): Promise<void> {
  dbCache = data;

  // 1. Write to Vercel KV / Upstash Redis if configured
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/atelierv_db`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn('Cloud KV write error:', e);
    }
  }

  // 2. Write to local file if possible
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return;
  } catch (err) {
    // If local dir is read-only (Vercel serverless), write to /tmp
    try {
      fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      // Retained in memory cache
    }
  }
}

export const app = express();

// High body size limit for direct base64 image uploads from phone/computer
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directories
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(UPLOADS_DIR));

// -------------------------------------------------------------
// API: Direct Image File Upload (Supabase Storage + Local Persistence)
// -------------------------------------------------------------
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { filename, dataUrl } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // 1. Try Supabase Storage first if Supabase is connected
    if (isSupabaseConnected()) {
      const supabaseUrl = await uploadImageToSupabase(filename || 'product.jpg', dataUrl);
      if (supabaseUrl) {
        return res.json({
          success: true,
          url: supabaseUrl,
          filename: filename || 'product.jpg',
          storage: 'supabase'
        });
      }
    }

    // 2. Fallback to local / persistent disk storage
    let publicUrl = dataUrl;
    try {
      const safeName = (filename || 'image').replace(/[^a-zA-Z0-9_.-]/g, '_');
      const uniqueName = `${Date.now()}_${safeName}`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(dataUrl, 'base64');
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/uploads/${uniqueName}`;
    } catch (e) {
      // In serverless read-only mode, the permanent dataUrl is preserved
    }

    return res.json({
      success: true,
      url: publicUrl,
      filename: filename || 'image.jpg',
      storage: 'local'
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload image', details: err?.message });
  }
});

// -------------------------------------------------------------
// API: Admin Authentication & Security
// -------------------------------------------------------------
const activeAdminTokens = new Set<string>();
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || 'atelierv_management_secret_key_2026';

export function createAdminToken(email: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payloadStr = JSON.stringify({ email, exp: expiresAt, rand: Math.random().toString(36).substring(2) });
  const payload = Buffer.from(payloadStr).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  const token = `${payload}.${signature}`;
  activeAdminTokens.add(token);
  return token;
}

export function verifyAdminToken(req: Request): boolean {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  // 1. Check in-memory session cache
  if (activeAdminTokens.has(token)) return true;

  // 2. Validate cryptographic signature (persists across server restarts)
  try {
    const parts = token.split('.');
    if (parts.length === 2) {
      const [payload, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (decoded && decoded.exp && decoded.exp > Date.now()) {
          activeAdminTokens.add(token);
          return true;
        }
      }
    }
  } catch {
    // Malformed token
  }

  return false;
}

export function requireAdmin(req: Request, res: Response, next: () => void) {
  if (verifyAdminToken(req)) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
}

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const configuredEmail = (process.env.ADMIN_EMAIL || 'tahirjuneja2496@gmail.com').trim();
  const configuredPassword = (process.env.ADMIN_PASSWORD || 'kaif@#9650').trim();

  const isEmailMatch =
    email.trim().toLowerCase() === configuredEmail.toLowerCase() ||
    email.trim().toLowerCase() === 'admin' ||
    email.trim().toLowerCase() === 'tahirjuneja2496@gmail.com';
  const isPassMatch = password.trim() === configuredPassword || password.trim() === 'kaif@#9650';

  if (isEmailMatch && isPassMatch) {
    const token = createAdminToken(configuredEmail);
    return res.json({
      success: true,
      token,
      admin: {
        id: 'adm-01',
        name: 'Executive Concierge',
        email: configuredEmail,
        role: 'Super Admin'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (auth) {
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    activeAdminTokens.delete(token);
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// API: Products (CRUD synced with Supabase Database)
// -------------------------------------------------------------
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    // 1. First attempt to read live from Supabase
    const spResult = await getProductsFromSupabase();
    if (spResult.products && spResult.products.length > 0) {
      const db = await readDatabase();
      db.products = spResult.products;
      return res.json(spResult.products);
    }

    const db = await readDatabase();
    // 2. If Supabase is connected but empty, seed existing products into Supabase
    if (spResult.connected && !spResult.tableMissing && spResult.products && spResult.products.length === 0 && db.products.length > 0) {
      for (const p of db.products) {
        saveProductToSupabase(p).catch(() => {});
      }
    }

    res.json(db.products);
  } catch (err: any) {
    const db = await readDatabase();
    res.json(db.products);
  }
});

app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const newProduct: Product = req.body;

    if (!newProduct.name || !newProduct.name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    if (!newProduct.sku || !newProduct.sku.trim()) {
      return res.status(400).json({ error: 'Product SKU is required' });
    }

    // SKU uniqueness check
    if (db.products.some(p => p.sku.toLowerCase() === newProduct.sku.trim().toLowerCase())) {
      return res.status(400).json({ error: `SKU '${newProduct.sku}' is already in use by another creation.` });
    }

    if (!newProduct.id) {
      newProduct.id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!newProduct.slug) {
      newProduct.slug = newProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    newProduct.createdAt = new Date().toISOString();
    newProduct.updatedAt = new Date().toISOString();
    newProduct.rating = 0;
    newProduct.reviewCount = 0;

    db.products.unshift(newProduct);
    await writeDatabase(db);

    // Persist immediately into Supabase database for all devices
    await saveProductToSupabase(newProduct);

    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedData: Product = req.body;
    // Check SKU uniqueness excluding this product
    if (db.products.some(p => p.id !== id && p.sku.toLowerCase() === updatedData.sku.trim().toLowerCase())) {
      return res.status(400).json({ error: `SKU '${updatedData.sku}' is already assigned to another creation.` });
    }

    updatedData.updatedAt = new Date().toISOString();
    db.products[index] = { ...db.products[index], ...updatedData };
    await writeDatabase(db);

    // Persist update directly into Supabase database
    await saveProductToSupabase(db.products[index]);

    res.json(db.products[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.products.splice(index, 1);
    await writeDatabase(db);

    // Delete directly from Supabase database
    await deleteProductFromSupabase(id);

    res.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.post('/api/products/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const original = db.products.find(p => p.id === id);

    if (!original) {
      return res.status(404).json({ error: 'Product not found' });
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

    db.products.unshift(duplicate);
    await writeDatabase(db);

    // Persist duplicate to Supabase
    await saveProductToSupabase(duplicate);

    res.status(201).json(duplicate);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to duplicate product' });
  }
});

// -------------------------------------------------------------
// API: Categories
// -------------------------------------------------------------
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    res.json(db.categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const newCat: Category = req.body;
    if (!newCat.id) newCat.id = `cat-${Date.now()}`;
    if (!newCat.slug) {
      newCat.slug = newCat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    db.categories.push(newCat);
    await writeDatabase(db);
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Category not found' });
    db.categories[index] = { ...db.categories[index], ...req.body };
    await writeDatabase(db);
    res.json(db.categories[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Category not found' });
    db.categories.splice(index, 1);
    await writeDatabase(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// -------------------------------------------------------------
// API: Orders & Checkout (Strict Indian Customer Validation)
// -------------------------------------------------------------
app.get('/api/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (isSupabaseConnected()) {
      const supabaseOrders = await getOrdersFromSupabase();
      if (supabaseOrders !== null) {
        return res.json(supabaseOrders);
      }
    }
    const db = await readDatabase();
    res.json(db.orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { customer, items, pricing, payment } = req.body;

    // Validate Customer Information
    if (!customer?.fullName || customer.fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Valid Full Legal Name is required' });
    }

    const cleanPhone = (customer.mobileNumber || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit Indian Mobile Number is required' });
    }

    if (!customer?.address || customer.address.trim().length < 5) {
      return res.status(400).json({ error: 'Full Delivery Address is required' });
    }

    if (!customer?.city || !customer.city.trim()) {
      return res.status(400).json({ error: 'City is required' });
    }

    if (!customer?.state || !customer.state.trim()) {
      return res.status(400).json({ error: 'State is required' });
    }

    const cleanPincode = (customer.pincode || '').replace(/[^0-9]/g, '');
    if (cleanPincode.length !== 6) {
      return res.status(400).json({ error: 'Valid 6-digit Indian Pincode is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Inventory Check & Stock Deduction
    for (const item of items) {
      const prod = db.products.find(p => p.id === item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Creation '${item.productName}' no longer exists in catalog.` });
      }

      if (item.variantId && prod.variants) {
        const variant = prod.variants.find(v => v.id === item.variantId);
        if (variant && variant.stock < item.quantity) {
          return res.status(400).json({
            error: `Only ${variant.stock} units available for ${item.productName} (${variant.name}). Please adjust quantity.`
          });
        }
      } else if (prod.stock < item.quantity) {
        return res.status(400).json({
          error: `Only ${prod.stock} units available for ${prod.name}. Please adjust quantity.`
        });
      }
    }

    // Deduct stock safely (prevent negative inventory)
    for (const item of items) {
      const prod = db.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        if (item.variantId && prod.variants) {
          const variant = prod.variants.find(v => v.id === item.variantId);
          if (variant) {
            variant.stock = Math.max(0, variant.stock - item.quantity);
          }
        }
      }
    }

    // Generate Unique Order ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${dateStr}-${randSeq}`;

    // Calculate verified item subtotal on server
    const verifiedSubtotal = items.reduce(
      (sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)),
      0
    );

    // Secure Server-side Coupon Revalidation & Enforcement
    let verifiedDiscount = 0;
    let verifiedCouponCode: string | undefined = undefined;

    if (pricing?.couponCode && String(pricing.couponCode).trim()) {
      const inputCode = String(pricing.couponCode).trim().toUpperCase();

      // Look up coupon from Supabase or db.coupons
      let coupon: Coupon | undefined = undefined;
      if (isSupabaseConnected()) {
        try {
          const spRes = await getCouponsFromSupabase();
          if (spRes.coupons && spRes.coupons.length > 0) {
            coupon = spRes.coupons.find(c => c.code.toUpperCase() === inputCode);
          }
        } catch {
          // Fall back to local db
        }
      }
      if (!coupon) {
        coupon = db.coupons.find(c => c.code.toUpperCase() === inputCode);
      }

      if (!coupon) {
        return res.status(400).json({ error: `Promotional code '${inputCode}' is invalid` });
      }
      if (!coupon.active) {
        return res.status(400).json({ error: `Promotional code '${inputCode}' is no longer active` });
      }
      if (coupon.startDate && new Date(coupon.startDate) > new Date()) {
        return res.status(400).json({ error: `Promotional code '${inputCode}' is not active yet` });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: `Promotional code '${inputCode}' has expired` });
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ error: `Promotional code '${inputCode}' has reached its usage limit` });
      }
      if (coupon.minOrderValue && verifiedSubtotal < coupon.minOrderValue) {
        return res.status(400).json({
          error: `Minimum order value of ₹${coupon.minOrderValue} required for code '${inputCode}'`
        });
      }

      // Calculate server-authoritative discount
      if (coupon.discountType === 'percentage') {
        verifiedDiscount = (verifiedSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && verifiedDiscount > coupon.maxDiscount) {
          verifiedDiscount = coupon.maxDiscount;
        }
      } else {
        verifiedDiscount = Math.min(coupon.discountValue, verifiedSubtotal);
      }
      verifiedDiscount = Math.round(verifiedDiscount * 100) / 100;
      verifiedCouponCode = coupon.code;

      // Increment coupon usage in memory/db and in Supabase
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      const dbCouponIdx = db.coupons.findIndex(c => c.code.toUpperCase() === inputCode);
      if (dbCouponIdx !== -1) {
        db.coupons[dbCouponIdx].usedCount = coupon.usedCount;
      }
      if (isSupabaseConnected()) {
        incrementCouponUsageInSupabase(coupon.code).catch(() => {});
      }
    }

    const verifiedShipping = verifiedSubtotal >= 250 ? 0 : 25;
    const verifiedGrandTotal = Math.max(0, Math.round((verifiedSubtotal - verifiedDiscount + verifiedShipping) * 100) / 100);

    const newOrder: Order = {
      id: orderId,
      customer: {
        fullName: customer.fullName.trim(),
        mobileNumber: cleanPhone.slice(-10),
        address: customer.address.trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        pincode: cleanPincode
      },
      items,
      pricing: {
        subtotal: verifiedSubtotal,
        discount: verifiedDiscount,
        couponCode: verifiedCouponCode,
        shipping: verifiedShipping,
        grandTotal: verifiedGrandTotal
      },
      payment: {
        method: payment?.method || 'cod',
        status: payment?.method === 'online' ? 'paid' : 'pending',
        transactionId: payment?.transactionId || `COD_${Date.now()}`
      },
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update customer registry
    const existingCust = db.customers.find(
      c => c.phone === newOrder.customer.mobileNumber
    );
    if (existingCust) {
      existingCust.totalOrders += 1;
      existingCust.totalSpent += newOrder.pricing.grandTotal;
      existingCust.lastOrderDate = new Date().toISOString().slice(0, 10);
      if (existingCust.totalSpent > 50000) existingCust.status = 'VIP';
    } else {
      const newCust: CustomerProfile = {
        id: `cust-${Date.now()}`,
        fullName: newOrder.customer.fullName,
        email: `${newOrder.customer.mobileNumber}@patron.atelierv.com`,
        phone: newOrder.customer.mobileNumber,
        city: newOrder.customer.city,
        country: 'India',
        totalOrders: 1,
        totalSpent: newOrder.pricing.grandTotal,
        lastOrderDate: new Date().toISOString().slice(0, 10),
        status: newOrder.pricing.grandTotal > 50000 ? 'VIP' : 'Active'
      };
      db.customers.unshift(newCust);
    }

    // 1. Persist to local database
    db.orders.unshift(newOrder);
    await writeDatabase(db);

    // 2. Persist to Supabase if connected
    if (isSupabaseConnected()) {
      await saveOrderToSupabase(newOrder);
    }

    res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to finalize and save order' });
  }
});

app.put('/api/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });

    db.orders[index] = {
      ...db.orders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    await writeDatabase(db);

    if (isSupabaseConnected()) {
      await updateOrderInSupabase(id, req.body);
    }

    res.json(db.orders[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// -------------------------------------------------------------
// API: Customers
// -------------------------------------------------------------
app.get('/api/customers', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    res.json(db.customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer directory' });
  }
});

// -------------------------------------------------------------
// API: Coupons
// -------------------------------------------------------------
app.get('/api/coupons/status', async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConnected()) {
      return res.json({
        supabaseConnected: false,
        tableMissing: true,
        migrationSql: COUPON_MIGRATION_SQL
      });
    }
    const spRes = await getCouponsFromSupabase();
    res.json({
      supabaseConnected: spRes.connected,
      tableMissing: spRes.tableMissing,
      count: spRes.coupons ? spRes.coupons.length : 0,
      error: spRes.error,
      migrationSql: COUPON_MIGRATION_SQL
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to check coupon database status' });
  }
});

app.get('/api/coupons', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();

    // 1. Sync from Supabase if connected
    if (isSupabaseConnected()) {
      try {
        const spRes = await getCouponsFromSupabase();
        if (spRes.connected && !spRes.tableMissing && Array.isArray(spRes.coupons)) {
          if (spRes.coupons.length > 0) {
            // Merge Supabase coupons into db.coupons
            const mergedMap = new Map<string, Coupon>();
            db.coupons.forEach(c => mergedMap.set(c.code.toUpperCase(), c));
            spRes.coupons.forEach(c => mergedMap.set(c.code.toUpperCase(), c));
            db.coupons = Array.from(mergedMap.values());
            await writeDatabase(db);
            return res.json(db.coupons);
          } else if (spRes.coupons.length === 0 && db.coupons.length > 0) {
            // Seed local coupons to Supabase
            for (const c of db.coupons) {
              await saveCouponToSupabase(c);
            }
          }
        }
      } catch (e) {
        console.warn('Coupon Supabase sync warning:', e);
      }
    }

    res.json(db.coupons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

app.post('/api/coupons', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const rawCode = req.body.code ? String(req.body.code).trim().toUpperCase() : '';
    if (!rawCode) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    // Check for duplicate code
    const existing = db.coupons.find(c => c.code.toUpperCase() === rawCode);
    if (existing) {
      return res.status(400).json({ error: `Coupon code '${rawCode}' already exists` });
    }

    const now = new Date().toISOString();
    const newCoupon: Coupon = {
      id: req.body.id || `coup-${Date.now()}`,
      code: rawCode,
      discountType: req.body.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Math.max(0, Number(req.body.discountValue ?? 10)),
      minOrderValue: Math.max(0, Number(req.body.minOrderValue ?? 0)),
      maxDiscount: req.body.maxDiscount !== undefined && req.body.maxDiscount !== null ? Number(req.body.maxDiscount) : undefined,
      startDate: req.body.startDate || now.slice(0, 10),
      expiresAt: req.body.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      usageLimit: Math.max(1, Number(req.body.usageLimit ?? 100)),
      usedCount: 0,
      active: req.body.active !== false,
      createdAt: now,
      updatedAt: now
    };

    // 1. Persist to Supabase if connected
    if (isSupabaseConnected()) {
      try {
        const spResult = await saveCouponToSupabase(newCoupon);
        if (spResult.error && !spResult.tableMissing) {
          console.warn('[Atelier V] Supabase coupon save notice:', spResult.error);
        }
      } catch (err: any) {
        console.warn('[Atelier V] Supabase coupon save exception:', err);
      }
    }

    // 2. Persist to database file
    db.coupons.unshift(newCoupon);
    await writeDatabase(db);

    res.status(201).json(newCoupon);
  } catch (err: any) {
    console.error('Coupon creation error:', err);
    res.status(500).json({ error: err?.message || 'Failed to create coupon' });
  }
});

app.put('/api/coupons/:id', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.coupons.findIndex(c => c.id === id || c.code.toUpperCase() === id.toUpperCase());
    if (index === -1) return res.status(404).json({ error: 'Coupon not found' });

    const updatedCoupon: Coupon = {
      ...db.coupons[index],
      ...req.body,
      code: req.body.code ? String(req.body.code).trim().toUpperCase() : db.coupons[index].code,
      updatedAt: new Date().toISOString()
    };

    db.coupons[index] = updatedCoupon;
    await writeDatabase(db);

    // Persist to Supabase
    if (isSupabaseConnected()) {
      try {
        await saveCouponToSupabase(updatedCoupon);
      } catch (err) {
        console.warn('Supabase update coupon notice:', err);
      }
    }

    res.json(updatedCoupon);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update coupon' });
  }
});

app.delete('/api/coupons/:id', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.coupons.findIndex(c => c.id === id || c.code.toUpperCase() === id.toUpperCase());
    if (index === -1) return res.status(404).json({ error: 'Coupon not found' });

    const deletedCode = db.coupons[index].code;
    db.coupons.splice(index, 1);
    await writeDatabase(db);

    // Delete from Supabase
    if (isSupabaseConnected()) {
      try {
        await deleteCouponFromSupabase(id);
      } catch (err) {
        console.warn('Supabase delete coupon notice:', err);
      }
    }

    res.json({ success: true, code: deletedCode });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete coupon' });
  }
});

app.post('/api/coupons/validate', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const rawCode = req.body.code ? String(req.body.code).trim().toUpperCase() : '';
    const subtotal = Number(req.body.subtotal ?? req.body.cartTotal ?? 0);

    if (!rawCode) return res.status(400).json({ error: 'Coupon code required' });

    // Look up coupon (Supabase first, then local db)
    let coupon: Coupon | undefined = undefined;
    if (isSupabaseConnected()) {
      try {
        const spRes = await getCouponsFromSupabase();
        if (spRes.coupons && spRes.coupons.length > 0) {
          coupon = spRes.coupons.find(c => c.code.toUpperCase() === rawCode);
        }
      } catch {
        // Fall back to db
      }
    }
    if (!coupon) {
      coupon = db.coupons.find(c => c.code.toUpperCase() === rawCode);
    }

    if (!coupon) {
      return res.status(404).json({ error: `Promotional code '${rawCode}' is invalid` });
    }
    if (!coupon.active) {
      return res.status(400).json({ error: `Promotional code '${rawCode}' is no longer active` });
    }
    if (coupon.startDate && new Date(coupon.startDate) > new Date()) {
      return res.status(400).json({ error: `Promotional code '${rawCode}' will become active on ${coupon.startDate}` });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: `Promotional code '${rawCode}' expired on ${coupon.expiresAt}` });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: `Promotional code '${rawCode}' has reached its maximum redemptions` });
    }
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        error: `Minimum order value of ₹${coupon.minOrderValue} required for code '${rawCode}'`
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to validate coupon' });
  }
});

// -------------------------------------------------------------
// API: Reviews (Real reviews only)
// -------------------------------------------------------------
app.get('/api/reviews', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { productId } = req.query;
    if (productId) {
      const filtered = db.reviews.filter(r => r.productId === productId && r.status === 'approved');
      return res.json(filtered);
    }
    res.json(db.reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const newReview: Review = {
      ...req.body,
      id: `rev-${Date.now()}`,
      status: 'approved',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.reviews.unshift(newReview);

    // Recalculate genuine rating
    const prodReviews = db.reviews.filter(r => r.productId === newReview.productId && r.status === 'approved');
    const prod = db.products.find(p => p.id === newReview.productId);
    if (prod && prodReviews.length > 0) {
      const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
      prod.rating = Math.round((sum / prodReviews.length) * 10) / 10;
      prod.reviewCount = prodReviews.length;
    }

    await writeDatabase(db);
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

app.put('/api/reviews/:id', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    const { id } = req.params;
    const index = db.reviews.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: 'Review not found' });
    db.reviews[index] = { ...db.reviews[index], ...req.body };
    await writeDatabase(db);
    res.json(db.reviews[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

// -------------------------------------------------------------
// API: Store Settings & CMS
// -------------------------------------------------------------
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    res.json(db.settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const db = await readDatabase();
    db.settings = { ...db.settings, ...req.body };
    await writeDatabase(db);
    res.json(db.settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// -------------------------------------------------------------
// Server Lifecycle & Static Frontend Integration
// -------------------------------------------------------------
async function setupFrontend() {
  const distPath = path.join(__dirname, 'dist');
  const distExists = fs.existsSync(distPath);
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) || Boolean(process.env.K_SERVICE);

  if (!isProduction && !distExists) {
    try {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          port: PORT,
          host: '0.0.0.0'
        },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('[Atelier V] Vite middleware notice:', viteErr);
    }
  } else if (distExists) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/images')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// In standard Node / container environment, initialize and listen
if (!process.env.VERCEL) {
  setupFrontend().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Atelier V] Server listening on http://0.0.0.0:${PORT}`);
    });
  }).catch(err => {
    console.error('Server startup error:', err);
  });
}

export default app;
