import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Layers, Trash2, Search, Zap, AlertTriangle, Activity, Globe, Hammer, CreditCard, Fingerprint, Ghost, UserX, UserCheck, EyeOff, Eye, Settings2, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import type { IUser, IPost, ITransaction, IRealm, IMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ArchitectRealm = ({ embeddedMode = false, initialTab: propTab, oversightMode, setOversightMode }: { embeddedMode?: boolean, initialTab?: any, oversightMode?: boolean, setOversightMode?: (v: boolean) => void }) => {
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
    <div className="flex-1 bg-black h-full overflow-hidden flex flex-col font-sans">
      {!embeddedMode && (
        <div className="h-20 bg-vani-gradient/5 border-b border-white/5 flex items-center justify-between px-10 backdrop-blur-xl shrink-0">
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-vani-gradient rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                 {isArchitect ? <Shield size={24} className="text-white" /> : <Hammer size={20} className="text-white" />}
              </div>
              <div>
                 <h1 className="text-xl font-black text-white uppercase tracking-tighter">{isArchitect ? 'Architect_Nexus' : 'Oversight_Post'}</h1>
                 <div className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{isArchitect ? 'Global_Matrix_Sovereignty' : 'Moderator_Oversight_Active'}</span></div>
              </div>
           </div>
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
         <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                 {/* MODE TOGGLE (ONLY IN EMBEDDED) */}
                 {embeddedMode && (
                   <div className="flex justify-center">
                      <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex items-center">
                         <button onClick={() => setOversightMode?.(true)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${oversightMode ? 'bg-vani-blue text-black shadow-lg' : 'text-gray-500'}`}>Oversight Mode</button>
                         <button onClick={() => setOversightMode?.(false)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${!oversightMode ? 'bg-vani-accent text-white shadow-lg' : 'text-gray-500'}`}>Signals Mode</button>
                      </div>
                   </div>
                 )}

                 {/* HERO STATS */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard label="Linked Identities" value={stats?.users || 0} icon={<Users size={32} />} color="text-blue-500" />
                    <StatCard label="Matrix Transmissions" value={stats?.posts || 0} icon={<Globe size={32} />} color="text-red-500" />
                    <StatCard label="Active Communities" value={stats?.realms || 0} icon={<Zap size={32} />} color="text-yellow-500" />
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* ACTIVE ANOMALIES */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col h-[400px]">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Active_Anomalies</h3>
                          <button onClick={() => setActiveTab('reports')} className="text-[9px] font-black text-vani-blue uppercase hover:underline">View All</button>
                       </div>
                       <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                          {reports.slice(0, 5).map(r => (
                            <div key={r._id} onClick={() => setSelectedReport(r)} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{r.targetType} // {r.reason}</span>
                               <ChevronRight size={14} className="text-gray-600" />
                            </div>
                          ))}
                          {reports.length === 0 && <div className="h-full flex items-center justify-center text-[9px] text-gray-600 font-black uppercase tracking-widest">Matrix Clear</div>}
                       </div>
                    </div>

                    {/* QUICK PROTOCOLS */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                       <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Hammer size={16} className="text-vani-blue" /> Quick_Protocols</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <QuickAction label="Sever Identity" icon={<UserX size={18} />} color="hover:bg-red-500/10 hover:text-red-500" onClick={() => setActiveTab('identities')} />
                          <QuickAction label="Shadow Ban" icon={<Ghost size={18} />} color="hover:bg-orange-500/10 hover:text-orange-500" onClick={() => setActiveTab('identities')} />
                          <QuickAction label="Purge Broadcast" icon={<Trash2 size={18} />} color="hover:bg-red-500/10 hover:text-red-500" onClick={() => setActiveTab('broadcasts')} />
                          <QuickAction label="Manage Reports" icon={<AlertTriangle size={18} />} color="hover:bg-yellow-500/10 hover:text-yellow-500" onClick={() => setActiveTab('reports')} />
                          <QuickAction label="Nexus Config" icon={<Shield size={18} />} color="hover:bg-vani-blue/10 hover:text-vani-blue" onClick={() => setActiveTab('realms')} />
                          <QuickAction label="Finance Sync" icon={<CreditCard size={18} />} color="hover:bg-green-500/10 hover:text-green-400" onClick={() => setActiveTab('finance')} />
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <StatCard label="Linked Identities" value={stats?.users || 0} icon={<Users size={32} />} color="text-blue-500" />
                 <StatCard label="Global Transmissions" value={stats?.posts || 0} icon={<Globe size={32} />} color="text-red-500" />
                 <StatCard label="Active Realms" value={stats?.realms || 0} icon={<Zap size={32} />} color="text-yellow-500" />
              </motion.div>
            )}

            {activeTab === 'realms' && (
              <motion.div key="realms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                 {realms.map(r => (
                   <div key={r._id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center justify-between group">
                      <div className="flex items-center space-x-6">
                         <div className="w-12 h-12 bg-gray-800 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center font-black">
                            {r.icon ? <img src={r.icon} className="w-full h-full object-cover" /> : r.name[0]}
                         </div>
                         <div>
                            <div className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                               {r.name} {(r as any).isSystem && <Shield size={12} className="text-vani-blue" />}
                            </div>
                            <div className="text-[9px] font-black text-gray-500 uppercase mt-1">Owner: {(r.owner as any)?.username} • {r.members?.length} Members</div>
                         </div>
                      </div>
                      {!(r as any).isSystem && (
                        <button onClick={() => { if(confirm("Collapse this community?")) api.purgeRealmAdmin(r._id).then(loadAll); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                      )}
                   </div>
                 ))}
              </motion.div>
            )}

            {activeTab === 'identities' && (
              <motion.div key="identities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {identities.map((id) => (
                   <div key={id._id} className={`bg-[#0a0a0c] border p-6 rounded-[32px] transition-all ${id.isDisabled ? 'border-red-500/50' : id.isShadowBanned ? 'border-orange-500/50' : 'border-gray-800 hover:border-vani-blue/30'}`}>
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center space-x-4">
                            <img src={id.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id.username}`} className="w-12 h-12 rounded-2xl border border-gray-700" />
                            <div><div className="text-sm font-black text-white uppercase">{id.username}</div><div className="text-[8px] font-black uppercase text-gray-600">{id.tier}_TIER_NODE</div></div>
                         </div>
                         <div className="flex gap-1">
                            {id.isDisabled && <UserX size={14} className="text-red-500" />}
                            {id.isShadowBanned && <Ghost size={14} className="text-orange-500" />}
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setSelectedIdentity(id)} className="col-span-2 bg-white/5 py-2.5 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2"><Settings2 size={14} /> Calibration</button>
                         <button onClick={() => handleModAction(id._id, id.isDisabled ? 'unban' : 'ban')} className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${id.isDisabled ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                            {id.isDisabled ? <UserCheck size={14} /> : <UserX size={14} />} {id.isDisabled ? 'Unban' : 'Ban'}
                         </button>
                         <button onClick={() => handleModAction(id._id, id.isShadowBanned ? 'unshadow_ban' : 'shadow_ban')} className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${id.isShadowBanned ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white'}`}>
                            {id.isShadowBanned ? <Eye size={14} /> : <EyeOff size={14} />} {id.isShadowBanned ? 'Visible' : 'Shadow'}
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
                      <div key={r._id} onClick={() => setSelectedReport(r)} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all">
                         <div className="flex items-center space-x-6">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500"><AlertTriangle size={20} /></div>
                            <div>
                               <div className="text-xs font-black text-white uppercase tracking-tight">{r.targetType} Report</div>
                               <div className="text-[9px] font-black text-gray-500 uppercase mt-1">Reporter: {r.reporter?.username}</div>
                            </div>
                         </div>
                         <div className="text-[10px] font-mono text-vani-blue bg-vani-blue/5 px-3 py-1.5 rounded-lg border border-vani-blue/20">{r.reason}</div>
                      </div>
                    ))}
                    {reports.length === 0 && <div className="text-center py-20 opacity-20 uppercase font-black tracking-widest text-xs">Zero anomalies detected.</div>}
                 </div>
              </motion.div>
            )}

            {activeTab === 'broadcasts' && (
              <motion.div key="broadcasts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-[24px] border border-white/5"><Search size={20} className="text-gray-500" /><input className="bg-transparent flex-1 outline-none text-sm text-white font-medium" placeholder="Search Matrix..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                 <div className="grid grid-cols-1 gap-4">
                    {broadcasts.filter(b => b.caption.toLowerCase().includes(searchTerm.toLowerCase())).map((b) => (
                      <div key={b._id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center justify-between group">
                         <div className="flex items-center space-x-6"><img src={b.imageUrl || undefined} className="w-16 h-16 rounded-2xl object-cover border border-white/5" /><div><div className="text-xs font-black text-white uppercase tracking-tight">{b.caption}</div><div className="text-[9px] font-black text-vani-blue uppercase mt-1">Author: {b.author?.username}</div></div></div>
                         <button onClick={() => { if(confirm("Purge transmission?")) api.severBroadcast(b._id).then(loadAll); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-[24px] border border-white/5"><Search size={20} className="text-gray-500" /><input className="bg-transparent flex-1 outline-none text-sm text-white font-medium" placeholder="Track Signals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                 <div className="grid grid-cols-1 gap-3">
                    {messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase())).map((m) => (
                      <div key={m._id} className="bg-white/[0.02] border border-white/5 p-5 rounded-[24px] flex items-center justify-between group">
                         <div className="flex items-center space-x-4 min-w-0">
                            <img src={m.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender?.username}`} className="w-10 h-10 rounded-xl shrink-0" />
                            <div className="min-w-0">
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white uppercase">{m.sender?.username}</span>
                                  <span className="text-[8px] font-mono text-gray-600">{(m as any).channel?.name || 'Link'}</span>
                               </div>
                               <p className="text-xs text-gray-400 truncate">{m.content}</p>
                            </div>
                         </div>
                         <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={async () => { const n = prompt("Recalibrate Signal?", m.content); if(n) { await api.editMessageAdmin(m._id, { content: n }); loadAll(); } }} className="p-2 bg-white/5 text-gray-400 rounded-lg hover:text-white"><Settings2 size={14} /></button>
                            <button onClick={() => { if(confirm("Sever Signal?")) api.severMessageAdmin(m._id).then(loadAll); }} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14} /></button>
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
                      <div key={tx._id} className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] flex items-center justify-between">
                         <div className="flex items-center space-x-6">
                            <img src={tx.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tx.user.username}`} className="w-12 h-12 rounded-2xl" />
                            <div><div className="text-sm font-black text-white uppercase">{tx.user.username}</div><div className="text-[10px] font-mono text-vani-blue uppercase">{tx.method}: {tx.transactionId} (${tx.amount})</div></div>
                         </div>
                         <div className="flex gap-3"><button onClick={() => api.approveTransaction(tx._id).then(loadAll)} className="px-8 py-3 bg-green-500 text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all">Verify</button><button onClick={() => api.rejectTransaction(tx._id).then(loadAll)} className="px-8 py-3 bg-white/5 text-gray-500 font-black uppercase text-[10px] rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">Reject</button></div>
                      </div>
                    ))}
                    {pendingTxs.length === 0 && <div className="text-center py-20 opacity-20 uppercase font-black tracking-widest text-xs">Zero pending proofs.</div>}
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* MODALS (AUTHORITY & REPORT) */}
      <AnimatePresence>
         {selectedIdentity && (
           <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0c] w-full max-w-md rounded-[48px] border border-white/5 p-10">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><Fingerprint size={28} className="text-vani-blue" /> Node_Authority</h2>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5"><span className="text-xs font-black text-white uppercase">Architect Clearance</span><input type="checkbox" checked={selectedIdentity.isAdmin} onChange={(e) => setSelectedIdentity({...selectedIdentity, isAdmin: e.target.checked})} className="w-5 h-5 accent-vani-blue" /></div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Identity Badges</label>
                       <div className="grid grid-cols-2 gap-2">
                          {['developer', 'architect', 'moderator', 'premium', 'tester', 'beta'].map(type => (
                            <div key={type} onClick={() => {
                                const exists = selectedIdentity.badges?.some(b => b.type === type);
                                const newBadges = exists ? selectedIdentity.badges?.filter(b => b.type !== type) : [...(selectedIdentity.badges || []), { type, label: type.toUpperCase() }];
                                setSelectedIdentity({...selectedIdentity, badges: newBadges});
                            }} className={`p-3 rounded-xl border text-[9px] font-black uppercase text-center cursor-pointer transition-all ${selectedIdentity.badges?.some(b => b.type === type) ? 'bg-vani-blue/20 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-600'}`}>{type}</div>
                          ))}
                       </div>
                    </div>
                    <div className="flex gap-3 pt-6"><button onClick={async () => { await api.grantAuthority(selectedIdentity._id, { badges: selectedIdentity.badges || [], isAdmin: selectedIdentity.isAdmin || false }); setSelectedIdentity(null); loadAll(); }} className="flex-1 bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">Confirm Sync</button><button onClick={() => setSelectedIdentity(null)} className="px-6 py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px]">Cancel</button></div>
                 </div>
              </motion.div>
           </div>
         )}

         {selectedReport && (
           <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0c] w-full max-w-lg rounded-[48px] border border-white/5 p-10 flex flex-col max-h-[85vh]">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><AlertTriangle size={28} className="text-red-500" /> Report_Analysis</h2>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Reason</div><div className="text-sm font-medium text-white">{selectedReport.reason}</div></div>
                    {selectedReport.context && selectedReport.context.length > 0 && (
                      <div className="space-y-2">
                         <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Message Context</div>
                         <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                            {selectedReport.context.map((m: any, i: number) => (
                              <div key={i} className={`text-xs ${m.content === selectedReport.context[Math.floor(selectedReport.context.length/2)].content ? 'text-white font-bold bg-white/5 p-2 rounded-lg' : 'text-gray-500'}`}><span className="text-[10px] uppercase text-vani-blue mr-2">{m.sender}:</span>{m.content}</div>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>
                 <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-white/5">
                    <button onClick={() => handleResolveReport(selectedReport._id, 'dismiss')} className="py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px] hover:text-white transition-all">Dismiss</button>
                    <button onClick={() => handleResolveReport(selectedReport._id, 'ban_user')} className="py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all">Ban User</button>
                    <button onClick={() => handleResolveReport(selectedReport._id, 'delete_content')} className="py-4 bg-orange-500/10 text-orange-500 rounded-2xl font-black uppercase text-[10px] hover:bg-orange-500 hover:text-white transition-all">Purge</button>
                 </div>
                 <button onClick={() => setSelectedReport(null)} className="mt-4 w-full py-3 text-[10px] font-black uppercase text-gray-600 hover:text-white transition-all">Cancel Review</button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const TabBtn = ({ label, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shrink-0 ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>{icon}<span className="text-[10px] font-black uppercase tracking-widest">{label}</span></button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] relative overflow-hidden group hover:border-white/10 transition-all"><div className={`${color} mb-4`}>{icon}</div><div className="text-4xl font-black text-white tracking-tighter mb-1">{value}</div><div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</div></div>
);

const QuickAction = ({ label, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`p-6 rounded-[24px] border border-white/5 bg-black/40 flex flex-col items-center justify-center gap-3 transition-all ${color} group`}>
     <div className="transition-transform group-hover:scale-110">{icon}</div>
     <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
