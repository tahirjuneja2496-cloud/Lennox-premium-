import React, { useState } from 'react';
import { ArrowRight, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onSelectProduct }) => {
  const { settings, products, categories } = useStore();
  const [activeTab, setActiveTab] = useState<'featured' | 'newArrivals' | 'bestsellers'>('featured');

  const featuredProducts = products.filter((p) => p.featured && p.published);
  const newArrivals = products.filter((p) => p.newArrival && p.published);
  const bestsellers = products.filter((p) => p.bestseller && p.published);

  const displayedProducts =
    activeTab === 'featured'
      ? featuredProducts.length > 0 ? featuredProducts : products.filter(p => p.published).slice(0, 4)
      : activeTab === 'newArrivals'
      ? newArrivals.length > 0 ? newArrivals : products.filter(p => p.published).slice(0, 4)
      : bestsellers.length > 0 ? bestsellers : products.filter(p => p.published).slice(0, 4);

  const heroImage = settings.hero?.image?.startsWith('/src/assets/images/')
    ? settings.hero.image.replace('/src/assets/images/', '/images/')
    : settings.hero?.image || '/images/hero_luxury_editorial_1790850435776.jpg';

  return (
    <div className="space-y-24 sm:space-y-32">
      
      {/* Hero Section */}
      <section className="relative w-full">
        <div className="relative h-[80vh] min-h-[560px] max-h-[820px] w-full overflow-hidden bg-[#EAEAE5]">
          <img
            src={heroImage}
            alt="Atelier V Editorial Campaign"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-[0.92]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

          {/* Hero Content */}
          <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-8 flex flex-col justify-end pb-16 sm:pb-20 text-[#FBFBF9]">
            <div className="max-w-2xl space-y-4">
              {settings.hero?.badge && (
                <p className="text-xs uppercase tracking-[0.25em] font-medium text-[#D4D4CD]">
                  {settings.hero.badge}
                </p>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.1] text-balance">
                {settings.hero?.headline || 'Form. Materiality. Permanent Presence.'}
              </h1>

              <p className="text-sm sm:text-base text-[#E2E2DC] font-light leading-relaxed max-w-xl">
                {settings.hero?.subtitle ||
                  'A disciplined curation of architectural objects, bespoke tailoring, and artisanal leather goods conceived for longevity.'}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('shop')}
                  className="py-3.5 px-8 bg-[#FBFBF9] hover:bg-white text-[#1A1A18] text-xs uppercase tracking-widest font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl"
                >
                  {settings.hero?.primaryCta || 'Explore Collection'}
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('manifesto');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="py-3.5 px-8 border border-[#FBFBF9]/40 hover:border-[#FBFBF9] text-[#FBFBF9] text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer backdrop-blur-xs"
                >
                  {settings.hero?.secondaryCta || 'The Atelier Journal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#1A1A18]/10">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#71716A]">Architectural Taxonomy</span>
            <h2 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">Curated Categories</h2>
          </div>
          <p className="text-xs text-[#71716A] max-w-sm mt-2 md:mt-0">
            Selected materials refined by heritage European ateliers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.filter((c) => c.enabled).map((cat) => {
            const catImg = cat.image?.startsWith('/src/assets/images/')
              ? cat.image.replace('/src/assets/images/', '/images/')
              : cat.image;
            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('shop', cat.name)}
                className="group relative aspect-[4/5] overflow-hidden bg-[#F4F4F0] cursor-pointer"
              >
                <img
                  src={catImg}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-[#FBFBF9]">
                  <h3 className="text-2xl font-serif">{cat.name}</h3>
                  <p className="text-xs text-[#D4D4CD] line-clamp-2 mt-1.5 opacity-90 leading-relaxed font-light">
                    {cat.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-[#FBFBF9]">
                    <span>Discover Editions</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured / New Arrivals / Bestsellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Segmented filter controls */}
          <div className="flex items-center gap-1 p-1 bg-[#EAEAE5] max-w-fit">
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer ${
                activeTab === 'featured'
                  ? 'bg-[#1A1A18] text-[#FBFBF9]'
                  : 'text-[#52524D] hover:text-[#1A1A18]'
              }`}
            >
              Featured Editions
            </button>
            <button
              onClick={() => setActiveTab('newArrivals')}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer ${
                activeTab === 'newArrivals'
                  ? 'bg-[#1A1A18] text-[#FBFBF9]'
                  : 'text-[#52524D] hover:text-[#1A1A18]'
              }`}
            >
              New Arrivals
            </button>
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer ${
                activeTab === 'bestsellers'
                  ? 'bg-[#1A1A18] text-[#FBFBF9]'
                  : 'text-[#52524D] hover:text-[#1A1A18]'
              }`}
            >
              Bestsellers
            </button>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs uppercase tracking-widest font-semibold text-[#1A1A18] hover:opacity-70 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            <span>View All Creations ({products.filter(p => p.published).length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Editorial Craftsmanship Manifesto */}
      <section id="manifesto" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F4F4F0] p-8 sm:p-14 lg:p-16 border border-[#1A1A18]/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-[0.2em] text-[#71716A] font-medium">
                The Atelier Discipline
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A18] font-normal leading-tight">
                Designed to resist temporal trends and mature with dignified patina.
              </h2>
              <p className="text-sm text-[#52524D] leading-relaxed">
                Every piece in the collection is crafted without compromise: Roman travertine carved in traditional stone masons, cast bronze chilled in sand moulds, double-faced cashmere woven in heritage mills, and full-grain bridle leather tanned naturally with chestnut bark.
              </p>
              <div className="pt-2 grid grid-cols-3 gap-6 text-center sm:text-left">
                <div>
                  <p className="font-serif text-2xl font-semibold text-[#1A1A18]">100%</p>
                  <p className="text-[11px] uppercase tracking-wider text-[#71716A] mt-0.5">Natural Provenance</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold text-[#1A1A18]">Lifetime</p>
                  <p className="text-[11px] uppercase tracking-wider text-[#71716A] mt-0.5">Integrity Guarantee</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold text-[#1A1A18]">Numbered</p>
                  <p className="text-[11px] uppercase tracking-wider text-[#71716A] mt-0.5">Bespoke Editions</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative aspect-square overflow-hidden bg-[#E2E2DC]">
              <img
                src="/images/product_sculptural_lamp_1790850449675.jpg"
                alt="Craftsmanship detail"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
