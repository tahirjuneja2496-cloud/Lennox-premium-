import React, { useState } from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { isWishlisted, toggleWishlist, addToCart, formatPrice, setQuickViewProduct } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isFavorited = isWishlisted(product.id);

  const cleanUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('/src/assets/images/')) {
      return url.replace('/src/assets/images/', '/images/');
    }
    return url;
  };

  const primaryImage = cleanUrl(product.images?.[0]);
  const secondaryImage = cleanUrl(product.images?.[1]) || primaryImage;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 3);

  return (
    <div
      className="group relative flex flex-col transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F0] cursor-pointer">
        <button
          type="button"
          onClick={() => onSelect(product)}
          className="w-full h-full text-left p-0 border-0 bg-transparent block"
          aria-label={`View ${product.name}`}
        >
          {!imageError && primaryImage ? (
            <img
              src={isHovered && secondaryImage ? secondaryImage : primaryImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#EAEAE5] text-[#71716A] text-xs font-serif italic p-6 text-center">
              <span>{product.name}</span>
            </div>
          )}
        </button>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label="Save to wishlist"
          className="absolute top-3 right-3 z-10 p-2 bg-[#FBFBF9]/80 backdrop-blur-md rounded-full text-[#1A1A18] hover:bg-white hover:scale-110 transition-all duration-200 cursor-pointer shadow-xs"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited ? 'fill-rose-700 text-rose-700' : 'text-[#1A1A18]'
            }`}
          />
        </button>

        {/* Quick Action Overlay */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="flex-1 py-2.5 px-3 bg-[#FBFBF9]/90 backdrop-blur-md hover:bg-[#1A1A18] hover:text-[#FBFBF9] text-[#1A1A18] text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>

          {!isOutOfStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="py-2.5 px-3 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-medium flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Add to bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Metadata */}
      <div className="pt-3.5 flex flex-col flex-grow">
        {/* Category & Status Indicator */}
        <div className="flex items-center justify-between text-[11px] text-[#71716A] uppercase tracking-wider">
          <span>{product.category}</span>
          {isOutOfStock ? (
            <span className="text-stone-500 font-medium">Sold Out</span>
          ) : isLowStock ? (
            <span className="text-amber-800 font-medium">Only {product.stock} left</span>
          ) : product.bestseller ? (
            <span className="text-[#1A1A18] font-medium">Bestseller</span>
          ) : product.newArrival ? (
            <span className="text-[#1A1A18] font-medium">New Edition</span>
          ) : null}
        </div>

        {/* Product Name */}
        <h3
          onClick={() => onSelect(product)}
          className="mt-1 text-sm font-medium text-[#1A1A18] hover:opacity-75 transition-opacity cursor-pointer line-clamp-1"
        >
          {product.name}
        </h3>

        {/* Pricing with Tabular Numerals */}
        <div className="mt-1.5 flex items-baseline gap-2 text-sm tabular-nums">
          <span className="font-semibold text-[#1A1A18]">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <>
              <span className="text-xs text-[#8A8A82] line-through">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="text-[11px] text-emerald-800 font-medium">
                -{product.discountPercent}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
