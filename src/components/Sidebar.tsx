import React from 'react';
import { Conversation, UserProfile } from '../types';
import {
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  GraduationCap,
  X,
  LogIn,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  user: UserProfile;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  modelName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  user,
  onLogout,
  onOpenAuthModal,
  isOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-68 sm:w-72 bg-[#171717] text-neutral-200 flex flex-col transition-transform duration-250 ease-in-out border-r border-neutral-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="font-semibold text-sm tracking-tight text-white">
              Question Focus <span className="text-xs text-sky-400 font-normal">24/7</span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-neutral-400 hover:text-white rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => {
              onNewConversation();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg border border-neutral-700/80 hover:bg-neutral-800/80 text-white font-normal text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-neutral-400" />
            <span>+ Cuộc trò chuyện mới</span>
          </button>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {conversations.length > 0 && (
            <div className="px-2.5 py-1 text-[11px] font-medium text-neutral-500">
              Gần đây
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="px-3 py-10 text-center text-xs text-neutral-500">
              Chưa có cuộc trò chuyện
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-4">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-neutral-500" />
                    <span className="truncate">
                      {conv.title || 'Cuộc trò chuyện mới'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => onDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 rounded transition-opacity"
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-neutral-800/80">
          {user.isGuest ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-xs font-medium">
                  K
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-white truncate">Chế độ khách</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                title="Đăng nhập Google"
              >
                <LogIn className="w-3 h-3" />
                <span>Đăng nhập</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-neutral-800 flex-shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <div className="text-xs text-white truncate font-medium">{user.name}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
