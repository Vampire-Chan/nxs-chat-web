import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { api, API_URL } from './services/api';
import type { IRealm, IChannel, IMessage, IPost, IUser } from './services/api';
import { getIdentityAvatar } from './services/identity';
import { TopNavbar as CoreDock } from './components/RealmSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { FeedArea } from './components/FeedArea';
import { ReelsArea } from './components/ReelsArea';
import { DMSidebar } from './components/DMSidebar';
import { ProfileNode } from './components/ProfileNode';
import { NotificationsPage } from './components/NotificationsPage';
import { SearchModal } from './components/SearchModal';
import { LaunchScreen } from './components/LaunchScreen';
import { SocialCorner } from './components/SocialCorner';
import { CreateRealmModal, CreatePostModal, CreateChannelModal, CreateGroupDMModal, RealmSettingsModal, GroupSettingsModal } from './components/Modals';
import { PostViewerModal } from './components/PostViewerModal';
import { UserSettingsModal as IdentitySettingsModal } from './components/UserSettingsModal';
import { LogoutModal } from './components/LogoutModal';
import { ArchitectRealm } from './components/ArchitectRealm';
import { VoiceChannel } from './components/VoiceChannel';
import { MediaPlayer } from './components/MediaPlayer';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { Menu, X, Search as SearchIcon, MessageSquare, Phone, Video, Wifi, WifiOff, Heart, MessageCircle, Users, Send, Zap } from 'lucide-react';
import HelpPage from './pages/HelpPage';

