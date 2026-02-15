import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Shield, ShieldAlert, Palette, Key, Layout, Download, RefreshCw, Type, CreditCard, Fingerprint, ScrollText } from 'lucide-react'; 
import { api } from '../services/api';
import type { IUser } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CropModal } from './CropModal';
import { SubscriptionModal } from './SubscriptionModal';

interface Props {
  user: IUser;
  onClose: () => void;
  onSave: (formData: FormData) => void;
}

export const UserSettingsModal = ({ user, onClose, onSave }: Props) => {
  const [bio, setBio] = useState(user.bio || '');
  const [status, setStatus] = useState(user.status || 'online');
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);
  const [showAge, setShowAge] = useState(user.showAge || false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [dob, setDob] = useState(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
  
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`);
  const [bannerPreview, setBannerPreview] = useState(user.banner || '');
  const [cropTarget, setCropTarget] = useState<'avatar' | 'banner' | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [pixelCrop, setPixelCrop] = useState<any>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) { setTempImage(URL.createObjectURL(file)); setCropTarget(target); }
  };

  const generateCroppedImage = async () => {
    if (!tempImage || !pixelCrop || !cropTarget) return;
    try {
      const croppedBlob = await getCroppedImg(tempImage, pixelCrop);
      if (cropTarget === 'avatar') { setAvatarBlob(croppedBlob); setAvatarPreview(URL.createObjectURL(croppedBlob)); }
      else { setBannerBlob(croppedBlob); setBannerPreview(URL.createObjectURL(croppedBlob)); }
      setCropTarget(null); setTempImage(null);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = () => {
    const fd = new FormData();
    if (avatarBlob) fd.append('avatar', avatarBlob, 'avatar.jpg');
    if (bannerBlob) fd.append('banner', bannerBlob, 'banner.jpg');
    fd.append('bio', bio); 
    fd.append('status', status); 
    fd.append('customStatus', customStatus); 
    fd.append('isPrivate', String(isPrivate));
    fd.append('showAge', String(showAge));
    fd.append('displayName', displayName);
    if (!user.dob && dob) fd.append('dob', dob);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[600] backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0c] w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-gray-800 relative"
      >
         <div className="absolute top-6 right-6 z-50 cursor-pointer text-white/40 hover:text-white bg-black/40 p-2.5 rounded-2xl transition-all border border-white/5" onClick={onClose}>
            <X size={18} />
         </div>

         <div className="overflow-y-auto max-h-[85vh] custom-scrollbar">
            <div className="h-44 bg-gray-900 relative group cursor-pointer overflow-hidden border-b border-gray-800/50" onClick={() => bannerInputRef.current?.click()}>
               {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-all duration-700" /> : <div className="w-full h-full bg-vani-gradient opacity-10" />}
               <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
                  <ImageIcon className="text-white mb-2" size={24} /><span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Recalibrate Banner</span>
               </div>
            </div>

            <div className="px-10 pb-10">
               <div className="-mt-12 relative mb-8 group/avatar cursor-pointer inline-block" onClick={() => avatarInputRef.current?.click()}>
                  <div className="relative w-28 h-24 rounded-[28px] overflow-hidden bg-gray-800 border-4 border-[#0a0a0c] shadow-2xl">
                     <img src={avatarPreview} className="w-full h-full object-cover transition group-hover/avatar:opacity-50" />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition"><Camera className="text-white" size={24} /></div>
                  </div>
                  <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-[#0a0a0c] rounded-full z-30 ${status === 'online' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} />
               </div>

               <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => onFileChange(e, 'avatar')} />
               <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => onFileChange(e, 'banner')} />

               <div className="space-y-8">
                  <div>
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Public Alias (Display Name)</label>
                     <input className="w-full bg-[#050507] text-white p-4 rounded-2xl border border-gray-800 focus:outline-none focus:border-vani-blue text-sm font-bold" placeholder="Your visible name..." value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>

                  <div>
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Date of Creation {user.dob && '(LOCKED)'}</label>
                     <input type="date" className={`w-full bg-[#050507] text-white p-4 rounded-2xl border border-gray-800 focus:outline-none focus:border-vani-blue text-sm font-mono ${user.dob ? 'opacity-50 cursor-not-allowed' : ''}`} value={dob} onChange={(e) => setDob(e.target.value)} disabled={!!user.dob} />
                  </div>

                  <div className="flex items-center space-x-4">
                     <div className="flex bg-gray-900 rounded-xl p-1 shadow-inner border border-white/5">
                        <StatusBtn active={status === 'online'} color="bg-green-500" onClick={() => setStatus('online')} />
                        <StatusBtn active={status === 'idle'} color="bg-yellow-500" onClick={() => setStatus('idle')} />
                        <StatusBtn active={status === 'dnd'} color="bg-red-500" onClick={() => setStatus('dnd')} />
                        <StatusBtn active={status === 'offline'} color="bg-gray-500" onClick={() => setStatus('offline')} />
                     </div>
                     <input className="flex-1 bg-transparent border-b border-gray-800 focus:border-vani-blue outline-none text-xs text-white placeholder-gray-600 py-2 font-mono" placeholder="Status Signature..." value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} />
                  </div>

                  <div>
                     <div className="flex justify-between items-end mb-2 ml-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Identity Description</label>
                        <span className="text-[8px] font-mono text-gray-700">{bio.length}/300</span>
                     </div>
                     <textarea className="w-full bg-[#050507] text-gray-200 p-4 rounded-2xl border border-gray-800 focus:outline-none focus:border-vani-blue h-24 resize-none transition-all text-xs leading-relaxed" placeholder="Broadcast your purpose..." value={bio} onChange={(e) => setBio(e.target.value.substring(0, 300))} />
                  </div>

                  <div className="space-y-3">
                    <div onClick={() => setIsPrivate(!isPrivate)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${isPrivate ? 'bg-vani-accent/5 border-vani-accent/30 shadow-lg' : 'bg-discord-dark border-gray-800 hover:border-gray-700'}`}>
                       <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPrivate ? 'bg-vani-accent text-white shadow-lg' : 'bg-gray-800 text-gray-500'}`}>{isPrivate ? <ShieldAlert size={18} /> : <Shield size={18} />}</div>
                          <div>
                             <div className={`text-[10px] font-black uppercase tracking-tighter ${isPrivate ? 'text-white' : 'text-gray-400'}`}>Private Ghost Node</div>
                             <div className="text-[8px] text-gray-600 font-medium uppercase tracking-widest">Invisible to public matrix</div>
                          </div>
                       </div>
                       <div className={`w-8 h-4 rounded-full relative transition-colors ${isPrivate ? 'bg-vani-accent' : 'bg-gray-800'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isPrivate ? 'left-4.5' : 'left-0.5'}`} />
                       </div>
                    </div>

                    <div onClick={() => setShowAge(!showAge)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${showAge ? 'bg-vani-blue/5 border-vani-blue/30 shadow-lg' : 'bg-discord-dark border-gray-800 hover:border-gray-700'}`}>
                       <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${showAge ? 'bg-vani-blue text-white shadow-lg' : 'bg-gray-800 text-gray-500'}`}><Type size={18} /></div>
                          <div>
                             <div className={`text-[10px] font-black uppercase tracking-tighter ${showAge ? 'text-white' : 'text-gray-400'}`}>Reveal Biological Age</div>
                             <div className="text-[8px] text-gray-600 font-medium uppercase tracking-widest">Show years in profile</div>
                          </div>
                       </div>
                       <div className={`w-8 h-4 rounded-full relative transition-colors ${showAge ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showAge ? 'left-4.5' : 'left-0.5'}`} />
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                     <button onClick={handleSubmit} className="bg-vani-gradient text-white px-12 py-4 rounded-[20px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center shadow-xl shadow-red-500/20 text-[10px] gap-2">
                        <Fingerprint size={16} /> Finalize Identity
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </motion.div>
      {cropTarget && tempImage && <CropModal image={tempImage} aspect={cropTarget === 'avatar' ? 1 : 21 / 9} onCropComplete={setPixelCrop} onClose={() => { setCropTarget(null); setTempImage(null); }} onConfirm={generateCroppedImage} />}
    </div>
  );
};

