import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminProvider } from './context/AdminContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { QuickViewModal } from './components/QuickViewModal';
import { ToastContainer } from './components/ToastContainer';
import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { CheckoutView } from './views/CheckoutView';
import { OrderConfirmationView } from './views/OrderConfirmationView';
import { WishlistView } from './views/WishlistView';
import { AdminView } from './views/admin/AdminView';
import { Product, Order } from './types';

function MainApp() {
  const { products, settings } = useStore();
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'product' | 'checkout' | 'order-confirmation' | 'wishlist' | 'admin'>('home');
  const [shopCategory, setShopCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Sync with browser URL / history
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        setCurrentView('admin');
      } else if (path.startsWith('/product/')) {
        const slug = path.replace('/product/', '');
        const found = products.find((p) => p.slug === slug);
        if (found) {
          setSelectedProduct(found);
          setCurrentView('product');
        }
      } else if (path === '/shop') {
        setCurrentView('shop');
      } else if (path === '/checkout') {
        setCurrentView('checkout');
      } else if (path === '/wishlist') {
        setCurrentView('wishlist');
      } else {
        setCurrentView('home');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [products]);

  const navigateTo = (view: string, param?: string) => {
    if (view === 'home') {
      window.history.pushState({}, '', '/');
      setCurrentView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'shop') {
      window.history.pushState({}, '', '/shop');
      setShopCategory(param || '');
      setCurrentView('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'wishlist') {
      window.history.pushState({}, '', '/wishlist');
      setCurrentView('wishlist');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'checkout') {
      window.history.pushState({}, '', '/checkout');
      setCurrentView('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.history.pushState({}, '', `/product/${product.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProductBySlug = (slug: string) => {
    const found = products.find((p) => p.slug === slug);
    if (found) {
      handleSelectProduct(found);
    }
  };

  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    setCurrentView('order-confirmation');
    window.history.pushState({}, '', `/order/${order.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in admin mode, display admin layout without customer header/footer
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#F4F4F0]">
        <AdminView onExitAdmin={() => navigateTo('home')} />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-[#1A1A18] selection:bg-[#1A1A18] selection:text-[#FBFBF9]">
      <AnnouncementBar onNavigateShop={() => navigateTo('shop')} />
      <Header currentView={currentView} onNavigate={navigateTo} />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={navigateTo}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'shop' && (
          <ShopView
            initialCategory={shopCategory}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onNavigateShop={() => navigateTo('shop')}
            onSelectProduct={handleSelectProduct}
            onCheckout={() => navigateTo('checkout')}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutView
            onBackToShopping={() => navigateTo('shop')}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentView === 'order-confirmation' && confirmedOrder && (
          <OrderConfirmationView
            order={confirmedOrder}
            onContinueShopping={() => navigateTo('shop')}
          />
        )}

        {currentView === 'wishlist' && (
          <WishlistView
            onNavigateShop={() => navigateTo('shop')}
            onSelectProduct={handleSelectProduct}
          />
        )}
      </main>

      <Footer onNavigate={navigateTo} />

      {/* Global Overlays & Modals */}
      <CartDrawer
        onCheckout={() => navigateTo('checkout')}
        onExplore={() => navigateTo('shop')}
      />
      <SearchModal onSelectProduct={handleSelectProduct} />
      <QuickViewModal onOpenFullProduct={handleOpenProductBySlug} />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AdminProvider>
        <MainApp />
      </AdminProvider>
    </StoreProvider>
  );
}
