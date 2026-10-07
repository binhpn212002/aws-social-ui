'use client';

import {
  Check,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Link } from '@/libs/I18nNavigation';
import { api } from '@/services/api';
import type { ApiChatMessage, ApiConversation, ApiFriend, ApiPostAuthor } from '@/services/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

function formatMessageTime(isoString?: string): string {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getConversationDisplay(
  conv: ApiConversation,
  currentUserId?: string,
): { name: string; avatar: string; isOnline: boolean } {
  if (conv.type === 'GROUP') {
    return {
      name: conv.name || 'Nhóm trò chuyện',
      avatar: conv.avatarUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      isOnline: true,
    };
  }

  const otherMember = conv.members.find((m) => m.id !== currentUserId) || conv.members[0];
  return {
    name: otherMember?.fullName || conv.name || 'Người dùng',
    avatar: otherMember?.avatarUrl || conv.avatarUrl || DEFAULT_AVATAR,
    isOnline: otherMember?.status === 'ACTIVE',
  };
}

function getSubtitleText(conv: ApiConversation, isOnline: boolean): string {
  if (conv.type === 'GROUP') {
    return `${conv.members.length} thành viên`;
  }
  if (isOnline) {
    return 'Đang hoạt động';
  }
  return 'Ngoại tuyến';
}

type ConversationItemProps = {
  conv: ApiConversation;
  isActive: boolean;
  currentUserId?: string;
  onSelect: (id: string) => void;
};

function ConversationItem({
  conv,
  isActive,
  currentUserId,
  onSelect,
}: ConversationItemProps) {
  const display = useMemo(
    () => getConversationDisplay(conv, currentUserId),
    [conv, currentUserId],
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(conv.id)}
      className={`flex w-full cursor-pointer items-center gap-3 p-3.5 text-left transition ${isActive
          ? 'bg-indigo-50/80 dark:bg-indigo-950/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
    >
      <div className="relative shrink-0">
        <Image
          src={display.avatar}
          alt={display.name}
          width={44}
          height={44}
          unoptimized
          className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
        />
        {conv.type === 'GROUP' ? (
          <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white shadow ring-2 ring-white dark:ring-slate-900">
            <Users className="h-2.5 w-2.5" />
          </span>
        ) : (
          display.isOnline && (
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          )
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
            {display.name}
          </h4>
          <span className="shrink-0 text-[10px] text-slate-400">
            {formatMessageTime(conv.lastMessage?.createdAt || conv.updatedAt || conv.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
          {conv.lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white shadow">
          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
        </span>
      )}
    </button>
  );
}

type MessageBubbleProps = {
  message: ApiChatMessage;
  isMe: boolean;
};

function MessageBubble({ message, isMe }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="flex items-end gap-2">
        {!isMe && (
          <Image
            src={message.sender?.avatarUrl || DEFAULT_AVATAR}
            alt={message.sender?.fullName || 'User'}
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 rounded-full object-cover shadow-sm"
          />
        )}
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-2.5 sm:max-w-md ${isMe
              ? 'rounded-br-xs bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-500/10'
              : 'rounded-bl-xs border border-slate-200/60 bg-white text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100'
            }`}
        >
          {!isMe && message.sender?.fullName && (
            <p className="mb-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {message.sender.fullName}
            </p>
          )}
          <p className="text-xs leading-relaxed break-words">{message.content}</p>
        </div>
      </div>
      <span className="mt-1 px-1 text-[10px] text-slate-400">
        {formatMessageTime(message.createdAt)}
      </span>
    </div>
  );
}

