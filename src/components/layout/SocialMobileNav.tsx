'use client';

import { Bell, Home, MessageSquare, Plus, Users } from 'lucide-react';
import { Link, usePathname } from '@/libs/I18nNavigation';

type SocialMobileNavProps = {
  onOpenCreatePost?: () => void;
};

export const SocialMobileNav: React.FC<SocialMobileNavProps> = ({ onOpenCreatePost }) => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-slate-200/80 bg-white/95 px-2 backdrop-blur-lg sm:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <Link
        href="/feed"
        className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
          pathname === '/feed' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
        }`}
      >
        <Home className="h-5 w-5" />
        <span>Bảng tin</span>
      </Link>

      <Link
        href="/friends"
        className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
          pathname?.startsWith('/friends')
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500'
        }`}
      >
        <Users className="h-5 w-5" />
        <span>Bạn bè</span>
      </Link>

      {/* Floating Center Create Button */}
      <button
        onClick={onOpenCreatePost}
        className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      <Link
        href="/messages"
        className={`relative flex flex-col items-center gap-1 text-[10px] font-medium ${
          pathname?.startsWith('/messages')
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500'
        }`}
      >
        <MessageSquare className="h-5 w-5" />
        <span className="absolute -top-1 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 text-[8px] font-bold text-white">
          2
        </span>
        <span>Tin nhắn</span>
      </Link>

      <Link
        href="/notifications"
        className={`relative flex flex-col items-center gap-1 text-[10px] font-medium ${
          pathname?.startsWith('/notifications')
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500'
        }`}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 right-2.5 h-2 w-2 rounded-full bg-rose-500" />
        <span>Thông báo</span>
      </Link>
    </nav>
  );
};
