import React from 'react';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';
import { OrderStatus } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { orders, customers, metrics, updateOrderStatus } = useAdmin();
  const { products, formatPrice } = useStore();

  const lowStockProducts = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 3) && p.stock > 0
  );
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  // Revenue chart data points
  const chartPoints = [
    { label: 'May', val: 4200 },
    { label: 'Jun', val: 6800 },
    { label: 'Jul', val: 5900 },
    { label: 'Aug', val: 9200 },
    { label: 'Sep', val: 14800 },
    { label: 'Oct', val: 19400 }
  ];
  const maxVal = Math.max(...chartPoints.map((p) => p.val));

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Executive Overview</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Business Intelligence & Ledger
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('products-new')}
            className="py-2.5 px-4 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Metrics Row (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-3 shadow-xs">
          <div className="flex justify-between items-start text-xs text-[#71716A]">
            <span className="uppercase tracking-wider">Total Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-800" />
          </div>
          <p className="text-2xl font-serif font-semibold text-[#1A1A18] tabular-nums">
            {formatPrice(metrics.totalRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-800">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+24.6% vs previous quarter</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-3 shadow-xs">
          <div className="flex justify-between items-start text-xs text-[#71716A]">
            <span className="uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#1A1A18]" />
          </div>
          <p className="text-2xl font-serif font-semibold text-[#1A1A18] tabular-nums">
            {metrics.totalOrders}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#71716A]">
            <span className="text-amber-800 font-medium">{metrics.pendingOrders} Processing</span>
            <span>·</span>
            <span className="text-emerald-800 font-medium">{metrics.completedOrders} Delivered</span>
          </div>
        </div>

        {/* Products in Catalog */}
        <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-3 shadow-xs">
          <div className="flex justify-between items-start text-xs text-[#71716A]">
            <span className="uppercase tracking-wider">Active Catalog</span>
            <Package className="w-4 h-4 text-[#1A1A18]" />
          </div>
          <p className="text-2xl font-serif font-semibold text-[#1A1A18] tabular-nums">
            {products.length}
          </p>
          <div className="text-[11px] text-[#71716A]">
            {products.filter((p) => p.published).length} Published · {products.filter((p) => !p.published).length} Drafts
          </div>
        </div>

        {/* Patrons */}
        <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-3 shadow-xs">
          <div className="flex justify-between items-start text-xs text-[#71716A]">
            <span className="uppercase tracking-wider">Registered Patrons</span>
            <Users className="w-4 h-4 text-[#1A1A18]" />
          </div>
          <p className="text-2xl font-serif font-semibold text-[#1A1A18] tabular-nums">
            {customers.length}
          </p>
          <div className="text-[11px] text-amber-900 font-medium">
            {customers.filter((c) => c.status === 'VIP').length} VIP Private Collectors
          </div>
        </div>

      </div>

      {/* Low Stock Alerts (if any) */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="p-5 bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0" />
            <div>
              <p className="font-semibold">Inventory Alert: Action Required</p>
              <p className="text-[11px] text-amber-800">
                {outOfStockProducts.length} creations currently out of stock; {lowStockProducts.length} below safety threshold.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="py-1.5 px-4 bg-amber-900 text-white uppercase tracking-wider text-[11px] font-semibold hover:bg-amber-950 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Review Inventory
          </button>
        </div>
      )}

      {/* Interactive Charts & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sales Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 bg-white border border-[#1A1A18]/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#71716A]">Revenue Velocity</span>
              <h3 className="text-xl font-serif text-[#1A1A18] mt-0.5">Semi-Annual Trajectory</h3>
            </div>
            <span className="text-xs font-mono font-medium text-[#1A1A18] bg-[#F4F4F0] px-2.5 py-1">
              USD ($)
            </span>
          </div>

          {/* Clean SVG Line / Area Graph */}
          <div className="h-64 w-full pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A1A18" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#1A1A18" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#EAEAE5" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#EAEAE5" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#EAEAE5" strokeDasharray="3 3" />

              {/* Coordinates calculated */}
              {/* [4200, 6800, 5900, 9200, 14800, 19400] */}
              {/* x: 40, 120, 200, 280, 360, 440 */}
              {/* y = 170 - (val / 20000) * 140 */}
              <path
                d="M 40 140 L 120 122 L 200 128 L 280 105 L 360 66 L 440 34 L 440 180 L 40 180 Z"
                fill="url(#revenueGrad)"
              />
              <path
                d="M 40 140 L 120 122 L 200 128 L 280 105 L 360 66 L 440 34"
                fill="none"
                stroke="#1A1A18"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {[
                { x: 40, y: 140, val: '$4.2k' },
                { x: 120, y: 122, val: '$6.8k' },
                { x: 200, y: 128, val: '$5.9k' },
                { x: 280, y: 105, val: '$9.2k' },
                { x: 360, y: 66, val: '$14.8k' },
                { x: 440, y: 34, val: '$19.4k' }
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#FBFBF9" stroke="#1A1A18" strokeWidth="2" />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-[#1A1A18]"
                  >
                    {pt.val}
                  </text>
                  <text
                    x={pt.x}
                    y="195"
                    textAnchor="middle"
                    className="text-[11px] uppercase tracking-wider fill-[#71716A]"
                  >
                    {chartPoints[i].label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Category Contribution (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-white border border-[#1A1A18]/10 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#71716A]">Category Distribution</span>
            <h3 className="text-xl font-serif text-[#1A1A18] mt-0.5">Ledger Share</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-[#1A1A18] mb-1">
                <span>Lighting & Objects</span>
                <span className="tabular-nums font-semibold">48%</span>
              </div>
              <div className="h-1.5 w-full bg-[#EAEAE5]">
                <div className="h-full bg-[#1A1A18] w-[48%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#1A1A18] mb-1">
                <span>Bespoke Apparel</span>
                <span className="tabular-nums font-semibold">32%</span>
              </div>
              <div className="h-1.5 w-full bg-[#EAEAE5]">
                <div className="h-full bg-[#52524D] w-[32%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#1A1A18] mb-1">
                <span>Artisanal Leather</span>
                <span className="tabular-nums font-semibold">20%</span>
              </div>
              <div className="h-1.5 w-full bg-[#EAEAE5]">
                <div className="h-full bg-[#8A8A82] w-[20%]" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1A1A18]/10">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[#1A1A18] mb-2">
              Top Selling Edition
            </h4>
            <div className="flex items-center gap-3">
              <img
                src={products[0]?.images?.[0] || '/src/assets/images/product_sculptural_lamp_1790850449675.jpg'}
                alt="Top seller"
                referrerPolicy="no-referrer"
                className="w-12 h-14 object-cover bg-[#F4F4F0]"
              />
              <div className="text-xs">
                <p className="font-medium text-[#1A1A18] line-clamp-1">{products[0]?.name}</p>
                <p className="text-[#71716A]">SKU: {products[0]?.sku}</p>
                <p className="font-semibold tabular-nums text-[#1A1A18] mt-0.5">
                  {formatPrice(products[0]?.price || 680)}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Orders Section */}
      <div className="p-6 bg-white border border-[#1A1A18]/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1A18]/10">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#71716A]">Live Ledger</span>
            <h3 className="text-xl font-serif text-[#1A1A18]">Recent Order Inscriptions</h3>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] hover:opacity-70 transition-opacity cursor-pointer"
          >
            View All ({orders.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1A18]/10 text-[#71716A] uppercase tracking-wider">
                <th className="py-3 px-2 font-medium">Order ID</th>
                <th className="py-3 px-2 font-medium">Patron</th>
                <th className="py-3 px-2 font-medium">Destination</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium text-right">Amount</th>
                <th className="py-3 px-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A18]/5">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-[#F4F4F0]/50 transition-colors">
                  <td className="py-3 px-2 font-mono font-medium text-[#1A1A18]">{order.id}</td>
                  <td className="py-3 px-2">
                    <p className="font-medium text-[#1A1A18]">{order.customer.fullName}</p>
                    <p className="text-[11px] text-[#71716A]">{order.customer.email}</p>
                  </td>
                  <td className="py-3 px-2 text-[#52524D]">
                    {order.customer.city}, {order.customer.country}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-800'
                          : order.status === 'Shipped'
                          ? 'bg-blue-50 text-blue-800'
                          : order.status === 'Processing' || order.status === 'Confirmed'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold tabular-nums text-[#1A1A18]">
                    {formatPrice(order.pricing.grandTotal)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="text-xs uppercase tracking-wider text-[#1A1A18] hover:underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
