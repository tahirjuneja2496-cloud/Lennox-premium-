import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAdmin } from '../../context/AdminContext';
import { Product } from '../../types';

export const AdminInventory: React.FC = () => {
  const { products, formatPrice } = useStore();
  const { saveProduct } = useAdmin();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);

    if (filter === 'out') return matchesSearch && p.stock <= 0;
    if (filter === 'low') return matchesSearch && p.stock > 0 && p.stock <= (p.lowStockThreshold || 3);
    return matchesSearch;
  });

  const handleStockAdjust = async (product: Product, newStock: number) => {
    const validStock = Math.max(0, newStock);
    await saveProduct({ ...product, stock: validStock }, true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Material Reserves</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Inventory & Variant Stock
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#1A1A18]/10 flex flex-wrap items-center gap-4 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#71716A]" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F4F4F0] border border-[#1A1A18]/10 text-xs text-[#1A1A18] focus:outline-hidden"
          />
        </div>

        <div className="flex border border-[#1A1A18]/20 bg-[#F4F4F0] p-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium cursor-pointer ${
              filter === 'all' ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium cursor-pointer ${
              filter === 'low' ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium cursor-pointer ${
              filter === 'out' ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-[#1A1A18]/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1A18]/10 bg-[#F4F4F0]/60 text-[#71716A] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">Edition</th>
                <th className="py-3.5 px-3 font-medium">SKU ID</th>
                <th className="py-3.5 px-3 font-medium">Price</th>
                <th className="py-3.5 px-3 font-medium">Variants Stock</th>
                <th className="py-3.5 px-3 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A18]/10">
              {filtered.map((p) => {
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= (p.lowStockThreshold || 3);
                return (
                  <tr key={p.id} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-12 object-cover bg-[#F4F4F0]"
                        />
                        <div>
                          <p className="font-semibold text-[#1A1A18]">{p.name}</p>
                          <p className="text-[11px] text-[#71716A]">{p.category}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-medium text-[#1A1A18]">{p.sku}</td>

                    <td className="py-3.5 px-3 tabular-nums font-semibold text-[#1A1A18]">
                      {formatPrice(p.price)}
                    </td>

                    <td className="py-3.5 px-3 text-[#52524D]">
                      {p.variants && p.variants.length > 0 ? (
                        <div className="space-y-1">
                          {p.variants.map((v) => (
                            <div key={v.id} className="flex justify-between gap-2 text-[11px]">
                              <span className="truncate max-w-[120px]">{v.name}:</span>
                              <span className="font-mono tabular-nums">{v.stock} in stock</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#71716A]">Base unit only</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {isOut ? (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-rose-50 text-rose-800">
                          Sold Out
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-amber-50 text-amber-800">
                          Low ({p.stock} left)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-800">
                          In Stock ({p.stock})
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStockAdjust(p, p.stock - 1)}
                          disabled={p.stock <= 0}
                          className="w-7 h-7 bg-[#F4F4F0] hover:bg-[#EAEAE5] disabled:opacity-30 text-[#1A1A18] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-mono font-bold tabular-nums text-sm text-[#1A1A18]">
                          {p.stock}
                        </span>
                        <button
                          onClick={() => handleStockAdjust(p, p.stock + 1)}
                          className="w-7 h-7 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
