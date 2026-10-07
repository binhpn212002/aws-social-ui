'use client';

import { Calendar, Clock, MessageCircle, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Link } from '@/libs/I18nNavigation';
import { api } from '@/services/api';
import type { ApiFriend } from '@/services/api';

type SocialRightSidebarProps = {
  onOpenChatWithUser?: (
    userId: string,
    userName: string,
    userAvatar?: string,
  ) => void;
};

export const SocialRightSidebar: React.FC<SocialRightSidebarProps> = ({ onOpenChatWithUser }) => {
  const [friends, setFriends] = useState<ApiFriend[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchFriends = async () => {
      if (!api.getToken()) {
        return;
      }
      try {
        const res = await api.getFriends();
        if (isMounted && res.items && res.items.length > 0) {
          setFriends(res.items);
        }
      } catch {
        // Fallback gracefully without unhandled errors
      }
    };
    void fetchFriends();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback default friends with valid DB UUIDs if API is still loading
  const displayFriends = friends.length > 0
    ? friends.map((f) => ({
        id: f.id,
        name: f.fullName,
        role: `@${f.username}`,
        avatar: f.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        isOnline: true,
      }))
    : [
        {
          id: '4e316ef6-263c-41cf-b433-e7f654b0a2da',
          name: 'Nguyễn Thảo Nhi',
          role: 'DevOps Engineer',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          isOnline: true,
        },
        {
          id: '88ebba8b-aba5-40cb-9571-e177ae1ee421',
          name: 'Trần Quang Huy',
          role: 'Solutions Architect',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
          isOnline: true,
        },
        {
          id: '8a57f1a6-aa34-4b3b-9191-6147bede262b',
          name: 'Lê Mai Hương',
          role: 'UI/UX Designer',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
          isOnline: true,
        },
        {
          id: '78045e3d-abf8-4029-93b0-f8b5127a3ca1',
          name: 'Vũ Quốc Bảo',
          role: 'Backend Node.js Dev',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          isOnline: true,
        },
      ];

  const upcomingSchedules = [
    {
      id: 'sch_1',
      targetUser: 'Trần Quang Huy',
      title: 'Chúc mừng sinh nhật',
      triggerTime: 'Hôm nay lúc 20:00',
      status: 'PENDING',
    },
    {
      id: 'sch_2',
      targetUser: 'AWS Study Group',
      title: 'Nhắc họp ôn tập chứng chỉ SAA',
      triggerTime: 'Ngày mai lúc 09:30',
      status: 'PENDING',
    },
  ];

  return (
    <aside className="sticky top-20 hidden w-80 shrink-0 space-y-6 xl:block">
      {/* Active Friends Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
              Bạn bè trực tuyến ({displayFriends.length})
            </h3>
          </div>
          <Link
            href="/friends"
            className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Tất cả
          </Link>
        </div>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {displayFriends.map((friend) => (
            <button
              key={friend.id}
              type="button"
              className="group flex w-full cursor-pointer items-center justify-between gap-2 py-2 text-left"
              onClick={() => onOpenChatWithUser?.(friend.id, friend.name, friend.avatar)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="relative shrink-0">
                  <Image
                    src={friend.avatar}
                    alt={friend.name}
                    width={36}
                    height={36}
                    unoptimized
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                  />
                  {friend.isOnline && (
                    <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400">
                    {friend.name}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">{friend.role}</p>
                </div>
              </div>

              <div
                title="Nhắn tin nhanh"
                className="shrink-0 rounded-full p-1.5 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/40 dark:group-hover:text-indigo-400"
              >
                <MessageCircle className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Scheduled Reminders */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
            <Clock className="h-4 w-4 text-emerald-500" />
            <span>Lịch hẹn thông báo</span>
          </div>
          <Link
            href="/notifications/schedules"
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <PlusCircle className="h-3 w-3" /> Đặt lịch
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {upcomingSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  Gửi tới: {schedule.targetUser}
                </span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  {schedule.status}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {schedule.title}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>{schedule.triggerTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Footer */}
      <div className="space-y-2 px-2 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/about" className="hover:underline">Điều khoản</Link>
          <Link href="/about" className="hover:underline">Chính sách bảo mật</Link>
          <Link href="/about" className="hover:underline">Hỗ trợ</Link>
          <Link href="/about" className="hover:underline">API Docs</Link>
        </div>
        <p>© 2026 AWS Social Network · Powered by AWS CDK & Next.js</p>
      </div>
    </aside>
  );
};
