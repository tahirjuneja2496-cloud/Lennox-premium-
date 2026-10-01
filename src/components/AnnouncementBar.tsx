import React from 'react';
import { useStore } from '../context/StoreContext';

interface AnnouncementBarProps {
  onNavigateShop?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onNavigateShop }) => {
  const { settings } = useStore();

  if (!settings.announcementBar?.enabled || !settings.announcementBar.text) {
    return null;
  }

  return (
    <aside aria-label="Announcement" className="bg-[#1A1A18] text-[#FBFBF9] py-2 px-4 text-center text-xs tracking-wide">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <span className="font-light truncate">{settings.announcementBar.text}</span>
        {settings.announcementBar.linkText && (
          <button
            onClick={onNavigateShop}
            className="underline underline-offset-4 font-medium hover:text-[#D4D4CD] transition-colors whitespace-nowrap cursor-pointer"
          >
            {settings.announcementBar.linkText}
          </button>
        )}
      </div>
    </aside>
  );
};
