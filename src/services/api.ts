import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface IUser {
  _id: string;
  id: string; 
  username: string;
  email?: string;
  avatar: string;
  banner?: string;
  bio?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  isPrivate?: boolean;
  isLocked?: boolean;
  isAdmin?: boolean; // Added
  followers?: string[];
  following?: string[];
  recoveryKeys?: { code: string, isUsed: boolean }[];
  createdAt?: string;
}

export interface IChannel {
  _id: string;
  name: string;
  type: 'text' | 'feed' | 'dm' | 'reels';
  realm?: string;
  members?: IUser[];
}

export interface IRealm {
  _id: string;
  name: string;
  icon: string;
  channels: IChannel[];
  members?: IUser[];
  owner?: string;
}

export interface IMessage {
  _id: string;
  content: string;
  sender: IUser;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface IPost {
  _id: string;
  imageUrl: string;
  caption: string;
  author: IUser;
  likes: string[];
  comments: any[];
  createdAt: string;
}

export interface INotification {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'login' | 'system' | 'sync_request';
  content: string;
  sender?: IUser;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    postId?: string;
    deviceName?: string;
  };
}

export const api = {
  // Admin Protocols
  getAdminStats: async () => {
    const res = await axios.get(`${API_URL}/admin/stats`);
    return res.data;
  },
  getAdminBroadcasts: async () => {
    const res = await axios.get<IPost[]>(`${API_URL}/admin/broadcasts`);
    return res.data;
  },
  severBroadcast: async (id: string) => {
    const res = await axios.delete(`${API_URL}/admin/broadcasts/${id}`);
    return res.data;
  },
  getAdminIdentities: async () => {
    const res = await axios.get<IUser[]>(`${API_URL}/admin/identities`);
    return res.data;
  },
  severIdentity: async (id: string) => {
    const res = await axios.delete(`${API_URL}/admin/identities/${id}`);
    return res.data;
  },

  // Users
  getUserProfile: async (id: string) => {
    const res = await axios.get<IUser>(`${API_URL}/users/${id}`);
    return res.data;
  },
  updateProfile: async (formData: FormData) => {
    const res = await axios.put<IUser>(`${API_URL}/users/me`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  generateRecoveryKeys: async () => {
    const res = await axios.post<{ keys: { code: string, isUsed: boolean }[] }>(`${API_URL}/users/me/security/keys`);
    return res.data;
  },
  syncIdentity: async (id: string) => {
    const res = await axios.post(`${API_URL}/users/nexus/sync/${id}`);
    return res.data;
  },
  acceptSync: async (id: string) => {
    const res = await axios.post(`${API_URL}/users/nexus/sync/${id}/accept`);
    return res.data;
  },
  getNotifications: async () => {
    const res = await axios.get<INotification[]>(`${API_URL}/users/nexus/alerts`);
    return res.data;
  },
  markNotificationsRead: async () => {
    const res = await axios.put(`${API_URL}/users/me/notifications/read`);
    return res.data;
  },
  getMyDMs: async () => {
    const res = await axios.get<IChannel[]>(`${API_URL}/dms`);
    return res.data;
  },
  startDM: async (targetUserId: string) => {
    const res = await axios.post<IChannel>(`${API_URL}/dms`, { targetUserId });
    return res.data;
  },
  acceptDM: async (dmId: string) => {
    const res = await axios.put(`${API_URL}/dms/${dmId}/accept`);
    return res.data;
  },
  getMyRealms: async () => {
    const res = await axios.get<IRealm[]>(`${API_URL}/realms/me`);
    return res.data;
  },
  getRealmDetails: async (id: string) => {
    const res = await axios.get<IRealm>(`${API_URL}/realms/${id}`);
    return res.data;
  },
  createRealm: async (name: string) => {
    const res = await axios.post<IRealm>(`${API_URL}/realms`, { name });
    return res.data;
  },
  joinRealm: async (id: string) => {
    const res = await axios.post(`${API_URL}/realms/${id}/join`);
    return res.data;
  },
  leaveRealm: async (id: string) => {
    const res = await axios.post(`${API_URL}/realms/${id}/leave`);
    return res.data;
  },
  deleteRealm: async (id: string) => {
    const res = await axios.delete(`${API_URL}/realms/${id}`);
    return res.data;
  },
  createChannel: async (realmId: string, name: string, type: string) => {
    const res = await axios.post<IChannel>(`${API_URL}/realms/${realmId}/channels`, { name, type });
    return res.data;
  },
  getMessages: async (channelId: string) => {
    const res = await axios.get<IMessage[]>(`${API_URL}/channels/${channelId}/messages`);
    return res.data;
  },
  getPosts: async (channelId: string) => {
    const res = await axios.get<IPost[]>(`${API_URL}/channels/${channelId}/posts`);
    return res.data;
  },
  getGlobalPosts: async () => {
    const res = await axios.get<IPost[]>(`${API_URL}/posts/all`);
    return res.data;
  },
  getUserPosts: async (userId: string) => {
    const res = await axios.get<IPost[]>(`${API_URL}/posts/user/${userId}`);
    return res.data;
  },
  createPost: async (channelId: string, formData: FormData) => {
    formData.append('channelId', channelId);
    const res = await axios.post<IPost>(`${API_URL}/posts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  likePost: async (postId: string) => {
    const res = await axios.post<{ likes: string[] }>(`${API_URL}/posts/${postId}/like`);
    return res.data;
  },
  editPost: async (postId: string, caption: string) => {
    const res = await axios.put(`${API_URL}/posts/${postId}`, { caption });
    return res.data;
  },
  deletePost: async (postId: string) => {
    const res = await axios.delete(`${API_URL}/posts/${postId}`);
    return res.data;
  },
  addComment: async (postId: string, text: string) => {
    const res = await axios.post<any>(`${API_URL}/posts/${postId}/comment`, { text });
    return res.data;
  },
  globalSearch: async (query: string) => {
    const res = await axios.get<{ users: IUser[], realms: IRealm[], posts: IPost[] }>(`${API_URL}/search?q=${query}`);
    return res.data;
  }
};
