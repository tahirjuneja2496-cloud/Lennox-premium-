import React from 'react';
import { Star, Check, X, Trash2, Award } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';

export const AdminReviews: React.FC = () => {
  const { reviews, updateReviewStatus } = useAdmin();
  const { products } = useStore();

  const getProductName = (id: string) => {
    return products.find((p) => p.id === id)?.name || 'Creation';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Patron Appraisals</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Review Moderation & Feedback
          </h1>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-[#1A1A18]/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1A18]/10 bg-[#F4F4F0]/60 text-[#71716A] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">Creation</th>
                <th className="py-3.5 px-3 font-medium">Patron</th>
                <th className="py-3.5 px-3 font-medium">Rating</th>
                <th className="py-3.5 px-4 font-medium">Appraisal Review</th>
                <th className="py-3.5 px-3 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A18]/10">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[#1A1A18] max-w-[180px] truncate">
                    {getProductName(r.productId)}
                  </td>

                  <td className="py-3.5 px-3 text-[#52524D]">
                    <p className="font-semibold text-[#1A1A18]">{r.customerName}</p>
                    <p className="text-[11px] text-[#71716A]">{r.createdAt}</p>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex text-amber-900 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < r.rating ? 'fill-current' : 'text-[#D4D4CD]'
                          }`}
                        />
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-semibold text-[#1A1A18]">{r.title}</p>
                    <p className="text-xs text-[#52524D] line-clamp-2 mt-0.5">{r.comment}</p>
                  </td>

                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase font-semibold ${
                        r.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status !== 'approved' ? (
                        <button
                          onClick={() => updateReviewStatus(r.id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-800 text-white rounded-xs text-[11px] hover:bg-emerald-900 cursor-pointer"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => updateReviewStatus(r.id, 'rejected')}
                          className="px-2.5 py-1 bg-rose-800 text-white rounded-xs text-[11px] hover:bg-rose-900 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
