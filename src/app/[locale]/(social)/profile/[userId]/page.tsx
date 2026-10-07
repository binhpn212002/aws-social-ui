'use client';

import { use, useEffect, useState, useTransition } from 'react';
import {
  Award,
  Briefcase,
  Calendar,
  Camera,
  Check,
  Edit3,
  Globe,
  Grid,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Link } from '@/libs/I18nNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, type ApiFriendshipStatus, type ApiPost, type ApiUserProfile } from '@/services/api';

type ProfilePageProps = {
  params: Promise<{ locale: string; userId: string }>;
};

export default function ProfilePage(props: ProfilePageProps) {
  const { userId } = use(props.params);
  const { user: currentUser, refreshUser } = useAuth();

  const isMe =
    userId === 'me' ||
    userId === 'current' ||
    (currentUser !== null && currentUser.id === userId);

  const targetUserId =
    userId === 'me' || userId === 'current'
      ? currentUser?.id || 'me'
      : userId;

  // Data states
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<ApiPost[]>([]);
  const [friendStatus, setFriendStatus] = useState<ApiFriendshipStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab & Action states
  const [activeTab, setActiveTab] = useState<'posts' | 'friends' | 'media' | 'about'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionPending, startTransition] = useTransition();

  const [editForm, setEditForm] = useState({
    name: '',
    headline: '',
    bio: '',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    company: 'Cloud Architect @ AWS Community',
  });

  // Fetch Profile & Data from Backend API
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Load user profile by userId
        const profileData = await api.getUserProfile(targetUserId);
        if (!isMounted) return;

        setProfile(profileData);
        setEditForm({
          name: profileData.fullName,
          headline:
            profileData.role === 'ADMIN'
              ? 'Senior Cloud Solutions Architect & Administrator'
              : 'Backend Cloud Solutions & Full-Stack Engineer',
          bio: profileData.bio || 'Chưa cập nhật tiểu sử.',
          location: 'TP. Hồ Chí Minh, Việt Nam',
          company: 'AWS Cloud Community Partner',
        });

        // 2. Load timeline posts of this user
        try {
          const postsRes = await api.getUserPosts(profileData.id);
          if (isMounted) {
            setUserPosts(postsRes.items || []);
          }
        } catch {
          // Keep empty posts if failed
        }

        // 3. Load friendship status if viewing another user
        if (!isMe && currentUser) {
          try {
            const statusRes = await api.getFriendStatus(profileData.id);
            if (isMounted) {
              setFriendStatus(statusRes);
            }
          } catch {
            // Friend status not found or none
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ.';
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (targetUserId) {
      void loadProfileData();
    }

    return () => {
      isMounted = false;
    };
  }, [targetUserId, isMe, currentUser]);

  // Handle Save Profile updates
  const handleSaveProfile = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      const updated = await api.updateProfile({
        fullName: editForm.name,
        bio: editForm.bio,
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: updated.fullName,
              bio: updated.bio,
            }
          : updated,
      );

      await refreshUser();
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật hồ sơ';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Like on post
  const handleToggleLike = async (postId: string) => {
    // Optimistic update
    setUserPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextLiked = !post.isLiked;
          return {
            ...post,
            isLiked: nextLiked,
            likesCount: nextLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
          };
        }
        return post;
      }),
    );

    try {
      await api.toggleLike(postId);
    } catch {
      // Revert if error
      setUserPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const nextLiked = !post.isLiked;
            return {
              ...post,
              isLiked: nextLiked,
              likesCount: nextLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
            };
          }
          return post;
        }),
      );
    }
  };

  // Friend request actions
  const handleSendFriendRequest = () => {
    if (!profile) return;
    startTransition(async () => {
      try {
        await api.sendFriendRequest(profile.id);
        setFriendStatus((prev) => ({
          targetUserId: profile.id,
          isFriend: false,
          status: 'PENDING_SENT',
          direction: 'outgoing',
          isBlockedByMe: false,
          isBlockedByThem: false,
          ...prev,
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể gửi lời mời kết bạn.';
        alert(msg);
      }
    });
  };

  const handleUnfriend = () => {
    if (!profile) return;
    if (!confirm(`Bạn có chắc muốn hủy kết bạn với ${profile.fullName}?`)) return;

    startTransition(async () => {
      try {
        await api.unfriend(profile.id);
        setFriendStatus((prev) => ({
          targetUserId: profile.id,
          isFriend: false,
          status: 'NONE',
          direction: 'none',
          isBlockedByMe: false,
          isBlockedByThem: false,
          ...prev,
        }));
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  friends: Math.max(0, prev.stats.friends - 1),
                },
              }
            : null,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể hủy kết bạn.';
        alert(msg);
      }
    });
  };

  const handleStartChat = () => {
    if (!profile) return;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-quick-chat', {
          detail: {
            id: profile.id,
            name: profile.fullName,
            avatar: profile.avatarUrl || avatarUrl,
          },
        }),
      );
    }
  };

  // Extract media items from posts or fallback
  const mediaGallery = userPosts
    .flatMap((p) =>
      (p.media || []).map((m) => ({
        id: m.id,
        url: m.mediaUrl,
        title: p.content.slice(0, 40) || 'Ảnh bài viết',
      })),
    );

  const displayMedia =
    mediaGallery.length > 0
      ? mediaGallery
      : [
          {
            id: 'm1',
            url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
            title: 'AWS Cloud Architecture',
          },
          {
            id: 'm2',
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600',
            title: 'System Metrics Dashboard',
          },
          {
            id: 'm3',
            url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
            title: 'Security Matrix & Audit Logs',
          },
          {
            id: 'm4',
            url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
            title: 'Microservices Deployment',
          },
        ];

  // Helper date formatter
  const formattedJoinedDate = profile?.createdAt
    ? `Tham gia từ ${new Date(profile.createdAt).toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric',
      })}`
    : 'Tham gia từ 2024';

  const avatarUrl =
    profile?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';

  const coverUrl =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop';

  // SKELETON LOADING STATE
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 shadow-sm">
          <div className="h-52 sm:h-64 w-full bg-slate-200 dark:bg-slate-800" />
          <div className="relative px-4 pb-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
              <div className="flex gap-2 pt-2 sm:pt-0">
                <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-12 w-full max-w-xl rounded-lg bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
        </div>
        <div className="h-14 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  // ERROR STATE
  if (error || !profile) {
    return (
      <div className="rounded-3xl border border-rose-200/80 bg-rose-50/50 p-8 text-center backdrop-blur-md dark:border-rose-900/40 dark:bg-rose-950/20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
          <Users className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          Không tìm thấy trang cá nhân
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {error || 'Người dùng này không tồn tại hoặc đã bị gỡ khỏi hệ thống.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/feed"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Quay về Bảng tin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. PROFILE HEADER CARD */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900">
        {/* Cover Photo */}
        <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-slate-900">
          {/* oxlint-disable-next-line next(no-img-element) */}
          <img
            src={coverUrl}
            alt="Cover banner"
            className="h-full w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          {/* Change Cover Button (for owner) */}
          {isMe && (
            <button
              type="button"
              className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-xl bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-slate-900/80"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Chỉnh sửa ảnh bìa</span>
            </button>
          )}

          {/* Pro Cloud Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-indigo-600/80 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {profile.role === 'ADMIN'
                ? 'AWS Community Builder & Admin'
                : 'AWS Cloud Member'}
            </span>
          </div>
        </div>

        {/* Profile Info & Avatar Row */}
        <div className="relative px-4 pb-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar with Ring */}
            <div className="relative inline-block">
              {/* oxlint-disable-next-line next(no-img-element) */}
              <img
                src={avatarUrl}
                alt={profile.fullName}
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-cover ring-4 ring-white shadow-xl dark:ring-slate-900"
              />
              <span className="absolute right-1 bottom-1 h-5 w-5 rounded-full bg-emerald-500 ring-3 ring-white dark:ring-slate-900" />

              {isMe && (
                <button
                  type="button"
                  title="Thay đổi ảnh đại diện"
                  className="absolute right-0 bottom-0 rounded-full bg-slate-900 p-2 text-white shadow-md hover:bg-indigo-600 transition"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {isMe ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({
                        name: profile.fullName,
                        headline: editForm.headline,
                        bio: profile.bio || '',
                        location: editForm.location,
                        company: editForm.company,
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition hover:opacity-90 active:scale-95"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>

                  <Link
                    href="/settings/audit-logs"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Nhật ký bảo mật</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Friend Status Action Button */}
                  {friendStatus?.status === 'FRIENDS' ? (
                    <button
                      type="button"
                      onClick={handleUnfriend}
                      disabled={isActionPending}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 transition"
                      title="Click để hủy kết bạn"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Bạn bè</span>
                    </button>
                  ) : friendStatus?.status === 'PENDING_SENT' ? (
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs sm:text-sm font-bold text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                    >
                      <Check className="h-4 w-4" />
                      <span>Đã gửi lời mời</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendFriendRequest}
                      disabled={isActionPending}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 shadow-sm transition disabled:opacity-60"
                    >
                      {isActionPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      <span>Thêm bạn bè</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStartChat}
                    disabled={isActionPending}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Nhắn tin</span>
                  </button>
                </>
              )}

              <button
                type="button"
                title="Tùy chọn khác"
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* User Details */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {profile.fullName}
              </h1>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm"
                title="Tài khoản đã xác minh"
              >
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              <span className="text-sm text-slate-400">@{profile.username}</span>
            </div>

            <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {editForm.headline}
            </p>

            <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed dark:text-slate-300 max-w-2xl">
              {profile.bio || 'Chưa cập nhật tiểu sử giới thiệu bản thân.'}
            </p>

            {/* Badges / Meta Info */}
            <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-indigo-500" />
                <span>{editForm.company}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span>{editForm.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-sky-500" />
                <a
                  href={`https://github.com/${profile.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline dark:text-indigo-400 font-medium"
                >
                  github.com/{profile.username}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{formattedJoinedDate}</span>
              </div>
            </div>

            {/* Stats Counter Bar */}
            <div className="mt-6 flex items-center divide-x divide-slate-100 border-t border-slate-100 pt-4 dark:divide-slate-800 dark:border-slate-800">
              <div className="pr-5 sm:pr-8 text-center sm:text-left">
                <span className="block text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {profile.stats?.posts ?? userPosts.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">Bài viết</span>
              </div>
              <div className="px-5 sm:px-8 text-center sm:text-left">
                <span className="block text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {(profile.stats?.friends ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium">Bạn bè</span>
              </div>
              <div className="px-5 sm:px-8 text-center sm:text-left">
                <span className="block text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {(profile.stats?.likes ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium">Lượt thích</span>
              </div>
              <div className="pl-5 sm:pl-8 text-center sm:text-left">
                <span className="block text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {profile.stats?.media ?? displayMedia.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">Ảnh / Media</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROFILE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white/70 px-4 py-2 rounded-2xl shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
        <button
          type="button"
          onClick={() => {
            setActiveTab('posts');
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
            activeTab === 'posts'
              ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>Bài viết ({profile.stats?.posts ?? userPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('friends');
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
            activeTab === 'friends'
              ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Bạn bè ({(profile.stats?.friends ?? 0).toLocaleString()})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('media');
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
            activeTab === 'media'
              ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Bộ sưu tập ({profile.stats?.media ?? displayMedia.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('about');
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
            activeTab === 'about'
              ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Giới thiệu & Kỹ năng</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: POSTS & TIMELINE */}
      {activeTab === 'posts' && (
        <div className="space-y-5">
          {userPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40">
              <Grid className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                Chưa có bài viết nào
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isMe
                  ? 'Hãy chia sẻ cập nhật kiến trúc hoặc thông tin mới nhất lên bảng tin!'
                  : `${profile.fullName} chưa đăng bài viết nào gần đây.`}
              </p>
            </div>
          ) : (
            userPosts.map((post) => {
              const firstMedia = post.media?.[0]?.mediaUrl;
              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/80"
                >
                  {/* Author & Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* oxlint-disable-next-line next(no-img-element) */}
                      <img
                        src={post.author?.avatarUrl || avatarUrl}
                        alt={post.author?.fullName || profile.fullName}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {post.author?.fullName || profile.fullName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>
                            {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
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
                      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <p className="mt-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed dark:text-slate-200 whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Media Image */}
                  {firstMedia && (
                    <div className="mt-3.5 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                      {/* oxlint-disable-next-line next(no-img-element) */}
                      <img
                        src={firstMedia}
                        alt="Post visual"
                        className="h-72 w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        void handleToggleLike(post.id);
                      }}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.isLiked
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'hover:text-rose-600'
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          post.isLiked ? 'fill-current text-rose-600' : ''
                        }`}
                      />
                      <span>{post.likesCount}</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.commentsCount} bình luận</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Chia sẻ</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: FRIENDS GRID */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              id: '1',
              name: 'Alex Johnson',
              role: 'Senior Cloud Solutions Architect',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
              mutualFriends: 18,
              isOnline: true,
            },
            {
              id: '2',
              name: 'Nguyễn Thảo Nhi',
              role: 'DevOps Engineer @ AWS',
              avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
              mutualFriends: 12,
              isOnline: true,
            },
            {
              id: '3',
              name: 'Trần Quang Huy',
              role: 'Solutions Architect',
              avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
              mutualFriends: 24,
              isOnline: false,
            },
            {
              id: '4',
              name: 'Lê Mai Hương',
              role: 'UI/UX Product Designer',
              avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
              mutualFriends: 8,
              isOnline: false,
            },
          ].map((friend) => (
            <div
              key={friend.id}
              className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {/* oxlint-disable-next-line next(no-img-element) */}
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                  />
                  {friend.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {friend.name}
                  </h4>
                  <p className="text-xs text-slate-500">{friend.role}</p>
                  <span className="text-[11px] text-slate-400">
                    {friend.mutualFriends} bạn chung
                  </span>
                </div>
              </div>

              <button
                type="button"
                title="Nhắn tin nhanh"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('open-quick-chat', {
                        detail: {
                          id: friend.id,
                          name: friend.name,
                          avatar: friend.avatar,
                        },
                      }),
                    );
                  }
                }}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MEDIA GALLERY */}
      {activeTab === 'media' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {displayMedia.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            >
              {/* oxlint-disable-next-line next(no-img-element) */}
              <img
                src={item.url}
                alt={item.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-3">
                <span className="text-xs font-semibold text-white">
                  {item.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ABOUT & SKILLS */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Tech Stack & Skills */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Kỹ năng & Công nghệ chính
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Amazon Web Services (AWS)',
                'DynamoDB Global Tables',
                'AWS Lambda Serverless',
                'EventBridge Scheduler',
                'Amazon S3 & CloudFront',
                'Next.js 16 (App Router)',
                'TypeScript & Node.js',
                'NestJS Microservices',
                'Docker & Terraform',
                'PostgreSQL',
                'Tailwind CSS v4',
              ].map((skill) => (
                <span
                  key={skill}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Chứng chỉ chuyên môn
            </h3>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 font-bold text-xs">
                  AWS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    AWS Certified Solutions Architect – Professional (SAP-C02)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Amazon Web Services · Đạt chứng chỉ 2024
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-400 font-bold text-xs">
                  AWS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    AWS Certified DevOps Engineer – Professional (DOP-C02)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Amazon Web Services · Đạt chứng chỉ 2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chỉnh sửa thông tin cá nhân
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm({ ...editForm, name: e.target.value });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chức danh / Headline
                </label>
                <input
                  type="text"
                  value={editForm.headline}
                  onChange={(e) => {
                    setEditForm({ ...editForm, headline: e.target.value });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tiểu sử (Bio)
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => {
                    setEditForm({ ...editForm, bio: e.target.value });
                  }}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => {
                      setEditForm({ ...editForm, location: e.target.value });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nơi làm việc
                  </label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => {
                      setEditForm({ ...editForm, company: e.target.value });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
