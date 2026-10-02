import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface AdminLoginProps {
  onBackToStorefront: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStorefront }) => {
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141413] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#FBFBF9]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="w-12 h-12 bg-[#292926] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3D3D39]">
          <ShieldCheck className="w-6 h-6 text-amber-200" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#A8A8A0] font-mono">
          Executive Portal
        </span>
        <h2 className="mt-2 text-3xl font-serif tracking-widest uppercase">
          ATELIER V MANAGEMENT
        </h2>
        <p className="mt-2 text-xs text-[#9B9B94]">
          Administrative authentication required for catalog, inventory, and order fulfillment operations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#1C1C1A] py-8 px-6 shadow-2xl border border-[#2E2E2A] sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#D4D4CD] uppercase tracking-wider font-medium mb-1.5">
                Executive Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter administrator email..."
                autoComplete="email"
                className="w-full bg-[#141413] border border-[#3D3D39] px-3.5 py-2.5 text-[#FBFBF9] focus:outline-hidden focus:border-[#D4D4CD]"
              />
            </div>

            <div>
              <label className="block text-[#D4D4CD] uppercase tracking-wider font-medium mb-1.5">
                Master Security Key
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoComplete="current-password"
                className="w-full bg-[#141413] border border-[#3D3D39] px-3.5 py-2.5 text-[#FBFBF9] focus:outline-hidden focus:border-[#D4D4CD]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="w-full py-3.5 bg-[#FBFBF9] hover:bg-white disabled:bg-[#3D3D39] disabled:text-[#71716A] text-[#141413] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Enter Management Suite'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#2E2E2A]">
            <button
              type="button"
              onClick={onBackToStorefront}
              className="text-xs text-[#8A8A82] hover:text-[#FBFBF9] transition-colors cursor-pointer"
            >
              ← Return to Public Storefront
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
