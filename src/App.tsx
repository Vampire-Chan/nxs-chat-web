import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { api } from './services/api';
import type { IRealm, IChannel, IMessage, IPost, IUser } from './services/api';
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
import { UserSettingsModal as IdentitySettingsModal } from './components/UserSettingsModal';
import { LogoutModal } from './components/LogoutModal';
import { ArchitectRealm } from './components/ArchitectRealm';
import { VoiceChannel } from './components/VoiceChannel';
import { MediaPlayer } from './components/MediaPlayer';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { Menu, X, Search as SearchIcon, MessageSquare, Phone, Video, Wifi, WifiOff, Heart, MessageCircle, Users, Send } from 'lucide-react';
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

  if (isBooting) return <LaunchScreen progress={bootProgress} />;

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/guidelines" element={<GuidelinesPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/app" /> : <AuthPage />} />

      {/* APP ROUTES (PROTECTED) */}
      <Route path="/app" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      <Route path="/app/id/:username" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      <Route path="/app/join/:code" element={isAuthenticated ? <Dashboard user={user!} updateUserState={login} /> : <Navigate to="/login" />} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function Dashboard({ user, updateUserState }: DashboardProps) {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { username, code } = useParams();
  const navigate = useNavigate();
  const savedState = JSON.parse(localStorage.getItem('Yantravani_view_state') || '{}');

  const [viewMode, setViewMode] = useState<any>(savedState.viewMode || 'home');
  const [socialTab, setSocialTab] = useState<'friends' | 'following' | 'followers' | 'invasions'>('friends');
  const [socialTargetId, setSocialTargetId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [dockPosition, setDockPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(isMobile ? 'bottom' : (savedState.dockPosition || 'top'));
  const [sidebarWidth, setSidebarWidth] = useState(savedState.sidebarWidth || 240);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setShowConnPill(true); setTimeout(() => setShowConnPill(false), 3000); };
    const handleOffline = () => { setIsOnline(false); setShowConnPill(true); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // BROWSER NOTIFICATION PERMISSION
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const sendLocalNotification = (title: string, body: string, icon?: string) => {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, {
        body,
        icon: icon || '/nexus.svg',
        tag: 'yantravani-sync'
      });
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
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;
    const threshold = 50;
    if (info.offset.x > threshold && !isSidebarOpen) setIsSidebarOpen(true);
    else if (info.offset.x < -threshold && isSidebarOpen) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handleLinkEntry = async () => {
      if (username) { try { const res = await api.getUserByHandle(username); handleViewOtherProfile(res.id); navigate('/', { replace: true }); } catch (e) {} }
      if (code) { try { const r = await api.joinRealmWithInvite(code); await loadRealms(); handleSelectRealm(r); navigate('/', { replace: true }); } catch (e) {} }
    };
    handleLinkEntry();
  }, [username, code]);

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

    const s = io(socketUrl, { 
      auth: { token: token },
      query: { userId: userId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    socketRef.current = s;

    s.on('new_notification', (notif: any) => {
      setLiveSignal(notif);
      setTimeout(() => setLiveSignal(null), 5000);
    });

    s.on('receive_message', (msg: any) => { 
      if (msg.channel === activeChannel?._id || msg.channel?._id === activeChannel?._id) {
        setMessages(prev => [...prev, msg]); 
      } else {
        // Show Samsung-style pill for in-app msg
        setLiveSignal({
          sender: msg.sender,
          content: msg.content || "Incoming Transmission...",
          type: 'message'
        });
        setTimeout(() => setLiveSignal(null), 5000);

        // Browser level fallback
        sendLocalNotification(
          `New signal from ${msg.sender.username}`,
          msg.content || "Incoming Visual Data"
        );
      }
      loadDMs();
      setMatrixRefreshKey(k => k + 1); 
    });

    s.on('incoming_call', (data: any) => {
      setIncomingCall(data);
      sendLocalNotification(
        `Incoming ${data.type} call`,
        `${data.sender.username} is establishing a link...`
      );
    });
    
    s.on('identity_sync_update', async () => {
      try {
        const u = await api.getUserProfile(user?.id || user?._id || '');
        updateUserState(localStorage.getItem('token') || '', u);
        loadDMs();
        loadRealms();
        setMatrixRefreshKey(k => k + 1);
      } catch (e) {}
    });

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

  const loadRealms = async () => { 
    setIsSyncing(true);
    try { const d = await api.getMyRealms(); setRealms(d); } catch(e){} 
    finally { setIsSyncing(false); }
  };
  const loadDMs = async () => { 
    setIsSyncing(true);
    try { const d = await api.getMyDMs(); setDms(d); } catch(e){} 
    finally { setIsSyncing(false); }
  };

  const handleSelectRealm = async (realm: IRealm | { _id: string }) => {
    setViewingUserId(null); if (isMobile) setIsSidebarOpen(false);
    
    if (realm._id === 'home') { setViewMode('home'); setActiveRealm(null); setActiveChannel(null); loadDMs(); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'home', activeRealm: null, activeChannel: null })); return; }
    if (realm._id === 'explore') { setViewMode('explore'); setActiveRealm(null); setActiveChannel(null); const d = await api.getGlobalPosts(); setPosts(d); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'explore', activeRealm: null, activeChannel: null })); return; }
    if (realm._id === 'profile') { setViewMode('profile'); setActiveRealm(null); setActiveChannel(null); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'profile', activeRealm: null, activeChannel: null })); return; }
    if (realm._id === 'architect') { setViewMode('architect'); setActiveRealm(null); setActiveChannel(null); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'architect', activeRealm: null, activeChannel: null })); return; }
    if (realm._id === 'social') { setViewMode('social'); setActiveRealm(null); setActiveChannel(null); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'social', activeRealm: null, activeChannel: null })); return; }

    setViewMode('realm'); setActiveChannel(null);
    try { const d = await api.getRealmDetails(realm._id); setActiveRealm(d); const firstChannel = d.channels?.find((c: any) => c.type === 'text' || c.type === 'announcement'); if (firstChannel) handleSelectChannel(firstChannel); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'realm', activeRealm: d })); } catch(e) { addToast("Failed to access node.", 'error'); }
  };

  const handleSelectChannel = async (channel: IChannel) => {
    if (isMobile) setIsSidebarOpen(false);
    if (activeChannel) socketRef.current?.emit('leave_channel', activeChannel._id);
    let displayName = channel.name;
    if (channel.type === 'dm') { const other = channel.members?.find(m => (m._id || m.id) !== (user?.id || user?._id)); displayName = other ? `@${other.username}` : '@Ghost_Node'; }
    const channelWithFixedName = { ...channel, name: displayName };
    setActiveChannel(channelWithFixedName); socketRef.current?.emit('join_channel', channel._id);
    localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...JSON.parse(localStorage.getItem('Yantravani_view_state') || '{}'), activeChannel: channelWithFixedName }));
    if (channel.type === 'text' || channel.type === 'dm' || channel.type === 'group_dm') { const msgs = await api.getMessages(channel._id); setMessages(msgs); setMatrixRefreshKey(k => k + 1); }
    else { const ps = await api.getPosts(channel._id); setPosts(ps); }
  };

  const handleAcceptCall = (type: 'voice' | 'video') => {
    if (!incomingCall) return;
    const channel = dms.find(d => d._id === incomingCall.channelId);
    if (channel) {
      handleSelectChannel(channel);
      setActiveChannel({ ...channel, type: 'voice', initialVideo: type === 'video' } as any);
    }
    setIncomingCall(null);
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
  const handleFollowUser = async (id: string) => { try { const isFollowing = user?.following?.some((f: any) => (f._id || f) === id); const isFriend = user?.friends?.some((f: any) => (f._id || f) === id); const isPending = user?.outboundRequests?.some((f: any) => (f._id || f) === id); if (isFollowing || isFriend) await api.unfollowUser(id); else if (!isPending) await api.syncIdentity(id); else return; const u = await api.getUserProfile(user!.id || user!._id); updateUserState(localStorage.getItem('token') || '', u); setMatrixRefreshKey(k => k + 1); addToast(isFollowing ? "Link Severed" : "Identity Synced", 'success'); } catch(e:any){ addToast(e.response?.data?.message || "Sync error.", 'error'); } };
  const handleStartDM = async (id: string) => { try { const dm = await api.startDM(id); await loadDMs(); setViewMode('home'); setViewingUserId(null); handleSelectChannel(dm); } catch(e) { addToast("Link Init Failed", 'error'); } };
  const handleTagSelect = async (tag: string | null) => { setViewMode('explore'); setActiveRealm(null); setActiveChannel(null); const d = await api.getGlobalPosts(tag || undefined); setPosts(d); localStorage.setItem('Yantravani_view_state', JSON.stringify({ ...savedState, viewMode: 'explore', activeRealm: null, activeChannel: null })); };

  const triggerRefresh = async () => {
    setIsSyncing(true);
    try {
      if (viewMode === 'explore') {
        const d = await api.getGlobalPosts();
        setPosts(d);
      } else if (activeChannel) {
        const ps = await api.getPosts(activeChannel._id);
        setPosts(ps);
      }
      await Promise.all([loadDMs(), loadRealms()]);
    } catch (e) {
      addToast("Sync failed", 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const showSidebar = viewMode !== 'architect' && viewMode !== 'view-profile' && viewMode !== 'social' && viewMode !== 'explore' && viewMode !== 'profile';
  const showDmsAsMain = isMobile && viewMode === 'home' && !activeChannel;
  const hideHamburger = (viewMode === 'home' && !activeChannel) || viewMode === 'profile' || viewMode === 'social' || viewMode === 'explore' || viewMode === 'view-profile' || activeChannel?.type === 'feed' || activeChannel?.type === 'reels';

  return (
    <div className={`flex h-screen bg-discord-dark text-gray-100 font-sans overflow-hidden select-none ${isMobile ? 'flex-col-reverse' : (dockPosition === 'top' ? 'flex-col' : dockPosition === 'bottom' ? 'flex-col-reverse' : dockPosition === 'left' ? 'flex-row' : 'flex-row-reverse')}`}>
      {isMobile && (
        <div className="h-14 bg-discord-sidebar border-b border-white/5 flex items-center justify-between px-4 z-50">
           <div className="flex items-center space-x-3">{!hideHamburger && <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white transition-all"><Menu size={20} /></button>}<span className="text-[10px] font-black uppercase tracking-[0.2em] text-vani-blue">{activeChannel ? `${activeChannel.type === 'dm' ? '@' : '#'}${activeChannel.name}` : (viewMode === 'home' ? t('nav.home') : (activeRealm?.name || viewMode))}</span></div>
           <button onClick={() => setShowSearchModal(true)} className="p-2 text-gray-400 hover:text-white transition-all"><SearchIcon size={18} /></button>
        </div>
      )}

      <AnimatePresence>
        {showConnPill && (
          <motion.div initial={{ y: -100, x: '-50%', opacity: 0 }} animate={{ y: 20, x: '-50%', opacity: 1 }} exit={{ y: -100, x: '-50%', opacity: 0 }} className="fixed top-0 left-1/2 z-[6000] w-fit pointer-events-none">
             <div className={`backdrop-blur-2xl border px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 ${isOnline ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Back_Online' : 'Connection_Lost'}</span>
             </div>
          </motion.div>
        )}

        {incomingCall && (
          <motion.div 
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 20, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className="fixed top-0 left-1/2 z-[5000] w-[90%] max-w-sm pointer-events-auto"
          >
             <div className="bg-[#0a0a0c]/90 backdrop-blur-2xl border border-vani-blue/30 rounded-[32px] p-4 shadow-[0_20px_60px_rgba(0,210,255,0.2)] flex items-center justify-between">
                <div className="flex items-center space-x-4 min-w-0">
                   <div className="relative shrink-0">
                      <div className="absolute inset-[-4px] rounded-full border-2 border-vani-blue/50 animate-ping" />
                      <img src={incomingCall.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.sender.username}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white/10" />
                   </div>
                   <div className="min-w-0">
                      <h4 className="text-xs font-black text-white uppercase truncate">{incomingCall.sender.username}</h4>
                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest leading-none mt-1">Incoming_{incomingCall.type}_Signal</p>
                   </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                   <button onClick={() => setIncomingCall(null)} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={18} /></button>
                   <button onClick={() => handleAcceptCall('voice')} className="p-3 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all"><Phone size={18} /></button>
                   {incomingCall.type === 'video' && (
                     <button onClick={() => handleAcceptCall('video')} className="p-3 bg-vani-blue/10 text-vani-blue rounded-2xl hover:bg-vani-blue hover:text-white transition-all"><Video size={18} /></button>
                   )}
                </div>
             </div>
          </motion.div>
        )}

        {liveSignal && (
          <motion.div 
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 20, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className="fixed top-0 left-1/2 z-[5500] w-fit max-w-[90%] pointer-events-auto cursor-pointer"
            onClick={() => setLiveSignal(null)}
          >
             <div className="bg-[#050507]/80 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-4 min-w-[200px]">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 shrink-0">
                   <img src={liveSignal.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liveSignal.sender?.username}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">
                      {liveSignal.sender?.username || 'SYSTEM'}
                   </span>
                   <span className="text-[8px] text-gray-400 font-mono uppercase tracking-widest truncate">
                      {liveSignal.content}
                   </span>
                </div>
                <div className="shrink-0 ml-2">
                   {liveSignal.type === 'like' && <Heart size={12} className="text-red-500 fill-red-500" />}
                   {liveSignal.type === 'comment' && <MessageCircle size={12} className="text-vani-blue" />}
                   {liveSignal.type === 'follow' && <Users size={12} className="text-vani-accent" />}
                   {liveSignal.type === 'message' && <Send size={12} className="text-green-500" />}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CoreDock 
        realms={realms} 
        selectedRealmId={viewMode} 
        onSelect={handleSelectRealm} 
        onCreate={() => setShowRealmModal(true)} 
        user={user} 
        onSettings={() => setShowIdentitySettings(true)} 
        onProfile={() => setViewMode('profile')} 
        onSeeAllNotifications={() => setShowNotifications(true)} 
        onLogout={() => setShowLogoutModal(true)} 
        onSearch={() => setShowSearchModal(true)} 
        onSocial={() => { setViewMode('social'); setSocialTab('friends'); setSocialTargetId(null); setActiveRealm(null); setActiveChannel(null); }} 
        position={isMobile ? 'bottom' : dockPosition} 
        refreshTrigger={matrixRefreshKey} 
        isSearchOpen={showSearchModal}
        isSettingsOpen={showIdentitySettings}
        isCreateOpen={showRealmModal || showPostModal || showChannelModal || showGroupDMModal}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && showSidebar && !showDmsAsMain && (
            <motion.div 
              initial={isMobile ? { x: '-100%' } : { width: 0 }} 
              animate={isMobile ? { x: 0 } : { width: sidebarWidth }} 
              exit={isMobile ? { x: '-100%' } : { width: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`flex-shrink-0 flex relative z-40 bg-discord-channel ${isMobile ? 'absolute inset-0 w-[85%] shadow-2xl' : 'border-r border-gray-900'}`}
            >
              <div className="flex-1 overflow-hidden flex flex-col">
                {isMobile && <div className="h-16 flex items-center justify-between px-4 bg-discord-sidebar border-b border-white/5"><span className="text-[10px] font-black uppercase text-white tracking-widest">{t('common.navigator')}</span><button onClick={() => setIsSidebarOpen(false)}><X size={18} /></button></div>}
                {viewMode === 'home' ? (
                  <DMSidebar 
                    dms={dms} 
                    selectedDmId={activeChannel?._id || null} 
                    onSelectDm={handleSelectChannel} 
                    user={user} 
                    onlineUserIds={onlineUserIds} 
                    onInitGroup={() => setShowGroupDMModal(true)} 
                    onRetry={loadDMs}
                    isSyncing={isSyncing}
                  />
                ) : (
                  <ChannelSidebar 
                    realm={activeRealm} 
                    channels={activeRealm?.channels || []} 
                    selectedChannelId={activeChannel?._id || null} 
                    onSelectChannel={handleSelectChannel} 
                    user={user!} 
                    onAddChannel={() => setShowChannelModal(true)} 
                    onSettings={() => setShowRealmSettings(true)} 
                  />
                )}
              </div>
              {!isMobile && <div onMouseDown={startResizing} className="absolute top-0 -right-0.5 w-1 h-full cursor-col-resize z-40 hover:bg-vani-blue/30 transition-colors" />}
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30" />}

        <main className="flex-1 overflow-hidden relative flex flex-col bg-discord-dark">
          <motion.div 
            className="flex-1 flex flex-col overflow-hidden"
            onPanEnd={handleDragEnd}
          >
            <AnimatePresence mode="wait">
              {showDmsAsMain ? <DMSidebar key="dms-main" dms={dms} selectedDmId={null} onSelectDm={handleSelectChannel} user={user} onlineUserIds={onlineUserIds} onInitGroup={() => setShowGroupDMModal(true)} /> : viewMode === 'architect' ? <ArchitectRealm key="architect" /> : viewMode === 'social' ? <SocialCorner key="social" currentUser={user!} onStartDM={handleViewOtherProfile} initialTab={socialTab} targetUserId={socialTargetId} /> : viewMode === 'profile' ? <ProfileNode key="profile" user={user!} isOwnProfile={true} onEdit={() => setShowIdentitySettings(true)} currentUser={user} onFollow={handleFollowUser} onViewSocials={handleViewSocials} onSelectTag={handleTagSelect} onViewProfile={handleViewOtherProfile} /> : viewMode === 'view-profile' && viewingUserId ? <OtherProfileView key="other" userId={viewingUserId} onStartDM={handleStartDM} currentUser={user!} onFollow={handleFollowUser} onViewSocials={handleViewSocials} onSelectTag={handleTagSelect} onViewProfile={handleViewOtherProfile} /> : activeChannel?.type === 'reels' ? <ReelsArea key="reels" posts={posts} onOpenCreateModal={() => {}} currentUser={user!} /> : activeChannel?.type === 'voice' ? <VoiceChannel key="voice" channelId={activeChannel._id} socket={socketRef.current!} currentUser={user!} onLeave={() => setActiveChannel(null)} initialVideo={(activeChannel as any).initialVideo} /> : (activeChannel?.type === 'text' || activeChannel?.type === 'dm' || activeChannel?.type === 'group_dm') ? (
                <ChatArea 
                  key="chat" 
                  channelName={activeChannel.name || 'Link'} 
                  messages={messages} 
                  onSendMessage={(c, pId) => socketRef.current?.emit('send_message', { channelId: activeChannel._id, senderId: user!.id || user!._id, content: c, senderUserObject: user, parentMessageId: pId })} 
                  currentUser={user} 
                  channelId={activeChannel._id} 
                  onViewOtherProfile={handleViewOtherProfile} 
                  channelType={activeChannel.type} 
                  activeRealm={activeRealm} 
                  activeChannel={activeChannel} 
                  socket={socketRef.current} 
                  onRefreshMatrix={() => setMatrixRefreshKey(k => k + 1)} 
                  onGroupSettings={() => setShowGroupSettings(true)} 
                  onOpenMedia={(type, url) => setActiveMedia({ type, url })}
                  onStartCall={() => {
                    socketRef.current?.emit('initiate_call', { channelId: activeChannel._id, type: 'voice', senderId: user?.id || user?._id, senderName: user?.username, senderAvatar: user?.avatar });
                    setActiveChannel({ ...activeChannel, type: 'voice' });
                  }}
                  onStartVideo={() => {
                    socketRef.current?.emit('initiate_call', { channelId: activeChannel._id, type: 'video', senderId: user?.id || user?._id, senderName: user?.username, senderAvatar: user?.avatar });
                    setActiveChannel({ ...activeChannel, type: 'voice', initialVideo: true } as any);
                  }}
                />
              ) : (activeChannel?.type === 'feed' || viewMode === 'explore') ? (
                <FeedArea 
                  key="feed" 
                  posts={posts} 
                  onOpenCreateModal={() => setShowPostModal(true)} 
                  currentUser={user!} 
                  channelId={activeChannel?._id || 'global'} 
                  onViewProfile={handleViewOtherProfile} 
                  onSelectTag={handleTagSelect} 
                  onRetry={triggerRefresh}
                  isSyncing={isSyncing}
                  liveStreamers={liveStreamers}
                />
              ) : (
                <div key="empty" className="flex-1 bg-discord-dark flex flex-col items-center justify-center text-gray-600 p-10 text-center"><div className="w-20 h-20 bg-vani-gradient opacity-10 rounded-[32px] mb-6 rotate-12" /><p className="font-black uppercase tracking-[0.3em] text-[10px]">{t('common.awaiting')}</p></div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-0 lg:p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full h-full lg:h-auto lg:max-w-xl lg:max-h-[80vh] bg-[#0a0a0c] border border-white/5 lg:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                <NotificationsPage onClose={() => setShowNotifications(false)} />
             </motion.div>
          </div>
        )}
        {activeMedia && <MediaPlayer type={activeMedia.type} url={activeMedia.url} onClose={() => setActiveMedia(null)} />}
        {showGroupSettings && activeChannel && <GroupSettingsModal group={activeChannel} onClose={() => setShowGroupSettings(false)} onUpdate={() => loadDMs()} currentUser={user!} />}
        {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} />}
      </AnimatePresence>

      {showRealmModal && <CreateRealmModal onClose={() => setShowRealmModal(false)} onSubmit={async (n: string) => { try { await api.createRealm(n); setShowRealmModal(false); loadRealms(); addToast("Node Established", 'success'); } catch(e){ addToast("Creation Failed", 'error'); } }} />}
      {showPostModal && <CreatePostModal onClose={() => setShowPostModal(false)} onComplete={async () => { if (activeChannel) { const ps = await api.getPosts(activeChannel._id); setPosts(ps); } else { const d = await api.getGlobalPosts(); setPosts(d); } addToast("Transmission Sent", 'success'); }} channelId={activeChannel?._id || 'global'} currentUser={user!} />}
      {showChannelModal && <CreateChannelModal onClose={() => setShowChannelModal(false)} onSubmit={async (n: string, t: string) => { if (!activeRealm) return; try { await api.createChannel(activeRealm._id, n, t); const d = await api.getRealmDetails(activeRealm._id); setActiveRealm(d); setShowChannelModal(false); handleSelectChannel(d.channels[d.channels.length-1]); addToast("Sector Opened", 'success'); } catch(e){ addToast("Sector Failed", 'error'); } }} />}
      {showGroupDMModal && <CreateGroupDMModal onClose={() => setShowGroupDMModal(false)} onSubmit={async (u: string[], n: string) => { try { const g = await api.createGroupDM(u, n); await loadDMs(); setShowGroupDMModal(false); handleSelectChannel(g); addToast("Group Initialized", 'success'); } catch(e){ addToast("Group Failed", 'error'); } }} currentUser={user!} />}
      {showIdentitySettings && <IdentitySettingsModal user={user!} onClose={() => setShowIdentitySettings(false)} onSave={async (f: FormData) => { try { const u = await api.updateProfile(f); updateUserState(localStorage.getItem('token') || '', u); setShowIdentitySettings(false); addToast("Calibration Saved", 'success'); } catch(e){ addToast("Save Failed", 'error'); } }} dockPosition={dockPosition} setDockPosition={setDockPosition} />}
      {showRealmSettings && activeRealm && <RealmSettingsModal realm={activeRealm} onClose={() => setShowRealmSettings(false)} onUpdate={async () => { const d = await api.getRealmDetails(activeRealm._id); setActiveRealm(d); }} />}
      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} onSelectUser={handleViewOtherProfile} onSelectRealm={async (r: IRealm) => { try { await api.joinRealm(r._id); await loadRealms(); handleSelectRealm(r); setShowSearchModal(false); addToast(`Joined ${r.name}`, 'success'); } catch (e) { addToast("Join Failed", 'error'); } }} currentUser={user!} />}
    </div>
  );
}

const OtherProfileView = ({ userId, onStartDM, currentUser, onFollow, onViewSocials, onSelectTag, onViewProfile }: { userId: string, onStartDM: (id: string) => void, currentUser: IUser, onFollow: (id: string) => void, onViewSocials: (tab: any, userId: string) => void, onSelectTag?: (tag: string) => void, onViewProfile?: (userId: string) => void }) => {
  const { t } = useLanguage();
  const [targetUser, setTargetUser] = useState<IUser | null>(null);
  useEffect(() => { api.getUserProfile(userId).then(setTargetUser); }, [userId]);
  if (!targetUser) return <div className="flex-1 flex items-center justify-center font-black uppercase text-vani-blue animate-pulse">{t('common.scanning')}</div>;
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-discord-dark">
       <div className="flex-1 overflow-y-auto custom-scrollbar"><ProfileNode user={targetUser} isOwnProfile={false} currentUser={currentUser} onFollow={onFollow} onViewSocials={onViewSocials} onSelectTag={onSelectTag} onViewProfile={onViewProfile} /></div>
       <div className="p-6 border-t border-white/5 bg-discord-sidebar/30 flex justify-center backdrop-blur-md"><button onClick={() => onStartDM(userId)} className="w-full max-w-sm bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-4"><MessageSquare size={20} /><span>{t('common.init_link')}</span></button></div>
    </div>
  );
};

interface DashboardProps { user: IUser; updateUserState: (token: string, user: IUser) => void; }

export default App;
