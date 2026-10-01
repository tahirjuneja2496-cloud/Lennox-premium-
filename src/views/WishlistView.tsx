import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

interface WishlistViewProps {
  onNavigateShop: () => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ onNavigateShop, onSelectProduct }) => {
  const { wishlist, products, toggleWishlist, addToCart, formatPrice, addToast } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddAllToCart = () => {
    let addedCount = 0;
    wishlistedProducts.forEach((p) => {
      if (p.stock > 0) {
        addToCart(p);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      addToast(`Added ${addedCount} available creations to your bag.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Private Archive</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Saved Wishlist ({wishlistedProducts.length})
          </h1>
        </div>

        {wishlistedProducts.length > 0 && (
          <button
            onClick={handleAddAllToCart}
            className="py-2.5 px-6 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            Add All Available to Bag
          </button>
        )}
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-24 bg-[#F4F4F0]/40 border border-[#1A1A18]/5">
          <Heart className="w-10 h-10 text-[#8A8A82] mx-auto mb-3" />
          <h2 className="font-serif text-2xl text-[#1A1A18]">Your wishlist is currently empty.</h2>
          <p className="mt-2 text-xs text-[#71716A] max-w-sm mx-auto">
            Save numbered editions and bespoke tailoring to review your private collection later.
          </p>
          <button
            onClick={onNavigateShop}
            className="mt-6 py-2.5 px-6 bg-[#1A1A18] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold hover:bg-[#333330] transition-colors cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {wishlistedProducts.map((product) => (
            <div key={product.id} className="group relative flex flex-col bg-white border border-[#1A1A18]/10">
              <div
                onClick={() => onSelectProduct(product)}
                className="relative aspect-[3/4] bg-[#F4F4F0] cursor-pointer overflow-hidden"
              >
                <img
                  src={product.images?.[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] uppercase tracking-wider text-[#71716A]">
                      {product.category}
                    </span>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="text-[#8A8A82] hover:text-rose-700 p-1 cursor-pointer transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="mt-1 text-sm font-medium text-[#1A1A18] hover:underline cursor-pointer line-clamp-1"
                  >
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold tabular-nums text-[#1A1A18]">
                    {formatPrice(product.price)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1A1A18]/10">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="w-full py-2.5 bg-[#1A1A18] hover:bg-[#333330] disabled:bg-[#8A8A82] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{product.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
