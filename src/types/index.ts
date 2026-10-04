export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
  attributes: Record<string, string>;
}

export interface ProductColorVariant {
  id: string;
  name: string;
  image?: string;
  price?: number;
}

export interface ProductVariantConfig {
  enableSize?: boolean;
  enableColor?: boolean;
  enableVariantPrice?: boolean;
  availableSizes?: string[];
  colors?: ProductColorVariant[];
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  tags: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  published: boolean;
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  variantConfig?: ProductVariantConfig;
  rating: number;
  reviewCount: number;
  seo: ProductSEO;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  enabled: boolean;
  order: number;
  subcategories?: string[];
}

export interface CartItem {
  productId: string;
  product: Product;
  variantId?: string;
  variantName?: string;
  color?: string;
  size?: string;
  image?: string;
  selectedVariant?: ProductVariant;
  quantity: number;
  price: number;
}

export interface CustomerDetails {
  fullName: string;
  mobileNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email?: string;
  phone?: string;
  apartment?: string;
  country?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'
  | 'New';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  variantName?: string;
  color?: string;
  size?: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customer: CustomerDetails;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    discount: number;
    couponCode?: string;
    shipping: number;
    grandTotal: number;
  };
  payment: {
    method: 'card' | 'cod' | 'bank_transfer';
    status: 'paid' | 'pending' | 'failed';
    transactionId?: string;
  };
  status: OrderStatus;
  trackingNumber?: string;
  shippingCarrier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'Active' | 'VIP' | 'Inactive';
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  verified: boolean;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  status: 'approved' | 'pending' | 'rejected';
  featured: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logo: string;
  favicon: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkUrl?: string;
  };
  hero: {
    headline: string;
    subtitle: string;
    badge: string;
    image: string;
    primaryCta: string;
    secondaryCta: string;
  };
  currency: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  shippingCharges: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  paymentGatewayTest: boolean;
  socialLinks: {
    instagram: string;
    twitter: string;
    pinterest: string;
    facebook: string;
  };
}
