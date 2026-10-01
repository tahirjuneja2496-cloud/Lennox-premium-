import React, { useState, useRef } from 'react';
import { Save, UploadCloud, Store, Palette, Shield, Sliders } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAdmin } from '../../context/AdminContext';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';

export const AdminSettings: React.FC = () => {
  const { settings, addToast } = useStore();
  const { saveSettings } = useAdmin();

  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const handleHeroImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(files[0]);
      setFormData((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          image: res.url
        }
      }));
      addToast('Hero campaign image uploaded directly.');
    } catch (err: any) {
      addToast(err.message || 'Image upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSettings(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Maison Controls</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Storefront CMS & Operations
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="py-2.5 px-6 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-xs">
        
        {/* Section 1: Store Brand Identity */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-4 shadow-xs">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span>1. Store Identity & Wordmark</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Maison Brand Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] font-serif uppercase tracking-widest focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Announcement Bar */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-4 shadow-xs">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>2. Top Announcement Bar</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.announcementBar?.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    announcementBar: { ...formData.announcementBar, enabled: e.target.checked }
                  })
                }
                className="w-4 h-4 accent-[#1A1A18]"
              />
              <span className="font-medium text-[#1A1A18]">Display Announcement Bar at top of site</span>
            </label>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Announcement Copy</label>
              <input
                type="text"
                value={formData.announcementBar?.text || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    announcementBar: { ...formData.announcementBar, text: e.target.value }
                  })
                }
                placeholder="Complimentary Global Shipping on Orders Over $250..."
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Action Link Label</label>
                <input
                  type="text"
                  value={formData.announcementBar?.linkText || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      announcementBar: { ...formData.announcementBar, linkText: e.target.value }
                    })
                  }
                  placeholder="Discover"
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Homepage Hero Campaign */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-4 shadow-xs">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>3. Homepage Hero Campaign</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Headline</label>
              <input
                type="text"
                value={formData.hero?.headline || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, headline: e.target.value }
                  })
                }
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] font-serif text-base focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Subtitle</label>
              <textarea
                rows={2}
                value={formData.hero?.subtitle || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, subtitle: e.target.value }
                  })
                }
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Season / Edition Badge</label>
                <input
                  type="text"
                  value={formData.hero?.badge || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, badge: e.target.value }
                    })
                  }
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Primary CTA Button</label>
                <input
                  type="text"
                  value={formData.hero?.primaryCta || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, primaryCta: e.target.value }
                    })
                  }
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Hero Image direct upload */}
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">
                Hero Campaign Image (Upload from device)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 bg-[#F4F4F0] overflow-hidden border border-[#1A1A18]/10 shrink-0">
                  <img
                    src={formData.hero?.image}
                    alt="Hero preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  ref={heroFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHeroImageUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => heroFileRef.current?.click()}
                  disabled={isUploading}
                  className="py-2.5 px-4 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] border border-[#1A1A18]/20 uppercase tracking-wider text-[11px] font-semibold cursor-pointer"
                >
                  {isUploading ? 'Uploading Image...' : 'Upload Device Image'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Logistics & Payment Controls */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-4 shadow-xs">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>4. Logistics & Payment Gateways</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Default Express Delivery Fee ($)</label>
              <input
                type="number"
                value={formData.shippingCharges}
                onChange={(e) => setFormData({ ...formData, shippingCharges: Number(e.target.value) })}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Complimentary Delivery Threshold ($)</label>
              <input
                type="number"
                value={formData.freeShippingThreshold}
                onChange={(e) => setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.codEnabled}
                  onChange={(e) => setFormData({ ...formData, codEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#1A1A18]"
                />
                <span className="text-[#1A1A18] font-medium">Enable Cash on Delivery (COD) Checkout Option</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paymentGatewayTest}
                  onChange={(e) => setFormData({ ...formData, paymentGatewayTest: e.target.checked })}
                  className="w-4 h-4 accent-[#1A1A18]"
                />
                <span className="text-[#1A1A18] font-medium">Enable Instant Card Simulation Gateway (Test Mode)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Concierge Contact */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-4 shadow-xs">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18]">
            5. Concierge & Physical Boutique Addresses
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Concierge Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1">Concierge Phone</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#1A1A18] font-medium mb-1">Maison Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] uppercase tracking-widest font-semibold text-xs transition-colors cursor-pointer shadow-md"
          >
            {isSaving ? 'Applying Settings...' : 'Save & Publish All Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};
