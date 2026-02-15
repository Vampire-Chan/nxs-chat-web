import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { IUser } from '../services/api';
import { Search, Users, UserCheck, MessageSquare, ShieldCheck, Star, Zap } from 'lucide-react';
import { getIdentityName } from '../services/identity';

interface Props {

  currentUser: IUser;

  onStartDM: (id: string) => void;

  initialTab?: 'friends' | 'following' | 'followers' | 'invasions';

  targetUserId?: string | null;

}



const Tab = ({ label, active, onClick, icon }: any) => (

  <button 

    onClick={onClick}

    className={`flex items-center space-x-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-all flex-shrink-0 ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}

  >

    {icon} <span>{label}</span>

  </button>

);



export const SocialCorner = ({ currentUser, onStartDM, initialTab = 'friends', targetUserId }: Props) => {

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



      // We only show invasions for the current user

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

  return (
    <div className="flex-1 bg-discord-dark md:p-8 p-4 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
             {activeTab === 'invasions' ? 'Access Invasions' : (targetUser ? `${getIdentityName(targetUser)}'s Matrix` : 'Social Matrix')}
           </h2>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-vani-blue w-full md:w-64" 
                placeholder="Search matrix nodes..." 
              />
           </div>
        </div>

        {/* TABS - Scrollable on mobile */}
        <div className="flex items-center space-x-2 md:space-x-6 mb-8 border-b border-gray-800 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
           <Tab label="Parallel" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} icon={<ShieldCheck size={14} />} />
           <Tab label="Synced" active={activeTab === 'following'} onClick={() => setActiveTab('following')} icon={<UserCheck size={14} />} />
           <Tab label="Nodes" active={activeTab === 'followers'} onClick={() => setActiveTab('followers')} icon={<Users size={14} />} />
           <div className="relative">
              <Tab label="Invasions" active={activeTab === 'invasions'} onClick={() => setActiveTab('invasions')} icon={<Zap size={14} className="text-vani-accent" />} />
              {invasionCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-vani-accent text-white text-[8px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-discord-dark shadow-lg animate-pulse">
                   {invasionCount > 99 ? '99+' : invasionCount}
                </div>
              )}
           </div>
        </div>

        {/* LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
           {users.map(u => (
             <div key={`${activeTab}-${u._id || u.id}`} className="bg-discord-channel p-3 md:p-4 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-vani-blue transition-all">
                <div className="flex items-center space-x-3 md:space-x-4 cursor-pointer flex-1 min-w-0" onClick={() => onStartDM(u._id)}>
                   <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-800 overflow-hidden border border-white/5">
                         <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                      </div>
                      {activeTab !== 'invasions' && (
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 border-[3px] md:border-4 border-discord-channel rounded-full ${u.status === 'dnd' ? 'bg-red-500' : u.status === 'idle' ? 'bg-yellow-500' : u.status === 'offline' ? 'bg-gray-500' : 'bg-green-500'}`} />
                      )}
                   </div>
                   <div className="min-w-0">
                      <div className="flex items-center gap-2">
                         <h4 className="font-black text-white text-xs md:text-sm uppercase truncate">{u.username}</h4>
                         {u.tier === 'elite' && <Star size={10} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-mono truncate uppercase">{activeTab === 'invasions' ? 'Requesting_Access' : (u.customStatus || "Node_Connected")}</p>
                   </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                   {activeTab === 'invasions' ? (
                     <>
                        <button onClick={(e) => { e.stopPropagation(); handleAccept(u._id || u.id); }} className="px-4 py-2 bg-vani-blue/10 text-vani-blue text-[10px] font-black uppercase rounded-xl border border-vani-blue/20 hover:bg-vani-blue hover:text-black transition-all">Accept</button>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(u._id || u.id); }} className="px-4 py-2 bg-white/5 text-gray-500 text-[10px] font-black uppercase rounded-xl border border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all">Reject</button>
                     </>
                   ) : (
                     <button onClick={(e) => { e.stopPropagation(); onStartDM(u._id || u.id); }} className="p-2.5 bg-gray-800 rounded-xl hover:bg-vani-blue hover:text-white transition-all border border-white/5 text-gray-400 md:opacity-0 md:group-hover:opacity-100">
                        <MessageSquare size={16} />
                     </button>
                   )}
                </div>
             </div>
           ))}

           {users.length === 0 && !loading && (
             <div className="col-span-1 md:col-span-2 text-center py-20 md:py-32 opacity-20 border-2 border-dashed border-gray-800 rounded-[32px] md:rounded-[40px] px-4">
                <Search size={40} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px]">Zero Identity Nodes Detected</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
