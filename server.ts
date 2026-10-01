import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface DatabaseSchema {
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

function readDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
      return dbCache!;
    }
  } catch (err) {
    console.error('Error reading database file, resetting to initial:', err);
  }
  dbCache = getInitialDatabase();
  writeDatabase(dbCache);
  return dbCache;
}

function writeDatabase(data: DatabaseSchema) {
  dbCache = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

async function startServer() {
  const app = express();

  // High body size limit for direct base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static directory for uploaded files
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Initialize DB
  readDatabase();

  // -------------------------------------------------------------
  // API: File Uploads (Direct file upload from device)
  // -------------------------------------------------------------
  app.post('/api/upload', (req: Request, res: Response) => {
    try {
      const { filename, dataUrl } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'No data URL provided' });
      }

      // Check if it's a base64 data url
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'jpg';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(dataUrl, 'base64');
      }

      const safeName = (filename || 'upload').replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${uniqueName}`;

      return res.json({
        success: true,
        url: publicUrl,
        filename: uniqueName
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Failed to upload image', details: err?.message });
    }
  });

  // -------------------------------------------------------------
  // API: Admin Authentication
  // -------------------------------------------------------------
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    // Default admin credentials
    if ((email === 'admin@atelierv.com' || email === 'admin') && (password === 'admin123' || password === 'admin')) {
      return res.json({
        success: true,
        token: `admin_token_${Date.now()}`,
        admin: {
          id: 'adm-01',
          name: 'Executive Concierge',
          email: 'admin@atelierv.com',
          role: 'Super Admin'
        }
      });
    }
    return res.status(401).json({ error: 'Invalid credentials. Use admin@atelierv.com / admin123' });
  });

  // -------------------------------------------------------------
  // API: Products
  // -------------------------------------------------------------
  app.get('/api/products', (req: Request, res: Response) => {
    const db = readDatabase();
    res.json(db.products);
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const db = readDatabase();
    const newProduct: Product = req.body;

    // Check SKU uniqueness
    if (db.products.some(p => p.sku.toLowerCase() === newProduct.sku.toLowerCase())) {
      return res.status(400).json({ error: `SKU '${newProduct.sku}' is already in use by another product.` });
    }

    if (!newProduct.id) {
      newProduct.id = `prod-${Date.now()}`;
    }
    if (!newProduct.slug) {
      newProduct.slug = newProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    newProduct.createdAt = new Date().toISOString();
    newProduct.updatedAt = new Date().toISOString();

    db.products.unshift(newProduct);
    writeDatabase(db);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedData: Product = req.body;
    // SKU uniqueness check excluding current product
    if (db.products.some(p => p.id !== id && p.sku.toLowerCase() === updatedData.sku.toLowerCase())) {
      return res.status(400).json({ error: `SKU '${updatedData.sku}' is already used by another product.` });
    }

    updatedData.updatedAt = new Date().toISOString();
    db.products[index] = { ...db.products[index], ...updatedData };
    writeDatabase(db);
    res.json(db.products[index]);
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.products.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true, message: 'Product deleted' });
  });

  app.post('/api/products/:id/duplicate', (req: Request, res: Response) => {
    const db = readDatabase();
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
    writeDatabase(db);
    res.status(201).json(duplicate);
  });

  // -------------------------------------------------------------
  // API: Categories
  // -------------------------------------------------------------
  app.get('/api/categories', (req: Request, res: Response) => {
    const db = readDatabase();
    res.json(db.categories);
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const db = readDatabase();
    const newCat: Category = req.body;
    if (!newCat.id) newCat.id = `cat-${Date.now()}`;
    if (!newCat.slug) {
      newCat.slug = newCat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    db.categories.push(newCat);
    writeDatabase(db);
    res.status(201).json(newCat);
  });

  app.put('/api/categories/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Category not found' });
    db.categories[index] = { ...db.categories[index], ...req.body };
    writeDatabase(db);
    res.json(db.categories[index]);
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Category not found' });
    db.categories.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true });
  });

  // -------------------------------------------------------------
  // API: Orders & Checkout
  // -------------------------------------------------------------
  app.get('/api/orders', (req: Request, res: Response) => {
    const db = readDatabase();
    res.json(db.orders);
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    const db = readDatabase();
    const orderData = req.body;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${dateStr}-${randSeq}`;

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Deduct inventory
    for (const item of newOrder.items) {
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

    // Update or add customer profile
    const existingCust = db.customers.find(
      c => c.email.toLowerCase() === newOrder.customer.email.toLowerCase()
    );
    if (existingCust) {
      existingCust.totalOrders += 1;
      existingCust.totalSpent += newOrder.pricing.grandTotal;
      existingCust.lastOrderDate = new Date().toISOString().slice(0, 10);
      if (existingCust.totalSpent > 2000) existingCust.status = 'VIP';
    } else {
      const newCust: CustomerProfile = {
        id: `cust-${Date.now()}`,
        fullName: newOrder.customer.fullName,
        email: newOrder.customer.email,
        phone: newOrder.customer.phone,
        city: newOrder.customer.city,
        country: newOrder.customer.country,
        totalOrders: 1,
        totalSpent: newOrder.pricing.grandTotal,
        lastOrderDate: new Date().toISOString().slice(0, 10),
        status: newOrder.pricing.grandTotal > 2000 ? 'VIP' : 'Active'
      };
      db.customers.unshift(newCust);
    }

    // If coupon used, increment coupon usage count
    if (newOrder.pricing.couponCode) {
      const coupon = db.coupons.find(
        c => c.code.toUpperCase() === newOrder.pricing.couponCode?.toUpperCase()
      );
      if (coupon) {
        coupon.usedCount += 1;
      }
    }

    db.orders.unshift(newOrder);
    writeDatabase(db);
    res.status(201).json(newOrder);
  });

  app.put('/api/orders/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });
    db.orders[index] = {
      ...db.orders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeDatabase(db);
    res.json(db.orders[index]);
  });

  // -------------------------------------------------------------
  // API: Customers
  // -------------------------------------------------------------
  app.get('/api/customers', (req: Request, res: Response) => {
    const db = readDatabase();
    res.json(db.customers);
  });

  // -------------------------------------------------------------
  // API: Coupons
  // -------------------------------------------------------------
  app.get('/api/coupons', (req: Request, res: Response) => {
    const db = readDatabase();
    res.json(db.coupons);
  });

  app.post('/api/coupons', (req: Request, res: Response) => {
    const db = readDatabase();
    const newCoupon: Coupon = {
      ...req.body,
      id: `coup-${Date.now()}`,
      code: req.body.code.toUpperCase(),
      usedCount: 0
    };
    db.coupons.push(newCoupon);
    writeDatabase(db);
    res.status(201).json(newCoupon);
  });

  app.put('/api/coupons/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.coupons.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Coupon not found' });
    db.coupons[index] = { ...db.coupons[index], ...req.body };
    writeDatabase(db);
    res.json(db.coupons[index]);
  });

  app.delete('/api/coupons/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.coupons.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Coupon not found' });
    db.coupons.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true });
  });

  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const db = readDatabase();
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required' });

    const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }
    if (!coupon.active) {
      return res.status(400).json({ error: 'This coupon is no longer active' });
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }
    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }
    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        error: `Minimum order value of $${coupon.minOrderValue} required for this coupon`
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
      discountValue: coupon.discountValue
    });
  });

  // -------------------------------------------------------------
  // API: Reviews
  // -------------------------------------------------------------
  app.get('/api/reviews', (req: Request, res: Response) => {
    const db = readDatabase();
    const { productId } = req.query;
    if (productId) {
      const filtered = db.reviews.filter(r => r.productId === productId);
      return res.json(filtered);
    }
    res.json(db.reviews);
  });

  app.post('/api/reviews', (req: Request, res: Response) => {
    const db = readDatabase();
    const newReview: Review = {
      ...req.body,
      id: `rev-${Date.now()}`,
      status: 'approved', // auto-approve for responsive UX
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.reviews.unshift(newReview);

    // Recalculate product rating
    const prodReviews = db.reviews.filter(r => r.productId === newReview.productId && r.status === 'approved');
    const prod = db.products.find(p => p.id === newReview.productId);
    if (prod && prodReviews.length > 0) {
      const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
      prod.rating = Math.round((sum / prodReviews.length) * 10) / 10;
      prod.reviewCount = prodReviews.length;
    }

    writeDatabase(db);
    res.status(201).json(newReview);
  });

  app.put('/api/reviews/:id', (req: Request, res: Response) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.reviews.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: 'Review not found' });
    db.reviews[index] = { ...db.reviews[index], ...req.body };
    writeDatabase(db);
    res.json(db.reviews[index]);
  });

  // -------------------------------------------------------------
  // API: Settings & CMS Homepage
  // -------------------------------------------------------------
  app.get('/api/settings', (req: Request, res: Response) => {
    const db = readDatabase();
    res.json(db.settings);
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const db = readDatabase();
    db.settings = { ...db.settings, ...req.body };
    writeDatabase(db);
    res.json(db.settings);
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite in Dev, Dist in Production)
  // -------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Atelier V] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
