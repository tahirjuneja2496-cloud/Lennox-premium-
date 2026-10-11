import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Sparkles, X, Check, Copy, Database, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';
import { api } from '../../services/api';
import { COUPON_MIGRATION_SQL } from '../../db/supabase';

export const AdminCoupons: React.FC = () => {
  const { coupons, saveCoupon, deleteCoupon } = useAdmin();
  const { formatPrice, addToast } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(15);
  const [minOrderValue, setMinOrderValue] = useState(200);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(300);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState(new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
  const [usageLimit, setUsageLimit] = useState(100);
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Supabase migration/sync status
  const [dbStatus, setDbStatus] = useState<{
    supabaseConnected: boolean;
    tableMissing: boolean;
    count: number;
  } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    checkDatabaseStatus();
  }, [coupons]);

  const checkDatabaseStatus = async () => {
    try {
      const status = await api.getCouponDatabaseStatus();
      setDbStatus(status);
    } catch {
      // Ignored
    }
  };

  const generateRandomCode = () => {
    const prefixes = ['LENNOX', 'LUXE', 'PRIVILEGE', 'ATELIER', 'SAVE'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${discountValue || 15}-${randomSuffix}`;
  };

  const handleOpenNew = () => {
    setEditingCoupon(null);
    setCode(generateRandomCode());
    setDiscountType('percentage');
    setDiscountValue(15);
    setMinOrderValue(500);
    setMaxDiscount(1000);
    setStartDate(new Date().toISOString().slice(0, 10));
    setExpiresAt(new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
    setUsageLimit(100);
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderValue(c.minOrderValue);
    setMaxDiscount(c.maxDiscount);
    setStartDate(c.startDate ? c.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 10) : new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
    setUsageLimit(c.usageLimit);
    setActive(c.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAutoGenerateClick = () => {
    setCode(generateRandomCode());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Coupon code is required');
      return;
    }

    if (discountValue <= 0) {
      setFormError('Discount value must be greater than 0');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      setFormError('Percentage discount cannot exceed 100%');
      return;
    }

    setIsSaving(true);
    try {
      await saveCoupon(
        {
          id: editingCoupon?.id,
          code: cleanCode,
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Math.max(0, Number(minOrderValue || 0)),
          maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
          startDate,
          expiresAt,
          usageLimit: Math.max(1, Number(usageLimit || 100)),
          active
        },
        !!editingCoupon
      );
      setIsModalOpen(false);
      checkDatabaseStatus();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save coupon code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(COUPON_MIGRATION_SQL);
    setCopiedSql(true);
    addToast('SQL Migration copied to clipboard', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Promotions & Privilege</span>
            {dbStatus && (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-semibold ${
                  dbStatus.supabaseConnected && !dbStatus.tableMissing
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                <Database className="w-3 h-3" />
                {dbStatus.supabaseConnected && !dbStatus.tableMissing
                  ? 'Supabase Synced'
                  : 'Cloud Backup Ready'}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Coupon & Privilege Management
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {dbStatus?.tableMissing && (
            <button
              onClick={() => setShowSqlModal(true)}
              className="py-2.5 px-4 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] border border-[#1A1A18]/20 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-2"
              title="View Supabase SQL migration"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>SQL Migration</span>
            </button>
          )}

          <button
            onClick={handleOpenNew}
            className="py-2.5 px-6 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Code</span>
          </button>
        </div>
      </div>

      {/* Supabase Migration Notice Banner if table is not yet detected in Supabase */}
      {dbStatus?.tableMissing && (
        <div className="p-4 bg-stone-50 border border-stone-200 text-xs text-[#52524D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#1A1A18]">Permanent Storage Active (Server & Local Storage)</p>
              <p className="text-[#71716A] text-[11px] mt-0.5">
                Coupons persist across page refreshes and sessions. To enable native PostgreSQL storage in Supabase, run the one-click SQL migration in your Supabase SQL Editor.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 bg-[#1A1A18] text-[#FBFBF9] text-[11px] uppercase tracking-wider font-medium hover:bg-[#333330] cursor-pointer whitespace-nowrap shrink-0"
          >
            View SQL Script
          </button>
        </div>
      )}

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
                {c.maxDiscount ? <p>Max. Discount: {formatPrice(c.maxDiscount)}</p> : null}
                {c.startDate && (
                  <p className="text-[11px] text-[#71716A]">Starts: {c.startDate.slice(0, 10)}</p>
                )}
                <p className="text-[11px] text-[#71716A]">Valid through: {c.expiresAt ? c.expiresAt.slice(0, 10) : 'Ongoing'}</p>
                <p className="text-[11px] text-[#71716A]">
                  Redemptions: {c.usedCount || 0} of {c.usageLimit}
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

      {coupons.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#1A1A18]/10">
          <p className="font-serif text-lg text-[#1A1A18]">No Active Privilege Codes</p>
          <p className="text-xs text-[#71716A] mt-1">Create or auto-generate your first promotional code above.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FBFBF9] border border-[#1A1A18]/20 w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
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

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#1A1A18] font-medium">Coupon Code *</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateClick}
                    className="flex items-center gap-1 text-[11px] text-[#71716A] hover:text-[#1A1A18] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LENNOX20"
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
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">
                    {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? '100' : undefined}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional cap"
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1A18] font-medium mb-1">Usage Limit (Redemptions)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 accent-[#1A1A18]"
                    />
                    <span className="text-[#1A1A18] font-medium">Active Status</span>
                  </label>
                </div>
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
                  className="py-2 px-6 bg-[#1A1A18] text-[#FBFBF9] uppercase font-semibold text-xs cursor-pointer hover:bg-[#333330] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingCoupon ? 'Update Code' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FBFBF9] border border-[#1A1A18]/20 w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A18]/10">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#1A1A18]" />
                <h3 className="text-xl font-serif text-[#1A1A18]">Supabase Coupons Migration</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 text-[#1A1A18] hover:opacity-60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#52524D] leading-relaxed">
              Copy and execute this SQL query in your <strong>Supabase Dashboard → SQL Editor</strong> to create the permanent coupons table with Row Level Security (RLS) policies:
            </p>

            <div className="relative">
              <pre className="p-3 bg-[#1A1A18] text-[#F4F4F0] text-[11px] font-mono rounded overflow-x-auto max-h-64 leading-tight">
                {COUPON_MIGRATION_SQL}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-2 right-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono flex items-center gap-1.5 rounded cursor-pointer transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="py-2 px-6 bg-[#1A1A18] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold hover:bg-[#333330] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

