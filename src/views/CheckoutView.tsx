import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, CreditCard, Banknote, Truck, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerDetails, Order } from '../types';
import { api } from '../services/api';

interface CheckoutViewProps {
  onBackToShopping: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onBackToShopping, onOrderSuccess }) => {
  const {
    cart,
    cartSubtotal,
    formatPrice,
    settings,
    clearCart,
    addToast
  } = useStore();

  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    pincode: '',
    country: 'United States'
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const freeShippingThreshold = settings.freeShippingThreshold || 250;
  const shippingCharge = cartSubtotal >= freeShippingThreshold ? 0 : settings.shippingCharges || 25;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + shippingCharge);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const res = await api.validateCoupon(couponCode, cartSubtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountAmount: res.discountAmount
        });
        addToast(`Coupon '${res.code}' applied (-${formatPrice(res.discountAmount)})`);
      }
    } catch (err: any) {
      addToast(err.message || 'Invalid coupon', 'error');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      addToast('Your shopping bag is empty', 'error');
      return;
    }

    if (!customer.fullName || !customer.email || !customer.phone || !customer.address || !customer.city) {
      addToast('Please fill all required delivery details', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = {
        customer,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          sku: item.selectedVariant?.sku || item.product.sku,
          variantId: item.variantId,
          variantName: item.variantName,
          image: item.selectedVariant?.image || item.product.images?.[0] || '',
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        pricing: {
          subtotal: cartSubtotal,
          discount: discountAmount,
          couponCode: appliedCoupon?.code,
          shipping: shippingCharge,
          grandTotal
        },
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'card' ? 'paid' : 'pending',
          transactionId: `TXN_${Date.now()}`
        }
      };

      const createdOrder = await api.createOrder(orderPayload);
      clearCart();
      addToast(`Order ${createdOrder.id} placed successfully!`, 'success');
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      addToast(err.message || 'Failed to finalize order', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-serif text-[#1A1A18]">Your Shopping Bag is Empty</h2>
        <p className="mt-2 text-xs text-[#71716A]">Add items before proceeding to checkout.</p>
        <button
          onClick={onBackToShopping}
          className="mt-6 py-3 px-8 bg-[#1A1A18] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <button
        onClick={onBackToShopping}
        className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#71716A] hover:text-[#1A1A18] mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Boutique</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Checkout Form (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Secure Checkout</span>
            <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
              Delivery & Concierge Details
            </h1>
          </div>

          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-6 text-xs">
            {/* Contact info */}
            <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18]">
                1. Client Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Lord Julian Sterling"
                    value={customer.fullName}
                    onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="julian@residence.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#1A1A18] font-medium mb-1">Mobile Telephone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (212) 555-0199"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18]">
                2. Delivery Destination
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="180 Mercer Street"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">Apartment, Suite, Unit</label>
                    <input
                      type="text"
                      placeholder="Penthouse 4B"
                      value={customer.apartment}
                      onChange={(e) => setCustomer({ ...customer, apartment: e.target.value })}
                      className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="New York"
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">State / Province *</label>
                    <input
                      type="text"
                      required
                      placeholder="NY"
                      value={customer.state}
                      onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                      className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">Postal / PIN Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="10012"
                      value={customer.pincode}
                      onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                      className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">Country *</label>
                    <select
                      value={customer.country}
                      onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                      className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden cursor-pointer"
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="France">France</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                      <option value="Singapore">Singapore</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18]">
                3. Payment Method
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#1A1A18] bg-[#F4F4F0]'
                      : 'border-[#1A1A18]/20 hover:border-[#1A1A18]'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#1A1A18] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1A1A18]">Credit / Debit Card</p>
                    <p className="text-[11px] text-[#71716A] mt-0.5">Encrypted Instant Authorization</p>
                  </div>
                </button>

                {settings.codEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-[#1A1A18] bg-[#F4F4F0]'
                        : 'border-[#1A1A18]/20 hover:border-[#1A1A18]'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-[#1A1A18] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1A1A18]">Cash on Delivery</p>
                      <p className="text-[11px] text-[#71716A] mt-0.5">Pay upon Courier Inspection</p>
                    </div>
                  </button>
                )}
              </div>

              {paymentMethod === 'card' && (
                <div className="pt-4 border-t border-[#1A1A18]/10 space-y-3">
                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#1A1A18] font-medium mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1A1A18] font-medium mb-1">Security CVC</label>
                      <input
                        type="text"
                        placeholder="CVC"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-[#1A1A18] hover:bg-[#333330] disabled:bg-[#8A8A82] text-[#FBFBF9] uppercase tracking-widest font-semibold text-xs transition-colors cursor-pointer shadow-lg"
            >
              {isProcessing
                ? 'Authorizing Transaction...'
                : `Authorize Order · ${formatPrice(grandTotal)}`}
            </button>
          </form>
        </div>

        {/* Order Summary Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-6">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18]">
              Order Summary ({cart.length})
            </h3>

            {/* Item list */}
            <div className="divide-y divide-[#1A1A18]/10 max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || 'base'}`}
                  className="py-3 flex items-center gap-3 text-xs"
                >
                  <img
                    src={item.selectedVariant?.image || item.product.images?.[0]}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-16 object-cover bg-[#F4F4F0] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A18] truncate">{item.product.name}</p>
                    {item.variantName && (
                      <p className="text-[11px] text-[#71716A]">{item.variantName}</p>
                    )}
                    <p className="text-[11px] text-[#71716A]">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold tabular-nums text-[#1A1A18]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Form */}
            <div className="pt-4 border-t border-[#1A1A18]/10">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. LUXE15)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs uppercase tracking-wider text-[#1A1A18] focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A18] text-[#FBFBF9] uppercase tracking-wider text-xs font-semibold hover:bg-[#333330] transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-[#1A1A18]/10 space-y-2 text-xs text-[#52524D]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-[#1A1A18]">
                  {formatPrice(cartSubtotal)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-800">
                  <span>Promotion ({appliedCoupon.code})</span>
                  <span className="tabular-nums font-medium">
                    -{formatPrice(appliedCoupon.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Insured Global Courier</span>
                <span className="tabular-nums font-medium text-[#1A1A18]">
                  {shippingCharge === 0 ? 'Complimentary' : formatPrice(shippingCharge)}
                </span>
              </div>
              <div className="pt-3 border-t border-[#1A1A18]/10 flex justify-between text-sm font-semibold text-[#1A1A18]">
                <span>Total Due</span>
                <span className="tabular-nums">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#F4F4F0] border border-[#1A1A18]/5 text-xs text-[#71716A] space-y-2">
            <div className="flex items-center gap-2 text-[#1A1A18] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Complimentary Concierge Tracking</span>
            </div>
            <p className="leading-relaxed">
              Upon dispatch, a direct private tracking link and dedicated shipping concierge contact will be assigned to your order.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
