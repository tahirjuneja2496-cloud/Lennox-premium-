import express from 'express';
import type { Request, Response } from 'express';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS
} from '../src/data/initialData.ts';
import type { Coupon } from '../src/types/index.ts';
import {
  getSupabaseClient,
  isSupabaseConnected,
  mapSupabaseToCoupon,
  mapCouponToSupabase,
  getCouponsFromSupabase,
  saveCouponToSupabase,
  deleteCouponFromSupabase,
  incrementCouponUsageInSupabase,
  COUPON_MIGRATION_SQL,
  getProductsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  getOrdersFromSupabase,
  saveOrderToSupabase,
  uploadImageToSupabase
} from '../src/db/supabase.ts';

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper: Admin authentication
function verifyAdminToken(req: Request): boolean {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  if (token.startsWith('adm_tok_') || token.startsWith('adm_')) return true;
  if (token.includes('.')) return true;
  return false;
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  if (verifyAdminToken(req)) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
}

// Router containing all API endpoints
const router = express.Router();

// -------------------------------------------------------------
// Health / Settings
// -------------------------------------------------------------
router.get('/settings', (_req: Request, res: Response) => {
  res.json(INITIAL_SETTINGS);
});

// -------------------------------------------------------------
// Products
// -------------------------------------------------------------
router.get('/products', async (_req: Request, res: Response) => {
  try {
    const spResult = await getProductsFromSupabase();
    if (spResult.products && spResult.products.length > 0) {
      return res.json(spResult.products);
    }
  } catch (err) {
    // Fallback
  }
  res.json(INITIAL_PRODUCTS);
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (!product.id) {
      product.id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    const result = await saveProductToSupabase(product);
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to save product to Supabase' });
    }
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Serverless error creating product' });
  }
});

router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteProductFromSupabase(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// -------------------------------------------------------------
// Orders
// -------------------------------------------------------------
router.get('/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await getOrdersFromSupabase();
    return res.json(orders || []);
  } catch {
    res.json([]);
  }
});

router.post('/orders', async (req: Request, res: Response) => {
  try {
    const order = req.body;
    if (!order.id) {
      order.id = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    await saveOrderToSupabase(order);

    // If coupon was applied, increment usage count in Supabase
    if (order.pricing?.couponCode) {
      const code = String(order.pricing.couponCode).trim().toUpperCase();
      incrementCouponUsageInSupabase(code).catch(() => {});
    }

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save order' });
  }
});

// -------------------------------------------------------------
// Admin Auth
// -------------------------------------------------------------
router.post('/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  const isEmailValid =
    cleanEmail === 'tahirjuneja2496@gmail.com' ||
    cleanEmail === 'admin' ||
    cleanEmail === (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  const isPassValid =
    cleanPass === 'kaif@#9650' ||
    cleanPass === (process.env.ADMIN_PASSWORD || '').trim();

  if (isEmailValid && isPassValid) {
    return res.json({
      success: true,
      token: `adm_tok_${Date.now()}`,
      admin: {
        id: 'adm-01',
        name: 'Executive Concierge',
        email: 'tahirjuneja2496@gmail.com',
        role: 'Super Admin'
      }
    });
  }

  res.status(401).json({ error: 'Invalid email or password' });
});

router.post('/admin/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// -------------------------------------------------------------
// Image Upload
// -------------------------------------------------------------
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { filename, dataUrl } = req.body;
    const url = await uploadImageToSupabase(filename, dataUrl);
    if (!url) {
      return res.status(500).json({ error: 'Failed to upload image to Supabase' });
    }
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload error' });
  }
});

// -------------------------------------------------------------
// Categories & Reviews
// -------------------------------------------------------------
router.get('/categories', (_req: Request, res: Response) => res.json(INITIAL_CATEGORIES));
router.get('/reviews', (_req: Request, res: Response) => res.json(INITIAL_REVIEWS));

// -------------------------------------------------------------
// COUPONS API (Direct Supabase public.coupons Integration)
// -------------------------------------------------------------

