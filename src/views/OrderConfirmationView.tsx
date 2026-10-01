import React from 'react';
import { CheckCircle2, Printer, ArrowRight, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';

interface OrderConfirmationViewProps {
  order: Order;
  onContinueShopping: () => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  onContinueShopping
}) => {
  const { formatPrice, settings } = useStore();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Celebration Header */}
      <div className="text-center space-y-3 pb-8 border-b border-[#1A1A18]/10">
        <div className="w-12 h-12 bg-[#1A1A18] text-[#FBFBF9] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <span className="text-xs uppercase tracking-[0.25em] text-[#71716A]">Order Confirmed</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#1A1A18]">
          Thank you, {order.customer.fullName}.
        </h1>
        <p className="text-xs text-[#52524D] max-w-md mx-auto">
          Your edition has entered reservation ledger #{order.id}. A receipt and private tracking link have been dispatched to <span className="font-semibold text-[#1A1A18]">{order.customer.email}</span>.
        </p>
      </div>

      {/* Invoice Card */}
      <div className="mt-8 bg-white border border-[#1A1A18]/10 p-6 sm:p-10 space-y-8 shadow-xs">
        
        {/* Header of Invoice */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-[#1A1A18]/10">
          <div>
            <h2 className="text-2xl font-serif uppercase tracking-widest font-semibold text-[#1A1A18]">
              {settings.storeName || 'ATELIER V'}
            </h2>
            <p className="text-xs text-[#71716A] mt-1">{settings.address}</p>
            <p className="text-xs text-[#71716A]">{settings.contactEmail}</p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <p className="font-mono text-sm font-bold text-[#1A1A18]">{order.id}</p>
            <p className="text-[#71716A]">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            <p className="text-[#71716A]">Status: <span className="font-medium text-emerald-800">{order.status}</span></p>
            <p className="text-[#71716A]">Payment: <span className="uppercase font-medium text-[#1A1A18]">{order.payment.method} ({order.payment.status})</span></p>
          </div>
        </div>

        {/* Client & Shipping Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#52524D]">
          <div>
            <span className="uppercase tracking-wider font-semibold text-[#1A1A18] block mb-1">
              Billed To
            </span>
            <p className="font-medium text-[#1A1A18]">{order.customer.fullName}</p>
            <p>{order.customer.email}</p>
            <p>{order.customer.phone}</p>
          </div>

          <div>
            <span className="uppercase tracking-wider font-semibold text-[#1A1A18] block mb-1">
              Delivery Destination
            </span>
            <p>{order.customer.address}</p>
            {order.customer.apartment && <p>{order.customer.apartment}</p>}
            <p>
              {order.customer.city}, {order.customer.state} {order.customer.pincode}
            </p>
            <p>{order.customer.country}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border-t border-[#1A1A18]/10 pt-6">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] mb-4">
            Curated Items
          </h3>
          <div className="divide-y divide-[#1A1A18]/10">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-14 object-cover bg-[#F4F4F0] shrink-0"
                  />
                  <div>
                    <p className="font-medium text-[#1A1A18]">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-[11px] text-[#71716A]">Variant: {item.variantName}</p>
                    )}
                    <p className="font-mono text-[10px] text-[#8A8A82]">SKU: {item.sku}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="tabular-nums text-[#71716A] text-[11px]">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                  <p className="font-semibold tabular-nums text-[#1A1A18]">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-[#1A1A18]/10 pt-6 flex justify-end">
          <div className="w-full sm:w-64 space-y-2 text-xs text-[#52524D]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#1A1A18]">
                {formatPrice(order.pricing.subtotal)}
              </span>
            </div>
            {order.pricing.discount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Discount</span>
                <span className="tabular-nums font-medium">
                  -{formatPrice(order.pricing.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Express Delivery</span>
              <span className="tabular-nums font-medium text-[#1A1A18]">
                {order.pricing.shipping === 0 ? 'Complimentary' : formatPrice(order.pricing.shipping)}
              </span>
            </div>
            <div className="pt-2 border-t border-[#1A1A18]/10 flex justify-between text-sm font-semibold text-[#1A1A18]">
              <span>Total Paid</span>
              <span className="tabular-nums">{formatPrice(order.pricing.grandTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto py-3 px-6 border border-[#1A1A18]/30 hover:border-[#1A1A18] text-[#1A1A18] text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Official Invoice</span>
        </button>

        <button
          onClick={onContinueShopping}
          className="w-full sm:w-auto py-3.5 px-8 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <span>Return to Permanent Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
