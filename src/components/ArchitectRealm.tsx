import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, Users, Layers, Trash2, Search, Zap, AlertTriangle, Activity, Globe, MessageSquare } from 'lucide-react';
import { api, IUser, IPost } from '../services/api';

export const ArchitectRealm = () => {
  const [stats, setStats] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<IPost[]>([]);
  const [identities, setIdentities] = useState<IUser[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'broadcasts' | 'identities'>('stats');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [s, b, i] = await Promise.all([
        api.getAdminStats(),
        api.getAdminBroadcasts(),
        api.getAdminIdentities()
      ]);
      setStats(s);
      setBroadcasts(b);
      setIdentities(i);
    } catch (e) { console.error(e); }
  };

  const severBroadcast = async (id: string) => {
    if (!window.confirm("Sever this transmission from the matrix permanently?")) return;
    try { await api.severBroadcast(id); loadAll(); } catch (e) { alert("Fail"); }
  };

  const severIdentity = async (id: string) => {
    if (!window.confirm("PERMANENT SEVERANCE: This node will be erased. Continue?")) return;
    try { await api.severIdentity(id); loadAll(); } catch (e) { alert("Fail"); }
  };

  return (
    <div className="flex-1 bg-black h-full overflow-hidden flex flex-col font-sans">
      {/* Cinematic Header */}
      <div className="h-20 bg-nexus-gradient/5 border-b border-white/5 flex items-center justify-between px-10 backdrop-blur-xl">
         <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-nexus-gradient rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
               <Shield size={24} className="text-white" />
            </div>
            <div>
               <h1 className="text-xl font-black text-white uppercase tracking-tighter">Architect_Realm</h1>
               <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Global_Administrative_Access_Link_Stable</span>
               </div>
            </div>
         </div>

         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <TabBtn label="Statistics" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Activity size={14} />} />
            <TabBtn label="Broadcasts" active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} icon={<Layers size={14} />} />
            <TabBtn label="Identities" active={activeTab === 'identities'} onClick={() => setActiveTab('identities')} icon={<Users size={14} />} />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
         <AnimatePresence mode="wait">
            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <StatCard label="Linked Identities" value={stats?.users || 0} icon={<Users size={32} />} color="text-blue-500" />
                 <StatCard label="Global Transmissions" value={stats?.posts || 0} icon={<Globe size={32} />} color="text-red-500" />
                 <StatCard label="Active Realms" value={stats?.realms || 0} icon={<Zap size={32} />} color="text-yellow-500" />
                 <div className="md:col-span-3 bg-white/[0.02] border border-white/5 rounded-[40px] p-10 mt-4">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-black text-white uppercase tracking-tight">System_Load</h3>
                       <div className="text-[10px] font-mono text-gray-500">REFRESH_RATE: 1.2ms</div>
                    </div>
                    <div className="h-48 flex items-end justify-between space-x-2">
                       {[...Array(30)].map((_, i) => (
                         <div key={i} style={{ height: `${Math.random() * 100}%` }} className="flex-1 bg-nexus-blue/20 rounded-full hover:bg-nexus-blue transition-all cursor-pointer" />
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'broadcasts' && (
              <motion.div key="broadcasts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                    <Search size={20} className="text-gray-500" />
                    <input 
                      className="bg-transparent flex-1 outline-none text-sm text-white font-medium"
                      placeholder="Filter Global Matrix Broadcasts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    {broadcasts.filter(b => b.caption.toLowerCase().includes(searchTerm.toLowerCase())).map((b) => (
                      <div key={b._id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                         <div className="flex items-center space-x-6">
                            <img src={b.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
                            <div>
                               <div className="text-xs font-black text-white uppercase tracking-tight line-clamp-1 max-w-md">{b.caption}</div>
                               <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-[9px] font-black text-nexus-blue uppercase">{b.author.username}</span>
                                  <span className="text-[8px] text-gray-600 font-mono">NODE_ID: {b._id}</span>
                               </div>
                            </div>
                         </div>
                         <button onClick={() => severBroadcast(b._id)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={20} />
                         </button>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'identities' && (
              <motion.div key="identities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {identities.map((id) => (
                   <div key={id._id} className="bg-[#0a0a0c] border border-gray-800 p-6 rounded-[32px] relative overflow-hidden group">
                      <div className="flex items-center space-x-4 mb-6 relative z-10">
                         <img src={id.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id.username}`} className="w-12 h-12 rounded-2xl border border-gray-700" />
                         <div>
                            <div className="text-sm font-black text-white uppercase tracking-tighter">{id.username}</div>
                            <div className="text-[9px] text-gray-500 font-mono">{id.id || id._id}</div>
                         </div>
                      </div>
                      <div className="flex space-x-2 relative z-10">
                         <button className="flex-1 bg-white/5 py-2.5 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all">Inspect Node</button>
                         <button onClick={() => severIdentity(id._id)} className="w-12 bg-red-500/10 text-red-500 flex items-center justify-center rounded-xl hover:bg-red-500 hover:text-white transition-all"><AlertTriangle size={16} /></button>
                      </div>
                      <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-nexus-blue/5 blur-[40px] rounded-full group-hover:bg-red-500/5 transition-all" />
                   </div>
                 ))}
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

const TabBtn = ({ label, active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
  >
     {icon}
     <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] relative overflow-hidden group hover:border-white/10 transition-all">
     <div className={`${color} mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
     <div className="text-4xl font-black text-white tracking-tighter mb-1">{value}</div>
     <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</div>
     <div className={`absolute top-0 right-0 p-4 opacity-5 ${color}`}><Zap size={64} /></div>
  </div>
);
