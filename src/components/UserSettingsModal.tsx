import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Camera, Image as ImageIcon, Shield, ShieldAlert, Palette, Bell, ScrollText, Key, Monitor, Smartphone, Trash2, CheckCircle2, Layout, Download, RefreshCw, Type, Maximize, Cpu, Globe, Zap } from 'lucide-react';
import { api } from '../services/api';
import type { IUser } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { CropModal } from './CropModal';

interface Props {
  user: IUser;
  onClose: () => void;
  onSave: (formData: FormData) => void;
}

// ==========================================
//         IDENTITY SETTINGS MODAL
// ==========================================
export const UserSettingsModal = ({ user, onClose, onSave }: Props) => {
  const [bio, setBio] = useState(user.bio || '');
  const [status, setStatus] = useState(user.status || 'online');
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);
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
    fd.append('bio', bio); fd.append('status', status); fd.append('customStatus', customStatus); fd.append('isPrivate', String(isPrivate));
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[600] backdrop-blur-md p-4">
      <div className="bg-[#0a0a0c] w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-gray-800 animate-in fade-in zoom-in duration-300 relative">
         <div className="h-44 bg-gray-900 relative group cursor-pointer overflow-hidden border-b border-gray-800" onClick={() => bannerInputRef.current?.click()}>
            {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-500" /> : <div className="w-full h-full bg-nexus-gradient opacity-20" />}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
               <ImageIcon className="text-white mb-2" size={32} /><span className="text-[10px] font-black text-white uppercase tracking-widest">Update Banner Node</span>
            </div>
         </div>
         <div className="absolute top-32 left-10 p-1.5 bg-[#0a0a0c] rounded-[32px] group/avatar cursor-pointer z-20" onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }}>
            <div className="relative w-32 h-32 rounded-[28px] overflow-hidden bg-gray-800 border-4 border-[#0a0a0c] shadow-2xl">
               <img src={avatarPreview} className="w-full h-full object-cover transition group-hover/avatar:opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition"><Camera className="text-white" size={28} /></div>
            </div>
            <div className={`absolute bottom-2 right-2 w-7 h-7 border-4 border-[#0a0a0c] rounded-full z-30 ${status === 'online' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} />
         </div>
         <div className="absolute top-6 right-6 z-30 cursor-pointer text-white/50 hover:text-white bg-black/40 p-3 rounded-2xl transition-all shadow-lg" onClick={onClose}><X size={20} /></div>
         <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => onFileChange(e, 'avatar')} />
         <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => onFileChange(e, 'banner')} />
         <div className="pt-24 px-12 pb-12">
            <div className="flex items-center space-x-4 mb-10">
               <div className="flex bg-gray-900 rounded-2xl p-1.5 shadow-inner border border-white/5">
                  <StatusBtn active={status === 'online'} color="bg-green-500" onClick={() => setStatus('online')} />
                  <StatusBtn active={status === 'idle'} color="bg-yellow-500" onClick={() => setStatus('idle')} />
                  <StatusBtn active={status === 'dnd'} color="bg-red-500" onClick={() => setStatus('dnd')} />
                  <StatusBtn active={status === 'offline'} color="bg-gray-500" onClick={() => setStatus('offline')} />
               </div>
               <input className="flex-1 bg-transparent border-b border-gray-800 focus:border-nexus-blue outline-none text-sm text-white placeholder-gray-600 py-3 font-mono" placeholder="Set custom status..." value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} />
            </div>
            <div className="space-y-8">
               <div onClick={() => setIsPrivate(!isPrivate)} className={`p-5 rounded-[24px] border cursor-pointer transition-all flex items-center justify-between ${isPrivate ? 'bg-nexus-accent/10 border-nexus-accent shadow-lg shadow-red-500/5' : 'bg-discord-dark border-gray-800 hover:border-gray-700'}`}>
                  <div className="flex items-center space-x-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPrivate ? 'bg-nexus-accent text-white' : 'bg-gray-800 text-gray-500'}`}>{isPrivate ? <ShieldAlert size={24} /> : <Shield size={24} />}</div>
                     <div><div className={`text-sm font-black uppercase tracking-tighter ${isPrivate ? 'text-white' : 'text-gray-400'}`}>Private Identity Mode</div><div className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Only synced nodes can view your matrix</div></div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${isPrivate ? 'bg-nexus-accent' : 'bg-gray-800'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPrivate ? 'left-7' : 'left-1'}`} /></div>
               </div>
               <div>
                  <div className="flex justify-between items-end mb-3 ml-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Identity Bio Buffer</label><span className={`text-[10px] font-mono ${bio.length > 280 ? 'text-nexus-accent' : 'text-gray-600'}`}>{bio.length} / 300</span></div>
                  <textarea className="w-full bg-[#050507] text-gray-200 p-5 rounded-[24px] border border-gray-800 focus:outline-none focus:border-nexus-blue h-28 resize-none transition-all text-sm font-medium shadow-inner leading-relaxed" placeholder="Describe your node..." value={bio} onChange={(e) => setBio(e.target.value.substring(0, 300))} />
               </div>
            </div>
            <div className="flex justify-end mt-10">
               <button onClick={handleSubmit} className="bg-nexus-gradient text-white px-16 py-4 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center shadow-2xl shadow-red-500/20 text-xs gap-3"><Save size={18} />Sync Identity</button>
            </div>
         </div>
      </div>
      {cropTarget && tempImage && <CropModal image={tempImage} aspect={cropTarget === 'avatar' ? 1 : 21 / 9} onCropComplete={setPixelCrop} onClose={() => { setCropTarget(null); setTempImage(null); }} onConfirm={generateCroppedImage} />}
    </div>
  );
};

// ==========================================
//         SYSTEM SETTINGS MODAL
// ==========================================
export const SystemSettingsModal = ({ user, onClose, dockPosition, setDockPosition }: any) => {
  const [activeTab, setActiveTab] = useState<'visuals' | 'security' | 'legal'>('visuals');
  const [recoveryKeys, setRecoveryKeys] = useState(user.recoveryKeys || []);
  const { theme, setTheme, fontSize, setFontSize, density, setDensity, font, setFont } = useTheme();

  const handleGenerateKeys = async () => {
    try {
      const res = await api.generateRecoveryKeys();
      setRecoveryKeys(res.keys);
    } catch (e) { alert("Security transmission failed."); }
  };

  const downloadKeys = () => {
    const txt = recoveryKeys.map((k: any) => `${k.code} [${k.isUsed ? 'USED' : 'ACTIVE'}]`).join('\n');
    const element = document.createElement("a");
    const file = new Blob([`NEXUS RECOVERY KEYS\nUSER: ${user.username}\n\n${txt}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `nexus-recovery-${user.username}.txt`;
    document.body.appendChild(element); element.click();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[700] flex flex-col items-center justify-center p-4 md:p-10 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl h-[85vh] bg-discord-dark border border-gray-800 rounded-[48px] shadow-2xl flex overflow-hidden relative">
        <div onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-red-500 hover:text-white rounded-3xl cursor-pointer transition-all z-50 shadow-xl"><X size={24} /></div>
        
        <div className="w-72 bg-discord-sidebar/50 border-r border-gray-800 p-10 flex flex-col">
           <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-12 flex items-center"><Shield className="text-nexus-blue mr-4" size={32} />System Matrix</h2>
           <div className="space-y-3 flex-1">
              <NavBtn label="Visual Optics" active={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} icon={<Palette size={20} />} />
              <NavBtn label="Identity Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Key size={20} />} />
              <NavBtn label="Nexus Protocols" active={activeTab === 'legal'} onClick={() => setActiveTab('legal')} icon={<ScrollText size={20} />} />
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
                            <div className="flex items-center space-x-3 text-nexus-blue mb-2"><Type size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Text Scale: {fontSize}px</span></div>
                            <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-nexus-blue cursor-pointer" />
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
                         <ThemeCard label="Nexus Dark" active={theme === 'nexus_dark'} onClick={() => setTheme('nexus_dark')} colors={['bg-red-500', 'bg-blue-500']} />
                         <ThemeCard label="OLED Black" active={theme === 'oled_black'} onClick={() => setTheme('oled_black')} colors={['bg-black', 'bg-gray-950']} />
                         <ThemeCard label="Clinical Light" active={theme === 'clinical_light'} onClick={() => setTheme('clinical_light')} colors={['bg-white', 'bg-gray-200']} />
                      </div>
                   </Section>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-16">
                   <Section title="Quantum Recovery Keys" sub="Generate emergency access codes. USED keys are strikethroughed.">
                      <div className="mt-8 bg-[#050507] p-10 rounded-[32px] border border-gray-800 shadow-inner">
                         {recoveryKeys.length > 0 ? (
                           <div className="space-y-10">
                              <div className="grid grid-cols-2 gap-4">
                                 {recoveryKeys.map((k: any, i: number) => (
                                   <div key={i} className={`p-4 rounded-2xl text-center font-mono text-xs border transition-all ${k.isUsed ? 'bg-red-500/5 border-red-500/20 text-gray-700 line-through opacity-40' : 'bg-white/5 border-white/10 text-nexus-blue shadow-lg'}`}>{k.code}</div>
                                 ))}
                              </div>
                              <div className="flex space-x-4">
                                 <button onClick={downloadKeys} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest border border-white/5 transition-all flex items-center justify-center gap-3"><Download size={18} /> Save to Disk</button>
                                 <button onClick={handleGenerateKeys} className="flex-1 bg-nexus-blue/10 hover:bg-nexus-blue/20 text-nexus-blue font-black py-4 rounded-2xl uppercase text-xs tracking-widest border border-nexus-blue/20 transition-all flex items-center justify-center gap-3"><RefreshCw size={18} /> Regenerate Protocol</button>
                              </div>
                           </div>
                         ) : (
                           <button onClick={handleGenerateKeys} className="w-full bg-nexus-gradient text-white font-black py-5 rounded-3xl uppercase text-xs tracking-widest shadow-2xl shadow-red-500/30">Initialize Security Matrix</button>
                         )}
                      </div>
                   </Section>

                   <Section title="Active Session Matrix" sub="Currently established links to this identity.">
                      <div className="space-y-3 mt-8">
                         <SessionItem device="Windows PC Node" location="Local Access" current={true} />
                         <SessionItem device="Identity Request" location="Unknown Relay" current={false} />
                      </div>
                   </Section>

                   <Section title="Phone Node Sync" sub="Receive emergency alerts via SMS. (Premium Node required)">
                      <div className="mt-8 opacity-40 grayscale pointer-events-none">
                         <div className="bg-gray-900/50 p-6 rounded-[24px] border border-gray-800 flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-gray-500"><Smartphone size={24} /><span>Add Phone Link</span></div>
                            <div className="bg-nexus-accent/10 text-nexus-accent text-[8px] font-black px-3 py-1 rounded-full uppercase">LOCKED</div>
                         </div>
                      </div>
                   </Section>
                </motion.div>
              )}

              {activeTab === 'legal' && (
                <motion.div key="legal" initial={{opacity:0}} animate={{opacity:1}} className="space-y-16">
                   <Section title="Nexus Protocol 1.0" sub="The ethics of the Matrix.">
                      <div className="mt-8 space-y-10 text-gray-400 font-medium text-sm leading-relaxed max-w-2xl bg-white/[0.02] p-10 rounded-[40px] border border-white/5">
                         <div className="space-y-4">
                            <h4 className="text-white font-black uppercase tracking-tighter flex items-center gap-3"><Globe size={18} className="text-nexus-blue" /> Social Integrity</h4>
                            <p>All nodes must maintain mutual respect. Unauthorized data flooding (spam) or identity harassment results in permanent severance from the matrix.</p>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-white font-black uppercase tracking-tighter flex items-center gap-3"><Cpu size={18} className="text-nexus-accent" /> Data Sovereignty</h4>
                            <p>Code Lost, ID Lost. Nexus does not store your private decryption keys. Your identity is your responsibility. Loss of keys is permanent.</p>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-white font-black uppercase tracking-tighter flex items-center gap-3"><Zap size={18} className="text-yellow-500" /> Transmission Ethics</h4>
                            <p>Broadcasts must adhere to regional node laws. Illegal data transmissions will be flagged by the Architect and purged.</p>
                         </div>
                      </div>
                   </Section>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const NavBtn = ({ label, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-5 px-6 py-4.5 rounded-[24px] transition-all ${active ? 'bg-nexus-gradient text-white shadow-2xl shadow-red-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
     {icon}<span className="text-xs font-black uppercase tracking-widest">{label}</span>
  </button>
);

const Section = ({ title, sub, children }: any) => (
  <div><h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">{title}</h3><p className="text-sm text-gray-600 font-medium uppercase tracking-[0.2em]">{sub}</p>{children}</div>
);

const PosCard = ({ label, active, onClick }: any) => (
  <div onClick={onClick} className={`p-6 rounded-[28px] border transition-all cursor-pointer text-center group ${active ? 'border-nexus-blue bg-nexus-blue/10 text-white shadow-lg' : 'border-gray-800 bg-[#050507] text-gray-600 hover:border-gray-700 hover:text-gray-400'}`}>
     <Layout size={32} className={`mx-auto mb-3 transition-colors ${active ? 'text-nexus-blue' : 'group-hover:text-gray-300'}`} />
     <div className="text-[11px] font-black uppercase tracking-widest">{label}</div>
  </div>
);

const FontCard = ({ label, active, onClick, preview, fontClass }: any) => (
  <div onClick={onClick} className={`p-6 rounded-[28px] border transition-all cursor-pointer group ${active ? 'border-nexus-blue bg-nexus-blue/10 text-white shadow-lg' : 'border-gray-800 bg-[#050507] text-gray-600 hover:border-gray-700'}`}>
     <div className={`text-2xl mb-4 ${fontClass} ${active ? 'text-nexus-blue' : 'text-gray-500'}`}>{preview}</div>
     <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
  </div>
);

const ThemeCard = ({ label, active, onClick, colors }: any) => (
  <div onClick={onClick} className={`p-6 rounded-[32px] border transition-all cursor-pointer group ${active ? 'border-nexus-blue bg-nexus-blue/10' : 'border-gray-800 bg-[#050507] hover:border-gray-700'}`}>
     <div className="flex space-x-3 mb-6">
        {colors.map((c: string, i: number) => <div key={i} className={`w-8 h-8 rounded-full shadow-lg ${c}`} />)}
     </div>
     <div className={`text-[11px] font-black uppercase tracking-[0.2em] ${active ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>{label}</div>
  </div>
);

const SessionItem = ({ device, location, current }: any) => (
  <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-[24px] group hover:bg-white/[0.04] transition-all">
     <div className="flex items-center space-x-5">
        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-nexus-blue transition-colors">
           {device.includes('PC') ? <Monitor size={24} /> : <Smartphone size={24} />}
        </div>
        <div>
           <div className="text-sm font-black text-white uppercase tracking-tight">{device}</div>
           <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">{location}</div>
        </div>
     </div>
     {current ? (
       <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 uppercase tracking-widest">Active_Node</span>
     ) : (
       <button className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl border border-transparent hover:border-red-500/20">
          <Trash2 size={18} />
       </button>
     )}
  </div>
);

const StatusBtn = ({ active, color, onClick }: any) => (
  <div onClick={onClick} className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${active ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'}`}><div className={`w-4 h-4 rounded-full ${color} ${active ? 'ring-4 ring-white/10' : ''}`} /></div>
);

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image(); image.src = imageSrc;
  await new Promise((r) => (image.onload = r));
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((r) => canvas.toBlob((b) => r(b!), 'image/jpeg'));
}