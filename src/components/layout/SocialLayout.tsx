'use client';

import { useEffect, useState } from 'react';
import { SocialCreatePostModal } from './SocialCreatePostModal';
import { SocialFloatingChat } from './SocialFloatingChat';
import { SocialMobileNav } from './SocialMobileNav';
import { SocialNavbar } from './SocialNavbar';
import { SocialRightSidebar } from './SocialRightSidebar';
import { SocialSidebar } from './SocialSidebar';

type SocialLayoutProps = {
  children: React.ReactNode;
};

export const SocialLayout: React.FC<SocialLayoutProps> = ({ children }) => {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isChatDockOpen, setIsChatDockOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<
    { id: string; name: string; avatar?: string } | undefined
  >();

  const handleOpenChatWithUser = (
    userId: string,
    userName: string,
    userAvatar?: string,
  ) => {
    setChatTargetUser({ id: userId, name: userName, avatar: userAvatar });
    setIsChatDockOpen(true);
  };

  useEffect(() => {
    const handleQuickChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        id: string;
        name: string;
        avatar?: string;
      }>;
      if (customEvent.detail) {
        setChatTargetUser(customEvent.detail);
        setIsChatDockOpen(true);
      }
    };

    window.addEventListener('open-quick-chat', handleQuickChatEvent);
    return () => {
      window.removeEventListener('open-quick-chat', handleQuickChatEvent);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors selection:bg-indigo-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* 1. TOP NAVBAR / HEADER */}
      <SocialNavbar
        onOpenCreatePost={() => {
          setIsCreatePostOpen(true);
        }}
        onToggleChatDock={() => {
          setIsChatDockOpen(!isChatDockOpen);
        }}
      />

      {/* 2. MAIN 3-COLUMN CONTAINER */}
      <div className="mx-auto flex max-w-7xl justify-between gap-6 px-3 py-6 sm:px-4 lg:px-8">
        {/* LEFT COLUMN: Sidebar Navigation */}
        <SocialSidebar />

        {/* CENTER COLUMN: Main Content Area */}
        <main className="mx-auto max-w-2xl min-w-0 flex-1 pb-20 sm:pb-6">{children}</main>

        {/* RIGHT COLUMN: Online Friends & Scheduled Reminders */}
        <SocialRightSidebar onOpenChatWithUser={handleOpenChatWithUser} />
      </div>

      {/* 3. FLOATING CHAT DOCK (Bottom Right) */}
      <SocialFloatingChat
        isOpen={isChatDockOpen}
        onClose={() => {
          setIsChatDockOpen(false);
        }}
        activeChatUser={chatTargetUser}
      />

      {/* 4. MOBILE BOTTOM NAVIGATION */}
      <SocialMobileNav
        onOpenCreatePost={() => {
          setIsCreatePostOpen(true);
        }}
      />

      {/* 5. CREATE POST MODAL */}
      <SocialCreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => {
          setIsCreatePostOpen(false);
        }}
      />
    </div>
  );
};