export const SystemSettingsModal = ({ user, onClose, dockPosition, setDockPosition }: any) => {
  const [activeTab, setActiveTab] = useState<'visuals' | 'security' | 'legal' | 'billing' | 'sovereignty' | 'sessions'>('visuals');
  const [showSubModal, setShowSubModal] = useState(false);
  const [recoveryKeys, setRecoveryKeys] = useState(user.recoveryKeys || []);
  const { theme, setTheme, fontSize, setFontSize, density, setDensity, font, setFont } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { accounts, switchAccount, logout } = useAuth();

  const handleGenerateKeys = async () => {
    try { const res = await api.generateRecoveryKeys(); setRecoveryKeys(res.keys); } catch (e) { alert("Fail"); }
  };

  const handleExport = async () => {
    if (window.confirm("Prepare neural log archive for export? This will gather all transmissions and identity metadata.")) {
      await api.exportData();
    }
  };

  const handleTerminate = async () => {
    const confirmation = prompt("CRITICAL PROTOCOL: To permanently sever this node from the matrix, type your username:");
    if (!confirmation) return;

    if (confirmation.toLowerCase() === user.username.toLowerCase()) {
      try {
        await api.terminateIdentity();
        alert("Termination Protocol Initialized. Your node will be purged in 7 days unless you log back in.");
        localStorage.clear();
        window.location.href = '/';
      } catch (e) { 
        alert("Severance Protocol Error: Connection refused by matrix core."); 
      }
    } else {
      alert("Validation failed. Identity signature does not match. Node preserved.");
    }
  };

  const toggleHideNode = async () => {
    try {
      const newStatus = !user.isDisabled;
      await api.toggleDisableAccount(newStatus);
      window.location.reload(); 
    } catch (e) { alert("Hideout Protocol Failed"); }
  };

  const downloadKeys = () => {
    const txt = recoveryKeys.map((k: any) => `${k.code} [${k.isUsed ? 'USED' : 'ACTIVE'}]`).join('\n');
    const element = document.createElement("a");
    const file = new Blob([`YANTRAVANI RECOVERY KEYS\nUSER: ${user.username}\n\n${txt}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `vani-recovery-${user.username}.txt`;
    document.body.appendChild(element); element.click();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[700] flex flex-col items-center justify-center p-4 md:p-10 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl h-[85vh] bg-discord-dark border border-gray-800 rounded-[48px] shadow-2xl flex overflow-hidden relative">
        <div onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-red-500 hover:text-white rounded-3xl cursor-pointer transition-all z-50 shadow-xl"><X size={24} /></div>
        <div className="w-72 bg-discord-sidebar/50 border-r border-gray-800 p-10 flex flex-col">
           <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-12 flex items-center"><Shield className="text-vani-blue mr-4" size={32} />System Matrix</h2>
           <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
              <NavBtn label="Visual Optics" active={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} icon={<Palette size={20} />} />
              <NavBtn label="Identity Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Key size={20} />} />
              <NavBtn label="Session Terminal" active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} icon={<RefreshCw size={20} />} />
              <NavBtn label="Premium Billing" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard size={20} />} />
              <NavBtn label="Account Sovereignty" active={activeTab === 'sovereignty'} onClick={() => setActiveTab('sovereignty')} icon={<ShieldAlert size={20} />} />
              <NavBtn label="Yantravani Protocols" active={activeTab === 'legal'} onClick={() => setActiveTab('legal')} icon={<ScrollText size={20} />} />
           </div>
           <div className="pt-10 border-t border-gray-800 mt-auto opacity-40"><p className="text-xs font-black text-white uppercase tracking-widest">v1.0.42-STABLE</p></div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-16">
           <AnimatePresence mode="wait">
              {activeTab === 'visuals' && (
                <motion.div key="visuals" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-16">
                   <Section title="Docking Station" sub="Relocate the core navigation hub.">
                      <div className="grid grid-cols-4 gap-6 mt-8">
                         <PosCard label="Top" active={dockPosition === 'top'} onClick={() => setDockPosition('top')} />
                         <PosCard label="Bottom" active={dockPosition === 'bottom'} onClick={() => setDockPosition('bottom')} />
                         <PosCard label="Left" active={dockPosition === 'left'} onClick={() => setDockPosition('left')} />
                         <PosCard label="Right" active={dockPosition === 'right'} onClick={() => setDockPosition('right')} />
                      </div>
                   </Section>
                   <Section title="Neural Language" sub="Select interface dialect.">
                      <div className="grid grid-cols-3 gap-6 mt-8">
                         <PosCard label="English" active={language === 'en'} onClick={() => setLanguage('en')} />
                         <PosCard label="Hindi (हिंदी)" active={language === 'hi'} onClick={() => setLanguage('hi')} />
                         <PosCard label="Nepali (नेपाली)" active={language === 'ne'} onClick={() => setLanguage('ne')} />
                      </div>
                   </Section>
                   <Section title="Neural Font Calibration" sub="Choose your identity's typeface.">
                      <div className="grid grid-cols-3 gap-6 mt-8">
                         <FontCard label="Modern Sans" active={font === 'modern_sans'} onClick={() => setFont('modern_sans')} preview="Modern_Interface" fontClass="font-sans" />
                         <FontCard label="Cyber Mono" active={font === 'cyber_mono'} onClick={() => setFont('cyber_mono')} preview="0101_KERN_EXEC" fontClass="font-mono" />
                         <FontCard label="Classic Matrix" active={font === 'classic_matrix'} onClick={() => setFont('classic_matrix')} preview="Legacy_Node" fontClass="font-serif" />
                      </div>
                   </Section>
                   <Section title="Optical Density" sub="Adjust interface scaling and text optics.">
                      <div className="mt-8 space-y-10 max-w-xl">
                         <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-vani-blue mb-2"><Type size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Text Scale: {fontSize}px</span></div>
                            <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-vani-blue cursor-pointer" />
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                            <PosCard label="Compact" active={density === 'compact'} onClick={() => setDensity('compact')} />
                            <PosCard label="Standard" active={density === 'standard'} onClick={() => setDensity('standard')} />
                            <PosCard label="Cozy" active={density === 'cozy'} onClick={() => setDensity('cozy')} />
                         </div>
                      </div>
                   </Section>
                   <Section title="Chromatic Matrix" sub="Choose your interface skin.">
                      <div className="grid grid-cols-3 gap-6 mt-8">
                         <ThemeCard label="Vani Dark" active={theme === 'Yantravani_dark'} onClick={() => setTheme('Yantravani_dark')} colors={['bg-red-500', 'bg-blue-500']} />
                         <ThemeCard label="OLED Black" active={theme === 'oled_black'} onClick={() => setTheme('oled_black')} colors={['bg-black', 'bg-gray-950']} />
                         <ThemeCard label="Clinical Light" active={theme === 'clinical_light'} onClick={() => setTheme('clinical_light')} colors={['bg-white', 'bg-gray-200']} />
                      </div>
                   </Section>
                </motion.div>
              )}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-16">
                   <Section title="Quantum Recovery Keys" sub="Generate emergency access codes.">
                      <div className="mt-8 bg-[#050507] p-10 rounded-[32px] border border-gray-800 shadow-inner">
                         {recoveryKeys.length > 0 ? (
                           <div className="space-y-10">
                              <div className="grid grid-cols-2 gap-4">
                                 {recoveryKeys.map((k: any, i: number) => (
                                   <div key={i} className={`p-4 rounded-2xl text-center font-mono text-xs border transition-all ${k.isUsed ? 'bg-red-500/5 border-red-500/20 text-gray-700 line-through opacity-40' : 'bg-white/5 border-white/10 text-vani-blue shadow-lg'}`}>{k.code}</div>
                                 ))}
                              </div>
                              <div className="flex space-x-4">
                                 <button onClick={downloadKeys} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest border border-white/5 transition-all flex items-center justify-center gap-3"><Download size={18} /> Save to Disk</button>
                                 <button onClick={handleGenerateKeys} className="flex-1 bg-vani-blue/10 hover:bg-vani-blue/20 text-vani-blue font-black py-4 rounded-2xl uppercase text-xs tracking-widest border border-vani-blue/20 transition-all flex items-center justify-center gap-3"><RefreshCw size={18} /> Regenerate Protocol</button>
                              </div>
                           </div>
                         ) : (
                           <button onClick={handleGenerateKeys} className="w-full bg-vani-gradient text-white font-black py-5 rounded-3xl uppercase text-xs tracking-widest shadow-2xl shadow-red-500/30">Initialize Security Matrix</button>
                         )}
                      </div>
                   </Section>
                </motion.div>
              )}
              {activeTab === 'sessions' && (
                <motion.div key="sessions" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-16">
                   <Section title="Session Terminal" sub="Manage active identity links and mult-node switching.">
                      <div className="space-y-6 mt-8">
                         {accounts.map(acc => {
                           const isCurrent = (acc.user._id || acc.user.id) === (user._id || user.id);
                           return (
                             <div key={acc.user._id || acc.user.id} className={`p-6 rounded-[32px] border flex items-center justify-between transition-all ${isCurrent ? 'bg-vani-blue/5 border-vani-blue shadow-lg' : 'bg-[#050507] border-gray-800'}`}>
                                <div className="flex items-center space-x-4">
                                   <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5">
                                      <img src={acc.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.user.username}`} className="w-full h-full object-cover" />
                                   </div>
                                   <div>
                                      <div className="text-sm font-black text-white uppercase tracking-tight">{acc.user.username} {isCurrent && '(CURRENT)'}</div>
                                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Node_Status: {isCurrent ? 'CONNECTED' : 'STANDBY'}</div>
                                   </div>
                                </div>
                                {!isCurrent && (
                                  <button onClick={() => { switchAccount(acc.user._id || acc.user.id); window.location.reload(); }} className="px-6 py-2.5 bg-white/5 hover:bg-vani-blue text-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">Switch Node</button>
                                )}
                             </div>
                           );
                         })}
                         
                         <div className="grid grid-cols-2 gap-4 mt-12 pt-12 border-t border-gray-800">
                            <button onClick={() => logout(false)} className="py-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 transition-all">Sever Current Link</button>
                            <button onClick={() => logout(true)} className="py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-red-500/20 transition-all">Global Disconnect</button>
                         </div>
                      </div>
                   </Section>
                </motion.div>
              )}
              {activeTab === 'sovereignty' && (
                <motion.div key="sovereignty" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-12">
                   <Section title="Data Sovereignty" sub="Exercise control over your neural footprint.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                         <div onClick={toggleHideNode} className={`p-8 rounded-[32px] border cursor-pointer transition-all space-y-6 ${user.isDisabled ? 'bg-vani-blue/5 border-vani-blue shadow-lg' : 'bg-[#050507] border-gray-800 hover:border-gray-700'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.isDisabled ? 'bg-vani-blue text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-500'}`}><Shield size={24} /></div>
                            <div>
                               <h4 className={`text-lg font-black uppercase tracking-tighter mb-2 ${user.isDisabled ? 'text-vani-blue' : 'text-white'}`}>{user.isDisabled ? 'Ghost Protocol Active' : 'Initialize Hideout'}</h4>
                               <p className="text-xs text-gray-500 leading-relaxed">Temporarily vanish from the matrix. Your node will be hidden from search, suggestions, and feeds.</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Status</span>
                               <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${user.isDisabled ? 'bg-vani-blue text-black' : 'bg-gray-800 text-gray-500'}`}>{user.isDisabled ? 'HIDDEN' : 'VISIBLE'}</div>
                            </div>
                         </div>

                         <div className="bg-[#050507] p-8 rounded-[32px] border border-gray-800 space-y-6">
                            <div className="w-12 h-12 bg-vani-blue/10 rounded-2xl flex items-center justify-center text-vani-blue"><Download size={24} /></div>
                            <div>
                               <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Export Neural Logs</h4>
                               <p className="text-xs text-gray-500 leading-relaxed">Download a complete JSON archive of your identity profile, transmissions, and realm metadata.</p>
                            </div>
                            <button onClick={handleExport} className="w-full py-4 bg-white/5 hover:bg-vani-blue text-white hover:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/5">Generate Archive</button>
                         </div>

                         <div className="bg-[#050507] p-8 rounded-[32px] border border-red-500/10 space-y-6">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500"><ShieldAlert size={24} /></div>
                            <div>
                               <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Terminate Identity</h4>
                               <p className="text-xs text-gray-500 leading-relaxed">Permanently sever your node from the matrix. All transmissions and community links will be purged in 7 days.</p>
                            </div>
                            <button onClick={handleTerminate} className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-red-500/20">Sever Connection</button>
                         </div>
                      </div>
                   </Section>
                </motion.div>
              )}
              {activeTab === 'billing' && (
                <motion.div key="billing" initial={{opacity:0}} animate={{opacity:1}} className="space-y-12">
                   <Section title="Sovereign Ledger" sub="Manage your contribution to the Matrix.">
                      <div className="mt-6 bg-[#050507] p-10 rounded-[40px] border border-gray-800 flex items-center justify-between">
                         <div>
                            <div className="text-2xl font-black text-white uppercase tracking-tighter mb-1">{user.tier === 'elite' ? 'Elite_Node_Active' : 'Standard_Node'}</div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{user.tier === 'elite' ? 'Lifetime Access Granted' : 'Restricted Capabilities'}</div>
                         </div>
                         {user.tier !== 'elite' && (
                           <button onClick={() => setShowSubModal(true)} className="bg-vani-gradient text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-500/20">Upgrade Node</button>
                         )}
                      </div>
                   </Section>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </motion.div>
      {showSubModal && <SubscriptionModal onClose={() => setShowSubModal(false)} currentUser={user} />}
    </div>
  );
};

const NavBtn = ({ label, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-5 px-6 py-4.5 rounded-[24px] transition-all ${active ? 'bg-vani-gradient text-white shadow-2xl shadow-red-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
     {icon}<span className="text-xs font-black uppercase tracking-widest">{label}</span>
  </button>
);

const Section = ({ title, sub, children }: any) => (
  <div><h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">{title}</h3><p className="text-sm text-gray-600 font-medium uppercase tracking-[0.2em]">{sub}</p>{children}</div>
);

const PosCard = ({ label, active, onClick }: any) => (
  <div onClick={onClick} className={`p-6 rounded-[28px] border transition-all cursor-pointer text-center group ${active ? 'border-vani-blue bg-vani-blue/10 text-white shadow-lg' : 'border-gray-800 bg-[#050507] text-gray-600 hover:border-gray-700 hover:text-gray-400'}`}>
     <Layout size={32} className={`mx-auto mb-3 transition-colors ${active ? 'text-vani-blue' : 'group-hover:text-gray-300'}`} />
     <div className="text-[11px] font-black uppercase tracking-widest">{label}</div>
  </div>
);

const FontCard = ({ label, active, onClick, preview, fontClass }: any) => (
  <div onClick={onClick} className={`p-6 rounded-[28px] border transition-all cursor-pointer group ${active ? 'border-vani-blue bg-vani-blue/10 text-white shadow-lg' : 'border-gray-800 bg-[#050507] text-gray-600 hover:border-gray-700'}`}>
     <div className={`text-2xl mb-4 ${fontClass} ${active ? 'text-vani-blue' : 'text-gray-500'}`}>{preview}</div>
     <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
  </div>
);

const ThemeCard = ({ label, active, onClick, colors }: any) => (
  <div onClick={onClick} className={`p-6 rounded-[32px] border transition-all cursor-pointer group ${active ? 'border-vani-blue bg-vani-blue/10' : 'border-gray-800 bg-[#050507] hover:border-gray-700'}`}>
     <div className="flex space-x-3 mb-6">
        {colors.map((c: string, i: number) => <div key={i} className={`w-8 h-8 rounded-full shadow-lg ${c}`} />)}
     </div>
     <div className={`text-[11px] font-black uppercase tracking-[0.2em] ${active ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>{label}</div>
  </div>
);

const StatusBtn = ({ active, color, onClick }: any) => (
  <div onClick={onClick} className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${active ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'}`}><div className={`w-4 h-4 rounded-full ${color} ${active ? 'ring-4 ring-white/10' : ''}`} /></div>
);

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image(); image.src = imageSrc; await new Promise((r) => (image.onload = r));
  const canvas = document.createElement('canvas'); canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d'); ctx?.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((r) => canvas.toBlob((b) => r(b!), 'image/jpeg'));
}
