import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { IUser } from '../services/api';
import { UserPlus, UserMinus, Search, Users, UserCheck } from 'lucide-react';

interface Props {
  currentUser: IUser;
  onStartDM: (id: string) => void;
}

export const SocialCorner = ({ currentUser, onStartDM }: Props) => {
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'followers'>('all');
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Since we don't have a specific "get friends" route yet, we'll reload the current profile 
        // to get the latest following/followers lists populated.
        const profile = await api.getUserProfile(currentUser.id || currentUser._id);
        
        let displayUsers: any[] = [];
        if (activeTab === 'following') displayUsers = profile.following || [];
        else if (activeTab === 'followers') displayUsers = profile.followers || [];
        else {
           // 'All' could be a mix or just suggestions. For now let's show Following as default 'friends' list
           displayUsers = profile.following || [];
        }
        setUsers(displayUsers);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [activeTab, currentUser]);

  return (
    <div className="flex-1 bg-discord-dark p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-8">Social Matrix</h2>

        {/* TABS */}
        <div className="flex items-center space-x-6 mb-8 border-b border-gray-800 pb-4">
           <Tab label="Synced (Following)" active={activeTab === 'following'} onClick={() => setActiveTab('following')} icon={<UserCheck size={16} />} />
           <Tab label="Nodes (Followers)" active={activeTab === 'followers'} onClick={() => setActiveTab('followers')} icon={<Users size={16} />} />
        </div>

        {/* LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {users.map(u => (
             <div key={u._id} className="bg-discord-channel p-4 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-nexus-blue transition-all">
                <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onStartDM(u._id)}>
                   <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden">
                         <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                      </div>
                      {/* Status Dot */}
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-4 border-discord-channel rounded-full ${u.status === 'dnd' ? 'bg-red-500' : u.status === 'idle' ? 'bg-yellow-500' : u.status === 'offline' ? 'bg-gray-500' : 'bg-green-500'}`} />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm">{u.username}</h4>
                      <p className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]">{u.customStatus || u.bio || "No status"}</p>
                   </div>
                </div>
                
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => onStartDM(u._id)} className="p-2 bg-gray-800 rounded-lg hover:bg-nexus-blue hover:text-white transition-colors">
                      <MessageSquare size={16} />
                   </button>
                </div>
             </div>
           ))}

           {users.length === 0 && !loading && (
             <div className="col-span-2 text-center py-20 opacity-30">
                <Users size={48} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No identities found in this sector.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const Tab = ({ label, active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
  >
    {icon} <span>{label}</span>
  </button>
);
