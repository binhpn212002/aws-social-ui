'use client';

import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  UserMinus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Link } from '@/libs/I18nNavigation';
import { api } from '@/services/api';
import type { ApiFriend, ApiFriendRequest } from '@/services/api';

type TabType = 'all' | 'received' | 'sent' | 'blocked';

type FriendListProps = {
  friends: ApiFriend[];
  searchQuery: string;
  onUnfriend: (id: string, name: string) => void;
};

function FriendListTab({ friends, searchQuery, onUnfriend }: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
        <UserCheck className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="mt-2 text-sm font-semibold">
          {searchQuery ? `Không tìm thấy bạn bè nào khớp với "${searchQuery}"` : 'Chưa có bạn bè nào.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md transition hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/80"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Image
              src={friend.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={friend.fullName}
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-indigo-500/20"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <Link
                href={`/profile/${friend.id}`}
                className="block truncate text-sm font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
              >
                {friend.fullName}
              </Link>
              <p className="truncate text-xs text-slate-500">@{friend.username}</p>
              <p className="truncate text-[11px] text-slate-400">
                {friend.bio ?? 'Thành viên mạng xã hội'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 pl-2">
            <Link
              href="/messages"
              title="Nhắn tin"
              className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <button
              type="button"
              title="Hủy kết bạn"
              onClick={() => onUnfriend(friend.id, friend.fullName)}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-950/40"
            >
              <UserMinus className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

type ReceivedRequestsProps = {
  requests: ApiFriendRequest[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

function ReceivedRequestsTab({ requests, onAccept, onDecline }: ReceivedRequestsProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
        <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="mt-2 text-sm font-semibold">Không có lời mời kết bạn nào đang chờ duyệt.</p>
        <p className="mt-1 text-xs text-slate-400">
          Khi ai đó gửi lời mời cho bạn, lời mời sẽ xuất hiện ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-slate-900/80"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Image
              src={req.requester?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={req.requester?.fullName ?? 'User'}
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-sky-500/20"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {req.requester?.fullName}
              </h4>
              <p className="truncate text-xs text-slate-500">@{req.requester?.username}</p>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" /> {new Date(req.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onAccept(req.id)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95"
            >
              <Check className="h-3.5 w-3.5" /> Chấp nhận
            </button>
            <button
              type="button"
              onClick={() => onDecline(req.id)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" /> Từ chối
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

type SentRequestsProps = {
  requests: ApiFriendRequest[];
  onCancel: (id: string) => void;
};

function SentRequestsTab({ requests, onCancel }: SentRequestsProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
        <Send className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="mt-2 text-sm font-semibold">Bạn chưa gửi lời mời kết bạn nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-slate-900/80"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Image
              src={req.addressee?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={req.addressee?.fullName ?? 'User'}
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-indigo-500/20"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {req.addressee?.fullName}
              </h4>
              <p className="truncate text-xs text-slate-500">@{req.addressee?.username}</p>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" /> Đang chờ phản hồi · {new Date(req.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCancel(req.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <X className="h-3.5 w-3.5" /> Hủy lời mời
          </button>
        </div>
      ))}
    </div>
  );
}

type ConfirmModalProps = {
  name: string;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmUnfriendModal({ name, isProcessing, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <UserMinus className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Hủy kết bạn với {name}?
        </h3>
        <p className="mt-2 text-xs text-slate-500">
          Hành động này sẽ xóa người dùng khỏi danh sách bạn bè của bạn. Bạn vẫn có thể gửi lời mời kết bạn lại sau này.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
          >
            {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

type FriendsHeaderProps = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  friendsCount: number;
  receivedCount: number;
  sentCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  isSearching: boolean;
};

function FriendsHeader({
  activeTab,
  setActiveTab,
  friendsCount,
  receivedCount,
  sentCount,
  isLoading,
  onRefresh,
  searchQuery,
  onSearch,
  isSearching,
}: FriendsHeaderProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Users className="h-5 w-5 text-indigo-600" />
            Mạng lưới bạn bè
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Kết nối trực tiếp API: Quản lý danh sách bạn bè, phản hồi lời mời và kiểm soát kết nối
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Tất cả ({friendsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'received'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <span>Lời mời nhận</span>
            {receivedCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {receivedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'sent'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Đã gửi ({sentCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocked')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'blocked'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Đã chặn
          </button>

          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới dữ liệu từ API"
            className="rounded-xl p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="relative mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Search className="absolute top-5 left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm kiếm nhanh bạn bè theo họ tên hoặc username..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2 pr-4 pl-10 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {isSearching && (
            <Loader2 className="absolute top-5 right-3.5 h-4 w-4 animate-spin text-slate-400" />
          )}
        </div>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ApiFriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ApiFriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Unfriend modal state
  const [unfriendTarget, setUnfriendTarget] = useState<{ id: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    if (!api.getToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests('received'),
        api.getFriendRequests('sent'),
      ]);
      setFriends(friendsRes.items ?? []);
      setReceivedRequests(receivedRes.items ?? []);
      setSentRequests(sentRes.items ?? []);
    } catch (error: unknown) {
      console.error('Load friends error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const res = await api.getFriends(query.trim() || undefined);
      setFriends(res.items ?? []);
    } catch (error: unknown) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      const res = await api.getFriends();
      setFriends(res.items ?? []);
      setStatusMessage({ type: 'success', message: 'Đã chấp nhận lời mời kết bạn thành công!' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setStatusMessage({ type: 'error', message: `Lỗi chấp nhận: ${msg}` });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      setStatusMessage({ type: 'success', message: 'Đã từ chối lời mời kết bạn.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setStatusMessage({ type: 'error', message: `Lỗi từ chối: ${msg}` });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleCancelSent = async (requestId: string) => {
    try {
      await api.cancelFriendRequest(requestId);
      setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
      setStatusMessage({ type: 'success', message: 'Đã thu hồi lời mời kết bạn.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setStatusMessage({ type: 'error', message: `Lỗi hủy lời mời: ${msg}` });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const confirmUnfriendAction = async () => {
    if (!unfriendTarget) {
      return;
    }
    setIsProcessing(true);
    try {
      await api.unfriend(unfriendTarget.id);
      setFriends((prev) => prev.filter((f) => f.id !== unfriendTarget.id));
      setStatusMessage({ type: 'success', message: `Đã hủy kết bạn với ${unfriendTarget.name}.` });
      setUnfriendTarget(null);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setStatusMessage({ type: 'error', message: `Lỗi hủy kết bạn: ${msg}` });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-sm transition-all ${
            statusMessage.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <FriendsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        friendsCount={friends.length}
        receivedCount={receivedRequests.length}
        sentCount={sentRequests.length}
        isLoading={isLoading}
        onRefresh={() => {
          void loadData();
        }}
        searchQuery={searchQuery}
        onSearch={(q) => {
          void handleSearch(q);
        }}
        isSearching={isSearching}
      />

      {isLoading && friends.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-2 text-xs">Đang tải danh sách bạn bè từ API...</p>
        </div>
      )}

      {!isLoading && activeTab === 'all' && (
        <FriendListTab
          friends={friends}
          searchQuery={searchQuery}
          onUnfriend={(id, name) => setUnfriendTarget({ id, name })}
        />
      )}

      {!isLoading && activeTab === 'received' && (
        <ReceivedRequestsTab
          requests={receivedRequests}
          onAccept={(id) => {
            void handleAccept(id);
          }}
          onDecline={(id) => {
            void handleDecline(id);
          }}
        />
      )}

      {!isLoading && activeTab === 'sent' && (
        <SentRequestsTab
          requests={sentRequests}
          onCancel={(id) => {
            void handleCancelSent(id);
          }}
        />
      )}

      {activeTab === 'blocked' && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-sm font-semibold">Hiện không có người dùng nào trong danh sách bị chặn.</p>
        </div>
      )}

      {unfriendTarget && (
        <ConfirmUnfriendModal
          name={unfriendTarget.name}
          isProcessing={isProcessing}
          onConfirm={() => {
            void confirmUnfriendAction();
          }}
          onCancel={() => setUnfriendTarget(null)}
        />
      )}
    </div>
  );
}
