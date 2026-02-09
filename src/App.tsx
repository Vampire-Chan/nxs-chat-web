import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
import { UserSettingsModal as IdentitySettingsModal, SystemSettingsModal } from './components/UserSettingsModal';
import { LogoutModal } from './components/LogoutModal';
import { ArchitectRealm } from './components/ArchitectRealm';
import { VoiceChannel } from './components/VoiceChannel';
import { MediaPlayer } from './components/MediaPlayer';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Search as SearchIcon, MessageSquare } from 'lucide-react';
import HelpPage from './pages/HelpPage';

import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import GuidelinesPage from './pages/GuidelinesPage';
import FAQPage from './pages/FAQPage';

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { isAuthenticated, user, login } = useAuth();
  useLanguage();
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
  const { username, code } = useParams();
  const navigate = useNavigate();
  const savedState = JSON.parse(localStorage.getItem('nexus_view_state') || '{}');

  const [viewMode, setViewMode] = useState<any>(savedState.viewMode || 'home');
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
  
  const socketRef = useRef<Socket | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [dockPosition, setDockPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(isMobile ? 'bottom' : (savedState.dockPosition || 'top'));
  const [sidebarWidth, setSidebarWidth] = useState(savedState.sidebarWidth || 240);
  const [isResizing, setIsResizing] = useState(false);

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

  useEffect(() => {
    const handleLinkEntry = async () => {
      if (username) { try { const res = await api.getUserByHandle(username); handleViewOtherProfile(res.id); navigate('/', { replace: true }); } catch (e) {} }
      if (code) { try { const r = await api.joinRealmWithInvite(code); await loadRealms(); handleSelectRealm(r); navigate('/', { replace: true }); } catch (e) {} }
    };
    handleLinkEntry();
  }, [username, code]);

  useEffect(() => {
    const userId = user?.id || user?._id;
    const token = localStorage.getItem('token');
    if (!user || !userId || !token) return;

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
    const socketUrl = import.meta.env.VITE_API_URL || (isLocal ? `http://${hostname}:5000` : '');

    const s = io(socketUrl, { 
      auth: { token: token },
      query: { userId: userId } 
    });

    socketRef.current = s;

    s.on('receive_message', (msg: IMessage) => { setMessages(prev => [...prev, msg]); setMatrixRefreshKey(k => k + 1); });
    s.on('receive_post', (post: IPost) => { setPosts(prev => [post, ...prev]); });
    s.on('user_status_change', ({ userId, status }: any) => { setOnlineUserIds(prev => { const n = new Set(prev); if (status === 'online') n.add(userId); else n.delete(userId); return n; }); });
    s.on('message_reaction_update', ({ messageId, reactions }: any) => { setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m)); });
    
    s.on('message_updated', (updated: IMessage) => {
      setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
    });

    s.on('channel_metadata_update', (updated: IChannel) => {
      setDms(prev => prev.map(d => d._id === updated._id ? updated : d));
      if (activeChannel?._id === updated._id) setActiveChannel(updated);
    });

    loadRealms(); loadDMs();
    if (activeChannel) handleSelectChannel(activeChannel);
    return () => { s.disconnect(); };
  }, []);

  const loadRealms = async () => { try { const d = await api.getMyRealms(); setRealms(d); } catch(e){} };
  const loadDMs = async () => { try { const d = await api.getMyDMs(); setDms(d); } catch(e){} };

  const handleSelectRealm = async (realm: IRealm | { _id: string }) => {
    setViewingUserId(null); if (isMobile) setIsSidebarOpen(false);
    
    if (realm._id === 'home') { 
      setViewMode('home'); setActiveRealm(null); setActiveChannel(null); loadDMs(); 
      localStorage.setItem('nexus_view_state', JSON.stringify({ ...savedState, viewMode: 'home', activeRealm: null, activeChannel: null }));
      return; 
    }
    if (realm._id === 'explore') { 
      setViewMode('explore'); setActiveRealm(null); setActiveChannel(null); const d = await api.getGlobalPosts(); setPosts(d); 
      localStorage.setItem('nexus_view_state', JSON.stringify({ ...savedState, viewMode: 'explore', activeRealm: null, activeChannel: null }));
      return; 
    }
    if (realm._id === 'profile') { 
      setViewMode('profile'); setActiveRealm(null); setActiveChannel(null); 
      localStorage.setItem('nexus_view_state', JSON.stringify({ ...savedState, viewMode: 'profile', activeRealm: null, activeChannel: null }));
      return; 
    }
    if (realm._id === 'architect') { 
      setViewMode('architect'); setActiveRealm(null); setActiveChannel(null); 
      localStorage.setItem('nexus_view_state', JSON.stringify({ ...savedState, viewMode: 'architect', activeRealm: null, activeChannel: null }));
      return; 
    }
    if (realm._id === 'social') { 
      setViewMode('social'); setActiveRealm(null); setActiveChannel(null); 
      localStorage.setItem('nexus_view_state', JSON.stringify({ ...savedState, viewMode: 'social', activeRealm: null, activeChannel: null }));
      return; 
    }

    setViewMode('realm');
    setActiveChannel(null);
    try { 
      const d = await api.getRealmDetails(realm._id); setActiveRealm(d); 
      const firstChannel = d.channels?.find((c: any) => c.type === 'text' || c.type === 'announcement');
      if (firstChannel) handleSelectChannel(firstChannel);
      localStorage.setItem('nexus_view_state', JSON.stringify({ ...savedState, viewMode: 'realm', activeRealm: d }));
    } catch(e) { alert("Failed to access node."); }
  };

    const handleSelectChannel = async (channel: IChannel) => {

      if (isMobile) setIsSidebarOpen(false);

      if (activeChannel) socketRef.current?.emit('leave_channel', activeChannel._id);

      

      let displayName = channel.name;

      if (channel.type === 'dm') {

        const other = channel.members?.find(m => (m._id || m.id) !== (user?.id || user?._id));

        displayName = other ? `@${other.username}` : '@Ghost_Node';

      } else if (channel.type === 'group_dm') { displayName = channel.name; }

  

      const channelWithFixedName = { ...channel, name: displayName };

      setActiveChannel(channelWithFixedName); 

      socketRef.current?.emit('join_channel', channel._id);
    localStorage.setItem('nexus_view_state', JSON.stringify({ ...JSON.parse(localStorage.getItem('nexus_view_state') || '{}'), activeChannel: channelWithFixedName }));
    if (channel.type === 'text' || channel.type === 'dm' || channel.type === 'group_dm') { const msgs = await api.getMessages(channel._id); setMessages(msgs); setMatrixRefreshKey(k => k + 1); }
    else { const ps = await api.getPosts(channel._id); setPosts(ps); }
  };

  const [showRealmModal, setShowRealmModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showIdentitySettings, setShowIdentitySettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showGroupDMModal, setShowGroupDMModal] = useState(false);
  const [showRealmSettings, setShowRealmSettings] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleViewOtherProfile = (id: string) => { setViewingUserId(id); setViewMode('view-profile'); setActiveRealm(null); setActiveChannel(null); if (isMobile) setIsSidebarOpen(false); };

  const handleFollowUser = async (id: string) => { 
    try { 
      const isFollowing = user?.following?.some((f: any) => (f._id || f) === id);
      const isFriend = user?.friends?.some((f: any) => (f._id || f) === id);
      const isPending = user?.outboundRequests?.some((f: any) => (f._id || f) === id);
      if (isFollowing || isFriend) await api.unfollowUser(id);
      else if (!isPending) await api.syncIdentity(id);
      else return;
      const u = await api.getUserProfile(user!.id || user!._id); updateUserState(localStorage.getItem('token') || '', u); setMatrixRefreshKey(k => k + 1);
    } catch(e:any){ alert(e.response?.data?.message || "Sync error."); } 
  };

  const handleStartDM = async (id: string) => {
    try { const dm = await api.startDM(id); await loadDMs(); setViewMode('home'); setViewingUserId(null); handleSelectChannel(dm); } catch(e) { alert("Link Init Failed"); }
  };

  const showSidebar = viewMode !== 'architect' && viewMode !== 'view-profile' && viewMode !== 'social' && viewMode !== 'explore' && viewMode !== 'notifications' && viewMode !== 'profile';
  
  // MOBILE NAVIGATION FIX: Show DMSidebar as main content if no channel selected in home mode
  const showDmsAsMain = isMobile && viewMode === 'home' && !activeChannel;
  
  // Decide whether to show hamburger
  const hideHamburger = (viewMode === 'home' && !activeChannel) || 
                        viewMode === 'profile' || 
                        viewMode === 'social' || 
                        viewMode === 'explore' || 
                        viewMode === 'view-profile' || 
                        viewMode === 'notifications' || 
                        activeChannel?.type === 'feed' || 
                        activeChannel?.type === 'reels';

  return (
    <div className={`flex h-screen bg-discord-dark text-gray-100 font-sans overflow-hidden ${isMobile ? 'flex-col-reverse' : (dockPosition === 'top' ? 'flex-col' : dockPosition === 'bottom' ? 'flex-col-reverse' : dockPosition === 'left' ? 'flex-row' : 'flex-row-reverse')}`}>
      {isMobile && (
        <div className="h-14 bg-discord-sidebar border-b border-white/5 flex items-center justify-between px-4 z-50">
           <div className="flex items-center space-x-3">
              {!hideHamburger && (
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white transition-all">
                  <Menu size={20} />
                </button>
              )}
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-nexus-blue">
                {activeChannel ? `${activeChannel.type === 'dm' ? '@' : '#'}${activeChannel.name}` : 
                 (viewMode === 'home' ? t('nav.home') : (activeRealm?.name || viewMode))}
              </span>
           </div>
           <button onClick={() => setShowSearchModal(true)} className="p-2 text-gray-400 hover:text-white transition-all">
              <SearchIcon size={18} />
           </button>
        </div>
      )}

      <CoreDock realms={realms} selectedRealmId={viewMode} onSelect={handleSelectRealm} onCreate={() => setShowRealmModal(true)} user={user} onSettings={() => setShowSystemSettings(true)} onProfile={() => setViewMode('profile')} onSeeAllNotifications={() => setViewMode('notifications')} onLogout={() => setShowLogoutModal(true)} onSearch={() => setShowSearchModal(true)} onSocial={() => setViewMode('social')} position={isMobile ? 'bottom' : dockPosition} refreshTrigger={matrixRefreshKey} />

      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && showSidebar && !showDmsAsMain && (
            <motion.div initial={isMobile ? { x: '-100%' } : { width: 0 }} animate={isMobile ? { x: 0 } : { width: sidebarWidth }} exit={isMobile ? { x: '-100%' } : { width: 0 }} className={`flex-shrink-0 flex relative z-40 bg-discord-channel ${isMobile ? 'absolute inset-0 w-[85%] shadow-2xl' : 'border-r border-gray-900'}`}>
              <div className="flex-1 overflow-hidden flex flex-col">
                {isMobile && <div className="h-16 flex items-center justify-between px-4 bg-discord-sidebar border-b border-white/5"><span className="text-[10px] font-black uppercase text-white tracking-widest">Navigator</span><button onClick={() => setIsSidebarOpen(false)}><X size={18} /></button></div>}
                {viewMode === 'home' ? (
                  <DMSidebar dms={dms} selectedDmId={activeChannel?._id || null} onSelectDm={handleSelectChannel} user={user} onlineUserIds={onlineUserIds} onInitGroup={() => setShowGroupDMModal(true)} />
                ) : (
                  <ChannelSidebar realm={activeRealm} channels={activeRealm?.channels || []} selectedChannelId={activeChannel?._id || null} onSelectChannel={handleSelectChannel} user={user!} onAddChannel={() => setShowChannelModal(true)} onSettings={() => setShowRealmSettings(true)} />
                )}
              </div>
              {!isMobile && <div onMouseDown={startResizing} className="absolute top-0 -right-0.5 w-1 h-full cursor-col-resize z-40 hover:bg-nexus-blue/30 transition-colors" />}
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30" />}

        <main className="flex-1 overflow-hidden relative flex flex-col bg-discord-dark">
          <AnimatePresence mode="wait">
            {showDmsAsMain ? (
              <DMSidebar key="dms-main" dms={dms} selectedDmId={null} onSelectDm={handleSelectChannel} user={user} onlineUserIds={onlineUserIds} onInitGroup={() => setShowGroupDMModal(true)} />
            ) : viewMode === 'architect' ? <ArchitectRealm key="architect" /> : viewMode === 'social' ? <SocialCorner key="social" currentUser={user!} onStartDM={handleViewOtherProfile} /> : viewMode === 'profile' ? <ProfileNode key="profile" user={user!} isOwnProfile={true} onEdit={() => setShowIdentitySettings(true)} currentUser={user} onFollow={handleFollowUser} /> : viewMode === 'view-profile' && viewingUserId ? <OtherProfileView key="other" userId={viewingUserId} onStartDM={handleStartDM} currentUser={user!} onFollow={handleFollowUser} /> : viewMode === 'notifications' ? <NotificationsPage key="notifications" onClose={() => setViewMode('home')} /> : activeChannel?.type === 'reels' ? <ReelsArea key="reels" posts={posts} onOpenCreateModal={() => {}} currentUser={user!} /> : activeChannel?.type === 'voice' ? <VoiceChannel key="voice" channelId={activeChannel._id} socket={socketRef.current!} currentUser={user!} onLeave={() => setActiveChannel(null)} /> : (activeChannel?.type === 'text' || activeChannel?.type === 'dm' || activeChannel?.type === 'group_dm') ? (
              <ChatArea 
                key="chat" 
                channelName={activeChannel.name || 'Link'} 
                messages={messages} 
                onSendMessage={(c) => socketRef.current?.emit('send_message', { channelId: activeChannel._id, senderId: user!.id || user!._id, content: c, senderUserObject: user })} 
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
              />
            ) : (activeChannel?.type === 'feed' || viewMode === 'explore') ? (
              <FeedArea key="feed" posts={posts} onOpenCreateModal={() => setShowPostModal(true)} currentUser={user!} channelId={activeChannel?._id || 'global'} />
            ) : (
              <div key="empty" className="flex-1 bg-discord-dark flex flex-col items-center justify-center text-gray-600 p-10 text-center"><div className="w-20 h-20 bg-nexus-gradient opacity-10 rounded-[32px] mb-6 rotate-12" /><p className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting Node Connection.</p></div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {activeMedia && <MediaPlayer type={activeMedia.type} url={activeMedia.url} onClose={() => setActiveMedia(null)} />}
        {showGroupSettings && activeChannel && <GroupSettingsModal group={activeChannel} onClose={() => setShowGroupSettings(false)} onUpdate={() => loadDMs()} currentUser={user!} />}
        {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} />}
      </AnimatePresence>

      {showRealmModal && <CreateRealmModal onClose={() => setShowRealmModal(false)} onSubmit={async (n: string) => { try { await api.createRealm(n); setShowRealmModal(false); loadRealms(); } catch(e){} }} />}
      {showPostModal && (
        <CreatePostModal 
          onClose={() => setShowPostModal(false)} 
          onComplete={async () => { 
            if (activeChannel) {
              const ps = await api.getPosts(activeChannel._id);
              setPosts(ps);
            } else {
              const d = await api.getGlobalPosts(); 
              setPosts(d); 
            }
          }} 
          channelId={activeChannel?._id || 'global'}
        />
      )}
      {showChannelModal && <CreateChannelModal onClose={() => setShowChannelModal(false)} onSubmit={async (n: string, t: string) => { if (!activeRealm) return; try { await api.createChannel(activeRealm._id, n, t); const d = await api.getRealmDetails(activeRealm._id); setActiveRealm(d); setShowChannelModal(false); handleSelectChannel(d.channels[d.channels.length-1]); } catch(e){} }} />}
      {showGroupDMModal && <CreateGroupDMModal onClose={() => setShowGroupDMModal(false)} onSubmit={async (u: string[], n: string) => { try { const g = await api.createGroupDM(u, n); await loadDMs(); setShowGroupDMModal(false); handleSelectChannel(g); } catch(e){} }} currentUser={user!} />}
      {showIdentitySettings && <IdentitySettingsModal user={user!} onClose={() => setShowIdentitySettings(false)} onSave={async (f: FormData) => { try { const u = await api.updateProfile(f); updateUserState(localStorage.getItem('token') || '', u); setShowIdentitySettings(false); } catch(e){} }} />}
      {showSystemSettings && <SystemSettingsModal user={user!} onClose={() => setShowSystemSettings(false)} dockPosition={dockPosition} setDockPosition={setDockPosition} />}
      {showRealmSettings && activeRealm && <RealmSettingsModal realm={activeRealm} onClose={() => setShowRealmSettings(false)} onUpdate={async () => { const d = await api.getRealmDetails(activeRealm._id); setActiveRealm(d); }} />}
      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} onSelectUser={handleViewOtherProfile} onSelectRealm={async (r: IRealm) => { try { await api.joinRealm(r._id); await loadRealms(); handleSelectRealm(r); setShowSearchModal(false); } catch (e) {} }} currentUser={user!} />}
    </div>
  );
}

const OtherProfileView = ({ userId, onStartDM, currentUser, onFollow }: { userId: string, onStartDM: (id: string) => void, currentUser: IUser, onFollow: (id: string) => void }) => {
  const [targetUser, setTargetUser] = useState<IUser | null>(null);
  useEffect(() => { api.getUserProfile(userId).then(setTargetUser); }, [userId]);
  if (!targetUser) return <div className="flex-1 flex items-center justify-center font-black uppercase text-nexus-blue animate-pulse">Scanning...</div>;
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-discord-dark">
       <div className="flex-1 overflow-y-auto custom-scrollbar"><ProfileNode user={targetUser} isOwnProfile={false} currentUser={currentUser} onFollow={onFollow} /></div>
       <div className="p-6 border-t border-white/5 bg-discord-sidebar/30 flex justify-center backdrop-blur-md"><button onClick={() => onStartDM(userId)} className="w-full max-w-sm bg-nexus-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-4"><MessageSquare size={20} /><span>Initialize Link</span></button></div>
    </div>
  );
};

interface DashboardProps { user: IUser; updateUserState: (token: string, user: IUser) => void; }

export default App;