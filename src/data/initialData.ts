import type { Product, Category, Order, CustomerProfile, Coupon, Review, StoreSettings } from '../types/index.ts';

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'ATELIER V',
  tagline: 'Quiet Luxury & Timeless Form',
  logo: 'ATELIER V',
  favicon: '',
  announcementBar: {
    enabled: true,
    text: 'Complimentary Express Delivery on Orders Above ₹1,999 · Bespoke Presentation Packaging',
    linkText: 'Explore',
    linkUrl: '#featured'
  },
  hero: {
    headline: 'Form. Materiality. Permanent Presence.',
    subtitle: 'A disciplined curation of architectural objects, bespoke tailoring, and artisanal leather goods conceived for longevity.',
    badge: 'Curated Edition 2026',
    image: '/images/hero_luxury_editorial_1790850435776.jpg',
    primaryCta: 'Explore Collection',
    secondaryCta: 'The Atelier Journal'
  },
  currency: '₹',
  contactEmail: 'concierge@atelierv.com',
  contactPhone: '+91 98765 43210',
  address: 'Atelier V Studio, Bandra West, Mumbai, Maharashtra 400050',
  shippingCharges: 150,
  freeShippingThreshold: 1999,
  codEnabled: true,
  paymentGatewayTest: false,
  socialLinks: {
    instagram: 'https://instagram.com',
    twitter: 'https://x.com',
    pinterest: 'https://pinterest.com',
    facebook: 'https://facebook.com'
  }
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-objects',
    name: 'Lighting & Objects',
    slug: 'lighting-objects',
    description: 'Sculptural lighting, carved travertine plinths, and hand-turned bronze vessel objects.',
    image: '/images/product_sculptural_lamp_1790850449675.jpg',
    enabled: true,
    order: 1,
    subcategories: ['Table Lamps', 'Vessels', 'Bronze Sculptures']
  },
  {
    id: 'cat-apparel',
    name: 'Bespoke Apparel',
    slug: 'apparel',
    description: 'Double-faced cashmere overcoats, heavy French twill trousers, and unlined silk shirts.',
    image: '/images/product_cashmere_coat_1790850467320.jpg',
    enabled: true,
    order: 2,
    subcategories: ['Overcoats', 'Tailoring', 'Knitwear']
  },
  {
    id: 'cat-leather',
    name: 'Artisanal Leather',
    slug: 'leather-goods',
    description: 'Full-grain saddle leather weekenders, vegetable-tanned briefcases, and minimalist card folios.',
    image: '/images/product_leather_tote_1790850479993.jpg',
    enabled: true,
    order: 3,
    subcategories: ['Weekenders', 'Totes', 'Folios']
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'ATV-OBJ-001',
    slug: 'sculptural-bronze-alabaster-lamp',
    name: 'No. 04 Sculptural Bronze & Fluted Alabaster Table Lamp',
    shortDescription: 'Hand-cast solid bronze arm with honed Spanish alabaster shade, offering soft directional illumination.',
    description: 'Conceived in collaboration with Parisian foundry artisans, the No. 04 table lamp marries solid patinated bronze with translucent honed Spanish alabaster. Each lamp exhibits distinct mineral veining, turning direct illumination into an atmospheric, warm ambient glow. Features an integrated touch dimmer switch concealed within the base.',
    category: 'Lighting & Objects',
    subcategory: 'Table Lamps',
    brand: 'Atelier V Editions',
    tags: ['Lighting', 'Bronze', 'Alabaster', 'Minimalist', 'Handcrafted'],
    price: 14500,
    originalPrice: 17500,
    discountPercent: 17,
    stock: 8,
    lowStockThreshold: 3,
    images: [
      '/images/product_sculptural_lamp_1790850449675.jpg',
      '/images/hero_luxury_editorial_1790850435776.jpg'
    ],
    featured: true,
    bestseller: true,
    newArrival: false,
    published: true,
    specifications: [
      { label: 'Dimensions', value: 'H 46cm × W 28cm × D 18cm' },
      { label: 'Weight', value: '6.4 kg / 14.1 lbs' },
      { label: 'Materials', value: 'Cast solid bronze, Honed Spanish alabaster' },
      { label: 'Light Source', value: 'Custom 2700K Warm LED (Included), 600 lumens' },
      { label: 'Origin', value: 'Handcrafted in Atelier Workshop' }
    ],
    variants: [
      {
        id: 'var-001-1',
        name: 'Patinated Dark Bronze',
        sku: 'ATV-OBJ-001-BRZ',
        price: 14500,
        stock: 5,
        attributes: { Finish: 'Patinated Dark Bronze' }
      },
      {
        id: 'var-001-2',
        name: 'Raw Brushed Brass',
        sku: 'ATV-OBJ-001-BSS',
        price: 15500,
        stock: 3,
        attributes: { Finish: 'Raw Brushed Brass' }
      }
    ],
    rating: 0,
    reviewCount: 0,
    seo: {
      metaTitle: 'No. 04 Sculptural Bronze & Alabaster Lamp | Atelier V',
      metaDescription: 'Hand-cast solid bronze arm with honed Spanish alabaster shade, offering soft directional illumination.',
      keywords: 'luxury lamp, sculptural lighting, alabaster table lamp, designer lamp'
    },
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-09-20T14:30:00Z'
  },
  {
    id: 'prod-002',
    sku: 'ATV-APP-002',
    slug: 'double-faced-oat-cashmere-overcoat',
    name: 'Sovereign Double-Faced Cashmere Overcoat',
    shortDescription: 'Unstructured, hand-stitched double-faced Mongolian cashmere tailored in oat beige with horn buttons.',
    description: 'The Sovereign Overcoat is constructed from 650gsm pure Mongolian cashmere, split and hand-finished along every interior seam with invisible blind stitching. Featuring a relaxed raglan shoulder, generous calf length, real horn buttons, and cupro-lined sleeves for effortless layering over heavy tailoring.',
    category: 'Bespoke Apparel',
    subcategory: 'Overcoats',
    brand: 'Atelier V Bespoke',
    tags: ['Cashmere', 'Outerwear', 'Overcoat', 'Tailoring', 'Luxury'],
    price: 24900,
    originalPrice: 28900,
    discountPercent: 14,
    stock: 4,
    lowStockThreshold: 2,
    images: [
      '/images/product_cashmere_coat_1790850467320.jpg',
      '/images/hero_luxury_editorial_1790850435776.jpg'
    ],
    featured: true,
    bestseller: false,
    newArrival: true,
    published: true,
    specifications: [
      { label: 'Composition', value: '100% Grade-A Mongolian Cashmere' },
      { label: 'Lining', value: '100% Bemberg Cupro (Sleeves only)' },
      { label: 'Closure', value: 'Engraved Buffalo Horn Buttons' },
      { label: 'Care', value: 'Specialist dry clean only' },
      { label: 'Origin', value: 'Hand-tailored in Biella' }
    ],
    variants: [
      {
        id: 'var-002-1',
        name: 'Oat Beige / 48 (Medium)',
        sku: 'ATV-APP-002-OAT-48',
        price: 24900,
        stock: 2,
        attributes: { Color: 'Oat Beige', Size: '48 (Medium)' }
      },
      {
        id: 'var-002-2',
        name: 'Oat Beige / 50 (Large)',
        sku: 'ATV-APP-002-OAT-50',
        price: 24900,
        stock: 2,
        attributes: { Color: 'Oat Beige', Size: '50 (Large)' }
      }
    ],
    rating: 0,
    reviewCount: 0,
    seo: {
      metaTitle: 'Sovereign Double-Faced Cashmere Overcoat | Atelier V',
      metaDescription: 'Unstructured, hand-stitched double-faced Mongolian cashmere tailored in oat beige with horn buttons.',
      keywords: 'cashmere overcoat, luxury coat, double faced cashmere, men luxury outerwear'
    },
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-28T16:15:00Z'
  },
  {
    id: 'prod-003',
    sku: 'ATV-LEA-003',
    slug: 'bridle-leather-cognac-weekender-tote',
    name: 'Cavalier Full-Grain Bridle Leather Weekender',
    shortDescription: 'Vegetable-tanned Tuscan bridle leather travel tote with solid brass hardware and suede lining.',
    description: 'Designed for brief continental journeys, the Cavalier Weekender is bench-made from 2.8mm vegetable-tanned Tuscan bridle leather that develops an extraordinary warm patina over decades of movement. Reinforced with hand-set copper saddle rivets, heavy RiRi zippers, and an interior divider lined in glove-soft suede.',
    category: 'Artisanal Leather',
    subcategory: 'Weekenders',
    brand: 'Atelier V Leathercraft',
    tags: ['Leather', 'Weekender', 'Luggage', 'Travel', 'Handcrafted'],
    price: 18500,
    originalPrice: 21000,
    discountPercent: 12,
    stock: 12,
    lowStockThreshold: 4,
    images: [
      '/images/product_leather_tote_1790850479993.jpg',
      '/images/product_sculptural_lamp_1790850449675.jpg'
    ],
    featured: true,
    bestseller: true,
    newArrival: false,
    published: true,
    specifications: [
      { label: 'Dimensions', value: '52cm × 32cm × 24cm (Carry-on approved)' },
      { label: 'Capacity', value: '40 Liters' },
      { label: 'Leather', value: 'Full-Grain Tuscan Bridle Leather (Vegetable-Tanned)' },
      { label: 'Hardware', value: 'Solid Sand-Cast Brass, Swiss RiRi Zippers' },
      { label: 'Origin', value: 'Bench-crafted in Florence' }
    ],
    variants: [
      {
        id: 'var-003-1',
        name: 'Cognac Saddle Brown',
        sku: 'ATV-LEA-003-COG',
        price: 18500,
        stock: 7,
        attributes: { Color: 'Cognac Saddle Brown' }
      },
      {
        id: 'var-003-2',
        name: 'Noir Black Bridle',
        sku: 'ATV-LEA-003-BLK',
        price: 19500,
        stock: 5,
        attributes: { Color: 'Noir Black' }
      }
    ],
    rating: 0,
    reviewCount: 0,
    seo: {
      metaTitle: 'Cavalier Full-Grain Bridle Leather Weekender | Atelier V',
      metaDescription: 'Vegetable-tanned Tuscan bridle leather travel tote with solid brass hardware and suede lining.',
      keywords: 'leather weekender, bridle leather bag, luxury travel tote, vegetable tanned luggage'
    },
    createdAt: '2026-07-20T11:00:00Z',
    updatedAt: '2026-09-18T10:45:00Z'
  },
  {
    id: 'prod-004',
    sku: 'ATV-OBJ-004',
    slug: 'fluted-travertine-pedestal-bowl',
    name: 'Aethel Travertine Centerpiece Plinth Bowl',
    shortDescription: 'Monolithic fluted Roman travertine vessel carved from a single block of unpolished stone.',
    description: 'Each Aethel centerpiece is carved from select blocks of Italian porous travertine stone. Kept matte and untreated to celebrate naturally formed cavity fissures and pale ivory tones, it functions with architectural presence either as a fruit display or solitary sculptural centerpiece.',
    category: 'Lighting & Objects',
    subcategory: 'Vessels',
    brand: 'Atelier V Editions',
    tags: ['Travertine', 'Sculpture', 'Home', 'Centerpiece'],
    price: 6800,
    originalPrice: 7800,
    discountPercent: 13,
    stock: 6,
    lowStockThreshold: 2,
    images: [
      '/images/hero_luxury_editorial_1790850435776.jpg',
      '/images/product_sculptural_lamp_1790850449675.jpg'
    ],
    featured: false,
    bestseller: false,
    newArrival: true,
    published: true,
    specifications: [
      { label: 'Dimensions', value: 'Diameter 34cm × Height 14cm' },
      { label: 'Weight', value: '5.2 kg' },
      { label: 'Material', value: 'Natural Roman Travertine' },
      { label: 'Origin', value: 'Tivoli Workshop' }
    ],
    variants: [
      {
        id: 'var-004-1',
        name: 'Warm Ivory Travertine',
        sku: 'ATV-OBJ-004-IVR',
        price: 6800,
        stock: 6,
        attributes: { Stone: 'Warm Ivory Travertine' }
      }
    ],
    rating: 0,
    reviewCount: 0,
    seo: {
      metaTitle: 'Aethel Travertine Centerpiece Plinth Bowl | Atelier V',
      metaDescription: 'Monolithic fluted Roman travertine vessel carved from a single block of unpolished stone.',
      keywords: 'travertine bowl, stone centerpiece, luxury home decor'
    },
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-09-25T08:20:00Z'
  }
];

// Clean real empty orders, customers, and reviews (no fake demo content)
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_CUSTOMERS: CustomerProfile[] = [];
export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-001',
    code: 'ATELIER10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 2000,
    maxDiscount: 2000,
    expiresAt: '2027-12-31',
    usageLimit: 500,
    usedCount: 0,
    active: true
  },
  {
    id: 'coup-002',
    code: 'WELCOME500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 5000,
    expiresAt: '2027-12-31',
    usageLimit: 200,
    usedCount: 0,
    active: true
  }
];
