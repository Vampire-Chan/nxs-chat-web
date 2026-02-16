import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Lock, History as HistoryIcon, Zap, Settings, Image as ImageIcon, Camera, Save, ArrowLeft, ChevronRight, Layout, Monitor, Smartphone, Download, AlertCircle as AlertIcon, Key, Eye, EyeOff, Globe } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import type { IUser } from '../services/api';

interface Props {
  user: IUser;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  dockPosition: 'top' | 'bottom' | 'left' | 'right';
  setDockPosition: (pos: 'top' | 'bottom' | 'left' | 'right') => void;
}

export const UserSettingsModal = ({ user, onClose, onSave, dockPosition, setDockPosition }: Props) => {
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy' | 'interface' | 'archive' | 'sovereignty'>('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  
  // Profile States
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'deleted'}`);
  const [bannerPreview, setBannerPreview] = useState(user.banner || '');
  
  // Privacy States
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);
  const [showAge, setShowAge] = useState(user.showAge || false);
  const [isDisabled, setIsDisabled] = useState(user.isDisabled || false);
  
  // Interface States
  const [creationUI, setCreationUI] = useState(user.creationUI || 'auto');
  
  // Security States
  const [recoveryKeys, setRecoveryKeys] = useState(user.recoveryKeys || []);
  const [showKeys, setShowKeys] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append('displayName', displayName);
    fd.append('bio', bio);
    fd.append('isPrivate', String(isPrivate));
    fd.append('showAge', String(showAge));
    fd.append('creationUI', creationUI);
    if (avatarBlob) fd.append('avatar', avatarBlob, 'avatar.jpg');
    if (bannerBlob) fd.append('banner', bannerBlob, 'banner.jpg');
    
    await onSave(fd);
    setLoading(false);
  };

  const handleToggleDisable = async () => {
    try {
      const nextStatus = !isDisabled;
      await api.toggleDisableAccount(nextStatus);
      setIsDisabled(nextStatus);
      alert(nextStatus ? "Node Hidden from Matrix" : "Node Reactivated");
    } catch (e) { alert("Protocol Failed"); }
  };

  const handleGenerateKeys = async () => {
    if (!window.confirm("Generating new keys will overwrite existing ones. Proceed?")) return;
    try {
      const res = await api.generateRecoveryKeys();
      setRecoveryKeys(res.keys);
      setShowKeys(true);
    } catch (e) { alert("Key Generation Failed"); }
  };

  const navItems = [
    { id: 'profile', label: 'Identity Hub', icon: <User size={18} />, color: 'text-vani-blue' },
    { id: 'interface', label: 'Interface Protocols', icon: <Layout size={18} />, color: 'text-pink-400' },
    { id: 'security', label: 'Security Protocols', icon: <Shield size={18} />, color: 'text-green-400' },
    { id: 'privacy', label: 'Privacy Shield', icon: <Lock size={18} />, color: 'text-purple-400' },
    { id: 'archive', label: 'Neural Logs', icon: <HistoryIcon size={18} />, color: 'text-yellow-400' },
    { id: 'sovereignty', label: 'Sovereignty', icon: <Zap size={18} />, color: 'text-vani-accent' }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="fixed inset-0 bg-black z-[2500] flex items-center justify-center lg:p-10 lg:bg-black/95 lg:backdrop-blur-2xl" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full lg:max-w-6xl lg:h-[85vh] bg-[#0a0a0c] lg:border border-white/5 lg:rounded-[48px] shadow-2xl flex flex-col lg:flex-row overflow-hidden"
      >
        
        {/* SIDEBAR - DESKTOP / MENU - MOBILE */}
        <div className={`w-full lg:w-80 bg-discord-sidebar/50 border-r border-white/5 flex flex-col shrink-0 ${isMobile && !isMobileMenuOpen ? 'hidden' : 'flex'}`}>
           <div className="p-6 lg:p-10 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                 <Settings size={24} className="text-vani-blue animate-spin-slow" /> Node_CFG
              </h2>
              <button onClick={onClose} className="lg:hidden p-2 bg-white/5 rounded-xl"><X size={20} /></button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2">
              {navItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); if(isMobile) setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${activeTab === item.id && !isMobileMenuOpen ? 'bg-vani-gradient text-white shadow-xl shadow-red-500/10' : 'text-gray-500 hover:bg-white/5'}`}
                >
                   <div className="flex items-center space-x-4">
                      <span className={activeTab === item.id && !isMobileMenuOpen ? 'text-white' : item.color}>{item.icon}</span>
                      <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                   </div>
                   <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
           </div>
        </div>

        {/* CONTENT AREA */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-discord-dark/20 ${isMobile && isMobileMenuOpen ? 'hidden' : 'flex'}`}>
           <div className="p-6 lg:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl text-white"><ArrowLeft size={20} /></button>
                 <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">{activeTab}_Matrix</h3>
              </div>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500 transition-all text-white"><X size={20} /></button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 lg:space-y-12">
                     <div className="relative mb-16 lg:mb-24">
                        <div className="h-32 lg:h-48 bg-gray-900 rounded-[24px] lg:rounded-[40px] overflow-hidden border border-white/5 group cursor-pointer shadow-inner" onClick={() => bannerRef.current?.click()}>
                           {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-40" /> : <div className="w-full h-full bg-vani-gradient opacity-10" />}
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20"><ImageIcon size={40} className="text-white" /></div>
                        </div>
                        <div className="absolute -bottom-10 lg:-bottom-14 left-6 lg:left-14 p-1.5 bg-[#0a0a0c] rounded-[28px] lg:rounded-[36px] group cursor-pointer shadow-2xl" onClick={(e) => { e.stopPropagation(); avatarRef.current?.click(); }}>
                           <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[24px] lg:rounded-[32px] bg-gray-800 border-4 border-[#0a0a0c] overflow-hidden relative">
                              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-vani-gradient" />}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40"><Camera size={32} className="text-white" /></div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-6 lg:gap-10">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-4">Identity_Label (Alias)</label>
                           <input className="w-full bg-[#050507] border border-white/5 p-5 rounded-3xl text-white outline-none focus:border-vani-blue/50 font-bold text-lg shadow-inner" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Node Name..." />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-4">Neural_Bio (Encryption Logs)</label>
                           <textarea className="w-full bg-[#050507] border border-white/5 p-5 rounded-3xl text-white outline-none focus:border-vani-blue/50 font-medium h-40 resize-none shadow-inner" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Initialize bio data..." />
                        </div>
                        <button onClick={handleSave} disabled={loading} className="bg-vani-gradient text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                           <Save size={20} /> {loading ? 'Saving...' : 'Update Matrix Node'}
                        </button>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'interface' && (
                  <motion.div key="interface" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                     {/* Creation Workflow */}
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><ImageIcon size={20} className="text-pink-400" /> Creation Workflow</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Select how you want to broadcast transmissions to the Matrix.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {[
                             { id: 'auto', label: 'Auto (Device)', icon: <Layout size={20} />, desc: 'System decides' },
                             { id: 'bar', label: 'Input Bar', icon: <Monitor size={20} />, desc: 'Desktop bar' },
                             { id: 'button', label: 'Floating (+)', icon: <Smartphone size={20} />, desc: 'Mobile button' }
                           ].map(opt => (
                             <div key={opt.id} onClick={() => setCreationUI(opt.id as any)} className={`p-6 rounded-3xl border cursor-pointer transition-all ${creationUI === opt.id ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/10'}`}>
                                <div className="mb-4">{opt.icon}</div>
                                <div className="text-xs font-black uppercase tracking-widest mb-1">{opt.label}</div>
                                <div className="text-[8px] font-medium opacity-60 uppercase">{opt.desc}</div>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Dock Calibration */}
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Layout size={20} className="text-vani-blue" /> Dock Calibration</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Position the primary navigation dock across the screen.</p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                           {['top', 'bottom', 'left', 'right'].map(pos => (
                             <button key={pos} onClick={() => setDockPosition(pos as any)} className={`py-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${dockPosition === pos ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}>{pos}</button>
                           ))}
                        </div>
                     </div>

                     {/* Neural Language */}
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Globe size={20} className="text-green-400" /> Neural Language</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Configure the dialect of the Matrix interface.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                           {[
                             { id: 'en', label: 'English' },
                             { id: 'hi', label: 'हिन्दी' },
                             { id: 'ne', label: 'नेपाली' }
                           ].map(l => (
                             <button key={l.id} onClick={() => setLanguage(l.id as any)} className={`py-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${language === l.id ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}>{l.label}</button>
                           ))}
                        </div>
                     </div>

                     <button onClick={handleSave} className="w-full bg-vani-gradient text-white py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl">Apply Interface Calibration</button>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-6">
                        <div className="flex items-start space-x-4">
                           <div className="p-3 bg-green-500/10 rounded-2xl text-green-500"><Key size={24} /></div>
                           <div className="flex-1">
                              <div className="text-lg font-black text-white uppercase tracking-tight">Recovery Protocols</div>
                              <p className="text-[10px] text-gray-500 font-medium mt-1">Generate emergency bypass keys to regain access if your node is de-synchronized.</p>
                           </div>
                           <button onClick={() => setShowKeys(!showKeys)} className="p-2 text-gray-500 hover:text-white transition-all">
                              {showKeys ? <EyeOff size={20} /> : <Eye size={20} />}
                           </button>
                        </div>

                        {recoveryKeys.length > 0 && showKeys && (
                          <div className="grid grid-cols-2 gap-2 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[10px]">
                             {recoveryKeys.map((k, i) => (
                               <div key={i} className={`p-2 border border-white/5 rounded-lg flex justify-between ${k.isUsed ? 'opacity-30 line-through' : 'text-vani-blue'}`}>
                                  <span>{k.code}</span>
                                  {!k.isUsed && <div className="w-1 h-1 bg-vani-blue rounded-full animate-pulse" />}
                               </div>
                             ))}
                          </div>
                        )}

                        <button 
                          onClick={handleGenerateKeys}
                          className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-[20px] border border-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
                        >
                           Forge New Recovery Keys
                        </button>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'privacy' && (
                  <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <div className="text-lg font-black text-white uppercase tracking-tight">Ghost Protocol</div>
                              <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Enable to hide your node from public search and Explore broadcasts.</p>
                           </div>
                           <button onClick={() => setIsPrivate(!isPrivate)} className={`w-14 h-8 rounded-full relative transition-all ${isPrivate ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                           <div>
                              <div className="text-lg font-black text-white uppercase tracking-tight">Reveal Chronology</div>
                              <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Allow other nodes to see your establishment duration (Age).</p>
                           </div>
                           <button onClick={() => setShowAge(!showAge)} className={`w-14 h-8 rounded-full relative transition-all ${showAge ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${showAge ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                     </div>
                     <button onClick={handleSave} className="w-full bg-vani-gradient text-white py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl">Apply Privacy Shields</button>
                  </motion.div>
                )}

                {activeTab === 'archive' && (
                  <motion.div key="archive" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-center py-10">
                     <div className="w-20 h-20 bg-vani-blue/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-vani-blue border border-vani-blue/20 shadow-2xl shadow-blue-500/20">
                        <Download size={40} />
                     </div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">Export Neural Log</h3>
                     <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed uppercase tracking-widest font-mono">Archive established: v1.0.42</p>
                     <p className="text-gray-400 text-xs max-w-md mx-auto leading-relaxed">Download a permanent archive of your identity node, including all transmissions, neural links, and matrix interactions.</p>
                     <button onClick={() => api.exportData()} className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-vani-blue transition-all shadow-xl">Initialize Archive Protocol</button>
                  </motion.div>
                )}

                {activeTab === 'sovereignty' && (
                  <motion.div key="sovereignty" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     {/* Neural Camouflage (Disable) */}
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] flex items-center justify-between">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight">Neural Camouflage</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Temporarily vanish from the Matrix. Your node will be hidden from search and feeds.</p>
                        </div>
                        <button onClick={handleToggleDisable} className={`w-14 h-8 rounded-full relative transition-all ${isDisabled ? 'bg-vani-accent' : 'bg-gray-800'}`}>
                           <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isDisabled ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>

                     {/* Identity Termination */}
                     <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[32px] space-y-6">
                        <div className="flex items-start space-x-4">
                           <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><AlertIcon size={24} /></div>
                           <div className="flex-1">
                              <div className="text-lg font-black text-white uppercase tracking-tight text-red-500">Node Termination</div>
                              <p className="text-[10px] text-gray-400 font-medium max-w-xs mt-1">This will permanently purge your node from the Matrix. 7-day grace period included.</p>
                           </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (window.confirm("CRITICAL: Finalize identity termination protocol?")) {
                              await api.terminateIdentity();
                              alert("Termination scheduled. Node will be purged in 7 days.");
                              onClose();
                            }
                          }}
                          className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                        >
                           Initialize Sovereignty Purge
                        </button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        <input type="file" ref={avatarRef} hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setAvatarBlob(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
        <input type="file" ref={bannerRef} hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setBannerBlob(f); setBannerPreview(URL.createObjectURL(f)); } }} />
      </motion.div>
    </div>
  );
};

export const SystemSettingsModal = ({ onClose, dockPosition, setDockPosition }: any) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-[2500] flex items-center justify-center p-4 backdrop-blur-xl" onClick={onClose}>
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0c] w-full max-w-md rounded-[40px] border border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">System_CFG</h2>
             <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-8 space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Dock Position</label>
                <div className="grid grid-cols-2 gap-3">
                   {['top', 'bottom', 'left', 'right'].map(pos => (
                     <button key={pos} onClick={() => setDockPosition(pos)} className={`py-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${dockPosition === pos ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}>{pos}</button>
                   ))}
                </div>
             </div>
             <button onClick={onClose} className="w-full bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">Sync System Settings</button>
          </div>
       </motion.div>
    </div>
  );
};
