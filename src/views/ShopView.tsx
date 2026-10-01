import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, Grid3X3, LayoutGrid, RotateCcw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';

interface ShopViewProps {
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ initialCategory = '', onSelectProduct }) => {
  const { products, categories, formatPrice } = useStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchFilter, setSearchFilter] = useState('');
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating'>('featured');
  const [gridColumns, setGridColumns] = useState<3 | 4>(3);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.published)
      .filter((p) => {
        if (!selectedCategory) return true;
        return p.category.toLowerCase() === selectedCategory.toLowerCase();
      })
      .filter((p) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .filter((p) => p.price <= priceMax)
      .filter((p) => (onlyInStock ? p.stock > 0 : true))
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchFilter, priceMax, onlyInStock, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSearchFilter('');
    setPriceMax(2000);
    setOnlyInStock(false);
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Editorial Header */}
      <div className="mb-10 text-center max-w-xl mx-auto">
        <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Permanent Catalog</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#1A1A18] mt-1 font-normal">
          {selectedCategory || 'All Creations'}
        </h1>
        <p className="text-xs text-[#71716A] mt-2">
          Numbered editions and handcrafted materials curated for quiet architectural spaces.
        </p>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10 text-xs">
        
        {/* Category Pills/Buttons (Segmented controls) */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 uppercase tracking-wider font-medium transition-colors cursor-pointer ${
              selectedCategory === ''
                ? 'bg-[#1A1A18] text-[#FBFBF9]'
                : 'bg-[#F4F4F0] text-[#52524D] hover:text-[#1A1A18]'
            }`}
          >
            All Categories ({products.filter((p) => p.published).length})
          </button>
          {categories.filter((c) => c.enabled).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 uppercase tracking-wider font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-[#1A1A18] text-[#FBFBF9]'
                  : 'bg-[#F4F4F0] text-[#52524D] hover:text-[#1A1A18]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Right side controls: Filter Drawer Toggle, Sort By, Layout Columns */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Mobile/Tablet filter toggle */}
          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] transition-colors cursor-pointer font-medium uppercase tracking-wider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Refine</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[#71716A] uppercase tracking-wider hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent border border-[#1A1A18]/20 px-2.5 py-1.5 text-xs text-[#1A1A18] uppercase tracking-wider focus:outline-hidden focus:border-[#1A1A18] cursor-pointer"
            >
              <option value="featured">Featured Curations</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Column Toggle (Desktop) */}
          <div className="hidden lg:flex items-center border border-[#1A1A18]/20">
            <button
              onClick={() => setGridColumns(3)}
              className={`p-1.5 cursor-pointer ${gridColumns === 3 ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'}`}
              title="3 Columns"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridColumns(4)}
              className={`p-1.5 cursor-pointer ${gridColumns === 4 ? 'bg-[#1A1A18] text-[#FBFBF9]' : 'text-[#71716A]'}`}
              title="4 Columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Refine Drawer/Panel */}
      {filterDrawerOpen && (
        <div className="my-6 p-6 bg-[#F4F4F0] border border-[#1A1A18]/10 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Search within catalog */}
            <div>
              <label className="block uppercase tracking-wider text-[#1A1A18] font-medium mb-2">
                Filter by Keywords / SKU
              </label>
              <input
                type="text"
                placeholder="Search lamp, coat, SKU..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            {/* Price Cap Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="uppercase tracking-wider text-[#1A1A18] font-medium">Max Price</span>
                <span className="font-semibold tabular-nums text-[#1A1A18]">{formatPrice(priceMax)}</span>
              </div>
              <input
                type="range"
                min="200"
                max="2500"
                step="50"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-[#1A1A18] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#71716A] mt-1">
                <span>$200</span>
                <span>$2,500</span>
              </div>
            </div>

            {/* Stock Availability */}
            <div className="flex flex-col justify-between">
              <div>
                <label className="block uppercase tracking-wider text-[#1A1A18] font-medium mb-2">
                  Availability
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#1A1A18]">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 accent-[#1A1A18]"
                  />
                  <span>Show In-Stock Items Only</span>
                </label>
              </div>

              <button
                onClick={handleResetFilters}
                className="mt-4 sm:mt-0 flex items-center gap-1.5 text-xs text-[#71716A] hover:text-[#1A1A18] transition-colors cursor-pointer self-start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="my-4 text-xs text-[#71716A]">
        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'creation' : 'creations'}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            gridColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          } gap-6 sm:gap-8`}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-[#F4F4F0]/50 border border-[#1A1A18]/5">
          <p className="font-serif text-2xl text-[#1A1A18]">No creations match your criteria.</p>
          <p className="mt-2 text-xs text-[#71716A] max-w-sm mx-auto">
            Try adjusting your price filter or search parameters to reveal our archived editions.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-6 py-2.5 px-6 bg-[#1A1A18] text-[#FBFBF9] text-xs uppercase tracking-wider font-medium hover:bg-[#333330] transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

    </div>
  );
};
