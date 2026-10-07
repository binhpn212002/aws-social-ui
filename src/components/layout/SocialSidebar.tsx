'use client';

import {
  CalendarClock,
  Home,
  MessageSquareText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Link, usePathname } from '@/libs/I18nNavigation';

export const SocialSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const mainNavigation = [
    {
      name: 'Bảng tin (Feed)',
      href: '/feed',
      icon: Home,
      badge: null,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      name: 'Bạn bè (Friends)',
      href: '/friends',
      icon: Users,
      badge: '3',
      color: 'text-sky-600 dark:text-sky-400',
    },
    {
      name: 'Tin nhắn (Messages)',
      href: '/messages',
      icon: MessageSquareText,
      badge: '5',
      color: 'text-violet-600 dark:text-violet-400',
    },
    {
      name: 'Lịch thông báo',
      href: '/notifications/schedules',
      icon: CalendarClock,
      badge: 'Mới',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      name: 'Nhật ký an ninh',
      href: '/settings/audit-logs',
      icon: ShieldCheck,
      badge: null,
      color: 'text-teal-600 dark:text-teal-400',
    },
    {
      name: 'Cài đặt cá nhân',
      href: '/settings/profile',
      icon: Settings,
      badge: null,
      color: 'text-slate-600 dark:text-slate-400',
    },
    {
      name: 'Quản trị viên (Admin)',
      href: '/admin/audit-logs',
      icon: ShieldAlert,
      badge: 'PRO',
      color: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const quickShortcuts = [
    { title: '#AWSCommunity', count: '1.2k bài viết' },
    { title: '#ServerlessNextjs', count: '840 bài viết' },
    { title: '#NestJSArchitecture', count: '520 bài viết' },
  ];

  return (
    <aside className="sticky top-20 hidden w-64 shrink-0 space-y-6 lg:block">
      {/* Quick Profile Overview Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        {isAuthenticated && user ? (
          <Link href={`/profile/${user.id}`} className="group flex items-center gap-3">
            <div className="relative shrink-0">
              <Image
                src={
                  user.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
                alt={user.fullName}
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-500/40 transition group-hover:scale-105"
              />
              <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                {user.fullName}
              </h3>
              <p className="truncate text-xs text-slate-500">
                {user.bio || `@${user.username}`}
              </p>
            </div>
          </Link>
        ) : (
          <Link href="/sign-in" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                Đăng nhập
              </h3>
              <p className="truncate text-xs text-slate-500">Khám phá mạng xã hội</p>
            </div>
          </Link>
        )}
      </div>

      {/* Main Navigation Menu */}
      <nav className="rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
          Khám phá
        </div>
        <ul className="space-y-1">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-400'
                      : 'text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : item.color
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.badge === 'PRO'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
                          : item.badge === 'Mới'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Trending Hashtags & Topics */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <span>Chủ đề nổi bật</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {quickShortcuts.map((topic) => (
            <div
              key={topic.title}
              className="group cursor-pointer rounded-lg p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-400">
                {topic.title}
              </p>
              <span className="text-[11px] text-slate-400">{topic.count}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
