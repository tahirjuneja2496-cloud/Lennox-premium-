import { Product, ProductColorVariant } from '../types';

export const CATEGORY_OPTIONS = [
  'Shoes',
  "Men's Clothing",
  "Women's Clothing",
  'Jeans & Pants',
  'Kids Clothing',
  'Rings',
  'Accessories',
  'Bags',
  'Watches',
  'Jewellery',
  'Lighting & Objects',
  'Other'
];

export const CATEGORY_SIZE_PRESETS: Record<string, string[]> = {
  Shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  "Men's Clothing": ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  "Women's Clothing": ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Jeans & Pants': ['28', '30', '32', '34', '36', '38', '40', '42'],
  'Kids Clothing': ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y', '14Y'],
  Rings: ['6', '7', '8', '9', '10', '11', '12']
};

/**
 * Returns suggested size presets for a given category name
 */
export function getSizePresetsForCategory(category: string): string[] {
  if (!category) return [];

  const catLower = category.toLowerCase();

  if (catLower.includes('shoe') || catLower.includes('footwear') || catLower.includes('sneaker')) {
    return CATEGORY_SIZE_PRESETS['Shoes'];
  }
  if (catLower.includes("men's") || catLower.includes('shirt') || catLower.includes('hoodie') || catLower.includes('t-shirt') || catLower.includes('men')) {
    return CATEGORY_SIZE_PRESETS["Men's Clothing"];
  }
  if (catLower.includes("women's") || catLower.includes('dress') || catLower.includes('top') || catLower.includes('women')) {
    return CATEGORY_SIZE_PRESETS["Women's Clothing"];
  }
  if (catLower.includes('jean') || catLower.includes('pant') || catLower.includes('trouser')) {
    return CATEGORY_SIZE_PRESETS['Jeans & Pants'];
  }
  if (catLower.includes('kid') || catLower.includes('child')) {
    return CATEGORY_SIZE_PRESETS['Kids Clothing'];
  }
  if (catLower.includes('ring')) {
    return CATEGORY_SIZE_PRESETS['Rings'];
  }

  // Exact match lookup
  if (CATEGORY_SIZE_PRESETS[category]) {
    return CATEGORY_SIZE_PRESETS[category];
  }

  return [];
}

/**
 * Resolves current display price based on product configuration and selected color variant
 */
export function getProductDisplayPrice(product: Product, selectedColorName?: string): number {
  if (!product) return 0;
  const cfg = product.variantConfig;

  // If variant pricing is enabled and a color is selected with a designated price
  if (cfg?.enableVariantPrice && cfg.colors && selectedColorName) {
    const matched = cfg.colors.find(
      (c) => c.name.toLowerCase() === selectedColorName.toLowerCase()
    );
    if (matched && typeof matched.price === 'number' && matched.price > 0) {
      return matched.price;
    }
  }

  return product.price;
}

/**
 * Resolves the active image for the selected color variant
 */
export function getProductDisplayImage(product: Product, selectedColorName?: string): string {
  const fallback = product.images?.[0] || '/images/hero_luxury_editorial_1790850435776.jpg';
  if (!product) return fallback;
  const cfg = product.variantConfig;

  if (cfg?.enableColor && cfg.colors && selectedColorName) {
    const matched = cfg.colors.find(
      (c) => c.name.toLowerCase() === selectedColorName.toLowerCase()
    );
    if (matched && matched.image) {
      return matched.image;
    }
  }

  return fallback;
}
