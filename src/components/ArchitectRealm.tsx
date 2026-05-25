import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Layers, Trash2, Search, Zap, AlertTriangle, Activity, Globe, Hammer, CreditCard, Fingerprint, Ghost, UserX, UserCheck, EyeOff, Eye, Settings2, ChevronRight, User as UserIcon, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import type { IUser, IPost, ITransaction, IRealm, IMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PostViewerModal } from './PostViewerModal';

export const ArchitectRealm = ({ 
  embeddedMode = false, 
  initialTab: propTab, 
  oversightMode, 
  setOversightMode,
  onViewProfile,
  onBackToHome
}: { 
  embeddedMode?: boolean, 
  initialTab?: any, 
  oversightMode?: boolean, 
  setOversightMode?: (v: boolean) => void,
  onViewProfile?: (userId: string) => void,
  onBackToHome?: () => void
}) => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<IPost[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [identities, setIdentities] = useState<IUser[]>([]);
  const [realms, setRealms] = useState<IRealm[]>([]);
  const [pendingTxs, setPendingTxs] = useState<ITransaction[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'broadcasts' | 'identities' | 'finance' | 'reports' | 'realms' | 'dashboard' | 'messages'>(propTab || 'stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdentity, setSelectedIdentity] = useState<IUser | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  useEffect(() => {
    if (propTab) {
      if (propTab === 'stats' && embeddedMode) setActiveTab('dashboard');
      else if (propTab === 'messages') setActiveTab('messages');
      else setActiveTab(propTab);
    }
  }, [propTab, embeddedMode]);

  const isArchitect = currentUser && (currentUser.isAdmin || currentUser.badges?.some(b => b.type === 'developer' || b.type === 'architect'));

  useEffect(() => { loadAll(); }, [activeTab]);

  const loadAll = async () => {
    try {
      const [s, b] = await Promise.all([api.getAdminStats(), api.getAdminBroadcasts()]);
      setStats(s); setBroadcasts(b);
      if (isArchitect) {
        if (activeTab === 'identities') setIdentities(await api.getAdminIdentities());
        if (activeTab === 'realms') setRealms(await api.getAllRealmsAdmin());
        if (activeTab === 'finance') setPendingTxs(await api.getPendingTransactions());
        if (activeTab === 'reports' || activeTab === 'dashboard') setReports(await api.getReports());
        if (activeTab === 'messages') setMessages(await api.getAdminMessages());
      }
    } catch (e) { console.error(e); }
  };

  const handleModAction = async (id: string, action: any) => {
    try {
      await api.modAction(id, action);
      loadAll();
      addToast(`Action ${action} finalized.`, 'success');
    } catch (e) { addToast("Action failed.", 'error'); }
  };

  const handleResolveReport = async (id: string, action: string) => {
    try {
      await api.resolveReport(id, action);
      setSelectedReport(null);
      loadAll();
      addToast(`Report processed: ${action}`, 'success');
    } catch (e) { addToast("Resolution failed.", 'error'); }
  };

  return (
    <div className="flex-1 bg-[#0a0a0c] h-full overflow-hidden flex flex-col font-sans bg-grid-pattern">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/3 w-[450px] h-[450px] rounded-full filter blur-[150px] opacity-[0.025] pointer-events-none bg-[#ff0055]" />

      {!embeddedMode && (
        <div className="h-20 bg-[#07070a]/60 border-b border-white/5 flex items-center justify-between px-10 backdrop-blur-xl shrink-0 z-10 relative">
           <div className="flex items-center space-x-4">
              {onBackToHome && (
                 <button 
                    onClick={onBackToHome}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10 hover:border-white/20 transition-all cursor-pointer mr-2"
                    title="Go to Home"
                 >
                    <ArrowLeft size={20} />
                 </button>
              )}
              <div className="w-10 h-10 bg-vani-gradient rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                 {isArchitect ? <Shield size={24} className="text-white" /> : <Hammer size={20} className="text-white" />}
              </div>
              <div>
                 <h1 className="text-xl font-black text-white uppercase tracking-tighter font-mono">{isArchitect ? 'Architect_Nexus' : 'Oversight_Post'}</h1>
                 <div className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{isArchitect ? 'Global_Matrix_Sovereignty' : 'Moderator_Oversight_Active'}</span></div>
              </div>
           </div>
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar font-mono">
              <TabBtn label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Activity size={14} />} />
              <TabBtn label="Transmissions" active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} icon={<Layers size={14} />} />
              {isArchitect && (
                <>
                   <TabBtn label="Realms" active={activeTab === 'realms'} onClick={() => setActiveTab('realms')} icon={<Zap size={14} />} />
                   <TabBtn label="Identities" active={activeTab === 'identities'} onClick={() => setActiveTab('identities')} icon={<Users size={14} />} />
                   <TabBtn label="Finance" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<CreditCard size={14} />} />
                   <TabBtn label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<AlertTriangle size={14} />} />
                </>
              )}
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 z-10">
         <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                 {/* MODE TOGGLE (ONLY IN EMBEDDED) */}
                 {embeddedMode && (
                   <div className="flex justify-center font-mono">
                      <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex items-center">
                         <button onClick={() => setOversightMode?.(true)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${oversightMode ? 'bg-[#00d2ff] text-black shadow-lg shadow-[#00d2ff]/20' : 'text-gray-500'}`}>Oversight Mode</button>
                         <button onClick={() => setOversightMode?.(false)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${!oversightMode ? 'bg-vani-accent text-white shadow-lg shadow-red-500/20' : 'text-gray-500'}`}>Signals Mode</button>
                      </div>
                   </div>
                 )}

                 {/* HERO STATS */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard label="Linked Identities" value={stats?.users || 0} icon={<Users size={32} />} color="text-blue-500" border="border-blue-500/10" glow="hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] hover:border-blue-500/30" />
                    <StatCard label="Matrix Transmissions" value={stats?.posts || 0} icon={<Globe size={32} />} color="text-red-500" border="border-red-500/10" glow="hover:shadow-[0_0_20px_rgba(239,68,68,0.08)] hover:border-red-500/30" />
                    <StatCard label="Active Communities" value={stats?.realms || 0} icon={<Zap size={32} />} color="text-yellow-500" border="border-yellow-500/10" glow="hover:shadow-[0_0_20px_rgba(234,179,8,0.08)] hover:border-yellow-500/30" />
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* ACTIVE ANOMALIES */}
                    <div className="bg-[#07070a]/40 border border-white/5 rounded-[40px] p-8 flex flex-col h-[400px] relative overflow-hidden group">
                       <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                       <div className="absolute bottom-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                       
                       <div className="flex justify-between items-center mb-6 z-10">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-mono"><AlertTriangle size={16} className="text-red-500" /> Active_Anomalies</h3>
                          <button onClick={() => setActiveTab('reports')} className="text-[9px] font-black text-vani-blue uppercase hover:underline font-mono">View All</button>
                       </div>
                       <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 z-10">
                          {reports.slice(0, 5).map(r => (
                            <div key={r._id} onClick={() => setSelectedReport(r)} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all font-mono">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{r.targetType} // {r.reason}</span>
                               <ChevronRight size={14} className="text-gray-600 animate-pulse" />
                            </div>
                          ))}
                          {reports.length === 0 && <div className="h-full flex items-center justify-center text-[9px] text-gray-600 font-black uppercase tracking-widest font-mono">Matrix Clear</div>}
                       </div>
                    </div>

                    {/* QUICK PROTOCOLS */}
                    <div className="bg-[#07070a]/40 border border-white/5 rounded-[40px] p-8 relative overflow-hidden group">
                       <div className="absolute top-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                       <div className="absolute bottom-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                       
                       <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 font-mono"><Hammer size={16} className="text-vani-blue" /> Quick_Protocols</h3>
                       <div className="grid grid-cols-2 gap-4 font-mono">
                          <QuickAction label="Sever Identity" icon={<UserX size={18} />} color="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30" onClick={() => setActiveTab('identities')} />
                          <QuickAction label="Shadow Ban" icon={<Ghost size={18} />} color="hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30" onClick={() => setActiveTab('identities')} />
                          <QuickAction label="Purge Broadcast" icon={<Trash2 size={18} />} color="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30" onClick={() => setActiveTab('broadcasts')} />
                          <QuickAction label="Manage Reports" icon={<AlertTriangle size={18} />} color="hover:bg-yellow-500/10 hover:text-yellow-500 hover:border-yellow-500/30" onClick={() => setActiveTab('reports')} />
                          <QuickAction label="Nexus Config" icon={<Shield size={18} />} color="hover:bg-vani-blue/10 hover:text-vani-blue hover:border-vani-blue/30" onClick={() => setActiveTab('realms')} />
                          <QuickAction label="Finance Sync" icon={<CreditCard size={18} />} color="hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30" onClick={() => setActiveTab('finance')} />
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <StatCard label="Linked Identities" value={stats?.users || 0} icon={<Users size={32} />} color="text-blue-500" border="border-blue-500/10" glow="hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] hover:border-blue-500/30" />
                 <StatCard label="Global Transmissions" value={stats?.posts || 0} icon={<Globe size={32} />} color="text-red-500" border="border-red-500/10" glow="hover:shadow-[0_0_20px_rgba(239,68,68,0.08)] hover:border-red-500/30" />
                 <StatCard label="Active Realms" value={stats?.realms || 0} icon={<Zap size={32} />} color="text-yellow-500" border="border-yellow-500/10" glow="hover:shadow-[0_0_20px_rgba(234,179,8,0.08)] hover:border-yellow-500/30" />
              </motion.div>
            )}

            {activeTab === 'realms' && (
              <motion.div key="realms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 {realms.map(r => (
                   <div key={r._id} className="bg-[#07070a]/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden group space-y-4 shadow-lg hover:border-white/10 transition-all">
                      <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                      <div className="absolute bottom-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                      
                      {/* Title Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                         <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-800 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center font-black text-white uppercase font-mono">
                               {r.icon ? <img src={r.icon} className="w-full h-full object-cover rounded-[inherit]" /> : r.name[0]}
                            </div>
                            <div>
                               <div className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2 font-mono">
                                  {r.name} {(r as any).isSystem && <Shield size={12} className="text-vani-blue animate-pulse" />}
                               </div>
                               <div className="text-[9px] font-black text-gray-500 uppercase mt-0.5 font-mono">Owner: {(r.owner as any)?.username || 'System'}</div>
                            </div>
                         </div>
                         {!(r as any).isSystem && (
                           <button 
                             onClick={() => {
                               const reason = prompt("Enter collapsing reason:");
                               if (reason) {
                                 api.purgeRealmAdmin(r._id).then(() => {
                                   loadAll();
                                   addToast(`Realm collapsed. Reason: ${reason}`, 'success');
                                 });
                               }
                             }} 
                             className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white font-mono text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                           >
                              <Trash2 size={12} /> Nuke Realm
                           </button>
                         )}
                      </div>

                      {/* Split pane for Channels and Members list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono">
                         {/* Channels Panel */}
                         <div className="p-3.5 bg-black/40 rounded-xl border border-white/5">
                            <div className="text-[8px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                               <Layers size={10} className="text-vani-blue" />
                               <span>[ SECTORS / CHANNELS ]</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                               {r.channels?.map((ch: any) => (
                                 <span key={ch._id || ch} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400 text-[9px]">
                                    {ch.type === 'voice' ? '🔊' : '#'} {ch.name}
                                 </span>
                               ))}
                               {(!r.channels || r.channels.length === 0) && <span className="text-gray-600 italic">No channels populated</span>}
                            </div>
                         </div>

                         {/* Members Panel */}
                         <div className="p-3.5 bg-black/40 rounded-xl border border-white/5">
                            <div className="text-[8px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                               <Users size={10} className="text-vani-blue" />
                               <span>[ INJECTED_IDENTITIES ]</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                               {r.members?.map((mem: any) => (
                                 <span key={mem._id || mem} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400 text-[9px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                    @{mem.username || mem}
                                 </span>
                               ))}
                               {(!r.members || r.members.length === 0) && <span className="text-gray-600 italic">No members active</span>}
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}

            {activeTab === 'identities' && (
              <motion.div key="identities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {identities.map((id) => (
                   <div key={id._id} className={`bg-[#07070a]/40 border p-6 rounded-[32px] transition-all relative overflow-hidden group shadow-lg ${id.isDisabled ? 'border-red-500/50' : id.isShadowBanned ? 'border-orange-500/50' : 'border-white/5 hover:border-vani-blue/30'}`}>
                      <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                      
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center space-x-4">
                            <img src={id.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id.username}`} className="w-12 h-12 rounded-2xl border border-white/5 object-cover" />
                            <div>
                               <div className="text-sm font-black text-white uppercase font-mono">{id.username}</div>
                               <div className="text-[8px] font-black uppercase text-gray-600 font-mono tracking-widest mt-0.5">{id.tier}_TIER_NODE</div>
                            </div>
                         </div>
                         <div className="flex gap-1 shrink-0">
                            {id.isDisabled && <UserX size={14} className="text-red-500 animate-pulse" />}
                            {id.isShadowBanned && <Ghost size={14} className="text-orange-500 animate-pulse" />}
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                         <button onClick={() => setSelectedIdentity(id)} className="bg-white/5 py-2.5 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent hover:border-white/5"><Settings2 size={12} /> Calibrate</button>
                         <button onClick={() => onViewProfile?.(id._id || id.id)} className="bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-[#00d2ff] hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"><UserIcon size={12} /> Profile</button>
                         <button onClick={() => handleModAction(id._id, id.isDisabled ? 'unban' : 'ban')} className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${id.isDisabled ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                            {id.isDisabled ? <UserCheck size={12} /> : <UserX size={12} />} {id.isDisabled ? 'Unban' : 'Ban'}
                         </button>
                         <button onClick={() => handleModAction(id._id, id.isShadowBanned ? 'unshadow_ban' : 'shadow_ban')} className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${id.isShadowBanned ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white'}`}>
                            {id.isShadowBanned ? <Eye size={12} /> : <EyeOff size={12} />} {id.isShadowBanned ? 'Visible' : 'Shadow'}
                         </button>
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
                    {reports.map((r) => (
                      <div key={r._id} onClick={() => setSelectedReport(r)} className="bg-[#07070a]/40 border border-white/5 p-6 rounded-[32px] flex items-center justify-between group cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all relative overflow-hidden shadow-lg">
                         <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                         
                         <div className="flex items-center space-x-6">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500"><AlertTriangle size={20} /></div>
                            <div>
                               <div className="text-xs font-black text-white uppercase tracking-tight font-mono">{r.targetType} Report</div>
                               <div className="text-[9px] font-black text-gray-500 uppercase mt-1 font-mono">Reporter: @{r.reporter?.username}</div>
                            </div>
                         </div>
                         <div className="text-[9px] font-mono text-vani-blue bg-vani-blue/5 px-3 py-1.5 rounded-lg border border-vani-blue/20 tracking-wider font-black uppercase">{r.reason}</div>
                      </div>
                    ))}
                    {reports.length === 0 && <div className="text-center py-20 opacity-20 uppercase font-black tracking-widest text-xs font-mono">Zero anomalies detected.</div>}
                 </div>
              </motion.div>
            )}

            {activeTab === 'broadcasts' && (
              <motion.div key="broadcasts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-[24px] border border-white/5"><Search size={20} className="text-gray-500" /><input className="bg-transparent flex-1 outline-none text-sm text-white font-medium font-mono" placeholder="Search Matrix..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                 
                 {/* Section Header */}
                 <div className="mb-4">
                    <div className="flex items-center gap-4">
                       <div className="text-[9px] font-black text-vani-blue uppercase tracking-[0.4em] font-mono flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-vani-blue rounded-full animate-pulse" />
                          [ BROADCASTS_LEDGER ]
                       </div>
                       <div className="flex-1 h-[1px] bg-gradient-to-r from-vani-blue/30 via-white/5 to-transparent" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {broadcasts.filter(b => b.caption.toLowerCase().includes(searchTerm.toLowerCase())).map((b) => (
                      <div key={b._id} className="bg-[#07070a]/40 border border-white/5 p-6 rounded-[32px] flex items-center justify-between group cursor-pointer hover:border-vani-blue/30 hover:bg-white/[0.04] transition-all relative overflow-hidden shadow-lg">
                         <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                         
                         <div onClick={() => setSelectedPost(b)} className="flex items-center space-x-6 flex-1 min-w-0">
                            <img src={b.imageUrl || undefined} className="w-16 h-16 rounded-2xl object-cover border border-white/5 shrink-0" />
                            <div className="min-w-0">
                               <div className="text-xs font-black text-white uppercase tracking-tight truncate font-mono">{b.caption}</div>
                               <div className="text-[9px] font-black text-vani-blue uppercase mt-1 font-mono">Author: @{b.author?.username}</div>
                            </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); if(confirm("Purge transmission?")) api.severBroadcast(b._id).then(loadAll); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 ml-4 shrink-0 cursor-pointer"><Trash2 size={18} /></button>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-[24px] border border-white/5"><Search size={20} className="text-gray-500" /><input className="bg-transparent flex-1 outline-none text-sm text-white font-medium font-mono" placeholder="Track Signals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                 <div className="grid grid-cols-1 gap-3">
                    {messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase())).map((m) => (
                      <div key={m._id} className="bg-[#07070a]/40 border border-white/5 p-5 rounded-[24px] flex items-center justify-between group relative overflow-hidden shadow-lg">
                         <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                         
                         <div className="flex items-center space-x-4 min-w-0">
                            <img src={m.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender?.username}`} className="w-10 h-10 rounded-xl shrink-0 object-cover" />
                            <div className="min-w-0">
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white uppercase font-mono">{m.sender?.username}</span>
                                  <span className="text-[8px] font-mono text-gray-600">{(m as any).channel?.name || 'Link'}</span>
                                </div>
                               <p className="text-xs text-gray-400 truncate font-mono mt-0.5">{m.content}</p>
                            </div>
                         </div>
                         <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={async () => { const n = prompt("Recalibrate Signal?", m.content); if(n) { await api.editMessageAdmin(m._id, { content: n }); loadAll(); } }} className="p-2 bg-white/5 text-gray-400 rounded-lg hover:text-white cursor-pointer"><Settings2 size={14} /></button>
                            <button onClick={() => { if(confirm("Sever Signal?")) api.severMessageAdmin(m._id).then(loadAll); }} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white cursor-pointer"><Trash2 size={14} /></button>
                         </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {/* FINANCE TAB */}
            {activeTab === 'finance' && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
                    {pendingTxs.map(tx => (
                      <div key={tx._id} className="bg-[#07070a]/40 border border-white/5 p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg">
                         <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                         
                         <div className="flex items-center space-x-6 w-full md:w-auto">
                            <img src={tx.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tx.user.username}`} className="w-12 h-12 rounded-2xl object-cover" />
                            <div>
                               <div className="text-sm font-black text-white uppercase font-mono">{tx.user.username}</div>
                               <div className="text-[10px] font-mono text-vani-blue uppercase mt-1">{tx.method}: {tx.transactionId} (₹{tx.amount})</div>
                            </div>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto justify-end font-mono">
                            <button onClick={() => api.approveTransaction(tx._id).then(loadAll)} className="px-8 py-3 bg-green-500 text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all cursor-pointer">Verify</button>
                            <button onClick={() => api.rejectTransaction(tx._id).then(loadAll)} className="px-8 py-3 bg-white/5 text-gray-500 font-black uppercase text-[10px] rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer border border-transparent hover:border-red-500/10">Reject</button>
                         </div>
                      </div>
                    ))}
                    {pendingTxs.length === 0 && <div className="text-center py-20 opacity-20 uppercase font-black tracking-widest text-xs font-mono">Zero pending proofs.</div>}
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* MODALS (AUTHORITY & REPORT) */}
      <AnimatePresence>
         {selectedIdentity && (
           <div className="fixed inset-0 bg-black/90 z-[4000] flex items-center justify-center p-4 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0c] w-full max-w-md rounded-[48px] border border-white/5 p-10 relative overflow-hidden">
                 <div className="scanner-line" />
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 font-mono"><Fingerprint size={28} className="text-vani-blue" /> Node_Authority</h2>
                 <div className="space-y-6 font-mono">                      
                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">[ Identity Designation ]</label>
                       <input
                         type="text"
                         value={selectedIdentity.username}
                         onChange={(e) => setSelectedIdentity({...selectedIdentity, username: e.target.value})}
                         className="w-full bg-white/5 border border-white/5 text-white p-4 rounded-2xl outline-none focus:border-vani-blue transition-all font-mono"
                         placeholder="Node Designation"
                       />
                    </div>                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-[10px] font-black text-white uppercase">Architect Clearance</span>
                       <input type="checkbox" checked={selectedIdentity.isAdmin} onChange={(e) => setSelectedIdentity({...selectedIdentity, isAdmin: e.target.checked})} className="w-5 h-5 accent-vani-blue" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">[ Identity Badges ]</label>
                       <div className="grid grid-cols-2 gap-2">
                          {['developer', 'architect', 'moderator', 'premium', 'tester', 'beta'].map(type => (
                            <div key={type} onClick={() => {
                                const exists = selectedIdentity.badges?.some(b => b.type === type);
                                const newBadges = exists ? selectedIdentity.badges?.filter(b => b.type !== type) : [...(selectedIdentity.badges || []), { type, label: type.toUpperCase() }];
                                setSelectedIdentity({...selectedIdentity, badges: newBadges});
                            }} className={`p-3 rounded-xl border text-[9px] font-black uppercase text-center cursor-pointer transition-all ${selectedIdentity.badges?.some(b => b.type === type) ? 'bg-vani-blue/20 border-vani-blue text-white shadow-md' : 'bg-white/5 border-transparent text-gray-600 hover:border-white/5'}`}>{type}</div>
                          ))}
                       </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                       <button onClick={async () => {
                         try {
                           await api.grantAuthority(selectedIdentity._id, { badges: selectedIdentity.badges || [], isAdmin: selectedIdentity.isAdmin || false, username: selectedIdentity.username });
                           addToast("Node parameters synchronized", 'success');
                           setSelectedIdentity(null);
                           loadAll();
                         } catch (e: any) {
                           addToast(e.response?.data?.message || "Failed to sync node parameters", 'error');
                         }
                       }} className="flex-1 bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl cursor-pointer">Confirm Sync</button>
                       <button onClick={() => setSelectedIdentity(null)} className="px-6 py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px] border border-transparent hover:border-white/5 cursor-pointer">Cancel</button>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}

         {selectedReport && (
           <div className="fixed inset-0 bg-black/90 z-[4000] flex items-center justify-center p-4 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0c] w-full max-w-lg rounded-[48px] border border-white/5 p-10 flex flex-col max-h-[85vh] relative overflow-hidden">
                 <div className="scanner-line-green animate-pulse" />
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 font-mono"><AlertTriangle size={28} className="text-red-500" /> Report_Analysis</h2>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 font-mono">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">[ Reason ]</div><div className="text-xs font-medium text-white">{selectedReport.reason}</div></div>
                    {selectedReport.context && selectedReport.context.length > 0 && (
                      <div className="space-y-2">
                         <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-2">[ Message Context ]</div>
                         <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                            {selectedReport.context.map((m: any, i: number) => (
                              <div key={i} className={`text-xs ${m.content === selectedReport.context[Math.floor(selectedReport.context.length/2)].content ? 'text-white font-bold bg-white/5 p-2.5 rounded-xl border border-white/5' : 'text-gray-500'}`}><span className="text-[10px] uppercase text-vani-blue mr-2 font-black">@{m.sender}:</span>{m.content}</div>
                            ))}
                          </div>
                      </div>
                    )}
                 </div>
                 <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-white/5 font-mono">
                    <button onClick={() => handleResolveReport(selectedReport._id, 'dismiss')} className="py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px] hover:text-white transition-all cursor-pointer">Dismiss</button>
                    <button onClick={() => handleResolveReport(selectedReport._id, 'ban_user')} className="py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all cursor-pointer">Ban User</button>
                    <button onClick={() => handleResolveReport(selectedReport._id, 'delete_content')} className="py-4 bg-orange-500/10 text-orange-500 rounded-2xl font-black uppercase text-[10px] hover:bg-orange-500 hover:text-white transition-all cursor-pointer">Purge</button>
                 </div>
                 <button onClick={() => setSelectedReport(null)} className="mt-4 w-full py-3 text-[10px] font-black uppercase text-gray-600 hover:text-white transition-all cursor-pointer font-mono">Cancel Review</button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Dynamic post viewer */}
      {selectedPost && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center">
          <PostViewerModal 
            post={selectedPost} 
            onClose={() => setSelectedPost(null)} 
            currentUser={currentUser} 
            onUpdate={() => loadAll()} 
          />
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ label, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${active ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>{icon}<span className="text-[10px] font-black uppercase tracking-widest">{label}</span></button>
);

const StatCard = ({ label, value, icon, color, border, glow }: any) => (
  <div className={`bg-[#07070a]/40 border ${border || 'border-white/5'} p-8 rounded-[40px] relative overflow-hidden group hover:border-white/10 transition-all shadow-lg ${glow || ''}`}>
     <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
     <div className={`${color} mb-4`}>{icon}</div>
     <div className="text-4xl font-black text-white tracking-tighter mb-1 font-mono">{value}</div>
     <div className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em] font-mono">{label}</div>
  </div>
);

const QuickAction = ({ label, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`p-6 rounded-[24px] border border-white/5 bg-black/40 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${color} group`}>
     <div className="transition-transform group-hover:scale-110">{icon}</div>
     <span className="text-[8px] font-black uppercase tracking-widest font-mono">{label}</span>
  </button>
);
