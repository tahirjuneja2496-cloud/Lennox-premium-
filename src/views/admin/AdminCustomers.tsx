import React, { useState } from 'react';
import { Search, Mail, Phone, MapPin, Award } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';

export const AdminCustomers: React.FC = () => {
  const { customers } = useAdmin();
  const { formatPrice } = useStore();
  const [search, setSearch] = useState('');

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Client Registry</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Patron Management
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border border-[#1A1A18]/10 flex items-center gap-4 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#71716A]" />
          <input
            type="text"
            placeholder="Search by patron name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F4F4F0] border border-[#1A1A18]/10 text-xs text-[#1A1A18] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#1A1A18]/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1A18]/10 bg-[#F4F4F0]/60 text-[#71716A] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">Patron Name</th>
                <th className="py-3.5 px-3 font-medium">Contact</th>
                <th className="py-3.5 px-3 font-medium">Residence</th>
                <th className="py-3.5 px-3 font-medium">Orders</th>
                <th className="py-3.5 px-3 font-medium">Lifetime Spend</th>
                <th className="py-3.5 px-3 font-medium">Last Inscription</th>
                <th className="py-3.5 px-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A18]/10">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#1A1A18]">{c.fullName}</p>
                    <p className="font-mono text-[10px] text-[#8A8A82]">{c.id}</p>
                  </td>

                  <td className="py-3.5 px-3 text-[#52524D]">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[#8A8A82]" />
                      <span>{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#71716A]">
                        <Phone className="w-3 h-3 text-[#8A8A82]" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-[#52524D]">
                    {c.city}, {c.country}
                  </td>

                  <td className="py-3.5 px-3 tabular-nums font-medium text-[#1A1A18]">
                    {c.totalOrders} order(s)
                  </td>

                  <td className="py-3.5 px-3 tabular-nums font-semibold text-[#1A1A18]">
                    {formatPrice(c.totalSpent)}
                  </td>

                  <td className="py-3.5 px-3 text-[#71716A]">{c.lastOrderDate}</td>

                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                        c.status === 'VIP'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
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
