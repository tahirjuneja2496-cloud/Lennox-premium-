import React, { useState } from 'react';
import { X, Check, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductVariant } from '../types';

interface QuickViewModalProps {
  onOpenFullProduct: (slug: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ onOpenFullProduct }) => {
  const { quickViewProduct, setQuickViewProduct, addToCart, formatPrice } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    quickViewProduct?.variants?.[0]
  );

  const cfg = quickViewProduct?.variantConfig;
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    cfg?.enableColor && cfg.colors && cfg.colors.length > 0 ? cfg.colors[0].name : undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    cfg?.enableSize && cfg.availableSizes && cfg.availableSizes.length > 0
      ? cfg.availableSizes[0]
      : undefined
  );

  const [quantity, setQuantity] = useState(1);

  // Sync state when quickViewProduct changes
  React.useEffect(() => {
    if (quickViewProduct) {
      setSelectedVariant(quickViewProduct.variants?.[0]);
      setQuantity(1);
      const c = quickViewProduct.variantConfig;
      setSelectedColor(c?.enableColor && c.colors && c.colors.length > 0 ? c.colors[0].name : undefined);
      setSelectedSize(c?.enableSize && c.availableSizes && c.availableSizes.length > 0 ? c.availableSizes[0] : undefined);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const selectedColorObj = cfg?.enableColor && selectedColor
    ? cfg.colors?.find((c) => c.name.toLowerCase() === selectedColor.toLowerCase())
    : undefined;

  const currentPrice =
    cfg?.enableVariantPrice && selectedColorObj && typeof selectedColorObj.price === 'number' && selectedColorObj.price > 0
      ? selectedColorObj.price
      : (selectedVariant?.price ?? quickViewProduct.price);

  const currentStock = selectedVariant?.stock ?? quickViewProduct.stock;
  const isOutOfStock = currentStock <= 0;
  const displayImage = selectedColorObj?.image || selectedVariant?.image || quickViewProduct.images?.[0];

  const handleAddToCart = () => {
    addToCart(quickViewProduct, selectedVariant, quantity, {
      color: cfg?.enableColor ? selectedColor : undefined,
      size: cfg?.enableSize ? selectedSize : undefined,
      image: displayImage,
      price: currentPrice
    });
    setQuickViewProduct(null);
  };

  const handleOpenDetails = () => {
    const slug = quickViewProduct.slug;
    setQuickViewProduct(null);
    onOpenFullProduct(slug);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={() => setQuickViewProduct(null)}
    >
      <div
        className="relative w-full max-w-3xl bg-[#FBFBF9] border border-[#1A1A18]/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-10 p-2 text-[#1A1A18] hover:opacity-60 transition-opacity cursor-pointer bg-[#FBFBF9]/80 backdrop-blur-md rounded-full"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
          {/* Image */}
          <div className="aspect-[3/4] md:aspect-auto bg-[#F4F4F0] relative">
            <img
              src={displayImage}
              alt={quickViewProduct.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-[#71716A] uppercase tracking-wider">
                <span>{quickViewProduct.category}</span>
                <span className="font-mono text-[11px]">{selectedVariant?.sku || quickViewProduct.sku}</span>
              </div>

              {/* Title */}
              <h2 className="mt-2 text-2xl font-serif text-[#1A1A18] font-normal leading-snug">
                {quickViewProduct.name}
              </h2>

              {/* Price */}
              <div className="mt-3 flex items-baseline gap-3 text-lg tabular-nums">
                <span className="font-semibold text-[#1A1A18]">{formatPrice(currentPrice)}</span>
                {quickViewProduct.originalPrice > currentPrice && (
                  <span className="text-sm text-[#8A8A82] line-through">
                    {formatPrice(quickViewProduct.originalPrice)}
                  </span>
                )}
                {quickViewProduct.discountPercent > 0 && (
                  <span className="text-xs text-emerald-800 font-medium">
                    Save {quickViewProduct.discountPercent}%
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-4 text-xs leading-relaxed text-[#52524D] line-clamp-3">
                {quickViewProduct.shortDescription || quickViewProduct.description}
              </p>

              {/* Optional Colour Selector */}
              {cfg?.enableColor && cfg.colors && cfg.colors.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#1A1A18]/10">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="uppercase tracking-wider font-medium text-[#1A1A18]">
                      Colour:
                    </span>
                    <span className="text-[#71716A] font-medium">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cfg.colors.map((c) => {
                      const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
                      return (
                        <button
                          key={c.id || c.name}
                          type="button"
                          onClick={() => setSelectedColor(c.name)}
                          className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'border-[#1A1A18] bg-[#1A1A18] text-[#FBFBF9]'
                              : 'border-[#1A1A18]/20 text-[#1A1A18] hover:border-[#1A1A18]'
                          }`}
                        >
                          {c.image && (
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-3.5 h-3.5 object-cover rounded-xs border border-white/20"
                            />
                          )}
                          <span>{c.name}</span>
                          {cfg.enableVariantPrice && c.price && c.price > 0 && (
                            <span className="text-[10px] opacity-80 tabular-nums">
                              ({formatPrice(c.price)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional Size Selector */}
              {cfg?.enableSize && cfg.availableSizes && cfg.availableSizes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#1A1A18]/10">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="uppercase tracking-wider font-medium text-[#1A1A18]">
                      Size:
                    </span>
                    <span className="text-[#71716A] font-mono font-medium">{selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cfg.availableSizes.map((sz) => {
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`min-w-[36px] px-2.5 py-1 text-xs font-mono font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-[#1A1A18] bg-[#1A1A18] text-[#FBFBF9]'
                              : 'border-[#1A1A18]/20 text-[#1A1A18] hover:border-[#1A1A18]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legacy Variant Selector */}
              {!cfg?.enableColor && !cfg?.enableSize && quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#1A1A18]/10">
                  <label className="text-xs uppercase tracking-wider text-[#1A1A18] font-medium block mb-2">
                    Edition / Option:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickViewProduct.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                          selectedVariant?.id === variant.id
                            ? 'border-[#1A1A18] bg-[#1A1A18] text-[#FBFBF9]'
                            : 'border-[#1A1A18]/20 text-[#1A1A18] hover:border-[#1A1A18]'
                        }`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mt-5 flex items-center gap-4">
                <span className="text-xs uppercase tracking-wider text-[#1A1A18] font-medium">
                  Quantity:
                </span>
                <div className="flex items-center border border-[#1A1A18]/20">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1 text-sm text-[#1A1A18] hover:bg-[#EAEAE5] disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs tabular-nums font-medium text-[#1A1A18]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    className="px-3 py-1 text-sm text-[#1A1A18] hover:bg-[#EAEAE5] disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-[#71716A]">
                  {isOutOfStock
                    ? 'Unavailable'
                    : currentStock <= 5
                    ? `Only ${currentStock} available`
                    : 'In Stock'}
                </span>
              </div>
            </div>

            {/* Actions & Links */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-3.5 bg-[#1A1A18] hover:bg-[#333330] disabled:bg-[#8A8A82] text-[#FBFBF9] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
              >
                {isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}
              </button>

              <button
                onClick={handleOpenDetails}
                className="w-full py-2.5 text-xs uppercase tracking-wider font-medium text-[#1A1A18] hover:opacity-70 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Complete Product Details & Specs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-3 border-t border-[#1A1A18]/10 grid grid-cols-2 gap-2 text-[11px] text-[#71716A]">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#1A1A18]" />
                  <span>Global Express Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1A1A18]" />
                  <span>Certificate of Authenticity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
