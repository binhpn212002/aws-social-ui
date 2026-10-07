'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { ApiNotificationItem } from '@/services/api';

type NotificationContextType = {
  isConnected: boolean;
  notifications: ApiNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  latestNotification: ApiNotificationItem | null;
  clearLatestNotification: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendWsMessage: (message: Record<string, unknown>) => boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const handleWebSocketError = (errorEvent: Event) => {
  console.warn('[WebSocket Error]:', errorEvent);
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [latestNotification, setLatestNotification] =
    useState<ApiNotificationItem | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const clearLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.getNotifications(1, 30);
      setNotifications(res.items || []);
      setUnreadCount(res.meta?.unreadCount ?? 0);
    } catch (error) {
      console.warn('Lỗi tải danh sách thông báo:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', error);
    }
  }, []);

  const sendWsMessage = useCallback((message: Record<string, unknown>): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Kết nối WebSocket Realtime tới AWS API Gateway WebSocket
  useEffect(() => {
    isUnmountedRef.current = false;

    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    (async () => {
      try {
        await refreshNotifications();
      } catch (error) {
        console.warn('refreshNotifications failed:', error);
      }
    })();

    let wsBaseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      'wss://g23j082869.execute-api.ap-southeast-1.amazonaws.com/$default';

    if (wsBaseUrl.includes('execute-api') && !wsBaseUrl.includes('$default')) {
      wsBaseUrl = `${wsBaseUrl.replace(/\/+$/u, '')}/$default`;
    }

    let backoffDelay = 1000;

    const connectWs = () => {
      if (isUnmountedRef.current || !token) {
        return;
      }

      try {
        const fullWsUrl = `${wsBaseUrl}?token=${encodeURIComponent(token)}`;
        console.log('[WebSocket Connecting] to AWS WebSocket Gateway...');
        const ws = new WebSocket(fullWsUrl);
        wsRef.current = ws;

        const onOpen = () => {
          if (isUnmountedRef.current) {
            ws.close();
            return;
          }
          console.log('[WebSocket Connected] AWS Notification Gateway ready!');
          setIsConnected(true);
          backoffDelay = 1000;

          // Heartbeat keep-alive ping mỗi 30 giây
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ action: 'ping' }));
            }
          }, 30_000);
        };

        const onMessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data as string) as Record<string, unknown>;

            // Bỏ qua heartbeat pong
            if (data.action === 'pong') {
              return;
            }

            // Phát sự kiện chung qua Window Event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ws:message', { detail: data }));
            }

            // Phát sự kiện tin nhắn mới (message:new) cho màn hình chat
            if (data.event === 'message:new' || data.type === 'message:new') {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('ws:chat-message', {
                    detail: data.data || data,
                  }),
                );
              }
            }

            // Xử lý sự kiện nhận thông báo thời gian thực từ AWS Lambda SQS Worker
            if (data.event === 'NOTIFICATION_RECEIVED' || data.type === 'notification') {
              const notifData = (data.data || data) as Partial<ApiNotificationItem>;
              const newItem: ApiNotificationItem = {
                id: notifData.id || `ws-${Date.now()}`,
                type: notifData.type || 'INTERACTION',
                title: notifData.title || 'Thông báo mới',
                message: notifData.message || '',
                status: 'COMPLETED',
                sender: notifData.sender || null,
                referenceId: notifData.referenceId,
                referenceType: notifData.referenceType,
                isRead: false,
                createdAt: notifData.createdAt || new Date().toISOString(),
              };

              setNotifications((prev) => [newItem, ...prev]);
              setUnreadCount((prev) => prev + 1);
              setLatestNotification(newItem);
            }
          } catch (error) {
            console.warn('[WebSocket Payload Parse Error]:', error);
          }
        };

        const onClose = (event: CloseEvent) => {
          setIsConnected(false);
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          if (!isUnmountedRef.current && isAuthenticated) {
            console.warn(
              `[WebSocket Closed] Code ${event.code}. Tự động kết nối lại sau ${backoffDelay}ms...`,
            );
            reconnectTimeoutRef.current = setTimeout(() => {
              backoffDelay = Math.min(backoffDelay * 1.5, 15_000);
              connectWs();
            }, backoffDelay);
          }
        };

        ws.addEventListener('open', onOpen);
        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
        ws.addEventListener('error', handleWebSocketError);
      } catch (error) {
        console.error('[WebSocket Init Error]:', error);
      }
    };

    connectWs();

    return () => {
      isUnmountedRef.current = true;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token, refreshNotifications]);

  const value = useMemo(
    () => ({
      isConnected,
      notifications,
      unreadCount,
      isLoading,
      latestNotification,
      clearLatestNotification,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
      sendWsMessage,
    }),
    [
      isConnected,
      notifications,
      unreadCount,
      isLoading,
      latestNotification,
      clearLatestNotification,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
      sendWsMessage,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast Notification Banner thời gian thực */}
      {latestNotification && (
        <div className="fixed right-6 bottom-6 z-50 flex max-w-sm animate-bounce-in items-start gap-3 rounded-2xl border border-indigo-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all dark:border-indigo-800/80 dark:bg-slate-900/95">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/30">
            🔔
          </div>
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {latestNotification.title}
            </h4>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              {latestNotification.message}
            </p>
          </div>
          <button
            type="button"
            onClick={clearLatestNotification}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications phải được sử dụng bên trong NotificationProvider');
  }
  return context;
};
