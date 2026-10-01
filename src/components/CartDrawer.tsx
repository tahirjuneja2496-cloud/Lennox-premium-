import React, { useState } from 'react';
import { X, Trash2, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';

interface CartDrawerProps {
  onCheckout: () => void;
  onExplore: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout, onExplore }) => {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    formatPrice,
    settings,
    addToast
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  if (!cartDrawerOpen) return null;

  const freeShippingThreshold = settings.freeShippingThreshold || 250;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const shippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingCharge = cartSubtotal >= freeShippingThreshold || cartSubtotal === 0 ? 0 : settings.shippingCharges || 25;
  const grandTotal = Math.max(0, cartSubtotal - discount + shippingCharge);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const res = await api.validateCoupon(couponCode, cartSubtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountAmount: res.discountAmount
        });
        addToast(`Coupon '${res.code}' applied successfully (-${formatPrice(res.discountAmount)})`);
      }
    } catch (err: any) {
      addToast(err.message || 'Invalid promotional code', 'error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleProceedToCheckout = () => {
    setCartDrawerOpen(false);
    onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FBFBF9] border-l border-[#1A1A18]/10 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#1A1A18]/10 flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest font-semibold text-[#1A1A18]">
              Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="p-1 text-[#1A1A18] hover:opacity-60 transition-opacity cursor-pointer"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Complimentary Shipping Progress */}
          <div className="px-6 py-3 bg-[#F4F4F0] border-b border-[#1A1A18]/5 text-xs text-[#52524D]">
            {amountToFreeShipping > 0 ? (
              <p>
                Add <span className="font-semibold text-[#1A1A18]">{formatPrice(amountToFreeShipping)}</span> for complimentary express delivery.
              </p>
            ) : (
              <p className="font-medium text-emerald-800">
                You have unlocked complimentary global express delivery.
              </p>
            )}
            <div className="mt-2 w-full h-1 bg-[#E2E2DC] overflow-hidden">
              <div
                className="h-full bg-[#1A1A18] transition-all duration-300"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>

          {/* Item List or Empty State */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#1A1A18]/10">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <p className="font-serif text-2xl text-[#1A1A18]">Your bag is empty.</p>
                <p className="mt-2 text-xs text-[#71716A] max-w-xs">
                  Discover our permanent editions of architectural objects and tailored creations.
                </p>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    onExplore();
                  }}
                  className="mt-6 py-2.5 px-6 bg-[#1A1A18] text-[#FBFBF9] text-xs uppercase tracking-wider font-medium hover:bg-[#333330] transition-colors cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const maxStock = item.selectedVariant
                  ? item.selectedVariant.stock
                  : item.product.stock;
                return (
                  <div key={`${item.productId}-${item.variantId || 'base'}`} className="py-4 flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-24 bg-[#F4F4F0] shrink-0 overflow-hidden">
                      <img
                        src={item.selectedVariant?.image || item.product.images?.[0]}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-medium text-[#1A1A18] line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.productId, item.variantId)}
                            className="text-[#8A8A82] hover:text-[#1A1A18] transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.variantName && (
                          <p className="mt-0.5 text-[11px] text-[#71716A]">
                            Edition: {item.variantName}
                          </p>
                        )}

                        <p className="mt-0.5 font-mono text-[10px] text-[#8A8A82]">
                          SKU: {item.selectedVariant?.sku || item.product.sku}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#1A1A18]/20">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.variantId, item.quantity - 1)
                            }
                            className="px-2 py-0.5 text-xs text-[#1A1A18] hover:bg-[#EAEAE5] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-medium tabular-nums text-[#1A1A18]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.variantId, item.quantity + 1)
                            }
                            disabled={item.quantity >= maxStock}
                            className="px-2 py-0.5 text-xs text-[#1A1A18] hover:bg-[#EAEAE5] disabled:opacity-30 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-xs font-semibold tabular-nums text-[#1A1A18]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Order Pricing Summary */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#1A1A18]/10 bg-[#FBFBF9] space-y-4">
              {/* Coupon input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8A8A82]" />
                  <input
                    type="text"
                    placeholder="Promotional code (e.g. LUXE15)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs uppercase tracking-wider bg-transparent border border-[#1A1A18]/20 focus:border-[#1A1A18] focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="px-3 py-2 text-xs uppercase tracking-wider font-medium bg-[#1A1A18] text-[#FBFBF9] hover:bg-[#333330] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {/* Price Calculation breakdown */}
              <div className="space-y-1.5 text-xs text-[#52524D]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-[#1A1A18]">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="tabular-nums font-medium">
                      -{formatPrice(appliedCoupon.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="tabular-nums font-medium text-[#1A1A18]">
                    {shippingCharge === 0 ? 'Complimentary' : formatPrice(shippingCharge)}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1A1A18]/10 flex justify-between text-sm font-semibold text-[#1A1A18]">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-4 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <span>Checkout Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#71716A]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1A1A18]" />
                <span>Encrypted 256-Bit Secure Checkout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
