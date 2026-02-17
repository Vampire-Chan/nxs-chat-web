import axios from 'axios';

const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
const API_BASE = import.meta.env.VITE_API_URL || (isLocal ? `http://${hostname}:5000` : '');
export const API_URL = `${API_BASE}/api`;

// IDENTITY SYNC: Attach Auth Token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// IDENTITY SYNC: Handle 401 Unauthorized globally
axios.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    console.warn('⚠️ UNAUTHORIZED: Severing session and redirecting to login...');
    localStorage.removeItem('token');
    localStorage.removeItem('vani_view_state');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export interface IUser {
  _id: string;
  id: string; 
  username: string;
  displayName?: string; // Added
  dob?: string; // Added
  showAge?: boolean; // Added
  email?: string;
  avatar: string;
  banner?: string;
  bio?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  isPrivate?: boolean;
  isLocked?: boolean;
  isDisabled?: boolean;
  isAdmin?: boolean;
  followers?: string[];
  following?: string[];
  friends?: string[];
  inboundRequests?: string[];
  outboundRequests?: string[];
  vanityHandle?: string;
  tier?: 'standard' | 'elite';
  creationUI?: 'auto' | 'bar' | 'button';
  recoveryKeys?: { code: string, isUsed: boolean }[];
  badges?: { type: string, label: string }[];
  createdAt?: string;
}

export interface IRole {
  _id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
}

export interface IChannel {
  _id: string;
  name: string;
  type: 'text' | 'voice' | 'feed' | 'reels' | 'announcement' | 'dm' | 'group_dm';
  realm?: string;
  members?: IUser[];
  icon?: string;
  nicknames?: Record<string, string>;
}

export interface IRealm {
  _id: string;
  name: string;
  icon: string;
  banner?: string; // Added
  channels: IChannel[];
  members?: IUser[];
  owner?: string;
  roles?: IRole[];
  memberRoles?: { user: string, roleId: string }[];
  vanityHandle?: string;
  isDiscoverable?: boolean; // Added
  tier?: 'standard' | 'elite';
}

export interface IMessage {
  _id: string;
  content: string;
  sender: IUser;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  reactions?: Record<string, string[]>;
  parentMessage?: IMessage | null;
}

export interface IPost {
  _id: string;
  imageUrl: string;
  caption: string;
  author: IUser;
  likes: string[];
  comments: any[];
  tags?: string[];
  createdAt: string;
}

