import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Layers, Trash2, Search, Zap, AlertTriangle, Activity, Globe, Hammer, CreditCard, Fingerprint } from 'lucide-react';
import { api } from '../services/api';
import type { IUser, IPost, ITransaction } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ArchitectRealm = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<IPost[]>([]);
  const [identities, setIdentities] = useState<IUser[]>([]);
  const [pendingTxs, setPendingTxs] = useState<ITransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'broadcasts' | 'identities' | 'finance'>('stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdentity, setSelectedIdentity] = useState<IUser | null>(null);

  const isArchitect = currentUser && (currentUser.isAdmin || currentUser.badges?.some(b => b.type === 'developer' || b.type === 'architect'));

  useEffect(() => { loadAll(); }, [activeTab]);

  const loadAll = async () => {
    try {
      const [s, b] = await Promise.all([api.getAdminStats(), api.getAdminBroadcasts()]);
      setStats(s); setBroadcasts(b);
      if (isArchitect) {
        if (activeTab === 'identities') setIdentities(await api.getAdminIdentities());
        if (activeTab === 'finance') setPendingTxs(await api.getPendingTransactions());
      }
    } catch (e) { console.error(e); }
  };

  const handleGrantAuthority = async (id: string, badges: any[], isAdmin: boolean) => {
    try {
      await api.grantAuthority(id, { badges, isAdmin });
      setSelectedIdentity(null);
      loadAll();
      alert("Node authority recalibrated.");
    } catch (e) { alert("Fail"); }
  };

  return (
    <div className="flex-1 bg-black h-full overflow-hidden flex flex-col font-sans">
      <div className="h-20 bg-nexus-gradient/5 border-b border-white/5 flex items-center justify-between px-10 backdrop-blur-xl">
         <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-nexus-gradient rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
               {isArchitect ? <Shield size={24} className="text-white" /> : <Hammer size={20} className="text-white" />}
            </div>
            <div>
               <h1 className="text-xl font-black text-white uppercase tracking-tighter">{isArchitect ? 'Architect_Realm' : 'Oversight_Post'}</h1>
               <div className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{isArchitect ? 'Global_Admin_Access' : 'Moderator_Oversight_Active'}</span></div>
            </div>
         </div>
         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <TabBtn label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Activity size={14} />} />
            <TabBtn label="Transmissions" active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} icon={<Layers size={14} />} />
            {isArchitect && (
              <>
                <TabBtn label="Identities" active={activeTab === 'identities'} onClick={() => setActiveTab('identities')} icon={<Users size={14} />} />
                <TabBtn label="Finance" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<CreditCard size={14} />} />
              </>
            )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
         <AnimatePresence mode="wait">
            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <StatCard label="Linked Identities" value={stats?.users || 0} icon={<Users size={32} />} color="text-blue-500" />
                 <StatCard label="Global Transmissions" value={stats?.posts || 0} icon={<Globe size={32} />} color="text-red-500" />
                 <StatCard label="Active Realms" value={stats?.realms || 0} icon={<Zap size={32} />} color="text-yellow-500" />
              </motion.div>
            )}

            {activeTab === 'broadcasts' && (
              <motion.div key="broadcasts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-[24px] border border-white/5"><Search size={20} className="text-gray-500" /><input className="bg-transparent flex-1 outline-none text-sm text-white font-medium" placeholder="Search Matrix..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                 <div className="grid grid-cols-1 gap-4">
                    {broadcasts.filter(b => b.caption.toLowerCase().includes(searchTerm.toLowerCase())).map((b) => (
                      <div key={b._id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center justify-between group">
                         <div className="flex items-center space-x-6"><img src={b.imageUrl} className="w-16 h-16 rounded-2xl object-cover border border-white/5" /><div><div className="text-xs font-black text-white uppercase tracking-tight">{b.caption}</div><div className="text-[9px] font-black text-nexus-blue uppercase mt-1">Author: {b.author.username}</div></div></div>
                         <button onClick={() => api.severBroadcast(b._id).then(loadAll)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'identities' && (
              <motion.div key="identities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {identities.map((id) => (
                   <div key={id._id} className="bg-[#0a0a0c] border border-gray-800 p-6 rounded-[32px] hover:border-nexus-blue/30 transition-all">
                      <div className="flex items-center space-x-4 mb-6">
                         <img src={id.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id.username}`} className="w-12 h-12 rounded-2xl border border-gray-700" />
                         <div><div className="text-sm font-black text-white uppercase">{id.username}</div><div className={`text-[8px] font-black uppercase text-gray-600`}>{id.tier}_TIER_NODE</div></div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setSelectedIdentity(id)} className="flex-1 bg-white/5 py-2.5 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all">Calibrate</button>
                         <button onClick={() => api.severIdentity(id._id).then(loadAll)} className="w-12 bg-red-500/10 text-red-500 flex items-center justify-center rounded-xl hover:bg-red-500 hover:text-white"><AlertTriangle size={16} /></button>
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="p-10 bg-nexus-gradient/5 border border-white/5 rounded-[40px] text-center">
                    <CreditCard size={48} className="mx-auto text-nexus-blue mb-4" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sovereign_Ledger</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Verifying contributions to the Matrix</p>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    {pendingTxs.map(tx => (
                      <div key={tx._id} className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] flex items-center justify-between">
                         <div className="flex items-center space-x-6">
                            <img src={tx.user.avatar} className="w-12 h-12 rounded-2xl" />
                            <div>
                               <div className="text-sm font-black text-white uppercase">{tx.user.username}</div>
                               <div className="text-[10px] font-mono text-nexus-blue uppercase">{tx.method}: {tx.transactionId}</div>
                            </div>
                         </div>
                         <div className="flex gap-3">
                            <button onClick={() => api.approveTransaction(tx._id).then(loadAll)} className="px-8 py-3 bg-green-500 text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all">Verify Proof</button>
                            <button onClick={() => api.rejectTransaction(tx._id).then(loadAll)} className="px-8 py-3 bg-white/5 text-gray-500 font-black uppercase text-[10px] rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">Reject</button>
                         </div>
                      </div>
                    ))}
                    {pendingTxs.length === 0 && <div className="text-center py-20 opacity-20 uppercase font-black tracking-widest text-xs">Zero pending proofs detected.</div>}
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* AUTHORITY CALIBRATION MODAL */}
      <AnimatePresence>
         {selectedIdentity && (
           <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0c] w-full max-w-md rounded-[48px] border border-white/5 p-10">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><Fingerprint size={28} className="text-nexus-blue" /> Node_Authority</h2>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-xs font-black text-white uppercase">Architect Clearance</span>
                       <input type="checkbox" checked={selectedIdentity.isAdmin} onChange={(e) => setSelectedIdentity({...selectedIdentity, isAdmin: e.target.checked})} className="w-5 h-5 accent-nexus-blue" />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Identity Badges</label>
                       <div className="grid grid-cols-2 gap-2">
                          {['developer', 'architect', 'moderator', 'premium', 'tester', 'beta'].map(type => (
                            <div 
                              key={type} 
                              onClick={() => {
                                const exists = selectedIdentity.badges?.some(b => b.type === type);
                                const newBadges = exists ? selectedIdentity.badges?.filter(b => b.type !== type) : [...(selectedIdentity.badges || []), { type, label: type.toUpperCase() }];
                                setSelectedIdentity({...selectedIdentity, badges: newBadges});
                              }}
                              className={`p-3 rounded-xl border text-[9px] font-black uppercase text-center cursor-pointer transition-all ${selectedIdentity.badges?.some(b => b.type === type) ? 'bg-nexus-blue/20 border-nexus-blue text-white' : 'bg-white/5 border-transparent text-gray-600'}`}
                            >
                               {type}
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                       <button onClick={() => handleGrantAuthority(selectedIdentity._id, selectedIdentity.badges || [], selectedIdentity.isAdmin || false)} className="flex-1 bg-nexus-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">Confirm Sync</button>
                       <button onClick={() => setSelectedIdentity(null)} className="px-6 py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const TabBtn = ({ label, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>{icon}<span className="text-[10px] font-black uppercase tracking-widest">{label}</span></button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] relative overflow-hidden group hover:border-white/10 transition-all"><div className={`${color} mb-4`}>{icon}</div><div className="text-4xl font-black text-white tracking-tighter mb-1">{value}</div><div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</div></div>
);
