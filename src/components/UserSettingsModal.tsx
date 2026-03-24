import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Lock, History as HistoryIcon, Zap, Settings, Image as ImageIcon, Camera, ArrowLeft, ChevronRight, Layout, Monitor, Smartphone, Globe, Heart, Send, Hash, RefreshCcw, LockKeyhole, ExternalLink, CreditCard } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getIdentityAvatar } from '../services/identity';
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
  const [gender, setGender] = useState(user.gender || 'none');
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(getIdentityAvatar(user));
  const [bannerPreview, setBannerPreview] = useState(user.banner || '');
  
  // Privacy States
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);
  const [showAge, setShowAge] = useState(user.showAge || false);
  const [showGender, setShowGender] = useState(user.showGender || false);
  const [isDisabled, setIsDisabled] = useState(user.isDisabled || false);
  
  // Interface States
  const [creationUI, setCreationUI] = useState(user.creationUI || 'auto');
  
  // Donation States
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'paypal'>('upi');
  const [donateAmount, setDonateAmount] = useState<string>('500');
  const [donateCurrency, setDonateCurrency] = useState<'INR' | 'USD'>('INR');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Security States
  const [backupKeys, setBackupKeys] = useState<{ code: string, isUsed: boolean }[]>(user.recoveryKeys || []);
  const [newTOTP, setNewTOTP] = useState<{ secret: string, qrCode: string } | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setGender(user.gender || 'none');
      setAvatarPreview(getIdentityAvatar(user));
      setBannerPreview(user.banner || '');
      setIsPrivate(user.isPrivate || false);
      setShowAge(user.showAge || false);
      setShowGender(user.showGender || false);
      setIsDisabled(user.isDisabled || false);
      setCreationUI(user.creationUI || 'auto');
      setBackupKeys(user.recoveryKeys || []);
   }, [user]);

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        const res = await api.getTransactions();
        setTransactions(Array.isArray(res) ? res : (res.data || []));
      } catch (e) { console.error("Failed to fetch ledger", e); }
    };
    if (activeTab === 'archive') fetchTxs();
  }, [activeTab]);

  const handleSave = async (customKeys?: any[]) => {
    setLoading(true);
    const fd = new FormData();

      const normalizedDisplayName = displayName.trim();
      const initialDisplayName = (user.displayName || '').trim();
      if (normalizedDisplayName !== initialDisplayName) {
         fd.append('displayName', normalizedDisplayName);
      }

      if (bio !== (user.bio || '')) {
         fd.append('bio', bio);
      }

      if (gender !== (user.gender || 'none')) {
         fd.append('gender', gender);
      }

      if (isPrivate !== !!user.isPrivate) {
         fd.append('isPrivate', String(isPrivate));
      }

      if (showAge !== !!user.showAge) {
         fd.append('showAge', String(showAge));
      }

      if (showGender !== !!user.showGender) {
         fd.append('showGender', String(showGender));
      }

      if (creationUI !== (user.creationUI || 'auto')) {
         fd.append('creationUI', creationUI);
      }

      if (customKeys) fd.append('recoveryKeys', JSON.stringify(customKeys));
      if (avatarBlob) fd.append('avatar', avatarBlob, 'avatar.jpg');
      if (bannerBlob) fd.append('banner', bannerBlob, 'banner.jpg');

      try {
         await onSave(fd);
      } finally {
         setLoading(false);
      }
  };

  const handleToggleDisable = async () => {
    try {
      const nextStatus = !isDisabled;
      await api.toggleDisableAccount(nextStatus);
      setIsDisabled(nextStatus);
      addToast(nextStatus ? t('settings.node_hidden') : t('settings.node_active'), 'success');
    } catch (e) { addToast(t('app.sync_error'), 'error'); }
  };

  const upiId = import.meta.env.VITE_UPI_ID || 'sarthakgautam2782002@okicici';
  const paypalId = import.meta.env.VITE_PAYPAL_ID || 'sarthakgautam2782002@gmail.com';

  const upiQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Sarthak%20Gautam&am=${donateAmount}&cu=INR`)}`;
  const paypalUrl = `https://www.paypal.com/myaccount/transfer/homepage/external/summary?recipient=${encodeURIComponent(paypalId)}&amount=${donateAmount}&currency_code=${donateCurrency}`;

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim()) return addToast(t('settings.enter_id'), 'error');
    setIsSubmittingTx(true);
    try {
      await api.submitPayment({
        method: paymentMethod,
        transactionId,
        amount: Number(donateAmount)
      });
      addToast(t('settings.signal_transmitted'), 'success');
      setTransactionId('');
    } catch (err: any) {
      addToast(err.response?.data?.message || t('auth.transmission_error'), 'error');
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
                <button key={item.id} onClick={() => { setActiveTab(item.id as any); if(isMobile) setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${activeTab === item.id && (isMobile ? !isMobileMenuOpen : true) ? 'bg-vani-gradient text-white' : 'text-gray-500 hover:bg-white/5'}`}>
                   <div className="flex items-center space-x-4"><span className={activeTab === item.id && (isMobile ? !isMobileMenuOpen : true) ? 'text-white' : item.color}>{item.icon}</span><span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span></div>
                   <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
           </div>
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden bg-discord-dark/20 ${isMobile && isMobileMenuOpen ? 'hidden' : 'flex'}`}>
           <div className="p-6 lg:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl text-white"><ArrowLeft size={20} /></button>
                 <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">
                    {navItems.find(i => i.id === activeTab)?.label.split(' ')[0] || activeTab}_{t('settings.matrix_matrix')}
                 </h3>
              </div>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500 transition-all text-white"><X size={20} /></button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 lg:space-y-12">
                     <div className="relative mb-16 lg:mb-24">
                        <div className="h-32 md:h-40 lg:h-48 bg-gray-900 rounded-[24px] lg:rounded-[40px] overflow-hidden border border-white/5 group cursor-pointer" onClick={() => bannerRef.current?.click()}>
                           {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-40" /> : <div className="w-full h-full bg-vani-gradient opacity-10" />}
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20"><ImageIcon size={40} className="text-white" /></div>
                        </div>
                        <div className="absolute -bottom-10 lg:-bottom-14 left-6 lg:left-14 p-1.5 bg-[#0a0a0c] rounded-[28px] lg:rounded-[36px] shadow-2xl" onClick={(e) => { e.stopPropagation(); avatarRef.current?.click(); }}>
                           <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-[20px] md:rounded-[24px] lg:rounded-[32px] bg-gray-800 border-4 border-[#0a0a0c] overflow-hidden relative">
                              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-vani-gradient" />}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40"><Camera size={32} className="text-white" /></div>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                        <div className="space-y-3"><label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-4">{t('profile.displayname')}</label><input className="w-full bg-[#050507] border border-white/5 p-4 md:p-5 rounded-2xl md:rounded-3xl text-white outline-none focus:border-vani-blue/50 font-bold" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                              {t('profile.gender')}
                              {user.gender && user.gender !== 'none' && <LockKeyhole size={10} className="text-vani-blue" />}
                           </label>
                           <select 
                             className={`w-full bg-[#050507] border border-white/5 p-4 md:p-5 rounded-2xl md:rounded-3xl text-white outline-none focus:border-vani-blue/50 font-bold appearance-none ${user.gender && user.gender !== 'none' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} 
                             value={gender} 
                             onChange={(e) => setGender(e.target.value as any)}
                             disabled={!!(user.gender && user.gender !== 'none')}
                           >
                              <option value="male">{t('profile.gender_male')}</option>
                              <option value="female">{t('profile.gender_female')}</option>
                              <option value="other">{t('profile.gender_other')}</option>
                              <option value="none">{t('profile.gender_none')}</option>
                           </select>
                           {user.gender && user.gender !== 'none' && (
                             <p className="text-[7px] font-black text-vani-blue uppercase tracking-widest ml-4">{t('profile.gender_locked')}</p>
                           )}
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-6 lg:gap-10">
                        <div className="space-y-3"><label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-4">{t('profile.bio')}</label><textarea className="w-full bg-[#050507] border border-white/5 p-4 md:p-5 rounded-2xl md:rounded-3xl text-white outline-none focus:border-vani-blue/50 font-medium h-32 md:h-40 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
                        <button onClick={() => handleSave()} disabled={loading} className="bg-vani-gradient text-white py-4 md:py-5 rounded-2xl md:rounded-[24px] font-black uppercase text-[10px] md:text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all">{loading ? t('common.scanning') : t('common.save')}</button>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'donate' && (
                  <motion.div key="donate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 lg:space-y-12">
                     <div className="text-center space-y-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/10 rounded-[28px] md:rounded-[32px] flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20 shadow-2xl"><Heart size={32} className="md:w-10 md:h-10" fill="currentColor" /></div>
                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{t('donate.title')}</h3>
                        <p className="text-gray-500 text-[10px] md:text-xs max-w-md mx-auto leading-relaxed uppercase tracking-widest font-mono">{t('donate.subtitle')}</p>
                     </div>

                     <div className="flex justify-center space-x-3 md:space-x-4">
                        <button onClick={() => { setPaymentMethod('upi'); setDonateCurrency('INR'); }} className={`px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all flex items-center gap-2 md:gap-3 ${paymentMethod === 'upi' ? 'bg-vani-blue text-black shadow-[0_0_20px_rgba(0,210,255,0.3)]' : 'bg-white/5 text-gray-500'}`}><Zap size={14} className="md:w-4 md:h-4" /> UPI</button>
                        <button onClick={() => { setPaymentMethod('paypal'); setDonateCurrency('USD'); }} className={`px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all flex items-center gap-2 md:gap-3 ${paymentMethod === 'paypal' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-gray-500'}`}><Globe size={14} className="md:w-4 md:h-4" /> PayPal</button>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* LEFT: PAYMENT DETAILS */}
                        <div className="space-y-8">
                           <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl md:rounded-[40px] space-y-8">
                              {paymentMethod === 'upi' ? (
                                <div className="space-y-6 text-center">
                                   <div className="p-4 bg-white rounded-2xl md:rounded-[32px] shadow-2xl inline-block"><img src={upiQr} alt="UPI QR" className="w-40 h-40 md:w-48 md:h-48" /></div>
                                   <div className="bg-black/40 p-3 md:p-4 rounded-xl border border-white/5 font-mono text-[10px] md:text-xs text-vani-blue select-all break-all">{upiId}</div>
                                   <div className="grid grid-cols-3 gap-2">
                                      {['50', '500', '5000'].map(v => <button key={v} onClick={() => setDonateAmount(v)} className={`py-3 rounded-xl border font-black text-[9px] md:text-[10px] transition-all ${donateAmount === v ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>₹{v}</button>)}
                                   </div>
                                </div>
                              ) : (
                                <div className="space-y-6 text-center">
                                   <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-500"><Globe size={40} className="md:w-12 md:h-12" /></div>
                                   <div className="bg-black/40 p-3 md:p-4 rounded-xl border border-white/5 font-mono text-[10px] md:text-xs text-purple-400 select-all break-all">{paypalId}</div>
                                   <div className="grid grid-cols-3 gap-2">
                                      {['5', '10', '20'].map(v => <button key={v} onClick={() => setDonateAmount(v)} className={`py-3 rounded-xl border font-black text-[9px] md:text-[10px] transition-all ${donateAmount === v ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>${v}</button>)}
                                   </div>
                                   <a href={paypalUrl} target="_blank" className="w-full bg-vani-gradient py-4 rounded-xl md:rounded-2xl block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-xl">Go to PayPal</a>
                                </div>
                              )}
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-4">{t('settings.magnitude_override')}</label>
                                 <input type="number" className="w-full bg-[#050507] border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-vani-blue/50 font-bold" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} />
                              </div>
                           </div>
                        </div>

                        {/* RIGHT: VERIFICATION FORM */}
                        <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl md:rounded-[40px] space-y-8">
                           <div>
                              <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Shield size={20} className="text-green-400" /> {t('settings.proof_of_link')}</div>
                              <p className="text-[10px] text-gray-500 font-medium mt-1">{t('settings.proof_desc')}</p>
                           </div>
                           
                           <div className="space-y-6">
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-2">{t('settings.transaction_id')}</label>
                                 <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-gray-600 group-focus-within:text-vani-blue transition-colors"><Hash size={16} /></div>
                                    <input type="text" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-vani-blue/50 transition-all placeholder-gray-800" placeholder="XXXX-XXXX-XXXX" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                                 </div>
                              </div>

                              <div className="p-4 bg-vani-blue/5 border border-vani-blue/10 rounded-2xl">
                                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">{t('settings.verification_protocol')}</p>
                              </div>

                              <button onClick={handleSubmitTransaction} disabled={isSubmittingTx} className="w-full bg-vani-gradient text-white py-4 md:py-5 rounded-xl md:rounded-[24px] font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-2xl flex items-center justify-center gap-2 md:gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                                 {isSubmittingTx ? <RefreshCcw size={16} className="md:w-[18px] md:h-[18px] animate-spin" /> : <Send size={16} className="md:w-[18px] md:h-[18px]" />}
                                 {isSubmittingTx ? t('common.loading') : t('settings.transmit_signal')}
                              </button>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'interface' && (
                  <motion.div key="interface" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 md:space-y-10">
                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] space-y-6 md:space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><ImageIcon size={20} className="text-pink-400" /> {t('settings.appearance')}</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">{t('settings.appearance_desc')}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                           {[{ id: 'auto', label: 'Auto', icon: <Layout size={20} /> }, { id: 'bar', label: 'Bar', icon: <Monitor size={20} /> }, { id: 'button', label: 'Float', icon: <Smartphone size={20} /> }].map(opt => (
                             <div key={opt.id} onClick={() => setCreationUI(opt.id as any)} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border cursor-pointer transition-all ${creationUI === opt.id ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-white/5 text-gray-500'}`}><div className="mb-3 md:mb-4">{opt.icon}</div><div className="text-[10px] md:text-xs font-black uppercase tracking-widest">{opt.label}</div></div>
                           ))}
                        </div>
                     </div>

                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] space-y-6 md:space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Zap size={20} className="text-yellow-400" /> {t('settings.system_metrics')}</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">{t('settings.system_metrics_desc')}</p>
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2">{t('settings.dock_alignment')}</label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                 {['top', 'bottom', 'left', 'right'].map(pos => (
                                   <button key={pos} onClick={() => setDockPosition(pos as any)} className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${dockPosition === pos ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>{pos}</button>
                                 ))}
                              </div>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div>
                                 <div className="text-[10px] font-black text-white uppercase tracking-widest">{t('settings.kinetic_transitions')}</div>
                                 <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">{t('settings.kinetic_desc')}</div>
                              </div>
                              <button onClick={() => setKineticTransitions?.(!kineticTransitions)} className={`w-12 h-6 rounded-full relative transition-all ${kineticTransitions ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${kineticTransitions ? 'left-7' : 'left-1'}`} />
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] space-y-6 md:space-y-8">
                        <div><div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Globe size={20} className="text-green-400" /> {t('settings.language')}</div><p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">{t('settings.language_desc')}</p></div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                           {[{ id: 'en', label: 'English' }, { id: 'en-simple', label: 'Simple' }, { id: 'hi', label: 'हिन्दी' }, { id: 'ne', label: 'नेपाली' }, { id: 'mr', label: 'मराठी' }, { id: 'pa', label: 'ਪੰਜਾਬੀ' }, { id: 'bho', label: 'भोजपुरी' }, { id: 'te', label: 'తెలుగు' }, { id: 'kn', label: 'ಕನ್ನಡ' }, { id: 'ur', label: 'اردو' }, { id: 'phd', label: 'Pahadi' }, { id: 'ks', label: 'Kashmiri' }, { id: 'doi', label: 'Dogri' }, { id: 'ghw', label: 'Garhwali' }, { id: 'kum', label: 'Kumaoni' }].map(l => (
                             <button key={l.id} onClick={() => setLanguage(l.id as any)} className={`py-3 md:py-4 rounded-xl md:rounded-2xl border font-black uppercase text-[9px] md:text-[10px] transition-all ${language === l.id ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/5 border-transparent text-gray-500'}`}>{l.label}</button>
                           ))}
                        </div>
                     </div>
                     <button onClick={() => handleSave()} className="w-full bg-vani-gradient text-white py-4 md:py-5 rounded-2xl md:rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl">{t('common.save')}</button>
                  </motion.div>
                )}

                {activeTab === 'archive' && (
                  <motion.div key="archive" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] space-y-6 md:space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><HistoryIcon size={20} className="text-yellow-400" /> {t('settings.billing')}</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">{t('settings.ledger_desc')}</p>
                        </div>
                        
                        <div className="space-y-3 md:space-y-4">
                             {transactions?.length > 0 ? (
                             transactions.map((tx, i) => (
                               <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-[28px] hover:bg-white/[0.04] transition-all gap-4 sm:gap-0">
                                  <div className="flex items-center gap-3 md:gap-4">
                                     <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-[20px] flex items-center justify-center ${tx.status === 'approved' ? 'bg-green-500/10 text-green-500' : tx.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        {tx.status === 'approved' ? <Shield size={18} className="md:w-5 md:h-5" /> : tx.status === 'rejected' ? <X size={18} className="md:w-5 md:h-5" /> : <Zap size={18} className="md:w-5 md:h-5" />}
                                     </div>
                                     <div>
                                        <div className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest">{tx.method} OVERRIDE</div>
                                        <div className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase tracking-tight flex items-center gap-2">
                                             {tx.transactionId ? tx.transactionId.substring(0, 10) : 'N/A'}...
                                             <span className="w-1 h-1 rounded-full bg-gray-800" />
                                             {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                                        </div>
                                     </div>
                                  </div>
                                  <div className="text-left sm:text-right w-full sm:w-auto">
                                     <div className="text-[11px] md:text-[12px] font-black text-white uppercase tracking-tighter">Magnitude {tx.amount}</div>
                                     <div className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${tx.status === 'approved' ? 'text-green-500' : tx.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{tx.status}</div>
                                  </div>
                               </div>
                             ))
                           ) : (
                             <div className="py-16 md:py-20 text-center space-y-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl md:rounded-[24px] flex items-center justify-center mx-auto text-gray-700"><CreditCard size={24} className="md:w-8 md:h-8" /></div>
                                <div className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">{t('settings.ledger_empty')}</div>
                             </div>
                           )}
                        </div>

                        <div className="p-4 md:p-6 bg-vani-blue/5 border border-vani-blue/10 rounded-2xl md:rounded-[28px] space-y-3 md:space-y-4">
                           <div className="text-[10px] md:text-[11px] font-black text-vani-blue uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="md:w-4 md:h-4" /> {t('settings.data_portability')}</div>
                           <p className="text-[9px] md:text-[10px] text-gray-500 font-medium leading-relaxed uppercase tracking-wider">{t('settings.data_portability_desc')}</p>
                           <button onClick={() => api.exportData()} className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-vani-blue text-black rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"><ExternalLink size={12} className="md:w-[14px] md:h-[14px]" /> {t('settings.request_export')}</button>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] space-y-6 md:space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Shield size={20} className="text-green-400" /> {t('settings.identity_matrix')}</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">{t('settings.identity_matrix_desc')}</p>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="p-5 md:p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl md:rounded-[24px] space-y-4">
                              <div className="flex items-center gap-3 text-yellow-500"><LockKeyhole size={18} className="md:w-5 md:h-5" /> <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{t('settings.saviour_protocol')}</span></div>
                              <p className="text-[9px] md:text-[10px] text-gray-500 font-medium leading-relaxed uppercase tracking-wider">{t('settings.saviour_desc')}</p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                 {backupKeys.length > 0 ? (
                                   backupKeys.map((k, i) => (
                                     <div key={i} className={`p-3 rounded-lg md:rounded-xl border font-mono text-[9px] md:text-[10px] flex items-center justify-between ${k.isUsed ? 'bg-red-500/10 border-red-500/20 text-red-500 line-through' : 'bg-black/40 border-white/5 text-green-400'}`}>
                                       {k.code}
                                       {k.isUsed ? <X size={12} /> : <Shield size={12} />}
                                     </div>
                                   ))
                                 ) : (
                                   <div className="col-span-full py-4 text-center text-gray-600 text-[9px] font-black uppercase tracking-widest">{t('settings.no_keys')}</div>
                                 )}
                              </div>

                              <button onClick={async () => {
                                 try {
                                    const res = await api.generateRecoveryKeys();
                                    setBackupKeys(res.keys);
                                    addToast(t('settings.keys_generated'), 'success');
                                 } catch (e) { addToast(t('app.sync_failed'), 'error'); }
                              }} className="w-full py-3.5 md:py-4 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white transition-all">{t('settings.generate_keys')}</button>
                           </div>

                           <div className="flex items-center justify-between p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-[24px] border border-white/5">
                              <div>
                                 <div className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest">{t('settings.biometric_lock')}</div>
                                 <div className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase tracking-tight">{t('settings.biometric_desc')}</div>
                              </div>
                              <button className="w-12 h-6 rounded-full bg-gray-800 relative cursor-not-allowed">
                                 <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/20" />
                              </button>
                           </div>

                           <div className="p-5 md:p-6 bg-vani-blue/5 border border-vani-blue/10 rounded-2xl md:rounded-[24px] space-y-6">
                              <div>
                                 <div className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <RefreshCcw size={14} className="md:w-4 md:h-4 text-vani-blue" /> {t('settings.totp_keys')}
                                 </div>
                                 <p className="text-[9px] md:text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-tight">{t('settings.totp_desc')}</p>
                              </div>

                              {newTOTP ? (
                                <div className="space-y-4 text-center">
                                   <div className="p-4 bg-white rounded-xl md:rounded-[24px] inline-block shadow-2xl">
                                      <img src={newTOTP.qrCode} alt="TOTP QR" className="w-32 h-32 md:w-40 md:h-40" />
                                   </div>
                                   <div className="bg-black/40 p-3 rounded-lg md:rounded-xl border border-white/5 font-mono text-[9px] md:text-[10px] text-vani-blue select-all uppercase break-all">
                                      Secret: {newTOTP.secret}
                                   </div>
                                   <p className="text-[8px] text-red-400 font-black uppercase tracking-widest">⚠️ {t('settings.sync_authenticator')}</p>
                                </div>
                              ) : (
                                <button onClick={async () => {
                                   if(confirm(t('settings.mfa_confirm'))) {
                                      try {
                                         const res = await api.resetTOTP();
                                         setNewTOTP(res);
                                         addToast(t('settings.identity_synced'), 'success');
                                      } catch (e) { addToast(t('app.sync_failed'), 'error'); }
                                   }
                                }} className="w-full py-3.5 md:py-4 bg-vani-blue/10 hover:bg-vani-blue/20 border border-vani-blue/20 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-vani-blue transition-all">
                                   {t('settings.regenerate_mfa')}
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'privacy' && (
                  <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] space-y-6 md:space-y-8">
                        <div>
                           <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Lock size={20} className="text-purple-400" /> {t('settings.privacy_matrix')}</div>
                           <p className="text-[10px] text-gray-500 font-medium max-w-xs mt-1">{t('settings.privacy_matrix_desc')}</p>
                        </div>
                        
                        <div className="space-y-5 md:space-y-6">
                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div>
                                 <div className="text-[10px] font-black text-white uppercase tracking-widest">{t('settings.cloaked_identity')}</div>
                                 <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">{t('settings.cloaked_desc')}</div>
                              </div>
                              <button onClick={() => setIsPrivate(!isPrivate)} className={`w-12 h-6 rounded-full relative transition-all ${isPrivate ? 'bg-purple-500' : 'bg-gray-800'}`}>
                                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                              </button>
                           </div>

                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div>
                                 <div className="text-[10px] font-black text-white uppercase tracking-widest">{t('profile.temporal_signature')}</div>
                                 <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">{t('settings.temporal_desc')}</div>
                              </div>
                              <button onClick={() => setShowAge(!showAge)} className={`w-12 h-6 rounded-full relative transition-all ${showAge ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showAge ? 'left-7' : 'left-1'}`} />
                              </button>
                           </div>

                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div>
                                 <div className="text-[10px] font-black text-white uppercase tracking-widest">{t('profile.show_gender')}</div>
                                 <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">{t('profile.show_gender_desc')}</div>
                              </div>
                              <button onClick={() => setShowGender(!showGender)} className={`w-12 h-6 rounded-full relative transition-all ${showGender ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showGender ? 'left-7' : 'left-1'}`} />
                              </button>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => handleSave()} className="w-full bg-vani-gradient text-white py-4 md:py-5 rounded-2xl md:rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl">{t('common.save')}</button>
                  </motion.div>
                )}

                {activeTab === 'sovereignty' && (
                  <motion.div key="sovereignty" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 md:space-y-8">
                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] space-y-6">
                        <div className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2"><Zap size={20} className="text-yellow-400" /> {t('ui.session_protocols')}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                           <button onClick={() => window.location.reload()} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{t('ui.reroute')}</button>
                           <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500">{t('logout.btn_logout')}</button>
                           <button onClick={async () => {
                              if(confirm(t('settings.severance_confirm'))) {
                                 try {
                                    await api.terminateIdentity();
                                    localStorage.clear();
                                    window.location.href = '/login';
                                 } catch (e) { addToast(t('app.sever_failed'), 'error'); }
                              }
                           }} className="p-4 bg-red-900/10 hover:bg-red-900/20 border border-red-900/20 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-900 col-span-full">{t('settings.permanent_severance')}</button>
                        </div>
                     </div>
                     <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-[32px] flex items-center justify-between gap-4">
                        <div><div className="text-lg font-black text-white uppercase tracking-tight">{t('settings.neural_camouflage')}</div><p className="text-[10px] text-gray-500 font-medium mt-1">{t('settings.camouflage_desc')}</p></div>
                        <button onClick={handleToggleDisable} className={`w-14 h-8 rounded-full relative transition-all shrink-0 ${isDisabled ? 'bg-vani-accent' : 'bg-gray-800'}`}><div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isDisabled ? 'left-7' : 'left-1'}`} /></button>
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
