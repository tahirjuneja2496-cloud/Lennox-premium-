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

export const api = {
  // Settings
  async getSettings(): Promise<StoreSettings> {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    return await res.json();
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    return await res.json();
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  },

  async duplicateProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to duplicate product');
    return await res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return await res.json();
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    if (!res.ok) throw new Error('Failed to update category');
    return await res.json();
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
    return true;
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    } catch {
      return INITIAL_ORDERS;
    }
  },

  async createOrder(order: any): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return await res.json();
  },

  async updateOrder(id: string, update: Partial<Order>): Promise<Order> {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    if (!res.ok) throw new Error('Failed to update order');
    return await res.json();
  },

  // Customers
  async getCustomers(): Promise<CustomerProfile[]> {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      return await res.json();
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    try {
      const res = await fetch('/api/coupons');
      if (!res.ok) throw new Error('Failed to fetch coupons');
      return await res.json();
    } catch {
      return INITIAL_COUPONS;
    }
  },

  async createCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon)
    });
    if (!res.ok) throw new Error('Failed to create coupon');
    return await res.json();
  },

  async updateCoupon(id: string, coupon: Partial<Coupon>): Promise<Coupon> {
    const res = await fetch(`/api/coupons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon)
    });
    if (!res.ok) throw new Error('Failed to update coupon');
    return await res.json();
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete coupon');
    return true;
  },

  async validateCoupon(code: string, subtotal: number): Promise<{
    valid: boolean;
    code: string;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  }> {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid coupon');
    }
    return await res.json();
  },

  // Reviews
  async getReviews(productId?: string): Promise<Review[]> {
    try {
      const url = productId ? `/api/reviews?productId=${productId}` : '/api/reviews';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return await res.json();
    } catch {
      return INITIAL_REVIEWS;
    }
  },

  async createReview(review: Partial<Review>): Promise<Review> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (!res.ok) throw new Error('Failed to create review');
    return await res.json();
  },

  async updateReview(id: string, review: Partial<Review>): Promise<Review> {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (!res.ok) throw new Error('Failed to update review');
    return await res.json();
  },

  // File Upload (Direct from device)
  async uploadImage(file: File): Promise<{ url: string; success: boolean }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              dataUrl
            })
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Upload failed');
          }
          const data = await res.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from device'));
      reader.readAsDataURL(file);
    });
  },

  // Admin Auth
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token: string; admin: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    }
    return await res.json();
  }
};
