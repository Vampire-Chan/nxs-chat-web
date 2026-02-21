import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Lock, History as HistoryIcon, Zap, Settings, Image as ImageIcon, Camera, ArrowLeft, ChevronRight, Layout, Monitor, Smartphone, Globe, Heart, Send, Hash, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import type { IUser } from '../services/api';

interface Props {
  user: IUser;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  dockPosition: 'top' | 'bottom' | 'left' | 'right';
  setDockPosition: (pos: 'top' | 'bottom' | 'left' | 'right') => void;
  kineticTransitions?: boolean;
  setKineticTransitions?: (val: boolean) => void;
}

export const UserSettingsModal = ({ user, onClose, onSave, dockPosition, setDockPosition, kineticTransitions, setKineticTransitions }: Props) => {
  const { language, setLanguage, t } = useLanguage();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy' | 'interface' | 'archive' | 'sovereignty' | 'donate'>('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  
  // Profile States
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'deleted'}`);
  const [bannerPreview, setBannerPreview] = useState(user.banner || '');
  
  // Privacy States
  const [isPrivate] = useState(user.isPrivate || false);
  const [showAge] = useState(user.showAge || false);
  const [isDisabled, setIsDisabled] = useState(user.isDisabled || false);
  
  // Interface States
  const [creationUI, setCreationUI] = useState(user.creationUI || 'auto');
  
  // Donation States
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'paypal'>('upi');
  const [donateAmount, setDonateAmount] = useState<string>('500');
  const [donateCurrency, setDonateCurrency] = useState<'INR' | 'USD'>('INR');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  const [loading, setLoading] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleSave = async (customKeys?: any[]) => {
    setLoading(true);
    const fd = new FormData();
    fd.append('displayName', displayName);
    fd.append('bio', bio);
    fd.append('isPrivate', String(isPrivate));
    fd.append('showAge', String(showAge));
    fd.append('creationUI', creationUI);
    if (customKeys) fd.append('recoveryKeys', JSON.stringify(customKeys));
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
      alert(nextStatus ? "Node Hidden" : "Node Active");
    } catch (e) { alert("Failed"); }
  };

  const upiId = import.meta.env.VITE_UPI_ID || 'sarthakgautam2782002@okicici';
  const paypalId = import.meta.env.VITE_PAYPAL_ID || 'sarthakgautam2782002@gmail.com';

  const upiQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Sarthak%20Gautam&am=${donateAmount}&cu=INR`)}`;
  const paypalUrl = `https://www.paypal.com/myaccount/transfer/homepage/external/summary?recipient=${encodeURIComponent(paypalId)}&amount=${donateAmount}&currency_code=${donateCurrency}`;

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim()) return addToast("Enter ID", 'error');
    setIsSubmittingTx(true);
    try {
      await api.submitPayment({
        method: paymentMethod,
        transactionId,
        amount: Number(donateAmount)
      });
      addToast("Signal Transmitted", 'success');
      setTransactionId('');
    } catch (err: any) {
      addToast(err.response?.data?.message || "Transmission Error", 'error');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const navItems = [
    { id: 'profile', label: t('nav.profile'), icon: <User size={18} />, color: 'text-vani-blue' },
    { id: 'interface', label: t('nav.settings'), icon: <Layout size={18} />, color: 'text-pink-400' },
    { id: 'security', label: t('settings.security'), icon: <Shield size={18} />, color: 'text-green-400' },
    { id: 'privacy', label: t('profile.private'), icon: <Lock size={18} />, color: 'text-purple-400' },
    { id: 'archive', label: t('settings.billing'), icon: <HistoryIcon size={18} />, color: 'text-yellow-400' },
    { id: 'sovereignty', label: t('nav.architect'), icon: <Zap size={18} />, color: 'text-vani-accent' },
    { id: 'donate', label: t('nav.donate'), icon: <Heart size={18} />, color: 'text-red-400' }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="fixed inset-0 bg-black z-[2500] flex items-center justify-center lg:p-10 lg:bg-black/95 lg:backdrop-blur-2xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full h-full lg:max-w-6xl lg:h-[85vh] bg-[#0a0a0c] lg:border border-white/5 lg:rounded-[48px] shadow-2xl flex flex-col lg:flex-row overflow-hidden">
        
        <div className={`w-full lg:w-80 bg-discord-sidebar/50 border-r border-white/5 flex flex-col shrink-0 ${isMobile && !isMobileMenuOpen ? 'hidden' : 'flex'}`}>
           <div className="p-6 lg:p-10 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Settings size={24} className="text-vani-blue animate-spin-slow" /> {t('nav.settings')}</h2>
              <button onClick={onClose} className="lg:hidden p-2 bg-white/5 rounded-xl text-white"><X size={20} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2">
              {navItems.map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id as any); if(isMobile) setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${activeTab === item.id && !isMobileMenuOpen ? 'bg-vani-gradient text-white' : 'text-gray-500 hover:bg-white/5'}`}>
                   <div className="flex items-center space-x-4"><span className={activeTab === item.id && !isMobileMenuOpen ? 'text-white' : item.color}>{item.icon}</span><span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span></div>
                   <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
           </div>
        </div>

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
                        <div className="h-32 lg:h-48 bg-gray-900 rounded-[24px] lg:rounded-[40px] overflow-hidden border border-white/5 group cursor-pointer" onClick={() => bannerRef.current?.click()}>
                           {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-40" /> : <div className="w-full h-full bg-vani-gradient opacity-10" />}
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20"><ImageIcon size={40} className="text-white" /></div>
                        </div>
                        <div className="absolute -bottom-10 lg:-bottom-14 left-6 lg:left-14 p-1.5 bg-[#0a0a0c] rounded-[28px] lg:rounded-[36px] shadow-2xl" onClick={(e) => { e.stopPropagation(); avatarRef.current?.click(); }}>
                           <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[24px] lg:rounded-[32px] bg-gray-800 border-4 border-[#0a0a0c] overflow-hidden relative">
                              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-vani-gradient" />}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40"><Camera size={32} className="text-white" /></div>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-6 lg:gap-10">
                        <div className="space-y-3"><label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-4">{t('profile.displayname')}</label><input className="w-full bg-[#050507] border border-white/5 p-5 rounded-3xl text-white outline-none focus:border-vani-blue/50 font-bold" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                        <div className="space-y-3"><label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-4">{t('profile.bio')}</label><textarea className="w-full bg-[#050507] border border-white/5 p-5 rounded-3xl text-white outline-none focus:border-vani-blue/50 font-medium h-40 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
                        <button onClick={() => handleSave()} disabled={loading} className="bg-vani-gradient text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all">{loading ? t('common.scanning') : t('common.save')}</button>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'donate' && (
                  <motion.div key="donate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 lg:space-y-12">
                     <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20 shadow-2xl"><Heart size={40} fill="currentColor" /></div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{t('donate.title')}</h3>
                        <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed uppercase tracking-widest font-mono">{t('donate.subtitle')}</p>
                     </div>

                     <div className="flex justify-center space-x-4">
                        <button onClick={() => { setPaymentMethod('upi'); setDonateCurrency('INR'); }} className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 ${paymentMethod === 'upi' ? 'bg-vani-blue text-black shadow-[0_0_20px_rgba(0,210,255,0.3)]' : 'bg-white/5 text-gray-500'}`}><Zap size={16} /> UPI</button>
                        <button onClick={() => { setPaymentMethod('paypal'); setDonateCurrency('USD'); }} className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 ${paymentMethod === 'paypal' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-gray-500'}`}><Globe size={16} /> PayPal</button>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* LEFT: PAYMENT DETAILS */}
                        <div className="space-y-8">
                           <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-8">
                              {paymentMethod === 'upi' ? (
                                <div className="space-y-6 text-center">
                                   <div className="p-4 bg-white rounded-[32px] shadow-2xl inline-block"><img src={upiQr} alt="UPI QR" className="w-48 h-48" /></div>
                                   <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs text-vani-blue select-all">{upiId}</div>
                                   <div className="grid grid-cols-3 gap-2">
                                      {['50', '500', '5000'].map(v => <button key={v} onClick={() => setDonateAmount(v)} className={`py-3 rounded-xl border font-black text-[10px] transition-all ${donateAmount === v ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>₹{v}</button>)}
                                   </div>
                                </div>
                              ) : (
                                <div className="space-y-6 text-center">
                                   <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-500"><Globe size={48} /></div>
                                   <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs text-purple-400 select-all">{paypalId}</div>
                                   <div className="grid grid-cols-3 gap-2">
                                      {['5', '10', '20'].map(v => <button key={v} onClick={() => setDonateAmount(v)} className={`py-3 rounded-xl border font-black text-[10px] transition-all ${donateAmount === v ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>${v}</button>)}
                                   </div>
                                   <a href={paypalUrl} target="_blank" className="w-full bg-vani-gradient py-4 rounded-2xl block text-[10px] font-black uppercase tracking-widest text-white shadow-xl">Go to PayPal</a>
                                </div>
                              )}
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-4">Magnitude Override</label>
                                 <input type="number" className="w-full bg-[#050507] border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-vani-blue/50 font-bold" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} />
                              </div>
                           </div>
                        </div>

                        {/* RIGHT: VERIFICATION FORM */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-8">
                           <div>
                              <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Shield size={20} className="text-green-400" /> Proof of Link</div>
                              <p className="text-[10px] text-gray-500 font-medium mt-1">Manual account nodes require a transaction ID for energy sync.</p>
                           </div>
                           
                           <div className="space-y-6">
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-2">Transaction ID / Reference</label>
                                 <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-gray-600 group-focus-within:text-vani-blue transition-colors"><Hash size={16} /></div>
                                    <input type="text" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-vani-blue/50 transition-all placeholder-gray-800" placeholder="XXXX-XXXX-XXXX" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                                 </div>
                              </div>

                              <div className="p-4 bg-vani-blue/5 border border-vani-blue/10 rounded-2xl">
                                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Verification protocol: The Architect core will verify the magnitude and transaction ID within 6-12 hours of transmission.</p>
                              </div>

                              <button onClick={handleSubmitTransaction} disabled={isSubmittingTx} className="w-full bg-vani-gradient text-white py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                                 {isSubmittingTx ? <RefreshCcw size={18} className="animate-spin" /> : <Send size={18} />}
                                 {isSubmittingTx ? "Syncing..." : "Transmit Verification Signal"}
                              </button>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'interface' && (
                  <motion.div key="interface" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><ImageIcon size={20} className="text-pink-400" /> {t('settings.appearance')}</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Select Matrix broadcast style.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {[{ id: 'auto', label: 'Auto', icon: <Layout size={20} /> }, { id: 'bar', label: 'Bar', icon: <Monitor size={20} /> }, { id: 'button', label: 'Float', icon: <Smartphone size={20} /> }].map(opt => (
                             <div key={opt.id} onClick={() => setCreationUI(opt.id as any)} className={`p-6 rounded-3xl border cursor-pointer transition-all ${creationUI === opt.id ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-white/5 text-gray-500'}`}><div className="mb-4">{opt.icon}</div><div className="text-xs font-black uppercase tracking-widest">{opt.label}</div></div>
                           ))}
                        </div>
                     </div>

                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Zap size={20} className="text-yellow-400" /> System Metrics</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">Configure core interface alignment and kinetic engines.</p>
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2">Dock Alignment</label>
                              <div className="grid grid-cols-4 gap-2">
                                 {['top', 'bottom', 'left', 'right'].map(pos => (
                                   <button key={pos} onClick={() => setDockPosition(pos as any)} className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${dockPosition === pos ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>{pos}</button>
                                 ))}
                              </div>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div>
                                 <div className="text-[10px] font-black text-white uppercase tracking-widest">Kinetic Transitions</div>
                                 <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Enable motion engine effects</div>
                              </div>
                              <button onClick={() => setKineticTransitions?.(!kineticTransitions)} className={`w-12 h-6 rounded-full relative transition-all ${kineticTransitions ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${kineticTransitions ? 'left-7' : 'left-1'}`} />
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-8">
                        <div><div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Globe size={20} className="text-green-400" /> {t('settings.language')}</div><p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">{t('settings.language_desc')}</p></div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                           {[{ id: 'en', label: 'English' }, { id: 'en-simple', label: 'Simple' }, { id: 'hi', label: 'हिन्दी' }, { id: 'ne', label: 'नेपाली' }, { id: 'mr', label: 'मराठी' }, { id: 'pa', label: 'ਪੰਜਾਬੀ' }, { id: 'bho', label: 'भोजपुरी' }, { id: 'te', label: 'తెలుగు' }, { id: 'kn', label: 'ಕನ್ನಡ' }, { id: 'ur', label: 'اردو' }, { id: 'phd', label: 'Pahadi' }, { id: 'ks', label: 'Kashmiri' }, { id: 'doi', label: 'Dogri' }, { id: 'ghw', label: 'Garhwali' }, { id: 'kum', label: 'Kumaoni' }].map(l => (
                             <button key={l.id} onClick={() => setLanguage(l.id as any)} className={`py-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${language === l.id ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>{l.label}</button>
                           ))}
                        </div>
                     </div>
                     <button onClick={() => handleSave()} className="w-full bg-vani-gradient text-white py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl">{t('common.save')}</button>
                  </motion.div>
                )}

                {activeTab === 'sovereignty' && (
                  <motion.div key="sovereignty" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] space-y-6">
                        <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Zap size={20} className="text-yellow-400" /> {t('ui.session_protocols')}</div>
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => window.location.reload()} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">{t('ui.reroute')}</button>
                           <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500">{t('logout.btn_logout')}</button>
                        </div>
                     </div>
                     <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] flex items-center justify-between">
                        <div><div className="text-lg font-black text-white uppercase tracking-tight">Neural Camouflage</div><p className="text-[10px] text-gray-500 font-medium mt-1">Temporarily vanish from search and feeds.</p></div>
                        <button onClick={handleToggleDisable} className={`w-14 h-8 rounded-full relative transition-all ${isDisabled ? 'bg-vani-accent' : 'bg-gray-800'}`}><div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isDisabled ? 'left-7' : 'left-1'}`} /></button>
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
