'use client';

import {
  Bookmark,
  CheckCircle2,
  Globe,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Share2,
  Smile,
  Sparkles,
  Users,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { ApiPost } from '@/services/api';

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) {
      return 'Vừa xong';
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }
    return date.toLocaleDateString('vi-VN');
  } catch {
    return dateString;
  }
}

type QuickPostBoxProps = {
  text: string;
  onChangeText: (text: string) => void;
  onSubmit: (e: React.SyntheticEvent) => void;
  isSubmitting: boolean;
};

function QuickPostBox({ text, onChangeText, onSubmit, isSubmitting }: QuickPostBoxProps) {
  const { user } = useAuth();
  const avatarUrl =
    user?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  const placeholder = user
    ? `${user.fullName || user.username} ơi, bạn đang nghĩ gì thế? Hãy chia sẻ với cộng đồng...`
    : 'Bạn đang có ý tưởng gì mới hôm nay? Hãy chia sẻ với cộng đồng...';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/80">
      <form onSubmit={onSubmit}>
        <div className="flex items-center gap-3">
          <Image
            src={avatarUrl}
            alt={user?.fullName || 'Avatar'}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Ảnh/Video</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Phát trực tiếp</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <Smile className="h-4 w-4" />
              <span className="hidden sm:inline">Cảm xúc</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
          >
            {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>{isSubmitting ? 'Đang đăng...' : 'Đăng ngay'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

type PostCardProps = {
  post: ApiPost;
  onToggleLike: (postId: string) => void;
};

function PostCard({ post, onToggleLike }: PostCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md sm:p-5 dark:border-slate-800/80 dark:bg-slate-900/80">
      {/* Post Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={post.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={post.author.fullName}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="cursor-pointer text-sm font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
                {post.author.fullName}
              </h4>
              <span className="text-xs text-slate-400">· @{post.author.username}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>{formatTimeAgo(post.createdAt)}</span>
              <span>•</span>
              {post.privacy === 'PUBLIC' ? (
                <span className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400">
                  <Globe className="h-3 w-3" /> Công khai
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-3 w-3" /> Bạn bè
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Post Content */}
      <p className="mt-3.5 text-xs leading-relaxed text-slate-800 sm:text-sm dark:text-slate-200">
        {post.content}
      </p>

      {/* Post Media (if any) */}
      {post.media && post.media.length > 0 && post.media[0]?.mediaUrl && (
        <div className="mt-3.5 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
          <Image
            src={post.media[0].mediaUrl}
            alt="Post visual"
            width={700}
            height={400}
            unoptimized
            className="h-72 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      )}

      {/* Action Bar: Like, Comment, Share, Bookmark */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          className={`flex items-center gap-1.5 transition-colors ${
            post.isLiked
              ? 'text-rose-600 dark:text-rose-400'
              : 'hover:text-rose-600 dark:hover:text-rose-400'
          }`}
        >
          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current text-rose-600' : ''}`} />
          <span>{post.likesCount}</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount} bình luận</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
        >
          <Share2 className="h-4 w-4" />
          <span>Chia sẻ</span>
        </button>

        <button
          type="button"
          className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const [quickPostText, setQuickPostText] = useState('');
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch real posts from backend API without requiring login
  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNewsFeed(20);
      setPosts(data.items ?? []);
    } catch (error: unknown) {
      console.error('Fetch feed error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setStatusMessage({ type: 'error', message: `Không thể tải bảng tin: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchFeed();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleLike = async (postId: string) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      }),
    );

    try {
      const res = await api.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: res.liked, likesCount: res.likesCount }
            : p,
        ),
      );
    } catch (error: unknown) {
      console.error('Like error:', error);
      void fetchFeed();
    }
  };

  const handleCreatePost = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!quickPostText.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await api.createPost(quickPostText, 'PUBLIC');
      setPosts((prev) => [newPost, ...prev]);
      setQuickPostText('');
      setStatusMessage({ type: 'success', message: 'Đăng bài viết thành công!' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setStatusMessage({ type: 'error', message: `Lỗi tạo bài viết: ${msg}` });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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

      {/* 1. Quick Status / Create Post Box */}
      <QuickPostBox
        text={quickPostText}
        onChangeText={setQuickPostText}
        onSubmit={(e) => {
          void handleCreatePost(e);
        }}
        isSubmitting={isSubmitting}
      />

      {/* Feed Status Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Bảng tin thời gian thực ({posts.length} bài viết)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            void fetchFeed();
          }}
          disabled={isLoading}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && posts.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-slate-200/80 bg-white/60 p-5 dark:border-slate-800/80 dark:bg-slate-900/60"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-sm font-semibold">Chưa có bài viết nào trên bảng tin.</p>
          <p className="mt-1 text-xs">Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!</p>
        </div>
      )}

      {/* 2. Feed Posts List from API */}
      <div className="space-y-5">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={(id) => {
              void handleToggleLike(id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
