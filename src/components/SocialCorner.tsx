import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import type { IUser } from '../services/api';
import { Search, Users, UserCheck, MessageSquare, ShieldCheck, Star, Zap } from 'lucide-react';
import { getIdentityName } from '../services/identity';

interface Props {
  currentUser: IUser;
  onStartDM: (id: string) => void;
  initialTab?: 'friends' | 'following' | 'followers' | 'invasions';
  targetUserId?: string | null;
  userStatuses: Record<string, 'online' | 'idle' | 'dnd' | 'offline'>;
}

const Tab = ({ label, active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-5 py-2 rounded-xl transition-all border ${active ? 'bg-[#0f0f13] border-vani-blue text-white shadow-[0_0_15px_rgba(0,210,255,0.08)]' : 'bg-black/30 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'}`}
  >
    {icon} <span>{label}</span>
  </button>
);

export const SocialCorner = ({ currentUser, onStartDM, initialTab = 'friends', targetUserId, userStatuses }: Props) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'following' | 'followers' | 'invasions'>(initialTab);
  const [users, setUsers] = useState<IUser[]>([]);
  const [invasionCount, setInvasionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<IUser | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileId = targetUserId || (currentUser.id || currentUser._id);
      const profile = await api.getUserProfile(profileId);
      
      if (targetUserId) {
        setTargetUser(profile);
      } else {
        setTargetUser(null);
      }

      const selfProfile = targetUserId === (currentUser.id || currentUser._id) ? profile : await api.getUserProfile(currentUser.id || currentUser._id);
      setInvasionCount((selfProfile as any).inboundRequests?.length || 0);

      let displayUsers: any[] = [];
      if (activeTab === 'friends') displayUsers = (profile as any).friends || [];
      else if (activeTab === 'following') displayUsers = profile.following || [];
      else if (activeTab === 'followers') displayUsers = profile.followers || [];
      else if (activeTab === 'invasions') displayUsers = (selfProfile as any).inboundRequests || [];
      
      const unique = Array.from(new Map(displayUsers.map((u: any) => [u._id || u.id, u])).values()) as IUser[];
      setUsers(unique);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, currentUser, targetUserId]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleAccept = async (id: string) => {
    try {
      await api.acceptSync(id);
      loadData();
    } catch (e) { alert("Acceptance failed."); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.unfollowUser(id);
      loadData();
    } catch (e) { alert("Rejection failed."); }
  };

  const renderUserCard = (u: IUser, isActiveNode: boolean) => {
    const realTimeStatus = isActiveNode ? (userStatuses[(u._id || u.id || '').toString()] || 'online') : 'offline';
    return (
      <motion.div 
        layout
        key={`${activeTab}-${u._id || u.id}`} 
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 64px' }}
        className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-vani-blue/20 transition-all"
      >
         <div className="flex items-center space-x-3.5 cursor-pointer flex-1 min-w-0" onClick={(e) => (window as any).__vani_show_mini_profile?.(e, u)}>
            <div className="relative flex-shrink-0">
               <div className="w-9 h-9 rounded-lg bg-gray-800 overflow-hidden border border-white/5">
                  <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
               </div>
               {activeTab !== 'invasions' && (
                 <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[#0d0d11] rounded-full ${
                   realTimeStatus === 'dnd' ? 'bg-red-500' : realTimeStatus === 'idle' ? 'bg-yellow-500' : realTimeStatus === 'offline' ? 'bg-gray-500' : 'bg-green-500'
                 }`} />
               )}
            </div>
            <div className="min-w-0 text-left">
               <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-white text-xs uppercase truncate">{u.username}</h4>
                  {u.tier === 'elite' && <Star size={9} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                  <span className={`text-[6px] font-black uppercase px-1 py-0.2 rounded border ${u.isPrivate ? 'border-red-500/20 text-red-400 bg-red-500/5' : 'border-green-500/20 text-green-400 bg-green-500/5'}`}>
                    {u.isPrivate ? 'Private' : 'Public'}
                  </span>
               </div>
               <p className="text-[8px] text-gray-500 font-mono truncate uppercase mt-0.5">{activeTab === 'invasions' ? 'Requesting_Access' : (u.customStatus || "Node_Connected")}</p>
            </div>
         </div>
        
         <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {activeTab === 'invasions' ? (
              <>
                 <button onClick={(e) => { e.stopPropagation(); handleAccept(u._id || u.id); }} className="px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500 hover:text-black text-green-400 text-[8px] font-black uppercase rounded-lg transition-all">Accept</button>
                 <button onClick={(e) => { e.stopPropagation(); handleReject(u._id || u.id); }} className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 text-[8px] font-black uppercase rounded-lg transition-all">Reject</button>
              </>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onStartDM(u._id || u.id); }} className="p-2 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:bg-vani-blue/20 hover:text-vani-blue transition-all md:opacity-0 md:group-hover:opacity-100">
                 <MessageSquare size={13} />
              </button>
            )}
         </div>
      </motion.div>
    );
  };

  const onlineUsersList = users.filter(u => {
    const status = userStatuses[(u._id || u.id || '').toString()] || 'offline';
    return status !== 'offline';
  });

  const offlineUsersList = users.filter(u => {
    const status = userStatuses[(u._id || u.id || '').toString()] || 'offline';
    return status === 'offline';
  });

  return (
    <div className="flex-1 bg-black/40 md:p-8 p-4 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-white/5 pb-6">
           <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
             <Users className="text-vani-blue" size={20} />
             <span>{activeTab === 'invasions' ? 'Access Invasions' : (targetUser ? `${getIdentityName(targetUser)}'s Matrix` : 'Social Matrix')}</span>
           </h2>
           <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
              <input 
                className="bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-vani-blue w-full md:w-64 font-mono uppercase" 
                placeholder="Search matrix nodes..." 
              />
           </div>
        </div>

        {/* TABS - Scrollable on mobile */}
        <div className="flex items-center space-x-2 md:space-x-3 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
           <Tab label="Parallel" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} icon={<ShieldCheck size={12} />} />
           <Tab label="Synced" active={activeTab === 'following'} onClick={() => setActiveTab('following')} icon={<UserCheck size={12} />} />
           <Tab label="Nodes" active={activeTab === 'followers'} onClick={() => setActiveTab('followers')} icon={<Users size={12} />} />
           <div className="relative">
              <Tab label="Invasions" active={activeTab === 'invasions'} onClick={() => setActiveTab('invasions')} icon={<Zap size={12} className="text-vani-accent" />} />
              {invasionCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-vani-accent text-white text-[7px] font-black min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center border border-black shadow-lg animate-pulse">
                   {invasionCount > 99 ? '99+' : invasionCount}
                </div>
              )}
           </div>
        </div>

        {/* LIST CONTAINER WITH TRANSITIONS */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center py-20 bg-black/30 rounded-3xl border border-white/5"
              >
                <div className="relative w-12 h-12 mb-6">
                   <div className="absolute inset-0 rounded-full border-2 border-vani-blue/10 border-t-vani-blue binding-ring animate-spin" />
                   <div className="absolute inset-1.5 rounded-full border-2 border-vani-accent/10 border-b-vani-accent animate-spin [animation-duration:1.2s] [animation-direction:reverse]" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-vani-blue animate-pulse">Scanning Neural Network...</span>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 w-full"
              >
                 {activeTab === 'invasions' ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {users.map(u => renderUserCard(u, false))}
                   </div>
                 ) : (
                   <>
                     {/* Active Nodes */}
                     {onlineUsersList.length > 0 && (
                       <div className="space-y-3">
                         <div className="text-[9px] font-black text-green-400 uppercase tracking-[0.3em] font-mono mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span>[ ACTIVE_NODES — {onlineUsersList.length} ]</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {onlineUsersList.map(u => renderUserCard(u, true))}
                         </div>
                       </div>
                     )}

                     {/* Inactive Nodes */}
                     {offlineUsersList.length > 0 && (
                       <div className="space-y-3">
                         <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] font-mono mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                            <span>[ INACTIVE_NODES — {offlineUsersList.length} ]</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {offlineUsersList.map(u => renderUserCard(u, false))}
                         </div>
                       </div>
                     )}
                   </>
                 )}

                 {users.length === 0 && (
                   <div className="col-span-1 md:col-span-2 text-center py-20 opacity-20 border border-dashed border-white/10 rounded-2xl px-4">
                      <Search size={32} className="mx-auto mb-3" />
                      <p className="font-black uppercase tracking-[0.2em] text-[9px] font-mono">Zero Identity Nodes Detected</p>
                   </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
