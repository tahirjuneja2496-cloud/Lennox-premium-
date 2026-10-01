import React, { useState } from 'react';
import {
  Search,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Eye,
  Star,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAdmin } from '../../context/AdminContext';
import { Product } from '../../types';

interface AdminProductsProps {
  onEditProduct: (product: Product) => void;
  onNewProduct: () => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ onEditProduct, onNewProduct }) => {
  const { products, categories, formatPrice } = useStore();
  const { deleteProduct, duplicateProduct, saveProduct } = useAdmin();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    const matchesCat = !categoryFilter || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? p.published
        : !p.published;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleTogglePublish = async (p: Product) => {
    await saveProduct({ ...p, published: !p.published }, true);
  };

  const handleToggleFeatured = async (p: Product) => {
    await saveProduct({ ...p, featured: !p.featured }, true);
  };

  const handleToggleBestseller = async (p: Product) => {
    await saveProduct({ ...p, bestseller: !p.bestseller }, true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete '${name}' permanently?`)) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Inventory Registry</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Product Management
          </h1>
        </div>

        <button
          onClick={onNewProduct}
          className="py-2.5 px-6 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#1A1A18]/10 flex flex-wrap items-center gap-4 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#71716A]" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F4F4F0] border border-[#1A1A18]/10 text-xs text-[#1A1A18] focus:outline-hidden"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#F4F4F0] border border-[#1A1A18]/10 px-3 py-2 text-xs text-[#1A1A18] uppercase tracking-wider focus:outline-hidden cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status segmented */}
        <div className="flex border border-[#1A1A18]/20 bg-[#F4F4F0] p-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium cursor-pointer ${
              statusFilter === 'all' ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium cursor-pointer ${
              statusFilter === 'published' ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium cursor-pointer ${
              statusFilter === 'draft' ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'
            }`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-[#1A1A18]/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1A18]/10 bg-[#F4F4F0]/60 text-[#71716A] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">Creation</th>
                <th className="py-3.5 px-3 font-medium">SKU ID</th>
                <th className="py-3.5 px-3 font-medium">Category</th>
                <th className="py-3.5 px-3 font-medium">Price</th>
                <th className="py-3.5 px-3 font-medium">Stock</th>
                <th className="py-3.5 px-3 font-medium text-center">Badges</th>
                <th className="py-3.5 px-3 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A18]/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71716A]">
                    No creations found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 3);
                  return (
                    <tr key={product.id} className="hover:bg-[#FBFBF9] transition-colors">
                      {/* Product Preview */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || ''}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-14 object-cover bg-[#F4F4F0] shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-semibold text-[#1A1A18] truncate">{product.name}</p>
                            <p className="text-[11px] text-[#71716A] truncate">
                              {product.variants?.length || 0} variant(s) · {product.rating}★ ({product.reviewCount})
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono font-medium text-[#1A1A18]">
                        {product.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-[#52524D]">{product.category}</td>

                      {/* Price */}
                      <td className="py-3 px-3 tabular-nums font-semibold text-[#1A1A18]">
                        {formatPrice(product.price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3">
                        {isOutOfStock ? (
                          <span className="text-rose-700 font-semibold">0 (Sold Out)</span>
                        ) : isLowStock ? (
                          <span className="text-amber-800 font-semibold">{product.stock} (Low)</span>
                        ) : (
                          <span className="text-emerald-800 font-medium tabular-nums">{product.stock}</span>
                        )}
                      </td>

                      {/* Badges toggles */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            title={product.featured ? 'Featured on Home' : 'Not featured'}
                            className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                              product.featured ? 'text-amber-900 bg-amber-50' : 'text-[#8A8A82] hover:text-[#1A1A18]'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleBestseller(product)}
                            title={product.bestseller ? 'Bestseller' : 'Standard edition'}
                            className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                              product.bestseller ? 'text-indigo-900 bg-indigo-50' : 'text-[#8A8A82] hover:text-[#1A1A18]'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleTogglePublish(product)}
                          className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold cursor-pointer ${
                            product.published
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {product.published ? 'Live' : 'Draft'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 text-[#52524D] hover:text-[#1A1A18] transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateProduct(product.id)}
                            className="p-1.5 text-[#52524D] hover:text-[#1A1A18] transition-colors cursor-pointer"
                            title="Duplicate Product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-[#8A8A82] hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
