import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Share2,
  Check,
  Copy,
  Send,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ZoomIn,
  MessageSquare
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductVariant, Review } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

interface ProductDetailViewProps {
  product: Product;
  onNavigateShop: () => void;
  onSelectProduct: (product: Product) => void;
  onCheckout: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onNavigateShop,
  onSelectProduct,
  onCheckout
}) => {
  const {
    addToCart,
    isWishlisted,
    toggleWishlist,
    formatPrice,
    addToast,
    products
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'provenance' | 'shipping'>('specs');
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Zoom lens state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Sticky mobile bar visibility observer
  const purchaseButtonRef = useRef<HTMLButtonElement>(null);
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);

  useEffect(() => {
    // Scroll to top on product change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImageIndex(0);
    setSelectedVariant(product.variants?.[0]);
    setQuantity(1);

    // Update document title & SEO
    document.title = `${product.name} | Atelier V`;

    // Fetch reviews
    api.getReviews(product.id).then(setReviews).catch(console.error);

    // Dynamic JSON-LD structured data injection for SEO
    const schemaId = 'product-jsonld';
    let scriptTag = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    const currentPrice = selectedVariant?.price ?? product.price;
    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: product.images,
      description: product.description,
      sku: selectedVariant?.sku || product.sku,
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Atelier V'
      },
      offers: {
        '@type': 'Offer',
        url: window.location.href,
        priceCurrency: 'USD',
        price: currentPrice,
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      },
      aggregateRating: product.reviewCount > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount
      } : undefined
    });

    return () => {
      // clean up script on unmount if needed
    };
  }, [product]);

  // Observer for mobile sticky buy bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (purchaseButtonRef.current) {
      observer.observe(purchaseButtonRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentSku = selectedVariant?.sku || product.sku;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= (product.lowStockThreshold || 3);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/src/assets/images/hero_luxury_editorial_1790850435776.jpg'];
  const activeImage = images[activeImageIndex] || images[0];

  // Mouse move for zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomCoords({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
  };

  const handleInstantBuy = () => {
    addToCart(product, selectedVariant, quantity);
    onCheckout();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    addToast('Product link copied to clipboard');
    setSharePopoverOpen(false);
  };

  const handleShare = (channel: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Explore ${product.name} at Atelier V.`);
    let shareUrl = '';

    if (channel === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    } else if (channel === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    } else if (channel === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
    } else if (channel === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (channel === 'native' && navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href
      }).catch(() => {});
      setSharePopoverOpen(false);
      return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setSharePopoverOpen(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewTitle.trim() || !newReviewComment.trim() || !newReviewAuthor.trim()) {
      addToast('Please fill all review fields', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const created = await api.createReview({
        productId: product.id,
        customerName: newReviewAuthor,
        rating: newReviewRating,
        title: newReviewTitle,
        comment: newReviewComment,
        verified: true,
        featured: false,
        images: []
      });
      setReviews((prev) => [created, ...prev]);
      addToast('Review submitted successfully. Thank you for your appraisal.');
      setNewReviewTitle('');
      setNewReviewComment('');
      setNewReviewAuthor('');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Related products in same category
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-[#71716A] mb-8 uppercase tracking-wider">
        <button onClick={onNavigateShop} className="hover:text-[#1A1A18] transition-colors cursor-pointer">
          Creations
        </button>
        <ChevronRight className="w-3 h-3 text-[#A8A8A0]" />
        <button
          onClick={onNavigateShop}
          className="hover:text-[#1A1A18] transition-colors cursor-pointer"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3 h-3 text-[#A8A8A0]" />
        <span className="text-[#1A1A18] truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Contiguous Purchase Stage (Two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        
        {/* Gallery Column (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          
          {/* Thumbnails (vertical on desktop, horizontal on mobile) */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 bg-[#F4F4F0] overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIndex === idx ? 'border-[#1A1A18]' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Large Main Image with Smooth Zoom */}
          <div
            ref={imageContainerRef}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
            className="relative flex-1 aspect-[3/4] bg-[#F4F4F0] overflow-hidden cursor-crosshair select-none"
          >
            <img
              src={activeImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                isZooming ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Magnified zoom layer */}
            {isZooming && (
              <div
                className="absolute inset-0 bg-no-repeat transition-transform pointer-events-none"
                style={{
                  backgroundImage: `url(${activeImage})`,
                  backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  backgroundSize: '240%'
                }}
              />
            )}

            {/* Zoom hint badge */}
            <div className="absolute bottom-4 right-4 bg-[#FBFBF9]/80 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#1A1A18] flex items-center gap-1.5 pointer-events-none">
              <ZoomIn className="w-3 h-3" />
              <span>Hover to Zoom</span>
            </div>
          </div>
        </div>

        {/* Contiguous Purchase Module (5 cols on desktop, sticky) */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
          
          {/* Header metadata */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#71716A] uppercase tracking-wider">
              <span>{product.brand || 'Atelier V Editions'} · {product.category}</span>
              <span className="font-mono text-[11px] text-[#1A1A18] font-semibold">SKU: {currentSku}</span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-serif text-[#1A1A18] font-normal leading-snug">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex text-amber-900 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating) ? 'fill-current' : 'text-[#D4D4CD]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold tabular-nums text-[#1A1A18]">{product.rating}</span>
              <span className="text-xs text-[#71716A]">({reviews.length} reviews)</span>
            </div>
          </div>

          {/* Pricing Module */}
          <div className="pt-4 border-t border-[#1A1A18]/10 flex items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums text-[#1A1A18]">
              {formatPrice(currentPrice)}
            </span>
            {product.originalPrice > currentPrice && (
              <>
                <span className="text-sm text-[#8A8A82] line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
                  Save {product.discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Stock Indicator */}
          <div className="text-xs">
            {isOutOfStock ? (
              <span className="text-rose-700 font-medium uppercase tracking-wider">
                Currently Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-amber-800 font-medium uppercase tracking-wider">
                Only {currentStock} remaining in this edition
              </span>
            ) : (
              <span className="text-emerald-800 font-medium uppercase tracking-wider">
                In Stock · Ready for Dispatch
              </span>
            )}
          </div>

          {/* Short Narrative */}
          <p className="text-xs leading-relaxed text-[#52524D]">
            {product.shortDescription || product.description}
          </p>

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="pt-4 border-t border-[#1A1A18]/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="uppercase tracking-wider font-medium text-[#1A1A18]">
                  Select Edition / Specification:
                </span>
                <span className="text-[#71716A]">{selectedVariant?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 text-left border transition-all cursor-pointer ${
                      selectedVariant?.id === v.id
                        ? 'border-[#1A1A18] bg-[#1A1A18] text-[#FBFBF9]'
                        : 'border-[#1A1A18]/20 bg-transparent text-[#1A1A18] hover:border-[#1A1A18]'
                    }`}
                  >
                    <p className="text-xs font-medium truncate">{v.name}</p>
                    <p className="text-[11px] opacity-80 mt-0.5 tabular-nums">
                      {formatPrice(v.price)} · {v.stock > 0 ? `${v.stock} in stock` : 'Sold out'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs uppercase tracking-wider font-medium text-[#1A1A18]">
              Quantity:
            </span>
            <div className="flex items-center border border-[#1A1A18]/20 bg-white">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="px-3 py-1.5 text-xs text-[#1A1A18] hover:bg-[#F4F4F0] disabled:opacity-30 cursor-pointer"
              >
                -
              </button>
              <span className="px-4 py-1.5 text-xs font-semibold tabular-nums text-[#1A1A18]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                disabled={quantity >= currentStock}
                className="px-3 py-1.5 text-xs text-[#1A1A18] hover:bg-[#F4F4F0] disabled:opacity-30 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Primary Purchase CTAs */}
          <div className="space-y-3 pt-4">
            <div className="flex gap-3">
              <button
                ref={purchaseButtonRef}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-4 bg-[#1A1A18] hover:bg-[#333330] disabled:bg-[#8A8A82] text-[#FBFBF9] text-xs uppercase tracking-widest font-semibold transition-all duration-200 cursor-pointer shadow-md"
              >
                {isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Add to wishlist"
                className="p-4 border border-[#1A1A18]/20 hover:border-[#1A1A18] text-[#1A1A18] transition-colors cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlisted(product.id) ? 'fill-rose-700 text-rose-700' : ''
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleInstantBuy}
              disabled={isOutOfStock}
              className="w-full py-3.5 border border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#FBFBF9] text-[#1A1A18] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
            >
              Instant Purchase
            </button>
          </div>

          {/* Share Accordion / Bar */}
          <div className="pt-2 relative">
            <button
              onClick={() => setSharePopoverOpen(!sharePopoverOpen)}
              className="text-xs uppercase tracking-wider text-[#71716A] hover:text-[#1A1A18] flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Creation</span>
            </button>

            {sharePopoverOpen && (
              <div className="mt-3 p-4 bg-[#F4F4F0] border border-[#1A1A18]/10 space-y-3 animate-in fade-in duration-150">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#1A1A18]">
                  Share Permanent Product Link
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1A1A18]/10 hover:border-[#1A1A18] text-[#1A1A18] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1A1A18]/10 hover:border-[#1A1A18] text-[#1A1A18] cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1A1A18]/10 hover:border-[#1A1A18] text-[#1A1A18] cursor-pointer"
                  >
                    <span>X / Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1A1A18]/10 hover:border-[#1A1A18] text-[#1A1A18] cursor-pointer"
                  >
                    <span>Telegram</span>
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={() => handleShare('native')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A18] text-white cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Device Share</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trust Value Props */}
          <div className="pt-6 border-t border-[#1A1A18]/10 space-y-3 text-xs text-[#52524D]">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-[#1A1A18] shrink-0" />
              <span>Complimentary insured express delivery on orders over $250</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#1A1A18] shrink-0" />
              <span>Bespoke presentation packaging & Certificate of Authenticity</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-[#1A1A18] shrink-0" />
              <span>Complimentary 30-day continental returns and exchanges</span>
            </div>
          </div>

        </div>
      </div>

      {/* Specifications / Provenance / Shipping Tabs */}
      <section className="mt-20 pt-12 border-t border-[#1A1A18]/10">
        <div className="flex items-center gap-8 border-b border-[#1A1A18]/10 text-xs uppercase tracking-widest font-medium">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === 'specs' ? 'text-[#1A1A18]' : 'text-[#71716A] hover:text-[#1A1A18]'
            }`}
          >
            <span>Material Specifications</span>
            {activeTab === 'specs' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1A1A18]" />}
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === 'provenance' ? 'text-[#1A1A18]' : 'text-[#71716A] hover:text-[#1A1A18]'
            }`}
          >
            <span>Artisan Provenance</span>
            {activeTab === 'provenance' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1A1A18]" />}
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === 'shipping' ? 'text-[#1A1A18]' : 'text-[#71716A] hover:text-[#1A1A18]'
            }`}
          >
            <span>Shipping & White Glove Concierge</span>
            {activeTab === 'shipping' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1A1A18]" />}
          </button>
        </div>

        <div className="py-8 max-w-3xl text-xs leading-relaxed text-[#52524D]">
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              {product.specifications && product.specifications.length > 0 && (
                <div className="mt-6 divide-y divide-[#1A1A18]/10 border-y border-[#1A1A18]/10">
                  {product.specifications.map((s, idx) => (
                    <div key={idx} className="py-3 flex justify-between">
                      <span className="font-medium text-[#1A1A18] uppercase tracking-wider">{s.label}</span>
                      <span className="text-[#71716A]">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="space-y-4">
              <p>
                Every edition is developed in collaboration with generational European workshops that have preserved their craft techniques for over a century. From hand-chiseled travertine to double-faced Mongolian cashmere stitched with invisible blind hems, our creators work with zero artificial shortcuts.
              </p>
              <p>
                Each item bears an engraved or stamped provenance registry mark with its individual production ledger number.
              </p>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <p>
                We offer worldwide express air courier delivery via DHL Express Worldwide and FedEx Priority. All pieces are packed in custom wooden crates or bonded archival boxes to ensure zero transit vibration.
              </p>
              <p>
                Transit times: Continental Europe: 1–2 business days; North America: 2–3 business days; Asia-Pacific: 3–4 business days.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews & Ratings Section */}
      <section className="mt-16 pt-12 border-t border-[#1A1A18]/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#71716A]">Appraisals</span>
            <h3 className="text-2xl font-serif text-[#1A1A18]">Patron Reviews ({reviews.length})</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Review List */}
          <div className="lg:col-span-7 space-y-6">
            {reviews.length === 0 ? (
              <p className="text-xs text-[#71716A] italic">
                Be the first verified patron to leave an appraisal for this creation.
              </p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-6 bg-[#F4F4F0] border border-[#1A1A18]/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-900 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-current' : 'text-[#D4D4CD]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#1A1A18]">{rev.title}</span>
                    </div>
                    <span className="text-[11px] text-[#71716A]">{rev.createdAt}</span>
                  </div>

                  <p className="text-xs text-[#52524D] leading-relaxed">{rev.comment}</p>

                  <div className="flex items-center gap-2 text-[11px] text-[#71716A]">
                    <span className="font-medium text-[#1A1A18]">{rev.customerName}</span>
                    {rev.verified && (
                      <span className="flex items-center gap-1 text-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Submit Review Form */}
          <div className="lg:col-span-5 p-6 bg-white border border-[#1A1A18]/10 space-y-4">
            <h4 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
              Submit an Appraisal
            </h4>
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Your Rating</label>
                <div className="flex text-amber-900 gap-1.5 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newReviewRating ? 'fill-current' : 'text-[#D4D4CD]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lord Julian Sterling"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Review Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architectural masterpiece"
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Comments</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your tactile experience, finish, and material weight..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-3 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] uppercase tracking-wider font-semibold text-xs transition-colors cursor-pointer"
              >
                {isSubmittingReview ? 'Submitting...' : 'Post Verified Appraisal'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[#1A1A18]/10">
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-[#71716A]">Complementary Pieces</span>
            <h3 className="text-2xl font-serif text-[#1A1A18]">Curated in Harmony</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Add-to-Cart Bar */}
      {showMobileStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FBFBF9]/95 backdrop-blur-md border-t border-[#1A1A18]/10 p-3 sm:hidden shadow-xl animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#1A1A18] truncate">{product.name}</p>
              <p className="text-xs font-semibold tabular-nums text-[#1A1A18]">{formatPrice(currentPrice)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="py-2.5 px-5 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer shrink-0"
            >
              {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
