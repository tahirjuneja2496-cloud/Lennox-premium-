import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, addToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    addToast('Thank you for subscribing to The Atelier Dispatches.', 'success');
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-[#141413] text-[#FBFBF9] border-t border-[#292926] pt-16 pb-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#292926]">
          
          {/* Brand & Manifesto */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-2xl font-serif tracking-widest uppercase">
              {settings.storeName || 'ATELIER V'}
            </h3>
            <p className="text-xs text-[#9B9B94] leading-relaxed max-w-sm">
              {settings.tagline || 'Quiet Luxury & Timeless Form'}. Conceived with rigorous discipline in material integrity, honoring architectural form and heritage craftsmanship.
            </p>
            <div className="pt-2 text-xs text-[#71716A]">
              <p>Maison Paris: 42 Rue de Sévigné, 75003</p>
              <p>Atelier New York: 180 Mercer St, SoHo</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#FBFBF9] font-medium">
              Curations
            </h4>
            <ul className="space-y-2 text-xs text-[#9B9B94]">
              <li>
                <button
                  onClick={() => onNavigate('shop', 'Lighting & Objects')}
                  className="hover:text-[#FBFBF9] transition-colors cursor-pointer"
                >
                  Lighting & Sculptural Objects
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', 'Bespoke Apparel')}
                  className="hover:text-[#FBFBF9] transition-colors cursor-pointer"
                >
                  Bespoke Outerwear & Tailoring
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', 'Artisanal Leather')}
                  className="hover:text-[#FBFBF9] transition-colors cursor-pointer"
                >
                  Handcrafted Tuscan Leather
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('wishlist')}
                  className="hover:text-[#FBFBF9] transition-colors cursor-pointer"
                >
                  Private Saved Archive
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Dispatches */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#FBFBF9] font-medium">
              The Atelier Journal
            </h4>
            <p className="text-xs text-[#9B9B94] leading-relaxed">
              Receive private invitations to limited edition releases, artisan studio visits, and architectural essays.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 bg-[#1E1E1C] border border-[#2E2E2A] text-xs px-3.5 py-2.5 text-[#FBFBF9] placeholder-[#71716A] focus:outline-hidden focus:border-[#71716A]"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-[#FBFBF9] hover:bg-[#EAEAE5] text-[#141413] px-3.5 py-2.5 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#71716A] gap-4">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onNavigate('admin')}
              className="hover:text-[#FBFBF9] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Management Suite</span>
            </button>
            <span>·</span>
            <span>Concierge: {settings.contactPhone || '+1 (800) 492-9102'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
