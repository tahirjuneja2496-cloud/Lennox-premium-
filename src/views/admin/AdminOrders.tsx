import React, { useState } from 'react';
import {
  Search,
  Printer,
  X,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  Package,
  AlertCircle,
  CreditCard,
  Banknote,
  MapPin,
  Phone
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import {
  generateWhatsAppMessage,
  getWhatsAppClickToChatUrl,
  WhatsAppIcon
} from '../../utils/whatsapp';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, refreshAdminData } = useAdmin();
  const { formatPrice, settings } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit details inside modal
  const [editingStatus, setEditingStatus] = useState<OrderStatus>('Pending');
  const [editingTracking, setEditingTracking] = useState('');
  const [editingCarrier, setEditingCarrier] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAdminData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      (o.customer.mobileNumber && o.customer.mobileNumber.includes(q)) ||
      (o.customer.city && o.customer.city.toLowerCase().includes(q)) ||
      (o.customer.pincode && o.customer.pincode.includes(q));

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenOrder = (o: Order) => {
    setSelectedOrder(o);
    setEditingStatus(o.status);
    setEditingTracking(o.trackingNumber || '');
    setEditingCarrier(o.shippingCarrier || 'Blue Dart Express');
    setEditingNotes(o.notes || '');
  };

  const handleSaveOrderStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      await updateOrderStatus(
        selectedOrder.id,
        editingStatus,
        editingTracking,
        editingCarrier,
        editingNotes
      );
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: editingStatus,
              trackingNumber: editingTracking,
              shippingCarrier: editingCarrier,
              notes: editingNotes
            }
          : null
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Packed':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Confirmed':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Cancelled':
      case 'Refunded':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Sales Ledger</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Customer Orders & Fulfillment
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white border border-[#1A1A18]/10 text-xs font-mono text-[#52524D]">
            {orders.length} Permanent Order{orders.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#1A1A18]/10 flex flex-wrap items-center gap-4 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#71716A]" />
          <input
            type="text"
            placeholder="Search by Order ID, Patron name, mobile, city, or pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F4F4F0] border border-[#1A1A18]/10 text-xs text-[#1A1A18] focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#F4F4F0] border border-[#1A1A18]/10 px-3 py-2 text-xs text-[#1A1A18] uppercase tracking-wider focus:outline-hidden cursor-pointer"
        >
          <option value="all">All Statuses ({orders.length})</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#1A1A18]/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1A18]/10 bg-[#F4F4F0]/60 text-[#71716A] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">Order ID</th>
                <th className="py-3.5 px-3 font-medium">Date & Time</th>
                <th className="py-3.5 px-3 font-medium">Customer & Mobile</th>
                <th className="py-3.5 px-3 font-medium">Delivery Destination</th>
                <th className="py-3.5 px-3 font-medium">Products & Qty</th>
                <th className="py-3.5 px-3 font-medium">Payment</th>
                <th className="py-3.5 px-3 font-medium">Total</th>
                <th className="py-3.5 px-3 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A18]/10">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#71716A]">
                    {orders.length === 0
                      ? 'No orders placed yet. Orders placed by customers will appear here automatically.'
                      : 'No orders matching the search query.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1A1A18] whitespace-nowrap">
                      {o.id}
                    </td>
                    <td className="py-3.5 px-3 text-[#71716A] whitespace-nowrap">
                      <div>{new Date(o.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[#A8A8A0] font-mono">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-[#1A1A18]">{o.customer.fullName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-[#71716A]">{o.customer.mobileNumber}</span>
                        {o.customer.mobileNumber && (
                          <a
                            href={getWhatsAppClickToChatUrl({
                              phone: o.customer.mobileNumber,
                              text: generateWhatsAppMessage({
                                order: o,
                                status: o.status,
                                storeName: settings.storeName,
                                formattedTotal: formatPrice(o.pricing.grandTotal)
                              })
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={`Open WhatsApp chat with ${o.customer.fullName}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#25D366]/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 hover:border-[#25D366] text-[10px] font-semibold tracking-wider uppercase transition-all duration-150 cursor-pointer shrink-0"
                          >
                            <WhatsAppIcon className="w-3 h-3 fill-current" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-[#52524D] max-w-[200px]">
                      <p className="truncate font-medium">{o.customer.city}, {o.customer.state}</p>
                      <p className="text-[11px] text-[#71716A] font-mono">{o.customer.pincode}</p>
                    </td>
                    <td className="py-3.5 px-3 text-[#52524D] max-w-[220px]">
                      <p className="truncate font-medium">
                        {o.items.map((i) => {
                          const vText = i.color && i.size ? ` (${i.color}/${i.size})` : (i.color ? ` (${i.color})` : (i.size ? ` (${i.size})` : (i.variantName ? ` (${i.variantName})` : '')));
                          return `${i.productName}${vText} (×${i.quantity})`;
                        }).join(', ')}
                      </p>
                      <p className="text-[11px] text-[#71716A]">
                        {o.items.reduce((s, i) => s + i.quantity, 0)} total item(s)
                      </p>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-[#1A1A18]">
                        {o.payment.method === 'cod' ? (
                          <>
                            <Banknote className="w-3.5 h-3.5 text-amber-700" />
                            <span>COD</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                            <span>Online</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 tabular-nums font-semibold text-[#1A1A18] whitespace-nowrap">
                      {formatPrice(o.pricing.grandTotal)}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold border ${getStatusBadge(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenOrder(o)}
                        className="py-1.5 px-3 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-[11px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FBFBF9] border border-[#1A1A18]/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A18]/10">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#71716A]">Order Details</span>
                <h3 className="text-xl font-serif text-[#1A1A18] font-bold">{selectedOrder.id}</h3>
                <p className="text-[11px] text-[#71716A] mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} at{' '}
                  {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintInvoice}
                  className="py-1.5 px-3 border border-[#1A1A18]/30 hover:border-[#1A1A18] text-xs uppercase tracking-wider text-[#1A1A18] flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-[#1A1A18] hover:opacity-60 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status & Fulfillment Update Panel */}
            <div className="bg-white p-4 border border-[#1A1A18]/10 space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#71716A]" />
                <span>Update Fulfillment Status</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Order Status</label>
                  <select
                    value={editingStatus}
                    onChange={(e: any) => setEditingStatus(e.target.value)}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Shipping Carrier</label>
                  <input
                    type="text"
                    value={editingCarrier}
                    onChange={(e) => setEditingCarrier(e.target.value)}
                    placeholder="e.g. Blue Dart, Delhivery, DTDC"
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Tracking Number / AWB</label>
                  <input
                    type="text"
                    value={editingTracking}
                    onChange={(e) => setEditingTracking(e.target.value)}
                    placeholder="e.g. BD-892019482"
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] font-mono focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[#1A1A18] font-medium mb-1">Fulfillment Notes</label>
                  <input
                    type="text"
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="e.g. Dispatched via express courier, customer notified via SMS"
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveOrderStatus}
                disabled={isUpdating}
                className="py-2 px-5 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] uppercase tracking-wider text-xs font-semibold cursor-pointer transition-colors"
              >
                {isUpdating ? 'Saving...' : 'Save Fulfillment Changes'}
              </button>
            </div>

            {/* Customer Information & Shipping Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#52524D] bg-white p-4 border border-[#1A1A18]/10">
              <div className="space-y-1.5">
                <p className="uppercase tracking-wider font-semibold text-[#1A1A18] mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Customer Details</span>
                </p>
                <p className="text-sm font-semibold text-[#1A1A18]">{selectedOrder.customer.fullName}</p>
                <div className="flex flex-wrap items-center gap-2 py-0.5">
                  <p className="font-mono text-xs text-[#1A1A18]">
                    Mobile: <span className="font-semibold">{selectedOrder.customer.mobileNumber}</span>
                  </p>
                  {selectedOrder.customer.mobileNumber && (
                    <a
                      href={getWhatsAppClickToChatUrl({
                        phone: selectedOrder.customer.mobileNumber,
                        text: generateWhatsAppMessage({
                          order: selectedOrder,
                          status: editingStatus,
                          storeName: settings.storeName,
                          formattedTotal: formatPrice(selectedOrder.pricing.grandTotal)
                        })
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open WhatsApp chat with ${selectedOrder.customer.fullName} with ${editingStatus} status message`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-semibold tracking-wider uppercase transition-colors shadow-xs cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
                <p className="text-[#71716A]">
                  Payment Method:{' '}
                  <span className="font-semibold text-[#1A1A18] uppercase">
                    {selectedOrder.payment.method === 'cod' ? 'Cash on Delivery (COD)' : selectedOrder.payment.method}
                  </span>
                </p>
                <p className="text-[#71716A]">
                  Payment Status:{' '}
                  <span className="font-semibold text-[#1A1A18] uppercase">{selectedOrder.payment.status}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="uppercase tracking-wider font-semibold text-[#1A1A18] mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Full Delivery Address</span>
                </p>
                <p className="text-[#1A1A18] font-medium leading-relaxed">{selectedOrder.customer.address}</p>
                <p className="text-[#1A1A18]">
                  City: <span className="font-semibold">{selectedOrder.customer.city}</span>
                </p>
                <p className="text-[#1A1A18]">
                  State: <span className="font-semibold">{selectedOrder.customer.state}</span>
                </p>
                <p className="text-[#1A1A18]">
                  Pincode: <span className="font-mono font-semibold">{selectedOrder.customer.pincode}</span>
                </p>
              </div>
            </div>

            {/* Ordered Products Table */}
            <div className="bg-white p-4 border border-[#1A1A18]/10 space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#71716A]" />
                <span>Ordered Products ({selectedOrder.items.reduce((s, i) => s + i.quantity, 0)})</span>
              </h4>
              <div className="divide-y divide-[#1A1A18]/10">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-12 object-cover bg-[#F4F4F0] shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-medium text-[#1A1A18]">{item.productName}</p>
                        {(item.color || item.size) ? (
                          <p className="text-[11px] text-[#71716A]">
                            {item.color && <span>Colour: <strong className="text-[#1A1A18] font-medium">{item.color}</strong></span>}
                            {item.color && item.size && <span> · </span>}
                            {item.size && <span>Size: <strong className="text-[#1A1A18] font-medium">{item.size}</strong></span>}
                          </p>
                        ) : item.variantName ? (
                          <p className="text-[11px] text-[#71716A]">Edition: {item.variantName}</p>
                        ) : null}
                        <p className="font-mono text-[10px] text-[#8A8A82]">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#71716A]">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                      <p className="font-semibold tabular-nums text-[#1A1A18]">
                        {formatPrice(item.subtotal || item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="pt-3 border-t border-[#1A1A18]/10 space-y-1.5 text-xs text-[#52524D]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-[#1A1A18]">
                    {formatPrice(selectedOrder.pricing.subtotal)}
                  </span>
                </div>
                {selectedOrder.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Discount ({selectedOrder.pricing.couponCode || 'Promotional'})</span>
                    <span className="tabular-nums font-medium">
                      -{formatPrice(selectedOrder.pricing.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="tabular-nums font-medium text-[#1A1A18]">
                    {selectedOrder.pricing.shipping === 0
                      ? 'Complimentary'
                      : formatPrice(selectedOrder.pricing.shipping)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#1A1A18]/10 flex justify-between text-sm font-semibold text-[#1A1A18]">
                  <span>Total Amount</span>
                  <span className="tabular-nums">{formatPrice(selectedOrder.pricing.grandTotal)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