// GET: Coupon Database Status
router.get('/coupons/status', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.json({
        supabaseConnected: false,
        tableMissing: true,
        count: 0,
        migrationSql: COUPON_MIGRATION_SQL,
        error: 'Supabase client not initialized'
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

// GET: List all coupons from Supabase
router.get('/coupons', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('[Vercel API /coupons] Supabase client not initialized, returning initial coupons');
      return res.json(INITIAL_COUPONS);
    }

    const { data, error } = await client
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Vercel API /coupons] Supabase query error:', error.message);
      return res.json(INITIAL_COUPONS);
    }

    if (data && Array.isArray(data)) {
      const coupons = data.map(mapSupabaseToCoupon);
      return res.json(coupons);
    }

    return res.json(INITIAL_COUPONS);
  } catch (err: any) {
    console.error('[Vercel API /coupons] Exception:', err);
    res.json(INITIAL_COUPONS);
  }
});

// POST: Create coupon directly in Supabase
router.post('/coupons', requireAdmin, async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        error: 'Supabase database is not configured. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.'
      });
    }

    const rawCode = req.body.code ? String(req.body.code).trim().toUpperCase() : '';
    if (!rawCode) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    // Check duplicate code in public.coupons
    const { data: existing, error: checkErr } = await client
      .from('coupons')
      .select('id, code')
      .eq('code', rawCode)
      .maybeSingle();

    if (checkErr) {
      console.error('[Vercel API POST /coupons] Duplicate check error:', checkErr);
      return res.status(500).json({ error: checkErr.message || 'Database error checking coupon code' });
    }

    if (existing) {
      return res.status(400).json({ error: `Coupon code '${rawCode}' already exists` });
    }

    // Generate unique text ID
    const coupId = req.body.id && String(req.body.id).trim()
      ? String(req.body.id).trim()
      : `coup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const now = new Date().toISOString();
    let startDateVal = now;
    if (req.body.startDate) {
      try {
        startDateVal = new Date(req.body.startDate).toISOString();
      } catch {
        startDateVal = now;
      }
    }

    let expiresAtVal: string;
    if (req.body.expiresAt) {
      try {
        expiresAtVal = new Date(req.body.expiresAt).toISOString();
      } catch {
        expiresAtVal = new Date(Date.now() + 365 * 86400000).toISOString();
      }
    } else {
      expiresAtVal = new Date(Date.now() + 365 * 86400000).toISOString();
    }

    const rowToInsert = {
      id: coupId,
      code: rawCode,
      discount_type: req.body.discountType === 'fixed' ? 'fixed' : 'percentage',
      discount_value: Math.max(0, Number(req.body.discountValue ?? 10)),
      min_order_value: Math.max(0, Number(req.body.minOrderValue ?? 0)),
      max_discount: req.body.maxDiscount !== undefined && req.body.maxDiscount !== null ? Number(req.body.maxDiscount) : null,
      start_date: startDateVal,
      expires_at: expiresAtVal,
      usage_limit: Math.max(1, Number(req.body.usageLimit ?? 100)),
      used_count: 0,
      active: req.body.active !== false,
      data: {
        id: coupId,
        code: rawCode,
        discountType: req.body.discountType === 'fixed' ? 'fixed' : 'percentage',
        discountValue: Math.max(0, Number(req.body.discountValue ?? 10)),
        minOrderValue: Math.max(0, Number(req.body.minOrderValue ?? 0)),
        maxDiscount: req.body.maxDiscount !== undefined && req.body.maxDiscount !== null ? Number(req.body.maxDiscount) : undefined,
        startDate: req.body.startDate || now.slice(0, 10),
        expiresAt: req.body.expiresAt || expiresAtVal.slice(0, 10),
        usageLimit: Math.max(1, Number(req.body.usageLimit ?? 100)),
        usedCount: 0,
        active: req.body.active !== false,
        createdAt: now,
        updatedAt: now
      },
      created_at: now,
      updated_at: now
    };

    const { data: inserted, error: insertError } = await client
      .from('coupons')
      .insert(rowToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[Vercel API POST /coupons] Supabase insert error:', insertError);
      if (insertError.code === '23505' || insertError.message.includes('unique') || insertError.message.includes('duplicate')) {
        return res.status(400).json({ error: `Coupon code '${rawCode}' already exists` });
      }
      return res.status(400).json({ error: insertError.message || 'Failed to save coupon to Supabase' });
    }

    const createdCoupon = mapSupabaseToCoupon(inserted);
    return res.status(201).json(createdCoupon);
  } catch (err: any) {
    console.error('[Vercel API POST /coupons] Exception:', err);
    res.status(500).json({ error: err?.message || 'Failed to create coupon' });
  }
});

// PUT: Update coupon in Supabase
router.put('/coupons/:id', requireAdmin, async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        error: 'Supabase is not configured on the server.'
      });
    }

    const { id } = req.params;
    const cleanId = String(id).trim();

    // Check if coupon exists in Supabase
    const { data: existing, error: findError } = await client
      .from('coupons')
      .select('*')
      .or(`id.eq.${cleanId},code.eq.${cleanId.toUpperCase()}`)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({ error: findError.message || 'Database lookup error' });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const targetId = existing.id;
    const newCode = req.body.code ? String(req.body.code).trim().toUpperCase() : existing.code;

    // Check if new code conflicts with another coupon
    if (newCode !== existing.code) {
      const { data: conflict } = await client
        .from('coupons')
        .select('id')
        .eq('code', newCode)
        .neq('id', targetId)
        .maybeSingle();

      if (conflict) {
        return res.status(400).json({ error: `Coupon code '${newCode}' is already in use by another coupon` });
      }
    }

    const now = new Date().toISOString();
    const updateData: Record<string, any> = {
      updated_at: now
    };

    if (req.body.code !== undefined) updateData.code = newCode;
    if (req.body.discountType !== undefined) updateData.discount_type = req.body.discountType === 'fixed' ? 'fixed' : 'percentage';
    if (req.body.discountValue !== undefined) updateData.discount_value = Math.max(0, Number(req.body.discountValue));
    if (req.body.minOrderValue !== undefined) updateData.min_order_value = Math.max(0, Number(req.body.minOrderValue));
    if (req.body.maxDiscount !== undefined) updateData.max_discount = req.body.maxDiscount !== null ? Number(req.body.maxDiscount) : null;
    if (req.body.startDate !== undefined) {
      try {
        updateData.start_date = new Date(req.body.startDate).toISOString();
      } catch {}
    }
    if (req.body.expiresAt !== undefined) {
      try {
        updateData.expires_at = new Date(req.body.expiresAt).toISOString();
      } catch {}
    }
    if (req.body.usageLimit !== undefined) updateData.usage_limit = Math.max(1, Number(req.body.usageLimit));
    if (req.body.usedCount !== undefined) updateData.used_count = Math.max(0, Number(req.body.usedCount));
    if (req.body.active !== undefined) updateData.active = Boolean(req.body.active);

    const mergedData = {
      ...(existing.data || {}),
      ...req.body,
      id: targetId,
      code: newCode,
      updatedAt: now
    };
    updateData.data = mergedData;

    const { data: updated, error: updateError } = await client
      .from('coupons')
      .update(updateData)
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message || 'Failed to update coupon in Supabase' });
    }

    return res.json(mapSupabaseToCoupon(updated));
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update coupon' });
  }
});

// DELETE: Delete coupon from Supabase
router.delete('/coupons/:id', requireAdmin, async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        error: 'Supabase is not configured on the server.'
      });
    }

    const { id } = req.params;
    const cleanId = String(id).trim();

    const { data: deleted, error: deleteError } = await client
      .from('coupons')
      .delete()
      .or(`id.eq.${cleanId},code.eq.${cleanId.toUpperCase()}`)
      .select();

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message || 'Failed to delete coupon from Supabase' });
    }

    return res.json({ success: true, count: deleted?.length || 0, id: cleanId });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete coupon' });
  }
});

// VALIDATE: Validate coupon against Supabase
router.post('/coupons/validate', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  try {
    const rawCode = req.body.code ? String(req.body.code).trim().toUpperCase() : '';
    const subtotal = Number(req.body.cartTotal ?? req.body.subtotal ?? 0);

    if (!rawCode) return res.status(400).json({ error: 'Coupon code required' });

    let coupon: Coupon | undefined = undefined;
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('coupons')
        .select('*')
        .eq('code', rawCode)
        .maybeSingle();

      if (data && !error) {
        coupon = mapSupabaseToCoupon(data);
      }
    }

    if (!coupon) {
      coupon = INITIAL_COUPONS.find(c => c.code.toUpperCase() === rawCode);
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

// Mount router on BOTH '/api' and '/' to ensure 100% path matching under all Vercel rewrite conditions
app.use('/api', router);
app.use('/', router);

export default app;
