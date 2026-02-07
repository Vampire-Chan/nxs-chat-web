import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import type { IRealm, IChannel, IMessage, IPost, IUser } from './services/api';
import { TopNavbar as CoreDock } from './components/RealmSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { FeedArea } from './components/FeedArea';
import { ReelsArea } from './components/ReelsArea';
import { MemberSidebar } from './components/MemberSidebar';
import { DMSidebar } from './components/DMSidebar';
import { ProfileNode } from './components/ProfileNode';
import { NotificationsPage } from './components/NotificationsPage';
import { SearchModal } from './components/SearchModal';
import { LaunchScreen } from './components/LaunchScreen';
import { SocialCorner } from './components/SocialCorner';
import { CreateRealmModal, CreatePostModal, CreateChannelModal } from './components/Modals';
import { UserSettingsModal as IdentitySettingsModal, SystemSettingsModal } from './components/UserSettingsModal';
import { ArchitectRealm } from './components/ArchitectRealm'; // Added
import { AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

let socket: Socket;

function App() {
  const { isAuthenticated, logout, user, login } = useAuth();
  const [bootProgress, setBootProgress] = useState(0);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const startBootSequence = async () => {
      setBootProgress(20); await new Promise(r => setTimeout(r, 800));
      if (isAuthenticated) {
        setBootProgress(50); await new Promise(r => setTimeout(r, 1000));
        setBootProgress(85); await new Promise(r => setTimeout(r, 600));
      } else { setBootProgress(100); }
      setBootProgress(100);
      setTimeout(() => setIsBooting(false), 500);
    };
    startBootSequence();
  }, [isAuthenticated]);

  if (isBooting) return <LaunchScreen progress={bootProgress} />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard user={user!} logout={logout} updateUserState={login} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function Dashboard({ user, logout, updateUserState }: DashboardProps) {
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

  const [dockPosition, setDockPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(savedState.dockPosition || 'top');
  const [sidebarWidth, setSidebarWidth] = useState(savedState.sidebarWidth || 240);
  const [isResizing, setIsResizing] = useState(false);

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

  const [showRealmModal, setShowRealmModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showIdentitySettings, setShowIdentitySettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('nexus_view_state', JSON.stringify({ viewMode, activeRealm, activeChannel, dockPosition, sidebarWidth }));
  }, [viewMode, activeRealm, activeChannel, dockPosition, sidebarWidth]);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!user || !userId) return;
    socket = io('http://localhost:5000', { query: { userId: userId } });

    socket.on('receive_message', (msg: IMessage) => {
      setMessages(prev => [...prev, msg]); 
      new Audio('/pop.mp3').play().catch(() => {});
    });

    socket.on('receive_post', (post: IPost) => {
      setPosts(prev => [post, ...prev]);
    });

    socket.on('user_status_change', ({ userId, status }: any) => {
       setOnlineUserIds(prev => {
         const newSet = new Set(prev);
         if (status === 'online') newSet.add(userId);
         else newSet.delete(userId);
         return newSet;
       });
    });

    loadRealms(); loadDMs();
    if (activeChannel) handleSelectChannel(activeChannel);
    return () => { socket.disconnect(); };
  }, []);

  const loadRealms = async () => { try { const data = await api.getMyRealms(); setRealms(data); } catch (err) { console.error(err); } };
  const loadDMs = async () => { try { const data = await api.getMyDMs(); setDms(data); } catch (err) { console.error(err); } };
  const loadGlobalPosts = async () => { try { const data = await api.getGlobalPosts(); setPosts(data); } catch (err) { console.error(err); } };

  const handleSelectRealm = async (realm: IRealm | { _id: string }) => {
    setViewingUserId(null);
    if (realm._id === 'home') { setViewMode('home'); setActiveRealm(null); setActiveChannel(null); loadDMs(); return; }
    if (realm._id === 'explore') { setViewMode('explore'); setActiveRealm(null); setActiveChannel(null); loadGlobalPosts(); return; }
    if (realm._id === 'profile') { setViewMode('profile'); setActiveRealm(null); setActiveChannel(null); return; }
    if (realm._id === 'architect') { setViewMode('architect'); setActiveRealm(null); setActiveChannel(null); return; } // Added
    
    setViewMode('realm');
    try {
      const details = await api.getRealmDetails(realm._id);
      setActiveRealm(details);
      if (details.channels && details.channels.length > 0) handleSelectChannel(details.channels[0]);
    } catch (err) { alert("Fail"); }
  };

  const handleSelectChannel = async (channel: IChannel) => {
    if (activeChannel) socket.emit('leave_channel', activeChannel._id);
    setActiveChannel(channel);
    socket.emit('join_channel', channel._id);
    if (channel.type === 'text' || channel.type === 'dm') {
      const msgs = await api.getMessages(channel._id); setMessages(msgs);
    } else { const ps = await api.getPosts(channel._id); setPosts(ps); }
  };

  const handleStartDM = async (id: string) => { try { const d = await api.startDM(id); await loadDMs(); setViewMode('home'); setViewingUserId(null); setActiveRealm(null); handleSelectChannel(d); } catch (e) { alert("Fail"); } };
  const handleViewOtherProfile = (id: string) => { setViewingUserId(id); setViewMode('view-profile'); setActiveRealm(null); setActiveChannel(null); };
  const handleFollowUser = async (id: string) => { try { const res = await api.syncIdentity(id); alert((res as any).message); const updatedMe = await api.getUserProfile(user.id || user._id); updateUserState(localStorage.getItem('token') || '', updatedMe); } catch (err: any) { alert(err.response?.data?.message); } };
  const handleSendMessage = (content: string) => { if (!activeChannel || !user) return; socket.emit('send_message', { channelId: activeChannel._id, senderId: user.id || user._id, content, senderUserObject: user }); };
  const handleCreateRealm = async (n: string) => { try { await api.createRealm(n); setShowRealmModal(false); loadRealms(); } catch (e) { alert('Fail'); } };
  const handleCreateChannel = async (n: string, t: string) => { if (!activeRealm) return; try { const c = await api.createChannel(activeRealm._id, n, t); const d = await api.getRealmDetails(activeRealm._id); setActiveRealm(d); setShowChannelModal(false); handleSelectChannel(c); } catch (e) { alert("Fail"); } };
  const handleUpdateProfile = async (f: FormData) => { try { const u = await api.updateProfile(f); updateUserState(localStorage.getItem('token') || '', u); setShowIdentitySettings(false); } catch (e) { alert('Fail'); } };

  return (
    <div className={`flex h-screen bg-discord-dark text-gray-100 font-sans overflow-hidden ${dockPosition === 'top' ? 'flex-col' : dockPosition === 'bottom' ? 'flex-col-reverse' : dockPosition === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
      <CoreDock 
        realms={realms} selectedRealmId={viewMode} onSelect={handleSelectRealm} onCreate={() => setShowRealmModal(true)} user={user} onSettings={() => setShowSystemSettings(true)} onProfile={() => setViewMode('profile')} onSeeAllNotifications={() => setViewMode('notifications')} onLogout={logout} onSearch={() => setShowSearchModal(true)} onSocial={() => setViewMode('social')} position={dockPosition} 
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Render Sidebar only if NOT in Architect mode */}
        {viewMode !== 'architect' && (
          <div style={{ width: sidebarWidth }} className="flex-shrink-0 flex relative border-r border-gray-900 bg-discord-channel">
            <div className="flex-1 overflow-hidden flex flex-col">
              {viewMode === 'home' ? (
                <DMSidebar dms={dms} selectedDmId={activeChannel?._id || null} onSelectDm={handleSelectChannel} user={user} onLogout={logout} onlineUserIds={onlineUserIds} />
              ) : (viewMode === 'explore' || viewMode === 'profile' || viewMode === 'notifications' || viewMode === 'view-profile' || viewMode === 'social') ? (
                <div className="flex-1 flex flex-col h-full">
                   <div className="h-12 border-b border-gray-900 flex items-center px-4 font-black text-white uppercase tracking-widest text-[10px]">{viewMode === 'explore' ? 'Global Matrix' : viewMode === 'profile' ? 'Personal Identity' : viewMode === 'notifications' ? 'Pulse Archive' : viewMode === 'social' ? 'Social Matrix' : 'Target Identity'}</div>
                   <div className="p-4 text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-tighter">{viewMode === 'explore' ? 'Viewing public broadcasts.' : viewMode === 'profile' ? 'Managing your node.' : viewMode === 'notifications' ? 'Reviewing alerts.' : viewMode === 'social' ? 'Managing identity links.' : 'Scanning identity signature.'}</div>
                </div>
              ) : (
                <ChannelSidebar realm={activeRealm} channels={activeRealm?.channels || []} selectedChannelId={activeChannel?._id || null} onSelectChannel={handleSelectChannel} user={user} onLogout={logout} onAddChannel={() => setShowChannelModal(true)} />
              )}
            </div>
            <div onMouseDown={startResizing} className={`absolute top-0 -right-0.5 w-1 h-full cursor-col-resize z-40 transition-colors ${isResizing ? 'bg-nexus-blue' : 'hover:bg-nexus-blue/30'}`} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === 'architect' ? <ArchitectRealm key="architect" /> : viewMode === 'social' ? <SocialCorner key="social" currentUser={user} onStartDM={handleStartDM} /> : viewMode === 'notifications' ? <NotificationsPage key="notifs" /> : viewMode === 'profile' ? <ProfileNode key="profile" user={user} isOwnProfile={true} onEdit={() => setShowIdentitySettings(true)} /> : viewMode === 'view-profile' && viewingUserId ? <OtherProfileView key="other" userId={viewingUserId} onStartDM={handleStartDM} currentUser={user} onFollow={() => handleFollowUser(viewingUserId)} /> : activeChannel?.type === 'reels' ? <ReelsArea key="reels" posts={posts} onOpenCreateModal={() => setShowPostModal(true)} currentUser={user} /> : (activeChannel?.type === 'text' || activeChannel?.type === 'dm') ? (
            <ChatArea key="chat" channelName={activeChannel.name || 'Private_Link'} messages={messages} onSendMessage={handleSendMessage} currentUser={user} channelId={activeChannel._id} onViewOtherProfile={handleViewOtherProfile} />
          ) : (activeChannel?.type === 'feed' || viewMode === 'explore') ? (
            <FeedArea key="feed" posts={posts} onOpenCreateModal={() => setShowPostModal(true)} currentUser={user} />
          ) : (
            <div key="empty" className="flex-1 bg-discord-dark flex flex-col items-center justify-center text-gray-600">
               <div className="w-20 h-20 bg-nexus-gradient opacity-10 rounded-[32px] mb-4 rotate-12" />
               <p className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting Node Selection</p>
            </div>
          )}
        </AnimatePresence>

        {viewMode === 'realm' && activeRealm && activeRealm.members && (
          <MemberSidebar members={activeRealm.members} onMemberClick={handleViewOtherProfile} currentUser={user} />
        )}
      </div>

      {showRealmModal && <CreateRealmModal onClose={() => setShowRealmModal(false)} onSubmit={handleCreateRealm} />}
      {showChannelModal && <CreateChannelModal onClose={() => setShowChannelModal(false)} onSubmit={handleCreateChannel} />}
      {showPostModal && activeChannel && (
        <CreatePostModal onClose={() => setShowPostModal(false)} channelId={activeChannel._id} onComplete={(newPost) => { socket.emit('new_post_created', { channelId: activeChannel._id, post: newPost }); setShowPostModal(false); }} />
      )}
      {showIdentitySettings && <IdentitySettingsModal user={user} onClose={() => setShowIdentitySettings(false)} onSave={handleUpdateProfile} />}
      {showSystemSettings && <SystemSettingsModal user={user} onClose={() => setShowSystemSettings(false)} dockPosition={dockPosition} setDockPosition={setDockPosition} />}
      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} onSelectUser={handleViewOtherProfile} onSelectRealm={async (r: IRealm) => { try { await api.joinRealm(r._id); await loadRealms(); handleSelectRealm(r); setShowSearchModal(false); } catch (e) { alert("Fail"); } }} currentUser={user} />}
    </div>
  );
}

const OtherProfileView = ({ userId, onStartDM, currentUser, onFollow }: { userId: string, onStartDM: (id: string) => void, currentUser: IUser, onFollow: () => void }) => {
  const [targetUser, setTargetUser] = useState<IUser | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => { api.getUserProfile(userId).then(setTargetUser); }, [userId, refreshKey]);
  if (!targetUser) return <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse text-nexus-blue">Establishing Remote Link...</div>;
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-discord-dark">
       <div className="flex-1 overflow-y-auto custom-scrollbar"><ProfileNode user={targetUser} isOwnProfile={false} currentUser={currentUser} onFollow={() => { onFollow(); setRefreshKey(k => k + 1); }} /></div>
       <div className="p-8 border-t border-gray-900 bg-discord-sidebar/30 flex justify-center space-x-6 backdrop-blur-md"><button onClick={() => onStartDM(userId)} className="bg-nexus-gradient text-white px-16 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4"><MessageSquare size={20} /><span>Initialize Private Transmission</span></button></div>
    </div>
  );
};

interface DashboardProps {
  user: IUser;
  logout: () => void;
  updateUserState: (token: string, user: IUser) => void;
}

export default App;