import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminProductForm } from './AdminProductForm';
import { AdminCategories } from './AdminCategories';
import { AdminOrders } from './AdminOrders';
import { AdminInventory } from './AdminInventory';
import { AdminCustomers } from './AdminCustomers';
import { AdminCoupons } from './AdminCoupons';
import { AdminReviews } from './AdminReviews';
import { AdminSettings } from './AdminSettings';
import { Product } from '../../types';

interface AdminViewProps {
  onExitAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onExitAdmin }) => {
  const { isAuthenticated } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (!isAuthenticated) {
    return <AdminLogin onBackToStorefront={onExitAdmin} />;
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setActiveTab('product-form');
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setActiveTab('product-form');
  };

  return (
    <AdminLayout
      currentTab={activeTab}
      onSelectTab={setActiveTab}
      onExitAdmin={onExitAdmin}
    >
      {activeTab === 'dashboard' && (
        <AdminDashboard onNavigateTab={setActiveTab} />
      )}

      {activeTab === 'products' && (
        <AdminProducts
          onEditProduct={handleEditProduct}
          onNewProduct={handleNewProduct}
        />
      )}

      {activeTab === 'product-form' && (
        <AdminProductForm
          initialProduct={editingProduct}
          onCancel={() => setActiveTab('products')}
          onSaved={() => setActiveTab('products')}
        />
      )}

      {activeTab === 'categories' && <AdminCategories />}

      {activeTab === 'orders' && <AdminOrders />}

      {activeTab === 'inventory' && <AdminInventory />}

      {activeTab === 'customers' && <AdminCustomers />}

      {activeTab === 'coupons' && <AdminCoupons />}

      {activeTab === 'reviews' && <AdminReviews />}

      {activeTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
};
