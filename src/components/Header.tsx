import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, ShieldCheck, Menu, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { settings, cartCount, wishlist, setSearchOpen, setCartDrawerOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'All Creations', view: 'shop', category: '' },
    { label: 'Objects & Light', view: 'shop', category: 'Lighting & Objects' },
    { label: 'Bespoke Apparel', view: 'shop', category: 'Bespoke Apparel' },
    { label: 'Artisanal Leather', view: 'shop', category: 'Artisanal Leather' },
    { label: 'The Journal', view: 'home', hash: 'manifesto' }
  ];

  const handleNavClick = (view: string, param?: string) => {
    setMobileMenuOpen(false);
    onNavigate(view, param);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-[#1A1A18]/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Mobile menu toggle button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-[#1A1A18] hover:opacity-70 transition-opacity"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center">
          <button
            onClick={() => handleNavClick('home')}
            className="text-2xl sm:text-3xl font-serif tracking-widest uppercase font-semibold text-[#1A1A18] hover:opacity-80 transition-opacity cursor-pointer"
          >
            {settings.storeName || 'ATELIER V'}
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs uppercase tracking-widest font-medium text-[#1A1A18]/80">
          {navLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => handleNavClick(link.view, link.category)}
              className="py-1 hover:text-[#1A1A18] transition-colors relative group cursor-pointer"
            >
              <span>{link.label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#1A1A18] transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center space-x-4 sm:space-x-5 text-[#1A1A18]">
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search collection"
            className="p-1.5 hover:opacity-60 transition-opacity cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => handleNavClick('wishlist')}
            aria-label="View saved items"
            className="p-1.5 hover:opacity-60 transition-opacity relative cursor-pointer"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#1A1A18] text-[#FBFBF9] text-[9px] font-semibold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            aria-label="Open shopping bag"
            className="p-1.5 hover:opacity-60 transition-opacity relative cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#1A1A18] text-[#FBFBF9] text-[9px] font-semibold rounded-full flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {/* Admin portal direct entry */}
          <button
            onClick={() => handleNavClick('admin')}
            aria-label="Admin Portal"
            title="Management Suite"
            className={`p-1.5 transition-colors cursor-pointer ${
              currentView.startsWith('admin') ? 'text-amber-800' : 'text-[#1A1A18]/60 hover:text-[#1A1A18]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1A1A18]/10 bg-[#FBFBF9] px-6 py-6 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-4 text-sm uppercase tracking-widest">
            {navLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleNavClick(link.view, link.category)}
                className="text-left py-2 font-medium text-[#1A1A18] border-b border-[#1A1A18]/5"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick('admin')}
              className="text-left py-2 font-medium text-amber-900 border-b border-[#1A1A18]/5 flex items-center justify-between"
            >
              <span>Admin Management</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