import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import GuidelinesPage from './pages/GuidelinesPage';
import FAQPage from './pages/FAQPage';

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { isAuthenticated, user, login } = useAuth();
  const [bootProgress, setBootProgress] = useState(0);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const startBootSequence = async () => {
      setBootProgress(20); await new Promise(r => setTimeout(r, 800));
      if (isAuthenticated) { setBootProgress(50); await new Promise(r => setTimeout(r, 1000)); setBootProgress(85); }
      setBootProgress(100); setTimeout(() => setIsBooting(false), 500);
    };
    startBootSequence();
  }, [isAuthenticated]);

  useEffect(() => {
    const checkRegion = async () => {
      try {
        if (sessionStorage.getItem('lang_suggestion_shown')) return;
        const res = await fetch('https://ipinfo.io/json');
        if (!res.ok) return;
        const data = await res.json();
        const complexRegions = ['Punjab', 'Jammu and Kashmir', 'Himachal Pradesh', 'Uttarakhand', 'Bihar', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        if (data.country === 'IN' && complexRegions.includes(data.region)) {
          setTimeout(() => {
            if (addToast) {
              addToast(t('ui.node_calib'), 'info');
              sessionStorage.setItem('lang_suggestion_shown', 'true');
            }
          }, 2000);
        }
      } catch (e) { console.warn("Region check suppressed", e); }
    };
    checkRegion();
  }, [t, addToast]);

  if (isBooting) return <LaunchScreen progress={bootProgress} />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/guidelines" element={<GuidelinesPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/app" /> : <AuthPage />} />
      
      {/* GLOBAL PREFIXED APP ROUTES */}
      <Route path="/app" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      <Route path="/app/id/:username" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      <Route path="/app/join/:code" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      <Route path="/app/post/:postId" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      <Route path="/app/msg/:channelId/:msgId" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      
      {/* LEGACY REDIRECTS (Fallback to /app) */}
      <Route path="/join/:code" element={<Navigate to="/app/join/:code" replace />} />
      <Route path="/id/:username" element={<Navigate to="/app/id/:username" replace />} />
      <Route path="/post/:postId" element={<Navigate to="/app/post/:postId" replace />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function Dashboard({ user, updateUserState }: DashboardProps) {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { username, code, postId, channelId, msgId } = useParams();
  const navigate = useNavigate();
  const savedState = JSON.parse(localStorage.getItem('Yantravani_view_state') || '{}');

  const [viewMode, setViewMode] = useState<any>(savedState.viewMode || 'home');
  const [socialTab, setSocialTab] = useState<'friends' | 'following' | 'followers' | 'invasions'>('friends');
  const [socialTargetId, setSocialTargetId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [realms, setRealms] = useState<IRealm[]>([]);
  const [dms, setDms] = useState<IChannel[]>([]);
  const [activeRealm, setActiveRealm] = useState<IRealm | null>(savedState.activeRealm || null);
  const [activeChannel, setActiveChannel] = useState<IChannel | null>(savedState.activeChannel || null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [matrixRefreshKey, setMatrixRefreshKey] = useState(0);
  const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video' | 'audio', url: string } | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConnPill, setShowConnPill] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveStreamers, setLiveStreamers] = useState<IUser[]>([]);
  const [liveSignal, setLiveSignal] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const activeChannelRef = useRef<IChannel | null>(null);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const [serverStatus, setServerStatus] = useState<'overload' | 'no_response' | 'rate_limit' | null>(null);
  
    useEffect(() => {
      const handleStatus = (e: any) => {
        setServerStatus(e.detail.type);
        // Auto-clear after 10 seconds for overloads
        if (e.detail.type !== 'rate_limit') {
          setTimeout(() => setServerStatus(null), 10000);
        } else {
          setTimeout(() => setServerStatus(null), 5000);
        }
      };
      window.addEventListener('vani_server_status', handleStatus);
      return () => window.removeEventListener('vani_server_status', handleStatus);
    }, []);
  
    const [dockPosition, setDockPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(isMobile ? 'bottom' : (savedState.dockPosition || 'top'));
  const [sidebarWidth, setSidebarWidth] = useState(savedState.sidebarWidth || 240);
  const [isResizing, setIsResizing] = useState(false);
  const [kineticTransitions, setKineticTransitions] = useState<boolean>(savedState.kineticTransitions !== undefined ? savedState.kineticTransitions : true);
  
  // GLOBAL OVERSIGHT TOGGLE
  const [oversightMode, setOversightMode] = useState(true);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setShowConnPill(true); setTimeout(() => setShowConnPill(false), 3000); };
    const handleOffline = () => { setIsOnline(false); setShowConnPill(true); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if ("Notification" in window && Notification.permission === "default") { Notification.requestPermission(); }
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const sendLocalNotification = (title: string, body: string, icon?: string) => {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, icon: icon || '/nexus.svg', tag: 'yantravani-sync' });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; setIsMobile(mobile);
      if (mobile) { setIsSidebarOpen(false); setDockPosition('bottom'); }
      else { setIsSidebarOpen(true); }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = dockPosition === 'left' ? e.clientX - 72 : dockPosition === 'right' ? window.innerWidth - e.clientX - 72 : e.clientX;
      if (newWidth > 180 && newWidth < 450) setSidebarWidth(newWidth);
    }
  }, [isResizing, dockPosition]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [resize, stopResizing]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;
    const threshold = 50;
    if (info.offset.x > threshold && !isSidebarOpen) setIsSidebarOpen(true);
    else if (info.offset.x < -threshold && isSidebarOpen) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handleLinkEntry = async () => {
      if (username) { try { const res = await api.getUserByHandle(username); handleViewOtherProfile(res.id); navigate('/app', { replace: true }); } catch (e) {} }
      if (code) { try { const r = await api.joinRealmWithInvite(code); await loadRealms(); handleSelectRealm(r); navigate('/app', { replace: true }); } catch (e) {} }
      if (postId) { setSelectedPostId(postId); navigate('/app', { replace: true }); }
      if (channelId && msgId) { 
        try {
          const res = await axios.get(`${API_URL}/channels/${channelId}`);
          handleSelectChannel(res.data);
          setTimeout(() => {
            const el = document.getElementById(`msg-${msgId}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.classList.add('bg-vani-blue/20');
            setTimeout(() => el?.classList.remove('bg-vani-blue/20'), 3000);
          }, 1000);
          navigate('/app', { replace: true });
        } catch (e) {}
      }
    };
    handleLinkEntry();
  }, [username, code, postId, channelId, msgId]);

  useEffect(() => {
    let context = 'Yantravani';
    if (viewMode === 'home') context = activeChannel ? `@${activeChannel.name}` : t('ui.neural_links');
    else if (viewMode === 'explore') context = t('ui.global_matrix');
    else if (viewMode === 'profile') context = t('ui.identity_node');
    else if (viewMode === 'architect') context = t('ui.architect_realm');
    else if (viewMode === 'social') context = t('ui.social_matrix');
    else if (activeRealm) context = activeChannel ? `#${activeChannel.name}` : activeRealm.name;
    document.title = `${context} - Yantravani`;
  }, [viewMode, activeRealm, activeChannel, t]);

  useEffect(() => {
    const userId = user?.id || user?._id;
    const token = localStorage.getItem('token');
    if (!user || !userId || !token) return;
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
    const socketUrl = import.meta.env.VITE_API_URL || (isLocal ? `http://${hostname}:5000` : '');
    const s = io(socketUrl, { auth: { token }, query: { userId }, reconnection: true });
    socketRef.current = s;
    s.on('new_notification', (notif: any) => { setLiveSignal(notif); setTimeout(() => setLiveSignal(null), 5000); });
    s.on('receive_message', (msg: any) => { 
      const msgChannelId = msg.channel?._id || msg.channel;
      const isMe = (msg.sender?._id || msg.sender?.id || msg.sender) === userId;

      if (msgChannelId === activeChannelRef.current?._id) { 
        setMessages(prev => [...prev, msg]); 
        api.markNotificationsReadByChannel(msgChannelId); 
      } 
      else if (!isMe) {
        setLiveSignal({ sender: msg.sender, content: msg.content || (t as any)('app.incoming_transmission'), type: 'message' }); 
        setTimeout(() => setLiveSignal(null), 5000); 
        sendLocalNotification(`New signal from ${msg.sender.username}`, msg.content || (t as any)('app.incoming_visual_data')); 
      }
      loadDMs(); setMatrixRefreshKey(k => k + 1); 
    });
    s.on('incoming_call', (data: any) => { setIncomingCall(data); setTimeout(() => setIncomingCall((prev: any) => (prev?.timestamp === data.timestamp ? null : prev)), 60000); sendLocalNotification((t as any)('app.incoming_call', { type: data.type }), (t as any)('app.establishing_link', { username: data.sender.username })); });
    s.on('call_rejected', ({ channelId }: any) => { setLiveSignal({ sender: { username: 'SYSTEM' }, content: t('app.identity_link_rejected'), type: 'error' }); setTimeout(() => setLiveSignal(null), 5000); setActiveChannel((prev: any) => prev?._id === channelId ? { ...prev, type: 'dm' } : prev); });
    s.on('identity_sync_update', async () => { try { const u = await api.getUserProfile(user?.id || user?._id || ''); updateUserState(localStorage.getItem('token') || '', u); loadDMs(); loadRealms(); setMatrixRefreshKey(k => k + 1); } catch (e) {} });
    s.on('user_status_change', ({ userId, status }: any) => { setOnlineUserIds(prev => { const n = new Set(prev); if (status === 'online') n.add(userId); else n.delete(userId); return n; }); });
    s.on('message_reaction_update', ({ messageId, reactions }: any) => { setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m)); });
    s.on('message_updated', (updated: IMessage) => { setMessages(prev => prev.map(m => m._id === updated._id ? updated : m)); });
    s.on('channel_metadata_update', (updated: IChannel) => { setDms(prev => prev.map(d => d._id === updated._id ? updated : d)); if (activeChannel?._id === updated._id) setActiveChannel(updated); });
    s.on('active_streams', (streamers: IUser[]) => { setLiveStreamers(streamers); });
    loadRealms(); loadDMs();
    if (activeChannel) handleSelectChannel(activeChannel);
    if (viewMode === 'explore') api.getGlobalPosts().then(setPosts).catch(console.error);
    return () => { s.disconnect(); };
  }, []);

  const loadRealms = async () => { setIsSyncing(true); try { const d = await api.getMyRealms(); setRealms(d); } catch(e){} finally { setIsSyncing(false); } };
  const loadDMs = async () => { setIsSyncing(true); try { const d = await api.getMyDMs(); setDms(d); } catch(e){} finally { setIsSyncing(false); } };

  const handleSelectRealm = async (realm: IRealm | { _id: string }) => {
    setViewingUserId(null); if (isMobile) setIsSidebarOpen(false);
    if (realm._id === 'home') { setViewMode('home'); setActiveRealm(null); setActiveChannel(null); loadDMs(); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'home', activeRealm: null, activeChannel: null })); return; }
    if (realm._id === 'explore') { setViewMode('explore'); setActiveRealm(null); setActiveChannel(null); const d = await api.getGlobalPosts(); setPosts(d); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'explore', activeRealm: null, activeChannel: null })); return; }
    if (realm._id === 'profile') { setViewMode('profile'); setActiveRealm(null); setActiveChannel(null); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'profile', activeRealm: null, activeChannel: null })); return; }
    if (realm._id === 'architect') { setViewMode('architect'); setActiveRealm(null); setActiveChannel(null); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'architect', activeRealm: null, activeChannel: null })); return; }
        if (realm._id === 'social') { setViewMode('social'); setActiveRealm(null); setActiveChannel(null); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'social', activeRealm: null, activeChannel: null })); return; }
        
        // Check if it's the System Realm (Architect Nexus)
        const isSystem = (realm as any).isSystem;
        if (isSystem) {
          setViewMode('architect');
          setActiveChannel(null);
          try {
            const d = await api.getRealmDetails(realm._id);
            setActiveRealm(d);
            const firstChannel = d.channels?.find((c: any) => c.type === 'text' || c.type === 'announcement' || c.type.startsWith('mod_'));
            if (firstChannel) handleSelectChannel(firstChannel);
            localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'architect', activeRealm: d }));
          } catch (e) { addToast(t('settings.access_failed'), 'error'); }
          return;
        }
    
        setViewMode(realm._id); setActiveChannel(null);
        try {
          const d = await api.getRealmDetails(realm._id);
          setActiveRealm(d);
          const firstChannel = d.channels?.find((c: any) => c.type === 'text' || c.type === 'announcement' || c.type.startsWith('mod_'));
          if (firstChannel) handleSelectChannel(firstChannel);
          localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: realm._id, activeRealm: d }));
        } catch (e) { addToast(t('settings.access_failed'), 'error'); }
      };

  const handleSelectChannel = async (channel: IChannel) => {
    if (isMobile) setIsSidebarOpen(false);
    if (activeChannel) socketRef.current?.emit('leave_channel', activeChannel._id);
    let displayName = channel.name;
    if (channel.type === 'dm') { const other = channel.members?.find(m => (m._id || m.id) !== (user?.id || user?._id)); displayName = other ? `@${other.username}` : '@Ghost_Node'; }
    const channelWithFixedName = { ...channel, name: displayName };
    setActiveChannel(channelWithFixedName); socketRef.current?.emit('join_channel', channel._id);
    localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...JSON.parse(localStorage.getItem('Yantravani_view_state') || '{}'), activeChannel: channelWithFixedName }));
    if (['text', 'dm', 'group_dm', 'mod_messages', 'mod_reports', 'mod_users', 'mod_stats'].includes(channel.type)) { 
      try {
        const msgs = await api.getMessages(channel._id); 
        setMessages(msgs); 
        setMatrixRefreshKey(k => k + 1); 
      } catch(e) { setMessages([]); }
    }
    else { const ps = await api.getPosts(channel._id); setPosts(ps); }
  };

  const findChannel = (channelId: string) => {
    for (const dm of dms) {
      if (dm._id === channelId) return dm;
    }
    for (const realm of realms) {
      const channel = realm.channels?.find(c => c._id === channelId);
      if (channel) return channel;
    }
    return null;
  }

  useEffect(() => {
    if (socketRef.current) {
      const s = socketRef.current;
      
      s.on('call_initiated', ({ recipients }: { recipients: any[] }) => {
        addToast((t as any)('app.ringing_users', { count: recipients.length }), 'info');
      });

      s.on('caller_ready', ({ channelId }: { channelId: string }) => {
        const channel = findChannel(channelId);
        if (channel) {
          setActiveChannel({ ...channel, type: 'voice' });
        }
      });

      return () => {
        s.off('call_initiated');
        s.off('caller_ready');
      };
    }
  }, [user, dms, realms, addToast, t]);

  const handleStartCall = (type: 'voice' | 'video') => {
    if (!activeChannel) return;
    socketRef.current?.emit('initiate_call', { 
      channelId: activeChannel._id, 
      type, 
      senderId: user!.id || user!._id, 
      senderName: user!.username, 
      senderAvatar: getIdentityAvatar(user) 
    });
    // We now wait for the 'caller_ready' event instead of joining immediately
  };
  
  const handleAcceptCall = () => {
    if (!incomingCall) return;
    
    // Notify the caller that we've accepted
    socketRef.current?.emit('accept_call', { channelId: incomingCall.channelId });

    // Join the voice channel immediately
    const channel = findChannel(incomingCall.channelId);
    setIncomingCall(null);
    if (channel) {
       setActiveChannel({ ...channel, type: 'voice' });
    }
  };

  const [showRealmModal, setShowRealmModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showIdentitySettings, setShowIdentitySettings] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showGroupDMModal, setShowGroupDMModal] = useState(false);
  const [showRealmSettings, setShowRealmSettings] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleViewOtherProfile = (id: string) => { setViewingUserId(id); setViewMode('view-profile'); setActiveRealm(null); setActiveChannel(null); if (isMobile) setIsSidebarOpen(false); };
  const handleViewSocials = (tab: any, userId: string) => { setSocialTab(tab); setSocialTargetId(userId); setViewMode('social'); setActiveRealm(null); setActiveChannel(null); };
  const handleFollowUser = async (id: string) => { try { const isFollowing = user?.following?.some((f: any) => (f._id || f) === id); const isFriend = user?.friends?.some((f: any) => (f._id || f) === id); const isPending = user?.outboundRequests?.some((f: any) => (f._id || f) === id); if (isFollowing || isFriend) await api.unfollowUser(id); else if (!isPending) await api.syncIdentity(id); else return; const u = await api.getUserProfile(user!.id || user!._id); updateUserState(localStorage.getItem('token') || '', u); setMatrixRefreshKey(k => k + 1); addToast(isFollowing ? t('settings.link_severed') : t('settings.identity_synced'), 'success'); } catch(e:any){ addToast(e.response?.data?.message || t('app.sync_error'), 'error'); } };
  const handleStartDM = async (id: string) => { try { const dm = await api.startDM(id); await loadDMs(); setViewMode('home'); setViewingUserId(null); handleSelectChannel(dm); } catch(e) { addToast(t('settings.link_init_failed'), 'error'); } };
  
  const handleLeaveRealm = async (id: string) => { if (!window.confirm(t('app.sever_link_confirm'))) return; try { await api.leaveRealm(id); loadRealms(); if (activeRealm?._id === id) { setViewMode('home'); setActiveRealm(null); setActiveChannel(null); } addToast(t('app.sever_success'), 'success'); } catch (e) { addToast(t('app.sever_failed'), 'error'); } };
  const handleDeleteRealm = async (id: string) => { if (!window.confirm(t('app.collapse_realm_confirm'))) return; try { await api.deleteRealm(id); loadRealms(); if (activeRealm?._id === id) { setViewMode('home'); setActiveRealm(null); setActiveChannel(null); } addToast(t('app.purge_success'), 'success'); } catch (e) { addToast(t('app.purge_failed'), 'error'); } };

  const handleTagSelect = async (tag: string | null) => { setViewMode('explore'); setActiveRealm(null); setActiveChannel(null); const d = await api.getGlobalPosts(tag || undefined); setPosts(d); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'explore', activeRealm: null, activeChannel: null })); };

  const triggerRefresh = async () => { setIsSyncing(true); try { if (viewMode === 'explore') { const d = await api.getGlobalPosts(); setPosts(d); } else if (activeChannel) { const ps = await api.getPosts(activeChannel._id); setPosts(ps); } await Promise.all([loadDMs(), loadRealms()]); } catch (e) { addToast(t('settings.sync_failed'), 'error'); } finally { setIsSyncing(false); } };

  const showSidebar = viewMode !== 'architect' && viewMode !== 'view-profile' && viewMode !== 'social' && viewMode !== 'explore' && viewMode !== 'profile';
  const showDmsAsMain = isMobile && viewMode === 'home' && !activeChannel;
  const hideHamburger = (viewMode === 'home' && !activeChannel) || viewMode === 'profile' || viewMode === 'social' || viewMode === 'explore' || viewMode === 'view-profile' || activeChannel?.type === 'feed' || activeChannel?.type === 'reels';

  return (
    <div className={`flex h-screen bg-discord-dark text-gray-100 font-sans overflow-hidden select-none ${isMobile ? 'flex-col-reverse' : (dockPosition === 'top' ? 'flex-col' : dockPosition === 'bottom' ? 'flex-col-reverse' : dockPosition === 'left' ? 'flex-row' : 'flex-row-reverse')}`}>
      {isMobile && (
        <div className="h-14 bg-discord-sidebar border-b border-white/5 flex items-center justify-between px-4 z-50">
           <div className="flex items-center space-x-3">{!hideHamburger && <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white transition-all"><Menu size={20} /></button>}<span className="text-[10px] font-black uppercase tracking-[0.2em] text-vani-blue">{activeChannel ? `${['dm','group_dm'].includes(activeChannel.type) ? '@' : '#'}${activeChannel.name}` : (viewMode === 'home' ? t('nav.home') : (activeRealm?.name || viewMode))}</span></div>
           <button onClick={() => setShowSearchModal(true)} className="p-2 text-gray-400 hover:text-white transition-all"><SearchIcon size={18} /></button>
        </div>
      )}

      <AnimatePresence>
        {serverStatus && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md pointer-events-auto">
             <div className={`backdrop-blur-2xl border p-6 rounded-[32px] shadow-2xl flex items-start space-x-4 ${serverStatus === 'rate_limit' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className={`p-3 rounded-2xl ${serverStatus === 'rate_limit' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                   <Zap size={24} className={serverStatus === 'no_response' ? 'animate-pulse' : ''} />
                </div>
                <div className="flex-1">
                   <h4 className={`text-sm font-black uppercase tracking-tighter ${serverStatus === 'rate_limit' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {serverStatus === 'overload' ? t('server.overload') : serverStatus === 'rate_limit' ? t('server.rate_limit') : t('server.cold_start')}
                   </h4>
                   <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-1 uppercase">
                      {serverStatus === 'overload' ? t('server.overload_desc') : serverStatus === 'rate_limit' ? t('server.rate_limit_desc') : t('server.cold_start_desc')}
                   </p>
                </div>
                <button onClick={() => setServerStatus(null)} className="p-2 text-gray-500 hover:text-white transition-all"><X size={18} /></button>
             </div>
          </motion.div>
        )}
        {showConnPill && (
          <motion.div initial={{ y: -100, x: '-50%', opacity: 0 }} animate={{ y: 20, x: '-50%', opacity: 1 }} exit={{ y: -100, x: '-50%', opacity: 0 }} className="fixed top-0 left-1/2 z-[6000] w-fit pointer-events-none">
             <div className={`backdrop-blur-2xl border px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 ${isOnline ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}<span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? t('ui.back_online') : t('ui.connection_lost')}</span></div>
          </motion.div>
        )}
        {incomingCall && (
          <motion.div initial={{ y: -100, x: '-50%', opacity: 0 }} animate={{ y: 20, x: '-50%', opacity: 1 }} exit={{ y: -100, x: '-50%', opacity: 0 }} className="fixed top-0 left-1/2 z-[5000] w-[90%] max-w-sm pointer-events-auto">
             <div className="bg-[#0a0a0c]/90 backdrop-blur-2xl border border-vani-blue/30 rounded-[32px] p-4 shadow-2xl flex items-center justify-between">
                <div className="flex items-center space-x-4 min-w-0"><div className="relative shrink-0"><div className="absolute inset-[-4px] rounded-full border-2 border-vani-blue/50 animate-ping" /><img src={getIdentityAvatar(incomingCall.sender)} className="w-12 h-12 rounded-2xl object-cover border-2 border-white/10" /></div><div className="min-w-0"><h4 className="text-xs font-black text-white uppercase truncate">{incomingCall.sender.username}</h4><p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mt-1">{t('app.incoming_signal')}</p></div></div>
                <div className="flex items-center space-x-2 shrink-0"><button onClick={() => { socketRef.current?.emit('reject_call', { channelId: incomingCall.channelId, senderId: incomingCall.senderId }); setIncomingCall(null); }} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={18} /></button><button onClick={() => handleAcceptCall()} className="p-3 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all"><Phone size={18} /></button>{incomingCall.type === 'video' && <button onClick={() => handleAcceptCall()} className="p-3 bg-vani-blue/10 text-vani-blue rounded-2xl hover:bg-vani-blue hover:text-white transition-all"><Video size={18} /></button>}</div>
             </div>
          </motion.div>
        )}
        {liveSignal && (
          <motion.div initial={{ y: -100, x: '-50%', opacity: 0 }} animate={{ y: 20, x: '-50%', opacity: 1 }} exit={{ y: -100, x: '-50%', opacity: 0 }} className="fixed top-0 left-1/2 z-[5500] w-fit max-w-[90%] pointer-events-auto cursor-pointer" onClick={() => setLiveSignal(null)}>
             <div className="bg-[#050507]/80 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-4 min-w-[200px]"><div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 shrink-0"><img src={getIdentityAvatar(liveSignal.sender)} className="w-full h-full object-cover" /></div><div className="flex flex-col min-w-0"><span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{liveSignal.sender?.username || 'SYSTEM'}</span><span className="text-[8px] text-gray-400 font-mono uppercase tracking-widest truncate">{liveSignal.content}</span></div><div className="shrink-0 ml-2">{liveSignal.type === 'like' && <Heart size={12} className="text-red-500 fill-red-500" />}{liveSignal.type === 'comment' && <MessageCircle size={12} className="text-vani-blue" />}{liveSignal.type === 'follow' && <Users size={12} className="text-vani-accent" />}{liveSignal.type === 'message' && <Send size={12} className="text-green-500" />}</div></div>
          </motion.div>
        )}
      </AnimatePresence>

      <CoreDock 
        realms={realms} selectedRealmId={viewMode} onSelect={handleSelectRealm} onCreate={() => setShowRealmModal(true)} user={user} onSettings={() => setShowIdentitySettings(true)} onProfile={() => setViewMode('profile')} onSeeAllNotifications={() => setShowNotifications(true)} onLogout={() => setShowLogoutModal(true)} onSearch={() => setShowSearchModal(true)} onLeaveRealm={handleLeaveRealm} onDeleteRealm={handleDeleteRealm} onSocial={() => { setViewMode('social'); setSocialTab('friends'); setSocialTargetId(null); setActiveRealm(null); setActiveChannel(null); }} position={isMobile ? 'bottom' : dockPosition} refreshTrigger={matrixRefreshKey} isSearchOpen={showSearchModal} isSettingsOpen={showIdentitySettings} isCreateOpen={showRealmModal || showPostModal || showChannelModal || showGroupDMModal}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && showSidebar && !showDmsAsMain && (
            <motion.div initial={isMobile ? { x: '-100%' } : { width: 0 }} animate={isMobile ? { x: 0 } : { width: sidebarWidth }} exit={isMobile ? { x: '-100%' } : { width: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`flex-shrink-0 flex relative z-40 bg-discord-channel ${isMobile ? 'absolute inset-0 w-[85%] shadow-2xl' : 'border-r border-gray-900'}`}>
              <div className="flex-1 overflow-hidden flex flex-col">
                {isMobile && <div className="h-16 flex items-center justify-between px-4 bg-discord-sidebar border-b border-white/5"><span className="text-[10px] font-black uppercase text-white tracking-widest">{t('common.navigator')}</span><button onClick={() => setIsSidebarOpen(false)}><X size={18} /></button></div>}
                {viewMode === 'home' ? <DMSidebar dms={dms} selectedDmId={activeChannel?._id || null} onSelectDm={handleSelectChannel} user={user} onlineUserIds={onlineUserIds} onInitGroup={() => setShowGroupDMModal(true)} onRetry={loadDMs} isSyncing={isSyncing} /> : <ChannelSidebar realm={activeRealm} channels={activeRealm?.channels || []} selectedChannelId={activeChannel?._id || null} onSelectChannel={handleSelectChannel} user={user!} onAddChannel={() => setShowChannelModal(true)} onSettings={() => setShowRealmSettings(true)} oversightMode={oversightMode} setOversightMode={setOversightMode} />}
              </div>
              {!isMobile && <div onMouseDown={startResizing} className="absolute top-0 -right-0.5 w-1 h-full cursor-col-resize z-40 hover:bg-vani-blue/30 transition-colors" />}
            </motion.div>
          )}
        </AnimatePresence>
        {isMobile && isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30" />}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-discord-dark">
          <motion.div className="flex-1 flex flex-col overflow-hidden" onPanEnd={handleDragEnd}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={viewMode + (activeChannel?._id || '') + (activeRealm?._id || '') + viewingUserId} initial={kineticTransitions ? { opacity: 0, x: 20, filter: 'blur(10px)' } : { opacity: 1 }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={kineticTransitions ? { opacity: 0, x: -20, filter: 'blur(10px)' } : { opacity: 1 }} transition={kineticTransitions ? { type: 'spring', damping: 25, stiffness: 200 } : { duration: 0 }} className="flex-1 flex flex-col overflow-hidden">
                {showDmsAsMain ? <DMSidebar key="dms-main" dms={dms} selectedDmId={null} onSelectDm={handleSelectChannel} user={user} onlineUserIds={onlineUserIds} onInitGroup={() => setShowGroupDMModal(true)} /> : viewMode === 'architect' ? <ArchitectRealm key="architect" oversightMode={oversightMode} setOversightMode={setOversightMode} /> : viewMode === 'social' ? <SocialCorner key="social" currentUser={user!} onStartDM={handleViewOtherProfile} initialTab={socialTab} targetUserId={socialTargetId} /> : viewMode === 'profile' ? <ProfileNode key="profile" user={user!} isOwnProfile={true} onEdit={() => setShowIdentitySettings(true)} currentUser={user} onFollow={handleFollowUser} onViewSocials={handleViewSocials} onSelectTag={handleTagSelect} onViewProfile={handleViewOtherProfile} /> : viewMode === 'view-profile' && viewingUserId ? (
                  <OtherProfileView 
                    key="other" 
                    userId={viewingUserId} 
                    onStartDM={handleStartDM} 
                    currentUser={user!} 
                    onFollow={handleFollowUser} 
                    onViewSocials={handleViewSocials} 
                    onSelectTag={handleTagSelect} 
                    onViewProfile={handleViewOtherProfile} 
                    isOwnProfile={viewingUserId === (user?.id || user?._id)}
                    onEdit={() => setShowIdentitySettings(true)}
                  />
                ) : activeChannel?.type === 'reels' ? <ReelsArea key="reels" posts={posts} onOpenCreateModal={() => {}} currentUser={user!} /> : activeChannel?.type === 'voice' ? <VoiceChannel key="voice" channelId={activeChannel._id} socket={socketRef.current!} currentUser={user!} onLeave={() => setActiveChannel(null)} initialVideo={(activeChannel as any).initialVideo} /> : (activeChannel?.type === 'text' || activeChannel?.type === 'dm' || activeChannel?.type === 'group_dm' || activeChannel?.type.startsWith('mod_')) ? (
                  <ChatArea 
                    key="chat" channelName={activeChannel.name || 'Link'} messages={messages} onSendMessage={(c, pId) => socketRef.current?.emit('send_message', { channelId: activeChannel._id, senderId: user!.id || user!._id, content: c, senderUserObject: user, parentMessageId: pId })} currentUser={user} channelId={activeChannel._id} onViewOtherProfile={handleViewOtherProfile} channelType={activeChannel.type} activeRealm={activeRealm} activeChannel={activeChannel} socket={socketRef.current} onRefreshMatrix={() => setMatrixRefreshKey(k => k + 1)} onGroupSettings={() => setShowGroupSettings(true)} onOpenMedia={(type, url) => setActiveMedia({ type, url })} onStartCall={() => handleStartCall('voice')} 
onStartVideo={() => handleStartCall('video')}
                    oversightMode={oversightMode} setOversightMode={setOversightMode}
                  />
                ) : (activeChannel?.type === 'feed' || viewMode === 'explore') ? (
                  <FeedArea 
                    key="feed" posts={posts} onOpenCreateModal={() => setShowPostModal(true)} currentUser={user!} channelId={activeChannel?._id || 'global'} onViewProfile={handleViewOtherProfile} onSelectTag={handleTagSelect} onRetry={triggerRefresh} isSyncing={isSyncing} liveStreamers={liveStreamers}
                  />
                ) : (
                  <div key="empty" className="flex-1 bg-discord-dark flex flex-col items-center justify-center text-gray-600 p-10 text-center"><div className="w-20 h-20 bg-vani-gradient opacity-10 rounded-[32px] mb-6 rotate-12" /><p className="font-black uppercase tracking-[0.3em] text-[10px]">{t('common.awaiting')}</p></div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-0 lg:p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full h-full lg:h-auto lg:max-w-xl lg:max-h-[80vh] bg-[#0a0a0c] border border-white/5 lg:rounded-[40px] shadow-2xl overflow-hidden flex flex-col"><NotificationsPage onClose={() => setShowNotifications(false)} /></motion.div>
          </div>
        )}
        {activeMedia && <MediaPlayer type={activeMedia.type} url={activeMedia.url} onClose={() => setActiveMedia(null)} />}
        {selectedPostId && <div className="fixed inset-0 z-[4000] flex items-center justify-center"><PostViewerModal post={posts.find(p => p._id === selectedPostId) || { _id: selectedPostId, caption: t('common.loading'), author: { username: '...' }, likes: [], comments: [] } as any} onClose={() => setSelectedPostId(null)} currentUser={user} onUpdate={() => triggerRefresh()} /></div>}
        {showGroupSettings && activeChannel && <GroupSettingsModal group={activeChannel} onClose={() => setShowGroupSettings(false)} onUpdate={() => loadDMs()} currentUser={user!} />}
        {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} />}
      </AnimatePresence>

      {showRealmModal && <CreateRealmModal onClose={() => setShowRealmModal(false)} onSubmit={async (n: string) => { try { await api.createRealm(n); setShowRealmModal(false); loadRealms(); addToast(t('settings.node_established'), 'success'); } catch(e){ addToast(t('settings.creation_failed'), 'error'); } }} />}
      {showPostModal && <CreatePostModal onClose={() => setShowPostModal(false)} onComplete={async () => { if (activeChannel) { const ps = await api.getPosts(activeChannel._id); setPosts(ps); } else { const d = await api.getGlobalPosts(); setPosts(d); } addToast(t('chat.transmission_success'), 'success'); }} channelId={activeChannel?._id || 'global'} currentUser={user!} />}
      {showChannelModal && <CreateChannelModal onClose={() => setShowChannelModal(false)} onSubmit={async (n: string, t_type: string) => { if (!activeRealm) return; try { await api.createChannel(activeRealm._id, n, t_type); const d = await api.getRealmDetails(activeRealm._id); setActiveRealm(d); setShowChannelModal(false); handleSelectChannel(d.channels[d.channels.length-1]); addToast(t('settings.sector_opened'), 'success'); } catch(e){ addToast(t('settings.sector_failed'), 'error'); } }} />}
      {showGroupDMModal && <CreateGroupDMModal onClose={() => setShowGroupDMModal(false)} onSubmit={async (u: string[], n: string) => { try { const g = await api.createGroupDM(u, n); await loadDMs(); setShowGroupDMModal(false); handleSelectChannel(g); addToast(t('settings.group_initialized'), 'success'); } catch(e){ addToast(t('settings.group_failed'), 'error'); } }} currentUser={user!} />}
      {showIdentitySettings && <IdentitySettingsModal user={user!} onClose={() => setShowIdentitySettings(false)} onSave={async (f: FormData) => { try { const u = await api.updateProfile(f); updateUserState(localStorage.getItem('token') || '', u); setShowIdentitySettings(false); addToast(t('settings.calibration_saved'), 'success'); } catch(e){ addToast(t('settings.save_failed'), 'error'); } }} dockPosition={dockPosition} setDockPosition={setDockPosition} kineticTransitions={kineticTransitions} setKineticTransitions={(v) => { setKineticTransitions(v); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...JSON.parse(localStorage.getItem('Yantravani_view_state') || '{}'), kineticTransitions: v })); }} />}
      {showRealmSettings && activeRealm && <RealmSettingsModal realm={activeRealm} onClose={() => setShowRealmSettings(false)} onUpdate={async () => { const d = await api.getRealmDetails(activeRealm._id); setActiveRealm(d); }} />}
      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} onSelectUser={handleViewOtherProfile} onSelectRealm={async (r: IRealm) => { try { await api.joinRealm(r._id); await loadRealms(); handleSelectRealm(r); setShowSearchModal(false); addToast((t as any)('app.joined_realm', { name: r.name }), 'success'); } catch (e) { addToast(t('settings.access_failed'), 'error'); } }} currentUser={user!} />}
    </div>
  );
}

