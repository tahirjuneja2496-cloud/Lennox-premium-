import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, Category, CartItem, ProductVariant, StoreSettings } from '../types';
import { api } from '../services/api';
import { INITIAL_SETTINGS } from '../data/initialData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface StoreContextType {
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
  loading: boolean;
  cart: CartItem[];
  wishlist: string[];
  toasts: Toast[];
  cartDrawerOpen: boolean;
  searchOpen: boolean;
  quickViewProduct: Product | null;
  searchQuery: string;
  
  // Actions
  refreshData: () => Promise<void>;
  addToCart: (
    product: Product,
    variant?: ProductVariant,
    quantity?: number,
    selectedOptions?: {
      color?: string;
      size?: string;
      image?: string;
      price?: number;
    }
  ) => void;
  removeFromCart: (productId: string, variantId?: string, color?: string, size?: string) => void;
  updateCartQuantity: (
    productId: string,
    variantId: string | undefined,
    quantity: number,
    color?: string,
    size?: string
  ) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;
  setSearchQuery: (query: string) => void;
  formatPrice: (amount: number) => string;
  
  // Computed
  cartSubtotal: number;
  cartCount: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cart persisted in localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('atelierv_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist persisted in localStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('atelierv_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Save cart & wishlist
  useEffect(() => {
    try {
      localStorage.setItem('atelierv_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('atelierv_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  const refreshData = useCallback(async () => {
    try {
      const [sData, pData, cData] = await Promise.all([
        api.getSettings(),
        api.getProducts(),
        api.getCategories()
      ]);
      setSettings(sData);
      setProducts(pData);
      setCategories(cData);
    } catch (err) {
      console.error('Error refreshing store data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToCart = (
    product: Product,
    variant?: ProductVariant,
    quantity: number = 1,
    selectedOptions?: {
      color?: string;
      size?: string;
      image?: string;
      price?: number;
    }
  ) => {
    // Check variant or product stock
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock <= 0) {
      addToast(`'${product.name}' is currently out of stock.`, 'error');
      return;
    }

    const price = selectedOptions?.price ?? (variant?.price ?? product.price);
    const variantId = variant?.id;
    const color = selectedOptions?.color;
    const size = selectedOptions?.size;
    const image = selectedOptions?.image || variant?.image || product.images?.[0];

    let variantName = variant?.name;
    if (!variantName && (color || size)) {
      variantName = [color, size].filter(Boolean).join(' / ');
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.productId === product.id &&
          item.variantId === variantId &&
          item.color === color &&
          item.size === size
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        const newQty = newCart[existingIndex].quantity + quantity;
        if (newQty > availableStock) {
          addToast(`Maximum available stock reached for this selection.`, 'info');
          newCart[existingIndex].quantity = availableStock;
        } else {
          newCart[existingIndex].quantity = newQty;
          addToast(`Added another to bag: ${product.name}`);
        }
        return newCart;
      } else {
        const itemQty = Math.min(quantity, availableStock);
        addToast(`Added to your shopping bag: ${product.name}`);
        return [
          ...prevCart,
          {
            productId: product.id,
            product,
            variantId,
            variantName,
            color,
            size,
            image,
            selectedVariant: variant,
            quantity: itemQty,
            price
          }
        ];
      }
    });

    setCartDrawerOpen(true);
  };

  const removeFromCart = (
    productId: string,
    variantId?: string,
    color?: string,
    size?: string
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.variantId === variantId &&
            item.color === color &&
            item.size === size
          )
      )
    );
    addToast('Item removed from bag', 'info');
  };

  const updateCartQuantity = (
    productId: string,
    variantId: string | undefined,
    quantity: number,
    color?: string,
    size?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId, color, size);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (
          item.productId === productId &&
          item.variantId === variantId &&
          item.color === color &&
          item.size === size
        ) {
          const maxStock = item.selectedVariant ? item.selectedVariant.stock : item.product.stock;
          return {
            ...item,
            quantity: Math.min(quantity, maxStock)
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        addToast('Removed from your saved items', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        addToast('Saved to your private wishlist');
        return [...prev, productId];
      }
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (amount: number) => {
    const symbol = settings.currency || '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        products,
        categories,
        loading,
        cart,
        wishlist,
        toasts,
        cartDrawerOpen,
        searchOpen,
        quickViewProduct,
        searchQuery,
        refreshData,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isWishlisted,
        addToast,
        removeToast,
        setCartDrawerOpen,
        setSearchOpen,
        setQuickViewProduct,
        setSearchQuery,
        formatPrice,
        cartSubtotal,
        cartCount
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
