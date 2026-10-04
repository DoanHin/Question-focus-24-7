import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  title: string;
  user: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  title,
  user,
}) => {
  return (
    <header className="h-12 border-b border-slate-100 bg-white/80 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
          title="Mở menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <span className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-xs sm:max-w-md">
          {title || 'Cuộc trò chuyện mới'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Tạo cuộc trò chuyện mới"
        >
          <Plus className="w-4 h-4" />
        </button>

        {user.isGuest ? (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-normal">
            Khách
          </span>
        ) : (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover bg-slate-100"
            title={user.name}
          />
        )}
      </div>
    </header>
  );
};
