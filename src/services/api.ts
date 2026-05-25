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

// IDENTITY SYNC: Handle Global Errors (Unauthorized, Overload, Rate Limits)
axios.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response) {
    const { status } = error.response;
    
    if (status === 401) {
      console.warn('⚠️ UNAUTHORIZED: Severing session and redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('vani_view_state');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (status === 429) {
      window.dispatchEvent(new CustomEvent('vani_server_status', { detail: { type: 'rate_limit' } }));
    }

    if ([502, 503, 504].includes(status)) {
      window.dispatchEvent(new CustomEvent('vani_server_status', { detail: { type: 'overload' } }));
    }
  } else if (error.request) {
    // Request made but no response received (possible cold start or network drop)
    window.dispatchEvent(new CustomEvent('vani_server_status', { detail: { type: 'no_response' } }));
  }
  
  return Promise.reject(error);
});

export interface IUser {
  _id: string;
  id: string; 
  username: string;
  displayName?: string; // Added
  dob?: string; // Added
  gender?: 'male' | 'female' | 'other' | 'none';
  showAge?: boolean; // Added
  showGender?: boolean;
  email?: string;
  avatar: string;
  banner?: string;
  bio?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  isPrivate?: boolean;
  isLocked?: boolean;
  isDisabled?: boolean;
  isShadowBanned?: boolean;
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
  publicKey?: string;
  createdAt?: string;
}

export interface IRole {
  _id: string;
  name: string;
  key?: string | null;
  isSystem?: boolean;
  color: string;
  permissions: string[];
  position: number;
}

export interface IChannel {
  _id: string;
  name: string;
  type: 'category' | 'text' | 'voice' | 'media' | 'gallery' | 'matrix' | 'feed' | 'reels' | 'announcement' | 'dm' | 'group_dm' | 'mod_reports' | 'mod_messages' | 'mod_posts' | 'mod_users' | 'mod_stats';
  realm?: string;
  parentCategory?: string | null;
  position?: number;
  topic?: string;
  nsfw?: boolean;
  permissionOverwrites?: Array<{ targetType: 'role' | 'member'; targetId: string; allow?: string[]; deny?: string[] }>;
  members?: IUser[];
  icon?: string;
  nicknames?: Record<string, string>;
  encryptedKeys?: Record<string, { ciphertext: string, iv: string, senderId: string }>;
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
  isSystem?: boolean;
  tier?: 'standard' | 'elite';
  systemChannel?: string | null;
  verificationLevel?: 'none' | 'low' | 'medium' | 'high';
  defaultNotifications?: 'all' | 'mentions';
  contentFilter?: 'none' | 'nsfw' | 'strict';
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
  isEncrypted?: boolean;
  iv?: string;
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
  type: 'like' | 'comment' | 'reply' | 'follow' | 'login' | 'mention' | 'system' | 'sync_request';
  content: string;
  sender?: IUser;
  isRead: boolean;
  createdAt: string;
  metadata?: { postId?: string; channelId?: string; deviceName?: string; };
}

export interface IRealmInvite {
  code: string;
  uses: number;
  maxUses: number;
  expiresAt?: string | null;
  createdAt?: string;
  urlPath: string;
  inviter?: Pick<IUser, '_id' | 'username' | 'avatar'>;
}

// DEDUP: Compute SHA-256 hash of a file using Web Crypto API
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// DEDUP: Calculate average pixel hash of image files
export async function calculatePerceptualHash(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, 8, 8);
    const imgData = ctx.getImageData(0, 0, 8, 8);
    const data = imgData.data;

    let sum = 0;
    const grays = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grays[i] = gray;
      sum += gray;
    }
    const avg = sum / 64;

    let hashStr = '';
    for (let i = 0; i < 64; i++) {
      hashStr += grays[i] >= avg ? '1' : '0';
    }

    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const chunk = hashStr.slice(i, i + 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    return hex;
  } catch (e) {
    console.error('Failed to compute perceptual hash:', e);
    return null;
  }
}

