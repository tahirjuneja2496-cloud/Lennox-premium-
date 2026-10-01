import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

interface SearchModalProps {
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onSelectProduct }) => {
  const { searchOpen, setSearchOpen, products, formatPrice } = useStore();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('atelierv_recent_searches');
      return saved ? JSON.parse(saved) : ['Cashmere', 'Lamp', 'Leather', 'Travertine'];
    } catch {
      return ['Cashmere', 'Lamp', 'Leather', 'Travertine'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [searchOpen]);

  if (!searchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const filteredProducts = trimmed
    ? products.filter((p) => {
        return (
          p.name.toLowerCase().includes(trimmed) ||
          p.sku.toLowerCase().includes(trimmed) ||
          p.category.toLowerCase().includes(trimmed) ||
          p.brand.toLowerCase().includes(trimmed) ||
          p.tags?.some((t) => t.toLowerCase().includes(trimmed))
        );
      })
    : [];

  const handleSelect = (product: Product) => {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      const updated = [query.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      try {
        localStorage.setItem('atelierv_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setSearchOpen(false);
    onSelectProduct(product);
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FBFBF9]/95 backdrop-blur-md transition-all duration-300">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between border-b border-[#1A1A18]/10">
        <div className="flex items-center gap-3 flex-1 mr-4">
          <Search className="w-5 h-5 text-[#71716A]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by object name, SKU, material, or category..."
            className="w-full text-base sm:text-lg bg-transparent text-[#1A1A18] placeholder-[#A8A8A0] focus:outline-hidden font-serif"
          />
        </div>
        <button
          onClick={() => setSearchOpen(false)}
          className="p-2 text-[#1A1A18] hover:opacity-60 transition-opacity cursor-pointer"
          aria-label="Close search"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto w-full px-6 py-8 flex-1 overflow-y-auto">
        {!trimmed ? (
          <div className="space-y-8">
            {/* Recent Searches */}
            <div>
              <p className="text-xs uppercase tracking-widest text-[#71716A] mb-3 font-medium">
                Recent Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    className="px-3 py-1.5 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-xs text-[#1A1A18] transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Curations */}
            <div>
              <p className="text-xs uppercase tracking-widest text-[#71716A] mb-3 font-medium">
                Curated Suggestions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="flex items-center gap-4 p-3 bg-[#F4F4F0]/60 hover:bg-[#F4F4F0] transition-colors cursor-pointer"
                  >
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-14 object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A1A18] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#71716A] mt-0.5">{product.category}</p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[#1A1A18]">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 text-xs text-[#71716A]">
              <span>Found {filteredProducts.length} creations matching &ldquo;{query}&rdquo;</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-serif text-2xl text-[#1A1A18]">No creations discovered.</p>
                <p className="mt-2 text-xs text-[#71716A]">
                  Try searching with a different term such as &ldquo;Bronze&rdquo;, &ldquo;Overcoat&rdquo;, or &ldquo;Tote&rdquo;.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A18]/10">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="py-4 flex items-center justify-between gap-4 hover:bg-[#F4F4F0]/40 px-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-16 object-cover shrink-0"
                      />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#71716A]">
                          {product.category} · SKU: {product.sku}
                        </span>
                        <h4 className="text-sm font-medium text-[#1A1A18] group-hover:underline">
                          {product.name}
                        </h4>
                        <p className="text-xs text-[#71716A] line-clamp-1 mt-0.5">
                          {product.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold tabular-nums text-[#1A1A18]">
                        {formatPrice(product.price)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#8A8A82] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