export default function MessagesPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isConnected, sendWsMessage } = useNotifications();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Trạng thái Modal Tạo cuộc trò chuyện mới
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [chatType, setChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [friendsList, setFriendsList] = useState<ApiFriend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const fetchFriends = useCallback(async () => {
    try {
      setIsLoadingFriends(true);
      const res = await api.getFriends('', 1, 50);
      setFriendsList(res.items || []);
    } catch (err) {
      console.warn('Lỗi lấy danh sách bạn bè:', err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  const handleOpenNewChatModal = () => {
    setIsNewChatModalOpen(true);
    fetchFriends();
  };

  const handleCreateDirectChat = async (friendId: string) => {
    try {
      setIsCreatingChat(true);
      const newConv = await api.createConversation({
        type: 'DIRECT',
        recipientId: friendId,
      });

      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) {
          return prev;
        }
        return [newConv, ...prev];
      });

      setActiveConversationId(newConv.id);
      setIsNewChatModalOpen(false);

      sendWsMessage({
        action: 'joinRoom',
        conversationId: newConv.id,
      });
    } catch (err: any) {
      console.error('Lỗi tạo hội thoại:', err);
      alert(err?.message || 'Không thể tạo cuộc hội thoại');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleCreateGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberIds.length === 0) {
      return;
    }

    try {
      setIsCreatingChat(true);
      const newConv = await api.createConversation({
        type: 'GROUP',
        name: groupName.trim(),
        memberIds: selectedMemberIds,
      });

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setIsNewChatModalOpen(false);
      setGroupName('');
      setSelectedMemberIds([]);

      sendWsMessage({
        action: 'joinRoom',
        conversationId: newConv.id,
      });
    } catch (err: any) {
      console.error('Lỗi tạo nhóm chat:', err);
      alert(err?.message || 'Không thể tạo nhóm chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const toggleSelectFriend = (friendId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) {
      return friendsList;
    }
    const q = friendSearch.toLowerCase();
    return friendsList.filter(
      (f) =>
        f.fullName.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q),
    );
  }, [friendsList, friendSearch]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // 1. Tải danh sách cuộc hội thoại từ Database (GET /chat/conversations)
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      setIsLoadingConversations(true);
      const res = await api.getConversations();
      const list = res.items || [];
      setConversations(list);

      setActiveConversationId((prev) => {
        if (prev && list.some((c) => c.id === prev)) {
          return prev;
        }
        return list[0]?.id || null;
      });
    } catch (error) {
      console.warn('Lỗi tải danh sách hội thoại từ DB:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    (async () => {
      try {
        await fetchConversations();
      } catch (error) {
        console.warn('fetchConversations error:', error);
      }
    })();
  }, [fetchConversations]);

  // 2. Tải lịch sử tin nhắn khi activeConversationId thay đổi (GET /chat/conversations/:id/messages)
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await api.getMessages(conversationId, 50);
      const sortedMessages = [...(res.items || [])].toReversed();
      setMessages(sortedMessages);

      try {
        await api.markConversationAsRead(conversationId);
      } catch (error) {
        console.warn('markConversationAsRead error:', error);
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (error) {
      console.warn('Lỗi tải lịch sử tin nhắn từ DB:', error);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [scrollToBottom]);

  // Xử lý khi người dùng click chọn cuộc trò chuyện: cập nhật state và joinRoom qua WebSocket
  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      sendWsMessage({
        action: 'joinRoom',
        conversationId: id,
      });
    },
    [sendWsMessage],
  );

  // Tham gia phòng chat WebSocket & tải tin nhắn
  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    sendWsMessage({
      action: 'joinRoom',
      conversationId: activeConversationId,
    });

    (async () => {
      try {
        await fetchMessages(activeConversationId);
      } catch (error) {
        console.warn('fetchMessages error:', error);
      }
    })();
  }, [activeConversationId, fetchMessages, sendWsMessage]);

  // Lắng nghe sự kiện tin nhắn thời gian thực (ws:chat-message) từ WebSocket
  useEffect(() => {
    const handleWsChatMessage = (event: Event) => {
      const customEvent = event as CustomEvent<ApiChatMessage>;
      const newMsg = customEvent.detail;
      if (!newMsg || !newMsg.conversationId) {
        return;
      }

      // Nếu đang mở đúng cuộc trò chuyện, append tin nhắn vào cửa sổ chat
      if (newMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }

      // Cập nhật danh sách cuộc hội thoại: tin nhắn mới nhất và thời gian
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: {
                id: newMsg.id,
                content: newMsg.content,
                type: newMsg.type,
                createdAt: newMsg.createdAt,
                sender: (newMsg.sender || {
                  id: newMsg.userId || '',
                  fullName: 'Người dùng',
                  username: 'user',
                  avatarUrl: null,
                }) as ApiPostAuthor,
              },
              updatedAt: newMsg.createdAt,
              unreadCount:
                c.id === activeConversationId
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        }),
      );
    };

    window.addEventListener('ws:chat-message', handleWsChatMessage);
    return () => {
      window.removeEventListener('ws:chat-message', handleWsChatMessage);
    };
  }, [activeConversationId, scrollToBottom]);

  const handleRefreshConversations = async () => {
    try {
      await fetchConversations();
    } catch (error) {
      console.warn('Refresh conversations error:', error);
    }
  };

  // 3. Gửi tin nhắn mới: Gọi WebSocket để Lambda Function lưu DynamoDB & tạo thông báo
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || !activeConversationId || isSending) {
      return;
    }

    try {
      setIsSending(true);
      setInputText('');

      // Gửi frame WebSocket sendMessage tới AWS API Gateway WebSocket
      let sentViaWs = false;
      if (isConnected) {
        sentViaWs = sendWsMessage({
          action: 'sendMessage',
          conversationId: activeConversationId,
          content,
          type: 'TEXT',
        });
      }

      // Fallback REST API nếu WebSocket tạm thời mất kết nối
      if (!sentViaWs) {
        const createdMessage = await api.sendMessage(activeConversationId, content);
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMessage.id)) {
            return prev;
          }
          return [...prev, createdMessage];
        });
        setTimeout(() => scrollToBottom(true), 50);

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversationId) {
              return {
                ...c,
                lastMessage: {
                  id: createdMessage.id,
                  content: createdMessage.content,
                  type: createdMessage.type,
                  createdAt: createdMessage.createdAt,
                  sender: (createdMessage.sender || user) as ApiPostAuthor,
                },
                updatedAt: createdMessage.createdAt,
              };
            }
            return c;
          }),
        );
      }
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
    } finally {
      setIsSending(false);
    }
  };

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  const activeDisplay = useMemo(
    () => (activeConversation ? getConversationDisplay(activeConversation, user?.id) : null),
    [activeConversation, user?.id],
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const display = getConversationDisplay(c, user?.id);
      return (
        display.name.toLowerCase().includes(q) ||
        (c.lastMessage?.content || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, user?.id]);

  const renderConversationList = () => {
    if (isLoadingConversations && conversations.length === 0) {
      return (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      );
    }
    if (filteredConversations.length === 0) {
      return (
        <div className="py-12 text-center text-xs text-slate-400">
          Không tìm thấy cuộc hội thoại nào
        </div>
      );
    }
    return filteredConversations.map((conv) => (
      <ConversationItem
        key={conv.id}
        conv={conv}
        isActive={activeConversationId === conv.id}
        currentUserId={user?.id}
        onSelect={handleSelectConversation}
      />
    ));
  };

  const renderMessagesContent = () => {
    if (isLoadingMessages && messages.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      );
    }
    if (messages.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
          <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-xs">Chưa có tin nhắn nào trong hội thoại này</p>
          <p className="text-[11px] text-slate-400">Hãy gửi tin nhắn đầu tiên để kết nối!</p>
        </div>
      );
    }
    return messages.map((m) => (
      <MessageBubble
        key={m.id}
        message={m}
        isMe={m.sender?.id === user?.id || m.senderId === user?.id}
      />
    ));
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          Đăng nhập để xem tin nhắn
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Bạn cần đăng nhập để trò chuyện thời gian thực và đồng bộ lịch sử tin nhắn từ database.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" /> Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[750px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md md:flex-row dark:border-slate-800/80 dark:bg-slate-900/80">
      {/* Cột danh sách hội thoại */}
      <div className="flex w-full flex-col border-r border-slate-100 md:w-80 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <MessageSquareText className="h-5 w-5 text-indigo-600" />
            Hội thoại ({conversations.length})
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenNewChatModal}
              title="Tạo cuộc trò chuyện mới"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-sm transition hover:opacity-90 active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRefreshConversations}
              title="Làm mới danh sách"
              className="rounded-full bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tìm kiếm */}
        <div className="border-b border-slate-100 p-3 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm hội thoại..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Danh sách */}
        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/60">
          {renderConversationList()}
        </div>
      </div>

      {/* Cửa sổ chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        {activeConversation && activeDisplay ? (
          <>
            {/* Header phòng chat */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={activeDisplay.avatar}
                    alt={activeDisplay.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/40"
                  />
                  {activeDisplay.isOnline && (
                    <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeDisplay.name}
                    </h3>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Realtime
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {getSubtitleText(activeConversation, activeDisplay.isOnline)}
                  </p>
                </div>
              </div>
            </div>

            {/* Vùng tin nhắn */}
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
              {renderMessagesContent()}
              <div ref={messagesEndRef} />
            </div>

            {/* Khung nhập tin nhắn */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
            >
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đính kèm ảnh"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Chọn biểu cảm"
              >
                <Smile className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập tin nhắn của bạn..."
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                aria-label="Gửi tin nhắn"
                className="rounded-full bg-indigo-600 p-2 text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquareText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Chọn một cuộc hội thoại
            </p>
            <p className="text-xs text-slate-400">
              Chọn từ danh sách bên trái để bắt đầu nhắn tin thời gian thực.
            </p>
          </div>
        )}
      </div>

      {/* Modal Tạo cuộc trò chuyện mới */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tạo cuộc trò chuyện mới
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setChatType('DIRECT')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  chatType === 'DIRECT'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Nhắn tin 1-1
              </button>
              <button
                type="button"
                onClick={() => setChatType('GROUP')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  chatType === 'GROUP'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Tạo nhóm chat
              </button>
            </div>

            {chatType === 'DIRECT' ? (
              /* TAB DIRECT CHAT */
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Tìm kiếm bạn bè..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                  {isLoadingFriends ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Không tìm thấy bạn bè nào.
                    </div>
                  ) : (
                    filteredFriends.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        disabled={isCreatingChat}
                        onClick={() => handleCreateDirectChat(f.id)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40"
                      >
                        <Image
                          src={f.avatarUrl || DEFAULT_AVATAR}
                          alt={f.fullName}
                          width={38}
                          height={38}
                          unoptimized
                          className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {f.fullName}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            @{f.username}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* TAB GROUP CHAT */
              <form onSubmit={handleCreateGroupChat} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên nhóm chat
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="VD: Nhóm Dự Án AWS..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Chọn thành viên
                    </label>
                    <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      Đã chọn ({selectedMemberIds.length})
                    </span>
                  </div>

                  <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                    {isLoadingFriends ? (
                      <div className="flex h-24 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                      </div>
                    ) : filteredFriends.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Chưa có bạn bè để thêm vào nhóm.
                      </div>
                    ) : (
                      filteredFriends.map((f) => {
                        const isSelected = selectedMemberIds.includes(f.id);
                        return (
                          <div
                            key={f.id}
                            onClick={() => toggleSelectFriend(f.id)}
                            className={`flex cursor-pointer items-center justify-between rounded-xl p-2 transition ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/50'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Image
                                src={f.avatarUrl || DEFAULT_AVATAR}
                                alt={f.fullName}
                                width={32}
                                height={32}
                                unoptimized
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {f.fullName}
                                </p>
                                <p className="text-[10px] text-slate-400">@{f.username}</p>
                              </div>
                            </div>
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded-md border text-[10px] ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewChatModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!groupName.trim() || selectedMemberIds.length === 0 || isCreatingChat}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {isCreatingChat && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Tạo nhóm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