export interface ITransaction {
  _id: string;
  user: IUser;
  amount: string;
  method: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface INotification {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'login' | 'system' | 'sync_request';
  content: string;
  sender?: IUser;
  isRead: boolean;
  createdAt: string;
  metadata?: { postId?: string; deviceName?: string; };
}

export const api = {
  getAdminStats: async () => { const res = await axios.get(`${API_URL}/admin/stats`); return res.data; },
  getAdminBroadcasts: async () => { const res = await axios.get<IPost[]>(`${API_URL}/admin/broadcasts`); return res.data; },
  severBroadcast: async (id: string) => { const res = await axios.delete(`${API_URL}/admin/broadcasts/${id}`); return res.data; },
  getAdminIdentities: async () => { const res = await axios.get<IUser[]>(`${API_URL}/admin/identities`); return res.data; },
  severIdentity: async (id: string) => { const res = await axios.delete(`${API_URL}/admin/identities/${id}`); return res.data; },
  grantAuthority: async (id: string, data: { badges?: any[], isAdmin?: boolean }) => { const res = await axios.post(`${API_URL}/admin/identities/${id}/authority`, data); return res.data; },
  getPendingTransactions: async () => { const res = await axios.get<ITransaction[]>(`${API_URL}/admin/finance/pending`); return res.data; },
  approveTransaction: async (id: string) => { const res = await axios.post(`${API_URL}/admin/finance/approve/${id}`); return res.data; },
  rejectTransaction: async (id: string) => { const res = await axios.post(`${API_URL}/admin/finance/reject/${id}`); return res.data; },
  submitPayment: async (data: { method: string, transactionId: string, amount: string }) => { const res = await axios.post(`${API_URL}/payments/submit`, data); return res.data; },
  getUserProfile: async (id: string) => { const res = await axios.get<IUser>(`${API_URL}/users/${id}`); return res.data; },
  getSuggestedUsers: async () => { const res = await axios.get<IUser[]>(`${API_URL}/users/public/list`); return res.data; },
  getUserByHandle: async (handle: string) => { const res = await axios.get<{ id: string }>(`${API_URL}/users/handle/${handle}`); return res.data; },
  updateProfile: async (formData: FormData) => { const res = await axios.put<IUser>(`${API_URL}/users/me`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data; },
  generateRecoveryKeys: async () => { const res = await axios.post<{ keys: { code: string, isUsed: boolean }[] }>(`${API_URL}/users/me/security/keys`); return res.data; },
  syncIdentity: async (id: string) => { const res = await axios.post(`${API_URL}/users/vani/sync/${id}`); return res.data; },
  unfollowUser: async (id: string) => { const res = await axios.post(`${API_URL}/users/vani/unsync/${id}`); return res.data; },
  acceptSync: async (id: string) => { const res = await axios.post(`${API_URL}/users/vani/sync/${id}/accept`); return res.data; },
  getNotifications: async () => { const res = await axios.get<INotification[]>(`${API_URL}/users/vani/alerts`); return res.data; },
  markNotificationsRead: async () => { const res = await axios.put(`${API_URL}/users/me/notifications/read`); return res.data; },
  exportData: async () => { window.location.href = `${API_URL}/users/me/archive/export?token=${localStorage.getItem('token')}`; },
  terminateIdentity: async () => { const res = await axios.delete(`${API_URL}/users/me/terminate`); return res.data; },
  toggleDisableAccount: async (status: boolean) => { const res = await axios.post(`${API_URL}/users/me/disable`, { status }); return res.data; },
  getMyDMs: async () => { const res = await axios.get<IChannel[]>(`${API_URL}/dms`); return res.data; },
  startDM: async (targetUserId: string) => { const res = await axios.post<IChannel>(`${API_URL}/dms`, { targetUserId }); return res.data; },
  createGroupDM: async (userIds: string[], name?: string) => { const res = await axios.post<IChannel>(`${API_URL}/dms/group`, { userIds, name }); return res.data; },
  acceptDM: async (dmId: string) => { const res = await axios.put(`${API_URL}/dms/${dmId}/accept`); return res.data; },
  updateChannelMetadata: async (id: string, formData: FormData) => { const res = await axios.patch<IChannel>(`${API_URL}/dms/${id}/metadata`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data; },
  closeDM: async (id: string) => { const res = await axios.delete(`${API_URL}/dms/${id}`); return res.data; },
  getMyRealms: async () => { const res = await axios.get<IRealm[]>(`${API_URL}/realms/me`); return res.data; },
  getRealmDetails: async (id: string) => { const res = await axios.get<IRealm>(`${API_URL}/realms/${id}`); return res.data; },
  getRealmByHandle: async (handle: string) => { const res = await axios.get<IRealm>(`${API_URL}/realms/handle/${handle}`); return res.data; },
  createRealm: async (name: string) => { const res = await axios.post<IRealm>(`${API_URL}/realms`, { name }); return res.data; },
  updateRealm: async (id: string, formData: FormData) => { const res = await axios.put<IRealm>(`${API_URL}/realms/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data; },
  joinRealm: async (id: string) => { const res = await axios.post(`${API_URL}/realms/${id}/join`); return res.data; },
  leaveRealm: async (id: string) => { const res = await axios.post(`${API_URL}/realms/${id}/leave`); return res.data; },
  deleteRealm: async (id: string) => { const res = await axios.delete(`${API_URL}/realms/${id}`); return res.data; },
  createChannel: async (realmId: string, name: string, type: string) => { const res = await axios.post<IChannel>(`${API_URL}/realms/${realmId}/channels`, { name, type }); return res.data; },
  createRealmInvite: async (realmId: string, maxUses = 0) => { const res = await axios.post<{ code: string }>(`${API_URL}/realms/${realmId}/invites`, { maxUses }); return res.data; },
  joinRealmWithInvite: async (code: string) => { const res = await axios.post<IRealm>(`${API_URL}/realms/join/${code}`); return res.data; },
  createRole: async (realmId: string, data: any) => { const res = await axios.post(`${API_URL}/realms/${realmId}/roles`, data); return res.data; },
  assignRole: async (realmId: string, userId: string, roleId: string) => { const res = await axios.post(`${API_URL}/realms/${realmId}/members/${userId}/role`, { roleId }); return res.data; },
  deleteRole: async (realmId: string, roleId: string) => { const res = await axios.delete(`${API_URL}/realms/${realmId}/roles/${roleId}`); return res.data; },
  getMessages: async (channelId: string) => { const res = await axios.get<IMessage[]>(`${API_URL}/channels/${channelId}/messages`); return res.data; },
  markChannelRead: async (id: string) => { const res = await axios.post(`${API_URL}/channels/${id}/read`); return res.data; },
  markChannelUnread: async (id: string) => { const res = await axios.post(`${API_URL}/channels/${id}/unread`); return res.data; },
  editMessage: async (id: string, content: string) => { const res = await axios.put<IMessage>(`${API_URL}/channels/messages/${id}`, { content }); return res.data; },
  deleteMessage: async (id: string) => { const res = await axios.delete(`${API_URL}/channels/messages/${id}`); return res.data; },
  getPosts: async (channelId: string) => { const res = await axios.get<IPost[]>(`${API_URL}/channels/${channelId}/posts`); return res.data; },
  getGlobalPosts: async (tag?: string) => { const res = await axios.get<IPost[]>(`${API_URL}/posts/all${tag ? `?tag=${tag}` : ''}`); return res.data; },
  getUserPosts: async (userId: string) => { const res = await axios.get<IPost[]>(`${API_URL}/posts/user/${userId}`); return res.data; },
  createPost: async (channelId: string, formData: FormData) => { formData.append('channelId', channelId); const res = await axios.post<IPost>(`${API_URL}/posts`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data; },
  likePost: async (postId: string) => { const res = await axios.post<{ likes: string[] }>(`${API_URL}/posts/${postId}/like`); return res.data; },
  getTrends: async () => { const res = await axios.get<any[]>(`${API_URL}/posts/trends`); return res.data; },
  editPost: async (postId: string, caption: string) => { const res = await axios.put(`${API_URL}/posts/${postId}`, { caption }); return res.data; },
  deletePost: async (postId: string) => { const res = await axios.delete(`${API_URL}/posts/${postId}`); return res.data; },
  addComment: async (postId: string, text: string, parentCommentId?: string) => { const res = await axios.post<any>(`${API_URL}/posts/${postId}/comment`, { text, parentCommentId }); return res.data; },
  uploadMedia: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => { 
    const res = await axios.post<IMessage>(`${API_URL}/media/upload`, formData, { 
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress 
    }); 
    return res.data; 
  },
  globalSearch: async (query: string) => { const res = await axios.get<{ users: IUser[], realms: IRealm[], posts: IPost[] }>(`${API_URL}/search?q=${query}`); return res.data; }
};
