import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Order, CustomerProfile, Coupon, Review, StoreSettings, OrderStatus } from '../types';
import { api, getAdminToken, setAdminToken } from '../services/api';
import { useStore } from './StoreContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminContextType {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  loading: boolean;
  orders: Order[];
  customers: CustomerProfile[];
  coupons: Coupon[];
  reviews: Review[];
  
  // Auth
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  
  // Refresh
  refreshAdminData: () => Promise<void>;
  
  // Product actions
  saveProduct: (product: Partial<Product>, isEdit?: boolean) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  duplicateProduct: (id: string) => Promise<Product>;
  
  // Category actions
  saveCategory: (category: Partial<Category>, isEdit?: boolean) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Order actions
  updateOrderStatus: (id: string, status: OrderStatus, tracking?: string, carrier?: string, notes?: string) => Promise<void>;
  
  // Coupon actions
  saveCoupon: (coupon: Partial<Coupon>, isEdit?: boolean) => Promise<Coupon>;
  deleteCoupon: (id: string) => Promise<void>;
  
  // Review actions
  updateReviewStatus: (id: string, status: 'approved' | 'rejected', featured?: boolean) => Promise<void>;
  
  // Settings actions
  saveSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  
  // Metrics
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalProducts: number;
    lowStockCount: number;
    totalCustomers: number;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { refreshData: refreshStoreData, addToast } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = getAdminToken();
    const hasAuth = localStorage.getItem('atelierv_admin_auth') === 'true';
    return Boolean(hasAuth && token);
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const token = getAdminToken();
    if (!token) return null;
    const saved = localStorage.getItem('atelierv_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAdminData = async () => {
    const token = getAdminToken();
    if (!token) {
      setIsAuthenticated(false);
      setAdminUser(null);
      localStorage.removeItem('atelierv_admin_auth');
      localStorage.removeItem('atelierv_admin_user');
      return;
    }

    setLoading(true);
    try {
      const [oData, cData, coupData, rData] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getCoupons(),
        api.getReviews()
      ]);
      setOrders(oData);
      setCustomers(cData);
      setCoupons(coupData);
      setReviews(rData);
    } catch (err: any) {
      if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
        setIsAuthenticated(false);
        setAdminUser(null);
        setAdminToken(null);
        localStorage.removeItem('atelierv_admin_auth');
        localStorage.removeItem('atelierv_admin_user');
      } else {
        console.warn('Admin sync notice:', err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshAdminData();
      // Periodically refresh orders and ledger so incoming storefront orders appear immediately
      const interval = setInterval(() => {
        refreshAdminData();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.adminLogin(email, pass);
      if (res.success) {
        setIsAuthenticated(true);
        setAdminUser(res.admin);
        localStorage.setItem('atelierv_admin_auth', 'true');
        localStorage.setItem('atelierv_admin_user', JSON.stringify(res.admin));
        addToast('Welcome back, Executive Concierge', 'success');
        refreshAdminData();
        return true;
      }
      return false;
    } catch (err: any) {
      addToast(err.message || 'Authentication failed', 'error');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminUser(null);
    setAdminToken(null);
    localStorage.removeItem('atelierv_admin_auth');
    localStorage.removeItem('atelierv_admin_user');
    api.adminLogout();
    addToast('Logged out of Admin Portal', 'info');
  };

  const saveProduct = async (product: Partial<Product>, isEdit = false): Promise<Product> => {
    try {
      let saved: Product;
      if (isEdit && product.id) {
        saved = await api.updateProduct(product.id, product);
        addToast(`Updated product: ${saved.name}`);
      } else {
        saved = await api.createProduct(product);
        addToast(`Created new product: ${saved.name}`);
      }
      await refreshStoreData();
      return saved;
    } catch (err: any) {
      addToast(err.message || 'Failed to save product', 'error');
      throw err;
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await api.deleteProduct(id);
      addToast('Product successfully removed', 'info');
      await refreshStoreData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete product', 'error');
      throw err;
    }
  };

  const duplicateProduct = async (id: string): Promise<Product> => {
    try {
      const dup = await api.duplicateProduct(id);
      addToast(`Created duplicate: ${dup.name}`);
      await refreshStoreData();
      return dup;
    } catch (err: any) {
      addToast(err.message || 'Failed to duplicate product', 'error');
      throw err;
    }
  };

  const saveCategory = async (category: Partial<Category>, isEdit = false): Promise<Category> => {
    try {
      let saved: Category;
      if (isEdit && category.id) {
        saved = await api.updateCategory(category.id, category);
        addToast(`Category updated: ${saved.name}`);
      } else {
        saved = await api.createCategory(category);
        addToast(`Category created: ${saved.name}`);
      }
      await refreshStoreData();
      return saved;
    } catch (err: any) {
      addToast(err.message || 'Failed to save category', 'error');
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      await api.deleteCategory(id);
      addToast('Category deleted', 'info');
      await refreshStoreData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete category', 'error');
      throw err;
    }
  };

  const updateOrderStatus = async (
    id: string,
    status: OrderStatus,
    tracking?: string,
    carrier?: string,
    notes?: string
  ): Promise<void> => {
    try {
      const updateData: Partial<Order> = { status };
      if (tracking !== undefined) updateData.trackingNumber = tracking;
      if (carrier !== undefined) updateData.shippingCarrier = carrier;
      if (notes !== undefined) updateData.notes = notes;

      await api.updateOrder(id, updateData);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updateData, updatedAt: new Date().toISOString() } : o))
      );
      addToast(`Order ${id} status updated to ${status}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to update order', 'error');
      throw err;
    }
  };

  const saveCoupon = async (coupon: Partial<Coupon>, isEdit = false): Promise<Coupon> => {
    try {
      let saved: Coupon;
      if (isEdit && coupon.id) {
        saved = await api.updateCoupon(coupon.id, coupon);
        addToast(`Coupon ${saved.code} updated`);
      } else {
        saved = await api.createCoupon(coupon);
        addToast(`Coupon ${saved.code} created`);
      }
      setCoupons((prev) =>
        isEdit ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]
      );
      return saved;
    } catch (err: any) {
      addToast(err.message || 'Failed to save coupon', 'error');
      throw err;
    }
  };

  const deleteCoupon = async (id: string): Promise<void> => {
    try {
      await api.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      addToast('Coupon deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete coupon', 'error');
      throw err;
    }
  };

  const updateReviewStatus = async (
    id: string,
    status: 'approved' | 'rejected',
    featured?: boolean
  ): Promise<void> => {
    try {
      await api.updateReview(id, { status, featured });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, featured: featured ?? r.featured } : r))
      );
      addToast(`Review marked as ${status}`);
      await refreshStoreData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update review', 'error');
      throw err;
    }
  };

  const saveSettings = async (newSettings: Partial<StoreSettings>): Promise<void> => {
    try {
      await api.updateSettings(newSettings);
      await refreshStoreData();
      addToast('Storefront content and settings updated');
    } catch (err: any) {
      addToast(err.message || 'Failed to update settings', 'error');
      throw err;
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled' && o.status !== 'Refunded')
    .reduce((sum, o) => sum + o.pricing.grandTotal, 0);

  const pendingOrders = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Processing'
  ).length;

  const completedOrders = orders.filter((o) => o.status === 'Delivered').length;

  const metrics = {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders,
    completedOrders,
    totalProducts: 0, // will be computed in consumer
    lowStockCount: 0,
    totalCustomers: customers.length
  };

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        adminUser,
        loading,
        orders,
        customers,
        coupons,
        reviews,
        login,
        logout,
        refreshAdminData,
        saveProduct,
        deleteProduct,
        duplicateProduct,
        saveCategory,
        deleteCategory,
        updateOrderStatus,
        saveCoupon,
        deleteCoupon,
        updateReviewStatus,
        saveSettings,
        metrics
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};
