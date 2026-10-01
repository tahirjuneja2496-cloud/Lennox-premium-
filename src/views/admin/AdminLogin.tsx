import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface AdminLoginProps {
  onBackToStorefront: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStorefront }) => {
  const { login } = useAdmin();
  const [email, setEmail] = useState('admin@atelierv.com');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@atelierv.com');
    setPassword('admin123');
    setIsSubmitting(true);
    await login('admin@atelierv.com', 'admin123');
    setIsSubmitting(false);
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
          Administrative authentication required for catalog, inventory, and ledger operations.
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
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@atelierv.com"
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
                placeholder="••••••••"
                className="w-full bg-[#141413] border border-[#3D3D39] px-3.5 py-2.5 text-[#FBFBF9] focus:outline-hidden focus:border-[#D4D4CD]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#FBFBF9] hover:bg-white text-[#141413] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Enter Management Suite'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-[#2E2E2A] text-center space-y-3">
            <p className="text-[11px] text-[#A8A8A0]">
              Demo credentials: <span className="font-mono text-amber-200">admin@atelierv.com / admin123</span>
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2 bg-[#292926] hover:bg-[#333330] text-amber-200 text-xs tracking-wider transition-colors cursor-pointer border border-amber-900/30 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Click Demo Access</span>
            </button>
          </div>

          <div className="text-center pt-2">
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
