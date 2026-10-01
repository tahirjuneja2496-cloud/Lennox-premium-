import React, { useState } from 'react';
import {
  Search,
  Printer,
  X,
  Truck,
  ExternalLink,
  Edit2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus } = useAdmin();
  const { formatPrice } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit details inside modal
  const [editingStatus, setEditingStatus] = useState<OrderStatus>('Pending');
  const [editingTracking, setEditingTracking] = useState('');
  const [editingCarrier, setEditingCarrier] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenOrder = (o: Order) => {
    setSelectedOrder(o);
    setEditingStatus(o.status);
    setEditingTracking(o.trackingNumber || '');
    setEditingCarrier(o.shippingCarrier || 'DHL Express Worldwide');
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Sales Ledger</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Order Fulfillment & Tracking
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#1A1A18]/10 flex flex-wrap items-center gap-4 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#71716A]" />
          <input
            type="text"
            placeholder="Search by Order ID, Patron name, or email..."
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
          <option value="Processing">Processing</option>
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
                <th className="py-3.5 px-4 font-medium">Order Identifier</th>
                <th className="py-3.5 px-3 font-medium">Date</th>
                <th className="py-3.5 px-3 font-medium">Patron</th>
                <th className="py-3.5 px-3 font-medium">Items</th>
                <th className="py-3.5 px-3 font-medium">Amount</th>
                <th className="py-3.5 px-3 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A18]/10">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#71716A]">
                    No orders recorded matching your query.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1A1A18]">{o.id}</td>
                    <td className="py-3.5 px-3 text-[#71716A]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-[#1A1A18]">{o.customer.fullName}</p>
                      <p className="text-[11px] text-[#71716A]">{o.customer.email}</p>
                    </td>
                    <td className="py-3.5 px-3 text-[#52524D]">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                    </td>
                    <td className="py-3.5 px-3 tabular-nums font-semibold text-[#1A1A18]">
                      {formatPrice(o.pricing.grandTotal)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                          o.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800'
                            : o.status === 'Shipped'
                            ? 'bg-blue-50 text-blue-800'
                            : o.status === 'Processing' || o.status === 'Confirmed'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenOrder(o)}
                        className="py-1.5 px-3 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-[11px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                      >
                        Open Details
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
                <span className="text-[10px] uppercase tracking-widest text-[#71716A]">Order Detail</span>
                <h3 className="text-xl font-serif text-[#1A1A18] font-bold">{selectedOrder.id}</h3>
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

            {/* Status & Courier Fulfillment Box */}
            <div className="p-4 bg-white border border-[#1A1A18]/10 space-y-4 text-xs">
              <h4 className="uppercase tracking-wider font-semibold text-[#1A1A18]">
                Fulfillment & Tracking Controls
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Order Status</label>
                  <select
                    value={editingStatus}
                    onChange={(e: any) => setEditingStatus(e.target.value)}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for delivery">Out for delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Returned">Returned</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Carrier</label>
                  <input
                    type="text"
                    value={editingCarrier}
                    onChange={(e) => setEditingCarrier(e.target.value)}
                    placeholder="DHL Express Worldwide"
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={editingTracking}
                    onChange={(e) => setEditingTracking(e.target.value)}
                    placeholder="DHL-EX-992019482"
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] font-mono focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[#1A1A18] font-medium mb-1">Internal Concierge Notes</label>
                  <input
                    type="text"
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="e.g. Signature required upon reception..."
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveOrderStatus}
                disabled={isUpdating}
                className="py-2 px-5 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] uppercase tracking-wider text-xs font-semibold cursor-pointer"
              >
                {isUpdating ? 'Updating Ledger...' : 'Save Fulfillment Changes'}
              </button>
            </div>

            {/* Customer & Items Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#52524D]">
              <div>
                <p className="uppercase tracking-wider font-semibold text-[#1A1A18] mb-1">Patron Information</p>
                <p className="font-semibold text-[#1A1A18]">{selectedOrder.customer.fullName}</p>
                <p>{selectedOrder.customer.email}</p>
                <p>{selectedOrder.customer.phone}</p>
              </div>

              <div>
                <p className="uppercase tracking-wider font-semibold text-[#1A1A18] mb-1">Shipping Destination</p>
                <p>{selectedOrder.customer.address}</p>
                {selectedOrder.customer.apartment && <p>{selectedOrder.customer.apartment}</p>}
                <p>
                  {selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.pincode}
                </p>
                <p>{selectedOrder.customer.country}</p>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div className="border-t border-[#1A1A18]/10 pt-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] mb-3">
                Ordered Items
              </h4>
              <div className="divide-y divide-[#1A1A18]/10">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-12 object-cover bg-[#F4F4F0]"
                      />
                      <div>
                        <p className="font-medium text-[#1A1A18]">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-[11px] text-[#71716A]">Edition: {item.variantName}</p>
                        )}
                        <p className="font-mono text-[10px] text-[#8A8A82]">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#71716A]">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                      <p className="font-semibold tabular-nums text-[#1A1A18]">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#1A1A18]/10 flex justify-between text-sm font-semibold text-[#1A1A18]">
                <span>Total Amount</span>
                <span className="tabular-nums">{formatPrice(selectedOrder.pricing.grandTotal)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
