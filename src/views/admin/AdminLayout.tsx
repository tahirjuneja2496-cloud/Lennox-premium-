import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Layers,
  Users,
  Tag,
  Star,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children
}) => {
  const { adminUser, logout } = useAdmin();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory & Stock', icon: Layers },
    { id: 'customers', label: 'Patrons', icon: Users },
    { id: 'coupons', label: 'Privilege Codes', icon: Tag },
    { id: 'reviews', label: 'Appraisals', icon: Star },
    { id: 'settings', label: 'CMS & Settings', icon: Settings }
  ];

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#1A1A18] flex flex-col">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#1A1A18] text-[#FBFBF9] border-b border-[#2E2E2A] px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 text-[#D4D4CD] hover:text-white"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-serif tracking-widest text-lg font-semibold uppercase">
              ATELIER V
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#A8A8A0] font-mono border-l border-[#3D3D39] pl-2 hidden sm:inline">
              Management Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onExitAdmin}
            className="text-xs uppercase tracking-wider text-[#D4D4CD] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 bg-[#292926] hover:bg-[#333330]"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-[#3D3D39]" />

          <button
            onClick={logout}
            className="text-xs text-[#A8A8A0] hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sign out of Admin"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex">
        
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-[#1A1A18]/10 hidden md:flex flex-col justify-between py-6">
          <div className="space-y-1 px-3">
            <div className="px-3 pb-3 mb-2 border-b border-[#1A1A18]/5">
              <p className="text-[11px] font-semibold text-[#1A1A18]">{adminUser?.name || 'Executive Concierge'}</p>
              <p className="text-[10px] text-[#71716A]">{adminUser?.email || 'tahirjuneja2496@gmail.com'}</p>
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || (item.id === 'products' && currentTab === 'products-new');
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1A1A18] text-[#FBFBF9]'
                      : 'text-[#52524D] hover:bg-[#F4F4F0] hover:text-[#1A1A18]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-6 text-[10px] text-[#8A8A82]">
            <p>Atelier V Platform v2.6</p>
            <p>Production Build Ready</p>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white h-full z-50 p-4 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between items-center pb-3 border-b border-[#1A1A18]/10">
                  <span className="font-serif text-lg font-bold">MANAGEMENT</span>
                  <button onClick={() => setMobileSidebarOpen(false)}>
                    <X className="w-5 h-5 text-[#1A1A18]" />
                  </button>
                </div>

                <div className="pt-2 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-wider ${
                          isActive
                            ? 'bg-[#1A1A18] text-[#FBFBF9]'
                            : 'text-[#52524D] hover:bg-[#F4F4F0]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#1A1A18]/10">
                <button
                  onClick={onExitAdmin}
                  className="w-full py-2.5 bg-[#1A1A18] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold"
                >
                  View Storefront
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl">
          {children}
        </main>

      </div>
    </div>
  );
};
