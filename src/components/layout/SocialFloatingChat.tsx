'use client';

import {
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Smile,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from '@/libs/I18nNavigation';
import { api, type ApiChatMessage, type ApiConversation } from '@/services/api';

type SocialFloatingChatProps = {
  isOpen: boolean;
  onClose: () => void;
  activeChatUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
};

export const SocialFloatingChat: React.FC<SocialFloatingChatProps> = ({
  isOpen,
  onClose,
  activeChatUser = {
    id: '4e316ef6-263c-41cf-b433-e7f654b0a2da',
    name: 'Nguyễn Thảo Nhi',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  },
}) => {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { isConnected, sendWsMessage } = useNotifications();

  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // 1. Initialize conversation & join room via WebSocket
  useEffect(() => {
    if (!isOpen || !activeChatUser?.id) {
      return;
    }

    let isMounted = true;

    const initConversation = async () => {
      if (!api.getToken() && !isAuthenticated) {
        setError('Vui lòng đăng nhập để bắt đầu trò chuyện.');
        setMessages([]);
        setConversation(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Lấy hoặc tạo phòng chat 1-1 cho 2 user
        const conv = await api.createConversation({
          type: 'DIRECT',
          recipientId: activeChatUser.id,
        });

        if (!isMounted) return;
        setConversation(conv);

        // Tải lịch sử tin nhắn ban đầu
        try {
          const msgsRes = await api.getMessages(conv.id, 50);
          if (isMounted) {
            setMessages(msgsRes.items || []);
            void api.markConversationAsRead(conv.id);
            setTimeout(() => scrollToBottom(false), 80);
          }
        } catch {
          // Empty initial messages
        }

        // Tham gia phòng chat qua WebSocket (joinRoom action)
        sendWsMessage({
          action: 'joinRoom',
          conversationId: conv.id,
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể kết nối cuộc trò chuyện.';
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initConversation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeChatUser?.id, isAuthenticated, scrollToBottom, sendWsMessage]);

  // 2. Tham gia lại phòng khi WebSocket kết nối thành công
  useEffect(() => {
    if (isConnected && conversation?.id) {
      sendWsMessage({
        action: 'joinRoom',
        conversationId: conversation.id,
      });
    }
  }, [isConnected, conversation?.id, sendWsMessage]);

  // 3. Lắng nghe tin nhắn thời gian thực qua WebSocket (ws:chat-message)
  useEffect(() => {
    const handleWsChatMessage = (event: Event) => {
      const customEvent = event as CustomEvent<ApiChatMessage>;
      const newMsg = customEvent.detail;
      if (!newMsg || !newMsg.conversationId) {
        return;
      }

      if (newMsg.conversationId === conversation?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          // Xóa tin nhắn tạm lạc quan nếu nội dung trùng khớp
          const filtered = prev.filter(
            (m) => !(m.id.startsWith('temp-') && m.content === newMsg.content),
          );
          return [...filtered, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    window.addEventListener('ws:chat-message', handleWsChatMessage);
    return () => {
      window.removeEventListener('ws:chat-message', handleWsChatMessage);
    };
  }, [conversation?.id, scrollToBottom]);

  if (!isOpen) {
    return null;
  }

  // 4. Gửi tin nhắn hoàn toàn qua WebSocket (Action: sendMessage)
  const handleSend = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || !conversation || isSending) {
      return;
    }

    if (!isConnected) {
      alert('WebSocket hiện đang mất kết nối. Vui lòng đợi trong giây lát...');
      return;
    }

    setMessageText('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ApiChatMessage = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUser?.id,
      type: 'TEXT',
      content,
      createdAt: new Date().toISOString(),
      sender: currentUser
        ? {
            id: currentUser.id,
            fullName: currentUser.fullName,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
          }
        : undefined,
    };

    // Hiển thị tin nhắn ngay trên giao diện
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(true), 50);

    // Gửi trực tiếp frame WebSocket tới AWS API Gateway WebSocket
    const sent = sendWsMessage({
      action: 'sendMessage',
      conversationId: conversation.id,
      content,
      type: 'TEXT',
    });

    if (!sent) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert('Không thể gửi qua WebSocket. Vui lòng kiểm tra lại kết nối!');
      setMessageText(content);
    }

    setIsSending(false);
  };

  const handleMaximize = () => {
    if (conversation) {
      router.push(`/messages/${conversation.id}`);
    } else {
      router.push('/messages');
    }
    onClose();
  };

  const displayAvatar =
    activeChatUser.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150';

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all sm:w-88 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {/* oxlint-disable-next-line next(no-img-element) */}
            <img
              src={displayAvatar}
              alt={activeChatUser.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-500/50"
            />
            <span
              className={`absolute right-0 bottom-0 h-2 w-2 rounded-full ring-1 ring-white dark:ring-slate-900 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {activeChatUser.name}
            </h4>
            <div className="flex items-center gap-1 text-[10px]">
              {isConnected ? (
                <>
                  <Wifi className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Socket Realtime</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-2.5 w-2.5 text-amber-500" />
                  <span className="text-amber-500 font-medium">Socket đang nối...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            title="Mở toàn màn hình"
            onClick={handleMaximize}
            className="rounded p-1 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            onClick={() => {
              setIsMinimized(!isMinimized);
            }}
            className="rounded p-1 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Đóng chat"
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Chat Body & Input (when not minimized) */}
      {!isMinimized && (
        <>
          <div className="h-72 space-y-2.5 overflow-y-auto p-3 text-xs flex flex-col">
            {isLoading ? (
              <div className="m-auto flex flex-col items-center gap-2 py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <span className="text-xs">Đang tải cuộc hội thoại...</span>
              </div>
            ) : error ? (
              <div className="m-auto rounded-xl bg-rose-50 p-3 text-center text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <p>{error}</p>
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="mt-2 inline-block rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm"
                  >
                    Đăng nhập ngay
                  </button>
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="m-auto text-center text-slate-400 py-6">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40">
                  <Send className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Chưa có tin nhắn nào
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hãy gửi lời chào đầu tiên qua socket đến {activeChatUser.name}!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMyMessage =
                  msg.senderId === currentUser?.id ||
                  msg.userId === currentUser?.id ||
                  (currentUser?.id && msg.sender?.id === currentUser?.id);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMyMessage ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        isMyMessage
                          ? 'rounded-br-xs bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-sm'
                          : 'rounded-bl-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <span className="mt-0.5 px-1 text-[9px] text-slate-400">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 3. Form Send Message */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-1.5 border-t border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              title="Đính kèm ảnh"
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Emoji"
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
            >
              <Smile className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={messageText}
              disabled={isLoading || !conversation}
              onChange={(e) => {
                setMessageText(e.target.value);
              }}
              placeholder={
                isConnected
                  ? 'Nhập tin nhắn (WebSocket)...'
                  : 'Đang kết nối lại socket...'
              }
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || isSending || !conversation || !isConnected}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-sm"
            >
              {isSending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};