const OtherProfileView = ({ userId, onStartDM, currentUser, onFollow, onViewSocials, onSelectTag, onViewProfile, isOwnProfile = false, onEdit }: { userId: string, onStartDM: (id: string) => void, currentUser: IUser, onFollow: (id: string) => void, onViewSocials: (tab: any, userId: string) => void, onSelectTag?: (tag: string) => void, onViewProfile?: (userId: string) => void, isOwnProfile?: boolean, onEdit?: () => void }) => {
  const { t } = useLanguage();
  const [targetUser, setTargetUser] = useState<IUser | null>(null);
  useEffect(() => { api.getUserProfile(userId).then(setTargetUser); }, [userId]);
  if (!targetUser) return <div className="flex-1 flex items-center justify-center font-black uppercase text-vani-blue animate-pulse">{t('common.scanning')}</div>;
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-discord-dark">
       <div className="flex-1 overflow-y-auto custom-scrollbar"><ProfileNode user={targetUser} isOwnProfile={isOwnProfile} onEdit={onEdit} currentUser={currentUser} onFollow={onFollow} onViewSocials={onViewSocials} onSelectTag={onSelectTag} onViewProfile={onViewProfile} /></div>
       {!isOwnProfile && (
         <div className="p-6 border-t border-white/5 bg-discord-sidebar/30 flex justify-center backdrop-blur-md"><button onClick={() => onStartDM(userId)} className="w-full max-w-sm bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-4"><MessageSquare size={20} /><span>{t('common.init_link')}</span></button></div>
       )}
    </div>
  );
};

interface DashboardProps { user: IUser; updateUserState: (token: string, user: IUser) => void; }

export default App;
