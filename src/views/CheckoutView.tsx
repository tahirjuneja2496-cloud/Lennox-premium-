import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Banknote, Truck, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerDetails, Order } from '../types';
import { api } from '../services/api';

interface CheckoutViewProps {
  onBackToShopping: () => void;
  onOrderSuccess: (order: Order) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Chandigarh', 'Puducherry'
];

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
    mobileNumber: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const freeShippingThreshold = settings.freeShippingThreshold || 1999;
  const shippingCharge = cartSubtotal >= freeShippingThreshold ? 0 : settings.shippingCharges || 150;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + shippingCharge);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!customer.fullName.trim() || customer.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full legal name (min 2 characters)';
    }

    const cleanMobile = customer.mobileNumber.replace(/[^0-9]/g, '');
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!customer.address.trim() || customer.address.trim().length < 5) {
      newErrors.address = 'Please enter complete delivery address (building, street, landmark)';
    }

    if (!customer.city.trim()) {
      newErrors.city = 'Please enter your city';
    }

    if (!customer.state.trim()) {
      newErrors.state = 'Please select or enter your state';
    }

    const cleanPin = customer.pincode.replace(/[^0-9]/g, '');
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      newErrors.pincode = 'Please enter a valid 6-digit Indian PIN code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      addToast(err.message || 'Invalid promotional code', 'error');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      addToast('Your shopping bag is empty', 'error');
      return;
    }

    if (!validateForm()) {
      addToast('Please complete all required fields with valid details', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = {
        customer: {
          fullName: customer.fullName.trim(),
          mobileNumber: customer.mobileNumber.replace(/[^0-9]/g, '').slice(-10),
          address: customer.address.trim(),
          city: customer.city.trim(),
          state: customer.state.trim(),
          pincode: customer.pincode.replace(/[^0-9]/g, '').slice(0, 6)
        },
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
          method: 'cod',
          status: 'pending',
          transactionId: `COD_${Date.now()}`
        }
      };

      const createdOrder = await api.createOrder(orderPayload);
      clearCart();
      addToast(`Order ${createdOrder.id} placed successfully!`, 'success');
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      addToast(err.message || 'Failed to place order. Please review stock and details.', 'error');
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
        <span>Return to Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Checkout Form (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Encrypted Checkout</span>
            <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
              Delivery & Order Inscription
            </h1>
          </div>

          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-6 text-xs">
            
            {/* Delivery Details */}
            <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-5 shadow-xs">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] pb-3 border-b border-[#1A1A18]/10">
                1. Delivery Information
              </h3>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Mehta"
                    value={customer.fullName}
                    onChange={(e) => {
                      setCustomer({ ...customer, fullName: e.target.value });
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    className={`w-full bg-[#F4F4F0] border px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden transition-colors ${
                      errors.fullName ? 'border-rose-500' : 'border-[#1A1A18]/20 focus:border-[#1A1A18]'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">
                    Mobile Number (10 digits) <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 bg-[#EAEAE5] border border-r-0 border-[#1A1A18]/20 text-xs text-[#52524D] font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={customer.mobileNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomer({ ...customer, mobileNumber: val });
                        if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: '' });
                      }}
                      className={`flex-1 bg-[#F4F4F0] border px-3.5 py-2.5 text-xs text-[#1A1A18] font-mono focus:outline-hidden transition-colors ${
                        errors.mobileNumber ? 'border-rose-500' : 'border-[#1A1A18]/20 focus:border-[#1A1A18]'
                      }`}
                    />
                  </div>
                  {errors.mobileNumber ? (
                    <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.mobileNumber}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-[#71716A]">Courier updates and OTP will be sent here.</p>
                  )}
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">
                    Full Delivery Address (Flat / House No., Building, Street, Area) <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Flat 402, Sterling Towers, Pali Hill, Bandra West"
                    value={customer.address}
                    onChange={(e) => {
                      setCustomer({ ...customer, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: '' });
                    }}
                    className={`w-full bg-[#F4F4F0] border px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden transition-colors ${
                      errors.address ? 'border-rose-500' : 'border-[#1A1A18]/20 focus:border-[#1A1A18]'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.address}</span>
                    </p>
                  )}
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">
                      City <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={customer.city}
                      onChange={(e) => {
                        setCustomer({ ...customer, city: e.target.value });
                        if (errors.city) setErrors({ ...errors, city: '' });
                      }}
                      className={`w-full bg-[#F4F4F0] border px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden ${
                        errors.city ? 'border-rose-500' : 'border-[#1A1A18]/20 focus:border-[#1A1A18]'
                      }`}
                    />
                    {errors.city && <p className="mt-1 text-[11px] text-rose-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">
                      State <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={customer.state}
                      onChange={(e) => {
                        setCustomer({ ...customer, state: e.target.value });
                        if (errors.state) setErrors({ ...errors, state: '' });
                      }}
                      className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden cursor-pointer"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#1A1A18] font-medium mb-1">
                      PIN Code (6 digits) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="400050"
                      value={customer.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomer({ ...customer, pincode: val });
                        if (errors.pincode) setErrors({ ...errors, pincode: '' });
                      }}
                      className={`w-full bg-[#F4F4F0] border px-3 py-2.5 text-xs text-[#1A1A18] font-mono focus:outline-hidden ${
                        errors.pincode ? 'border-rose-500' : 'border-[#1A1A18]/20 focus:border-[#1A1A18]'
                      }`}
                    />
                    {errors.pincode && <p className="mt-1 text-[11px] text-rose-600">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Section (Cash on Delivery) */}
            <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-4 shadow-xs">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] pb-3 border-b border-[#1A1A18]/10">
                2. Payment Method
              </h3>

              <div className="p-4 bg-[#F4F4F0] border-2 border-[#1A1A18] flex items-start gap-3">
                <Banknote className="w-5 h-5 text-[#1A1A18] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[#1A1A18]">Cash on Delivery (COD)</p>
                    <span className="bg-[#1A1A18] text-[#FBFBF9] text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-medium">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#52524D] leading-relaxed">
                    Pay securely upon doorstep receipt by cash or UPI. Zero advance card charge required.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-[#1A1A18] hover:bg-[#333330] disabled:bg-[#8A8A82] text-[#FBFBF9] uppercase tracking-widest font-semibold text-xs transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessing
                ? 'Saving Order to Ledger...'
                : `Place Order via COD · ${formatPrice(grandTotal)}`}
            </button>
          </form>
        </div>

        {/* Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] pb-3 border-b border-[#1A1A18]/10">
              Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
            </h3>

            {/* Item list */}
            <div className="divide-y divide-[#1A1A18]/10 max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => {
                const img = item.selectedVariant?.image || item.product.images?.[0] || '';
                const displayImg = img.startsWith('/src/assets/images/') ? img.replace('/src/assets/images/', '/images/') : img;
                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'base'}`}
                    className="py-3 flex items-center gap-3 text-xs"
                  >
                    <img
                      src={displayImg}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-16 object-cover bg-[#F4F4F0] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A18] truncate">{item.product.name}</p>
                      {item.variantName && (
                        <p className="text-[11px] text-[#71716A]">Edition: {item.variantName}</p>
                      )}
                      <p className="text-[11px] text-[#71716A]">Quantity: {item.quantity}</p>
                    </div>
                    <span className="font-semibold tabular-nums text-[#1A1A18]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-4 border-t border-[#1A1A18]/10">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. ATELIER10)"
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

            {/* Cost Breakdown */}
            <div className="pt-4 border-t border-[#1A1A18]/10 space-y-2 text-xs text-[#52524D]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-[#1A1A18]">
                  {formatPrice(cartSubtotal)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-800">
                  <span>Privilege Code ({appliedCoupon.code})</span>
                  <span className="tabular-nums font-medium">
                    -{formatPrice(appliedCoupon.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Insured Express Courier</span>
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
              <span>Authentic Edition Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Every creation is inspected by master artisans and shipped in bonded presentation casing.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
