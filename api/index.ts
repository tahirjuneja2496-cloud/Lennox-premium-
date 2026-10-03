import express from 'express';
import type { Request, Response } from 'express';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS
} from '../src/data/initialData.ts';
import {
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

// Health / Settings
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(INITIAL_SETTINGS);
});

// Products
app.get('/api/products', async (_req: Request, res: Response) => {
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

app.post('/api/products', async (req: Request, res: Response) => {
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

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteProductFromSupabase(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// Orders
app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await getOrdersFromSupabase();
    return res.json(orders || []);
  } catch {
    res.json([]);
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const order = req.body;
    if (!order.id) {
      order.id = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    await saveOrderToSupabase(order);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save order' });
  }
});

// Admin Auth
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  const isEmailValid = cleanEmail === 'tahirjuneja2496@gmail.com' || cleanEmail === 'admin';
  const isPassValid = cleanPass === 'kaif@#9650';

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

app.post('/api/admin/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// Upload
app.post('/api/upload', async (req: Request, res: Response) => {
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

// Categories & Coupons
app.get('/api/categories', (_req: Request, res: Response) => res.json(INITIAL_CATEGORIES));
app.get('/api/coupons', (_req: Request, res: Response) => res.json(INITIAL_COUPONS));
app.get('/api/reviews', (_req: Request, res: Response) => res.json(INITIAL_REVIEWS));

export default app;
