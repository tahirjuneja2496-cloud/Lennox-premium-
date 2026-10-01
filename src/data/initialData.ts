import type { Product, Category, Order, CustomerProfile, Coupon, Review, StoreSettings } from '../types/index.ts';

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'ATELIER V',
  tagline: 'Quiet Luxury & Timeless Form',
  logo: 'ATELIER V',
  favicon: '',
  announcementBar: {
    enabled: true,
    text: 'Complimentary Global Express Delivery on Orders Above $250 · Bespoke Gift Packaging',
    linkText: 'Discover',
    linkUrl: '#featured'
  },
  hero: {
    headline: 'Form. Materiality. Permanent Presence.',
    subtitle: 'A disciplined curation of architectural objects, bespoke tailoring, and artisanal leather goods conceived for longevity.',
    badge: 'Curated Edition 2026',
    image: '/src/assets/images/hero_luxury_editorial_1790850435776.jpg',
    primaryCta: 'Explore Collection',
    secondaryCta: 'The Atelier Journal'
  },
  currency: '$',
  contactEmail: 'concierge@atelierv.com',
  contactPhone: '+1 (800) 492-9102',
  address: '42 Rue de Sévigné, 75003 Paris & 180 Mercer St, New York, NY 10012',
  shippingCharges: 25,
  freeShippingThreshold: 250,
  codEnabled: true,
  paymentGatewayTest: true,
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
    image: '/src/assets/images/product_sculptural_lamp_1790850449675.jpg',
    enabled: true,
    order: 1,
    subcategories: ['Table Lamps', 'Vessels', 'Bronze Sculptures']
  },
  {
    id: 'cat-apparel',
    name: 'Bespoke Apparel',
    slug: 'apparel',
    description: 'Double-faced cashmere overcoats, heavy French twill trousers, and unlined silk shirts.',
    image: '/src/assets/images/product_cashmere_coat_1790850467320.jpg',
    enabled: true,
    order: 2,
    subcategories: ['Overcoats', 'Tailoring', 'Knitwear']
  },
  {
    id: 'cat-leather',
    name: 'Artisanal Leather',
    slug: 'leather-goods',
    description: 'Full-grain saddle leather weekenders, vegetable-tanned briefcases, and minimalist card folios.',
    image: '/src/assets/images/product_leather_tote_1790850479993.jpg',
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
    price: 680,
    originalPrice: 850,
    discountPercent: 20,
    stock: 8,
    lowStockThreshold: 3,
    images: [
      '/src/assets/images/product_sculptural_lamp_1790850449675.jpg',
      '/src/assets/images/hero_luxury_editorial_1790850435776.jpg'
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
      { label: 'Origin', value: 'Handcrafted in France' }
    ],
    variants: [
      {
        id: 'var-001-1',
        name: 'Patinated Dark Bronze',
        sku: 'ATV-OBJ-001-BRZ',
        price: 680,
        stock: 5,
        attributes: { Finish: 'Patinated Dark Bronze' }
      },
      {
        id: 'var-001-2',
        name: 'Raw Brushed Brass',
        sku: 'ATV-OBJ-001-BSS',
        price: 720,
        stock: 3,
        attributes: { Finish: 'Raw Brushed Brass' }
      }
    ],
    rating: 4.9,
    reviewCount: 18,
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
    price: 1450,
    originalPrice: 1750,
    discountPercent: 17,
    stock: 4,
    lowStockThreshold: 2,
    images: [
      '/src/assets/images/product_cashmere_coat_1790850467320.jpg',
      '/src/assets/images/hero_luxury_editorial_1790850435776.jpg'
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
      { label: 'Origin', value: 'Tailored in Biella, Italy' }
    ],
    variants: [
      {
        id: 'var-002-1',
        name: 'Oat Beige / 48 (Medium)',
        sku: 'ATV-APP-002-OAT-48',
        price: 1450,
        stock: 2,
        attributes: { Color: 'Oat Beige', Size: '48 (Medium)' }
      },
      {
        id: 'var-002-2',
        name: 'Oat Beige / 50 (Large)',
        sku: 'ATV-APP-002-OAT-50',
        price: 1450,
        stock: 2,
        attributes: { Color: 'Oat Beige', Size: '50 (Large)' }
      }
    ],
    rating: 5.0,
    reviewCount: 9,
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
    price: 890,
    originalPrice: 990,
    discountPercent: 10,
    stock: 12,
    lowStockThreshold: 4,
    images: [
      '/src/assets/images/product_leather_tote_1790850479993.jpg',
      '/src/assets/images/product_sculptural_lamp_1790850449675.jpg'
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
      { label: 'Origin', value: 'Bench-crafted in Florence, Italy' }
    ],
    variants: [
      {
        id: 'var-003-1',
        name: 'Cognac Saddle Brown',
        sku: 'ATV-LEA-003-COG',
        price: 890,
        stock: 7,
        attributes: { Color: 'Cognac Saddle Brown' }
      },
      {
        id: 'var-003-2',
        name: 'Noir Black Bridle',
        sku: 'ATV-LEA-003-BLK',
        price: 920,
        stock: 5,
        attributes: { Color: 'Noir Black' }
      }
    ],
    rating: 4.8,
    reviewCount: 24,
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
    price: 340,
    originalPrice: 400,
    discountPercent: 15,
    stock: 6,
    lowStockThreshold: 2,
    images: [
      '/src/assets/images/hero_luxury_editorial_1790850435776.jpg',
      '/src/assets/images/product_sculptural_lamp_1790850449675.jpg'
    ],
    featured: false,
    bestseller: false,
    newArrival: true,
    published: true,
    specifications: [
      { label: 'Dimensions', value: 'Diameter 34cm × Height 14cm' },
      { label: 'Weight', value: '5.2 kg' },
      { label: 'Material', value: 'Natural Roman Travertine' },
      { label: 'Origin', value: 'Tivoli, Italy' }
    ],
    variants: [
      {
        id: 'var-004-1',
        name: 'Warm Ivory Travertine',
        sku: 'ATV-OBJ-004-IVR',
        price: 340,
        stock: 6,
        attributes: { Stone: 'Warm Ivory Travertine' }
      }
    ],
    rating: 4.7,
    reviewCount: 7,
    seo: {
      metaTitle: 'Aethel Travertine Centerpiece Plinth Bowl | Atelier V',
      metaDescription: 'Monolithic fluted Roman travertine vessel carved from a single block of unpolished stone.',
      keywords: 'travertine bowl, stone centerpiece, luxury home decor'
    },
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-09-25T08:20:00Z'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-20260928-0042',
    customer: {
      fullName: 'Lord Julian Sterling',
      email: 'j.sterling@mayfair.co.uk',
      phone: '+44 20 7946 0912',
      address: '14 Berkeley Square',
      apartment: 'Penthouse 4B',
      city: 'London',
      state: 'Greater London',
      pincode: 'W1J 6ER',
      country: 'United Kingdom'
    },
    items: [
      {
        productId: 'prod-001',
        productName: 'No. 04 Sculptural Bronze & Fluted Alabaster Table Lamp',
        sku: 'ATV-OBJ-001-BRZ',
        variantName: 'Patinated Dark Bronze',
        image: '/src/assets/images/product_sculptural_lamp_1790850449675.jpg',
        price: 680,
        quantity: 1,
        subtotal: 680
      },
      {
        productId: 'prod-003',
        productName: 'Cavalier Full-Grain Bridle Leather Weekender',
        sku: 'ATV-LEA-003-COG',
        variantName: 'Cognac Saddle Brown',
        image: '/src/assets/images/product_leather_tote_1790850479993.jpg',
        price: 890,
        quantity: 1,
        subtotal: 890
      }
    ],
    pricing: {
      subtotal: 1570,
      discount: 150,
      couponCode: 'ATELIER150',
      shipping: 0,
      grandTotal: 1420
    },
    payment: {
      method: 'card',
      status: 'paid',
      transactionId: 'TXN_9842104928'
    },
    status: 'Shipped',
    trackingNumber: 'DHL-EX-892019482',
    shippingCarrier: 'DHL Express Worldwide',
    notes: 'Signature required upon delivery at concierge.',
    createdAt: '2026-09-28T14:22:10Z',
    updatedAt: '2026-09-29T09:10:00Z'
  },
  {
    id: 'ORD-20260929-0043',
    customer: {
      fullName: 'Elena Rostova',
      email: 'elena.rostova@geneve-private.ch',
      phone: '+41 22 819 4400',
      address: '28 Quai du Mont-Blanc',
      city: 'Geneva',
      state: 'Geneva',
      pincode: '1201',
      country: 'Switzerland'
    },
    items: [
      {
        productId: 'prod-002',
        productName: 'Sovereign Double-Faced Cashmere Overcoat',
        sku: 'ATV-APP-002-OAT-48',
        variantName: 'Oat Beige / 48 (Medium)',
        image: '/src/assets/images/product_cashmere_coat_1790850467320.jpg',
        price: 1450,
        quantity: 1,
        subtotal: 1450
      }
    ],
    pricing: {
      subtotal: 1450,
      discount: 0,
      shipping: 0,
      grandTotal: 1450
    },
    payment: {
      method: 'card',
      status: 'paid',
      transactionId: 'TXN_4829103991'
    },
    status: 'Processing',
    trackingNumber: 'SWISS-POST-PRIO-0921',
    shippingCarrier: 'Swiss Post Priority',
    createdAt: '2026-09-29T18:05:44Z',
    updatedAt: '2026-09-30T08:00:00Z'
  },
  {
    id: 'ORD-20260930-0044',
    customer: {
      fullName: 'Marcus Vance',
      email: 'm.vance@tribecaworks.com',
      phone: '+1 212 555 0199',
      address: '77 Franklin St',
      apartment: 'Floor 6',
      city: 'New York',
      state: 'NY',
      pincode: '10013',
      country: 'United States'
    },
    items: [
      {
        productId: 'prod-004',
        productName: 'Aethel Travertine Centerpiece Plinth Bowl',
        sku: 'ATV-OBJ-004-IVR',
        variantName: 'Warm Ivory Travertine',
        image: '/src/assets/images/hero_luxury_editorial_1790850435776.jpg',
        price: 340,
        quantity: 1,
        subtotal: 340
      }
    ],
    pricing: {
      subtotal: 340,
      discount: 0,
      shipping: 0,
      grandTotal: 340
    },
    payment: {
      method: 'card',
      status: 'paid',
      transactionId: 'TXN_1928374650'
    },
    status: 'Confirmed',
    createdAt: '2026-09-30T11:40:12Z',
    updatedAt: '2026-09-30T11:40:12Z'
  }
];

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'cust-001',
    fullName: 'Lord Julian Sterling',
    email: 'j.sterling@mayfair.co.uk',
    phone: '+44 20 7946 0912',
    city: 'London',
    country: 'United Kingdom',
    totalOrders: 3,
    totalSpent: 4280,
    lastOrderDate: '2026-09-28',
    status: 'VIP'
  },
  {
    id: 'cust-002',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@geneve-private.ch',
    phone: '+41 22 819 4400',
    city: 'Geneva',
    country: 'Switzerland',
    totalOrders: 2,
    totalSpent: 2650,
    lastOrderDate: '2026-09-29',
    status: 'VIP'
  },
  {
    id: 'cust-003',
    fullName: 'Marcus Vance',
    email: 'm.vance@tribecaworks.com',
    phone: '+1 212 555 0199',
    city: 'New York',
    country: 'United States',
    totalOrders: 1,
    totalSpent: 340,
    lastOrderDate: '2026-09-30',
    status: 'Active'
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-001',
    code: 'LUXE15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 200,
    maxDiscount: 300,
    expiresAt: '2026-12-31',
    usageLimit: 100,
    usedCount: 24,
    active: true
  },
  {
    id: 'coup-002',
    code: 'ATELIER150',
    discountType: 'fixed',
    discountValue: 150,
    minOrderValue: 1000,
    expiresAt: '2026-11-30',
    usageLimit: 50,
    usedCount: 12,
    active: true
  },
  {
    id: 'coup-003',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 100,
    expiresAt: '2027-01-01',
    usageLimit: 500,
    usedCount: 88,
    active: true
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    productId: 'prod-001',
    customerName: 'Alexander Hayes',
    verified: true,
    rating: 5,
    title: 'An architectural masterwork in our living room',
    comment: 'The weight of the cast bronze is remarkable. In the evening, the alabaster diffuses light with the warmth of candlelight. Every visitor asks where it was acquired.',
    images: [],
    status: 'approved',
    featured: true,
    createdAt: '2026-09-12'
  },
  {
    id: 'rev-002',
    productId: 'prod-002',
    customerName: 'Sophia Lin',
    verified: true,
    rating: 5,
    title: 'Supreme cashmere quality and tailoring',
    comment: 'Having owned outerwear from Milan and Savile Row, the hand-finishing on this coat is peerless. It drapes naturally without any rigidity and is exceptionally warm.',
    images: [],
    status: 'approved',
    featured: true,
    createdAt: '2026-09-22'
  },
  {
    id: 'rev-003',
    productId: 'prod-003',
    customerName: 'David K.',
    verified: true,
    rating: 5,
    title: 'Heirloom quality bridle leather',
    comment: 'Took it on a weekend trip to Zurich. Sturdy, smells incredible, and the brass hardware is substantial. Will likely pass this down.',
    images: [],
    status: 'approved',
    featured: true,
    createdAt: '2026-09-25'
  }
];
