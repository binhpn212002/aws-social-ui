const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export type ApiPostAuthor = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role?: string;
  status?: string;
};

export type ApiPost = {
  id: string;
  content: string;
  privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  author: ApiPostAuthor;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  media?: {
    id: string;
    mediaUrl: string;
    mediaType: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type ApiFriend = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  friendshipId: string;
  friendshipSince: string;
};

export type ApiFriendRequest = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  requester?: ApiPostAuthor;
  addressee?: ApiPostAuthor;
  createdAt: string;
  updatedAt: string;
};

export type ApiUserProfile = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  status: string;
  createdAt: string;
  stats: {
    posts: number;
    friends: number;
    likes: number;
    media: number;
  };
};

export type ApiFriendshipStatus = {
  targetUserId: string;
  isFriend: boolean;
  status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' | 'BLOCKED';
  direction: 'none' | 'outgoing' | 'incoming';
  isBlockedByMe: boolean;
  isBlockedByThem: boolean;
};

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('social_access_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('social_access_token', token);
      } else {
        localStorage.removeItem('social_access_token');
      }
    }
  }

  public getToken(): string | null {
    if (this.token) {
      return this.token;
    }
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem('social_access_token');
    if (stored) {
      this.token = stored;
      return stored;
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth = true,
  ): Promise<T> {
    const token = requireAuth
      ? this.getToken()
      : this.token || (typeof window === 'undefined' ? null : localStorage.getItem('social_access_token'));

    if (requireAuth && !token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.setToken(null);
      }

      const errorJson = await res.json().catch(() => ({}));
      let msg = `Lỗi hệ thống (${res.status})`;
      if (typeof errorJson.message === 'string') {
        msg = errorJson.message;
      } else if (Array.isArray(errorJson.message)) {
        msg = errorJson.message.join(', ');
      }

      const details = Array.isArray(errorJson.details) ? `: ${errorJson.details.join(', ')}` : '';
      throw new Error(`${msg}${details}`);
    }

    const json = await res.json();
    return json.data === undefined ? json : json.data;
  }

  // ------------------------------------
  // AUTH
  // ------------------------------------
  async login(identifier: string, password: string) {
    const data = await this.request<{
      user: ApiPostAuthor;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }, false);

    if (data.tokens?.accessToken) {
      this.setToken(data.tokens.accessToken);
    }
    return data;
  }

  async register(payload: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) {
    const data = await this.request<{
      user: ApiPostAuthor;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);

    if (data.tokens?.accessToken) {
      this.setToken(data.tokens.accessToken);
    }
    return data;
  }

  async logout() {
    try {
      await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      }, true);
    } catch {
      // Ignore network error on logout
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return await this.request<ApiPostAuthor>('/auth/me', {}, true);
  }

  // ------------------------------------
  // POSTS & FEED
  // ------------------------------------
  async getNewsFeed(limit = 20, beforeTimestamp?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (beforeTimestamp) {
      params.append('beforeTimestamp', beforeTimestamp);
    }
    return await this.request<{
      items: ApiPost[];
      pagination: {
        nextCursor: string | null;
        hasMore: boolean;
      };
    }>(`/posts/feed?${params.toString()}`, {}, false); // Không yêu cầu đăng nhập
  }

  async getPostById(postId: string) {
    return await this.request<ApiPost>(`/posts/${postId}`, {}, false); // Không yêu cầu đăng nhập
  }

  async createPost(content: string, privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' = 'PUBLIC') {
    return await this.request<ApiPost>('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, privacy }),
    });
  }

  async toggleLike(postId: string) {
    return await this.request<{
      liked: boolean;
      likesCount: number;
    }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async getUserPosts(userId: string, limit = 20) {
    return await this.request<{
      items: ApiPost[];
      pagination: {
        nextCursor: string | null;
        hasMore: boolean;
      };
    }>(`/posts/user/${userId}?limit=${limit}`, {}, false);
  }

  // ------------------------------------
  // USER PROFILE
  // ------------------------------------
  async getUserProfile(userId: string) {
    return await this.request<ApiUserProfile>(`/users/${userId}`, {}, false);
  }

  async updateProfile(payload: { fullName?: string; bio?: string; avatarUrl?: string }) {
    return await this.request<ApiUserProfile>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, true);
  }

  async getFriendStatus(userId: string) {
    return await this.request<ApiFriendshipStatus>(`/friends/status/${userId}`, {}, false);
  }

  // ------------------------------------
  // FRIENDS
  // ------------------------------------
  async getFriends(search?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    return await this.request<{
      items: ApiFriend[];
      meta: {
        totalItems: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
      };
    }>(`/friends?${params.toString()}`);
  }

  async getFriendRequests(type: 'received' | 'sent' = 'received') {
    return await this.request<{
      items: ApiFriendRequest[];
      meta: {
        totalItems: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
      };
    }>(`/friends/requests?type=${type}`);
  }

  async acceptFriendRequest(requestId: string) {
    return await this.request(`/friends/requests/${requestId}/accept`, {
      method: 'PATCH',
    });
  }

  async declineFriendRequest(requestId: string) {
    return await this.request(`/friends/requests/${requestId}/decline`, {
      method: 'PATCH',
    });
  }

  async cancelFriendRequest(requestId: string) {
    return await this.request(`/friends/requests/${requestId}/cancel`, {
      method: 'DELETE',
    });
  }

  async sendFriendRequest(addresseeId: string) {
    return await this.request('/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ addresseeId }),
    });
  }

  async unfriend(friendUserId: string) {
    return await this.request(`/friends/${friendUserId}`, {
      method: 'DELETE',
    });
  }

  // ------------------------------------
  // CHAT
  // ------------------------------------
  async createConversation(data: {
    type: 'DIRECT' | 'GROUP';
    recipientId?: string;
    name?: string;
    avatarUrl?: string;
    memberIds?: string[];
  }) {
    return await this.request<ApiConversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversations() {
    return await this.request<{
      items: ApiConversation[];
      nextCursor?: string | null;
    }>('/chat/conversations');
  }

  async getMessages(conversationId: string, limit = 50) {
    return await this.request<{
      items: ApiChatMessage[];
      nextCursor?: string | null;
    }>(`/chat/conversations/${conversationId}/messages?limit=${limit}`);
  }

  async sendMessage(conversationId: string, content: string) {
    return await this.request<ApiChatMessage>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        content,
      }),
    });
  }

  async markConversationAsRead(conversationId: string) {
    return await this.request(`/chat/conversations/${conversationId}/read`, {
      method: 'PATCH',
    });
  }
  // ------------------------------------
  // NOTIFICATIONS
  // ------------------------------------
  async getNotifications(page = 1, pageSize = 20) {
    return await this.request<ApiNotificationsResponse>(
      `/notifications?page=${page}&pageSize=${pageSize}`,
    );
  }

  async markNotificationAsRead(id: string) {
    return await this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return await this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }
}

export interface ApiNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  sender?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  } | null;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface ApiNotificationsResponse {
  items: ApiNotificationItem[];
  meta: {
    totalItems: number;
    unreadCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiConversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  avatarUrl?: string;
  members: ApiPostAuthor[];
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender: ApiPostAuthor;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiChatMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  userId?: string;
  type: string;
  content: string;
  mediaUrls?: string[];
  isRecalled?: boolean;
  createdAt: string;
  sender?: ApiPostAuthor;
}

export const api = new ApiService();