export const api = {
  getAdminStats: async () => { const res = await axios.get(`${API_URL}/admin/stats`); return res.data; },
  getAdminBroadcasts: async () => { const res = await axios.get<IPost[]>(`${API_URL}/admin/broadcasts`); return res.data; },
  getAdminMessages: async () => { const res = await axios.get<IMessage[]>(`${API_URL}/admin/messages`); return res.data; },
  severBroadcast: async (id: string) => { const res = await axios.delete(`${API_URL}/admin/broadcasts/${id}`); return res.data; },
  getAdminIdentities: async () => { const res = await axios.get<IUser[]>(`${API_URL}/admin/identities`); return res.data; },
  severIdentity: async (id: string) => { const res = await axios.delete(`${API_URL}/admin/identities/${id}`); return res.data; },
  modAction: async (id: string, action: 'ban' | 'unban' | 'shadow_ban' | 'unshadow_ban') => { const res = await axios.post(`${API_URL}/admin/identities/${id}/mod-action`, { action }); return res.data; },
  editMessageAdmin: async (id: string, data: { content?: string, removeAttachments?: boolean }) => { const res = await axios.put(`${API_URL}/admin/messages/${id}`, data); return res.data; },
  severMessageAdmin: async (id: string) => { const res = await axios.delete(`${API_URL}/admin/messages/${id}`); return res.data; },
  getAllRealmsAdmin: async () => { const res = await axios.get(`${API_URL}/admin/realms`); return res.data; },
  purgeRealmAdmin: async (id: string) => { const res = await axios.delete(`${API_URL}/admin/realms/${id}`); return res.data; },
  grantAuthority: async (id: string, data: { badges?: any[], isAdmin?: boolean, username?: string }) => { const res = await axios.post(`${API_URL}/admin/identities/${id}/authority`, data); return res.data; },
  getPendingTransactions: async () => { const res = await axios.get<ITransaction[]>(`${API_URL}/admin/finance/pending`); return res.data; },
  approveTransaction: async (id: string) => { const res = await axios.post(`${API_URL}/admin/finance/approve/${id}`); return res.data; },
  rejectTransaction: async (id: string) => { const res = await axios.post(`${API_URL}/admin/finance/reject/${id}`); return res.data; },
  getReports: async () => { const res = await axios.get(`${API_URL}/admin/reports`); return res.data; },
  resolveReport: async (id: string, action: string) => { const res = await axios.post(`${API_URL}/admin/reports/${id}/resolve`, { action }); return res.data; },
  submitReport: async (data: { targetType: string, targetId: string, reason: string }) => { const res = await axios.post(`${API_URL}/admin/report`, data); return res.data; },
  submitPayment: async (data: { method: string, transactionId: string, amount: number }) => { const res = await axios.post(`${API_URL}/payments/submit`, data); return res.data; },
  getTransactions: async () => { const res = await axios.get(`${API_URL}/payments/me`); return res.data; },
  getUserProfile: async (id: string) => { const res = await axios.get<IUser>(`${API_URL}/users/${id}`); return res.data; },
  getSuggestedUsers: async () => { const res = await axios.get<IUser[]>(`${API_URL}/users/public/list`); return res.data; },
  getUserByHandle: async (handle: string) => { const res = await axios.get<{ id: string }>(`${API_URL}/users/handle/${handle}`); return res.data; },
  updateProfile: async (formData: FormData) => { const res = await axios.put<IUser>(`${API_URL}/users/me`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data; },
  resetTOTP: async (token: string) => { const res = await axios.post<{ secret: string, qrCode: string }>(`${API_URL}/users/me/security/totp/reset`, { token }); return res.data; },
  generateRecoveryKeys: async () => { const res = await axios.post<{ keys: { code: string, isUsed: boolean }[] }>(`${API_URL}/users/me/security/keys`); return res.data; },
  syncIdentity: async (id: string) => { const res = await axios.post(`${API_URL}/users/vani/sync/${id}`); return res.data; },
  unfollowUser: async (id: string) => { const res = await axios.post(`${API_URL}/users/vani/unsync/${id}`); return res.data; },
  acceptSync: async (id: string) => { const res = await axios.post(`${API_URL}/users/vani/sync/${id}/accept`); return res.data; },
  getNotifications: async () => { const res = await axios.get<INotification[]>(`${API_URL}/users/vani/alerts`); return res.data; },
  markNotificationsRead: async () => { const res = await axios.put(`${API_URL}/users/me/notifications/read`); return res.data; },
  markNotificationsReadByChannel: async (channelId: string) => { const res = await axios.put(`${API_URL}/users/me/notifications/read/channel/${channelId}`); return res.data; },
  markNotificationsReadByPost: async (postId: string) => { const res = await axios.put(`${API_URL}/users/me/notifications/read/post/${postId}`); return res.data; },
  markNotificationReadById: async (id: string) => { const res = await axios.put(`${API_URL}/users/me/notifications/read/id/${id}`); return res.data; },
  exportData: async () => {
    const res = await axios.get(`${API_URL}/users/me/archive/export`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vani-archive.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  },
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
  createChannel: async (realmId: string, name: string, type: string, extras: { parentCategory?: string; position?: number; topic?: string; nsfw?: boolean } = {}) => { const res = await axios.post<IChannel>(`${API_URL}/realms/${realmId}/channels`, { name, type, ...extras }); return res.data; },
  createCategory: async (realmId: string, name: string, position = 0) => { const res = await axios.post<IChannel>(`${API_URL}/realms/${realmId}/categories`, { name, position }); return res.data; },
  updateChannel: async (id: string, data: { name?: string; topic?: string; nsfw?: boolean; parentCategory?: string | null; position?: number }) => { const res = await axios.put<IChannel>(`${API_URL}/channels/${id}`, data); return res.data; },
  deleteChannel: async (id: string) => { const res = await axios.delete(`${API_URL}/channels/${id}`); return res.data; },
  createRealmInvite: async (
    realmId: string,
    options: { code?: string; maxUses?: number; expiresInHours?: number; expiresAt?: string } = {}
  ) => {
    const res = await axios.post<IRealmInvite>(`${API_URL}/realms/${realmId}/invites`, options);
    return res.data;
  },
  listRealmInvites: async (realmId: string) => { const res = await axios.get<IRealmInvite[]>(`${API_URL}/realms/${realmId}/invites`); return res.data; },
  revokeRealmInvite: async (realmId: string, code: string) => { const res = await axios.delete(`${API_URL}/realms/${realmId}/invites/${encodeURIComponent(code)}`); return res.data; },
  joinRealmWithInvite: async (code: string) => { const res = await axios.post<IRealm>(`${API_URL}/realms/join/${code}`); return res.data; },
  createRole: async (realmId: string, data: any) => { const res = await axios.post(`${API_URL}/realms/${realmId}/roles`, data); return res.data; },
  updateRole: async (realmId: string, roleId: string, data: { name?: string; color?: string; permissions?: string[]; position?: number }) => { const res = await axios.patch(`${API_URL}/realms/${realmId}/roles/${roleId}`, data); return res.data; },
  assignRole: async (realmId: string, userId: string, roleId: string) => { const res = await axios.post(`${API_URL}/realms/${realmId}/members/${userId}/role`, { roleId }); return res.data; },
  deleteRole: async (realmId: string, roleId: string) => { const res = await axios.delete(`${API_URL}/realms/${realmId}/roles/${roleId}`); return res.data; },
  getMessages: async (channelId: string) => { const res = await axios.get<IMessage[]>(`${API_URL}/channels/${channelId}/messages`); return res.data; },
  markChannelRead: async (id: string) => { const res = await axios.post(`${API_URL}/channels/${id}/read`); return res.data; },
  markChannelUnread: async (id: string) => { const res = await axios.post(`${API_URL}/channels/${id}/unread`); return res.data; },
  scheduleMessage: async (data: { channelId: string, content: string, scheduledFor: Date, parentMessageId?: string, isEncrypted?: boolean, iv?: string }) => { const res = await axios.post(`${API_URL}/channels/schedule`, data); return res.data; },
  editMessage: async (id: string, content: string, isEncrypted?: boolean, iv?: string) => { const res = await axios.put<IMessage>(`${API_URL}/channels/messages/${id}`, { content, isEncrypted, iv }); return res.data; },
  deleteMessage: async (id: string) => { const res = await axios.delete(`${API_URL}/channels/messages/${id}`); return res.data; },
  getPosts: async (channelId: string) => { const res = await axios.get<IPost[]>(`${API_URL}/channels/${channelId}/posts`); return res.data; },
  getGlobalPosts: async (tag?: string) => { const res = await axios.get<IPost[]>(`${API_URL}/posts/all${tag ? `?tag=${tag}` : ''}`); return res.data; },
  getPulseEvents: async () => { const res = await axios.get<any[]>(`${API_URL}/posts/pulse`); return res.data; },
  getUserPosts: async (userId: string) => { const res = await axios.get<IPost[]>(`${API_URL}/posts/user/${userId}`); return res.data; },
  createPost: async (channelId: string, formData: FormData) => { formData.append('channelId', channelId); const res = await axios.post<IPost>(`${API_URL}/posts`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data; },
  likePost: async (postId: string) => { const res = await axios.post<{ likes: string[] }>(`${API_URL}/posts/${postId}/like`); return res.data; },
  getTrends: async () => { const res = await axios.get<any[]>(`${API_URL}/posts/trends`); return res.data; },
  editPost: async (postId: string, caption: string) => { const res = await axios.put(`${API_URL}/posts/${postId}`, { caption }); return res.data; },
  deletePost: async (postId: string) => { const res = await axios.delete(`${API_URL}/posts/${postId}`); return res.data; },
  addComment: async (postId: string, text: string, parentCommentId?: string) => { const res = await axios.post<any>(`${API_URL}/posts/${postId}/comment`, { text, parentCommentId }); return res.data; },
  uploadMedia: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => { 
    const rawChannelId = formData.get('channelId');
    const channelId = rawChannelId ? encodeURIComponent(String(rawChannelId)) : '';
    const uploadUrl = `${API_URL}/media/upload${channelId ? `?channelId=${channelId}` : ''}`;
    const res = await axios.post<IMessage>(uploadUrl, formData, { 
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress 
    }); 
    return res.data; 
  },
  globalSearch: async (query: string, filters: { type?: string, sortBy?: string, author?: string } = {}) => { 
    const params = new URLSearchParams({ q: query, ...filters });
    const res = await axios.get<{ 
      users: IUser[], 
      realms: IRealm[], 
      posts: IPost[],
      tags: { name: string; count: number }[],
      counts: { users: number; realms: number; posts: number; tags: number }
    }>(`${API_URL}/search?${params.toString()}`); 
    return res.data; 
  },
  updatePublicKey: async (publicKey: string) => { 
    const res = await axios.put(`${API_URL}/users/me/publicKey`, { publicKey }); 
    return res.data; 
  },
  getUserPublicKey: async (userId: string) => { 
    const res = await axios.get<{ publicKey: string | null }>(`${API_URL}/users/${userId}/publicKey`); 
    return res.data; 
  },
  checkMediaHash: async (hash: string, pHash?: string) => {
    const res = await axios.get<{ exists: boolean; url?: string; mimeType?: string }>(
      `${API_URL}/media/check-hash?hash=${hash}${pHash ? `&pHash=${pHash}` : ''}`
    );
    return res.data;
  },
  updateChannelPermissions: async (channelId: string, overwrites: any[]) => {
    const res = await axios.put<IChannel>(`${API_URL}/channels/${channelId}/overwrites`, { overwrites });
    return res.data;
  },
  kickRealmMember: async (realmId: string, userId: string, reason?: string) => {
    const res = await axios.delete(`${API_URL}/realms/${realmId}/members/${userId}`, { data: { reason } });
    return res.data;
  },
  banRealmMember: async (realmId: string, userId: string, reason?: string) => {
    const res = await axios.post(`${API_URL}/realms/${realmId}/bans/${userId}`, { reason });
    return res.data;
  },
  unbanRealmMember: async (realmId: string, userId: string, reason?: string) => {
    const res = await axios.delete(`${API_URL}/realms/${realmId}/bans/${userId}`, { data: { reason } });
    return res.data;
  },
  getRealmBans: async (realmId: string) => {
    const res = await axios.get<any[]>(`${API_URL}/realms/${realmId}/bans`);
    return res.data;
  },
  getRealmAuditLogs: async (realmId: string) => {
    const res = await axios.get<any[]>(`${API_URL}/realms/${realmId}/audit-logs`);
    return res.data;
  },
  assignRoles: async (realmId: string, userId: string, roleIds: string[]) => {
    const res = await axios.post(`${API_URL}/realms/${realmId}/members/${userId}/role`, { roleIds });
    return res.data;
  },
  updateChannelEncryptedKeys: async (channelId: string, encryptedKeys: Record<string, { ciphertext: string, iv: string }>) => {
    const res = await axios.put<IChannel>(`${API_URL}/channels/${channelId}/encrypted-keys`, { encryptedKeys });
    return res.data;
  }
};
