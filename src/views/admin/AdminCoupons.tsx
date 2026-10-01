import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Tag, X, Check } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';

export const AdminCoupons: React.FC = () => {
  const { coupons, saveCoupon, deleteCoupon } = useAdmin();
  const { formatPrice } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(15);
  const [minOrderValue, setMinOrderValue] = useState(200);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(300);
  const [expiresAt, setExpiresAt] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState(100);
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(15);
    setMinOrderValue(150);
    setMaxDiscount(250);
    setExpiresAt('2026-12-31');
    setUsageLimit(100);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderValue(c.minOrderValue);
    setMaxDiscount(c.maxDiscount);
    setExpiresAt(c.expiresAt);
    setUsageLimit(c.usageLimit);
    setActive(c.active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSaving(true);
    try {
      await saveCoupon(
        {
          id: editingCoupon?.id,
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
          expiresAt,
          usageLimit: Number(usageLimit),
          active
        },
        !!editingCoupon
      );
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Promotions & Privilege</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Coupon & Privilege Management
          </h1>
        </div>

        <button
          onClick={handleOpenNew}
          className="py-2.5 px-6 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Code</span>
        </button>
      </div>

      {/* Coupon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white border border-[#1A1A18]/10 p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="font-mono text-base font-bold text-[#1A1A18] bg-[#F4F4F0] px-2.5 py-1">
                  {c.code}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] uppercase font-semibold ${
                    c.active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {c.active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-4 space-y-1 text-xs text-[#52524D]">
                <p className="text-sm font-semibold text-[#1A1A18]">
                  {c.discountType === 'percentage'
                    ? `${c.discountValue}% Discount`
                    : `${formatPrice(c.discountValue)} Fixed Discount`}
                </p>
                <p>Min. Order Value: {formatPrice(c.minOrderValue)}</p>
                {c.maxDiscount && <p>Max. Discount: {formatPrice(c.maxDiscount)}</p>}
                <p className="text-[11px] text-[#71716A]">Valid through: {c.expiresAt}</p>
                <p className="text-[11px] text-[#71716A]">
                  Redemptions: {c.usedCount} of {c.usageLimit}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1A1A18]/10 flex justify-end gap-2 text-xs">
              <button
                onClick={() => handleOpenEdit(c)}
                className="p-1.5 text-[#52524D] hover:text-[#1A1A18] cursor-pointer"
                title="Edit coupon"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteCoupon(c.id)}
                className="p-1.5 text-[#8A8A82] hover:text-rose-700 cursor-pointer"
                title="Delete coupon"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FBFBF9] border border-[#1A1A18]/20 w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A18]/10">
              <h3 className="text-xl font-serif text-[#1A1A18]">
                {editingCoupon ? 'Edit Privilege Code' : 'Create Privilege Code'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#1A1A18] hover:opacity-60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LUXE20"
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] font-mono focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Min Order Value ($)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Max Discount ($)</label>
                  <input
                    type="number"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional cap"
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 accent-[#1A1A18]"
                  />
                  <span className="text-[#1A1A18] font-medium">Activate code for immediate usage</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#1A1A18]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-[#1A1A18]/20 text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-6 bg-[#1A1A18] text-[#FBFBF9] uppercase font-semibold text-xs cursor-pointer hover:bg-[#333330]"
                >
                  {isSaving ? 'Saving...' : 'Save Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
