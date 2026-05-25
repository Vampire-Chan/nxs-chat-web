import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Lock, History as HistoryIcon, Zap, Settings, Image as ImageIcon, Camera, ArrowLeft, ChevronRight, Layout, Monitor, Smartphone, Globe, Heart, Send, Hash, RefreshCcw, LockKeyhole, ExternalLink, CreditCard, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage, VISIBLE_LANGUAGE_OPTIONS } from '../context/LanguageContext';
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

// ----------------------------------------------------------------------------
// Helper Logic & Styles
// ----------------------------------------------------------------------------

const calculateAge = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getThemeColors = (tab: 'profile' | 'security' | 'privacy' | 'interface' | 'archive' | 'sovereignty' | 'donate') => {
  switch (tab) {
    case 'profile':
      return {
        accent: 'text-[#00d2ff]',
        accentBg: 'bg-[#00d2ff]',
        glow: 'glow-blue',
        border: 'border-[#00d2ff]/20',
        focusBorder: 'focus:border-[#00d2ff]/40',
        activeNav: 'bg-[#00d2ff]/10 text-[#00d2ff] border-l-2 border-[#00d2ff]',
        iconColor: 'text-[#00d2ff]',
        badgeText: '[ PROTOCOL: ACTIVE ]'
      };
    case 'interface':
      return {
        accent: 'text-pink-400',
        accentBg: 'bg-pink-500',
        glow: 'glow-pink',
        border: 'border-pink-500/20',
        focusBorder: 'focus:border-pink-500/40',
        activeNav: 'bg-pink-500/10 text-pink-400 border-l-2 border-pink-500',
        iconColor: 'text-pink-400',
        badgeText: '[ CONFIG: STABLE ]'
      };
    case 'security':
      return {
        accent: 'text-green-400',
        accentBg: 'bg-green-500',
        glow: 'glow-green',
        border: 'border-green-500/20',
        focusBorder: 'focus:border-green-500/40',
        activeNav: 'bg-green-500/10 text-green-400 border-l-2 border-green-500',
        iconColor: 'text-green-400',
        badgeText: '[ ACCESS: SECURED ]'
      };
    case 'privacy':
      return {
        accent: 'text-purple-400',
        accentBg: 'bg-purple-500',
        glow: 'glow-purple',
        border: 'border-purple-500/20',
        focusBorder: 'focus:border-purple-500/40',
        activeNav: 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-500',
        iconColor: 'text-purple-400',
        badgeText: '[ NODAL CLOAK: ACTIVE ]'
      };
    case 'archive':
      return {
        accent: 'text-yellow-400',
        accentBg: 'bg-yellow-500',
        glow: 'glow-yellow',
        border: 'border-yellow-500/20',
        focusBorder: 'focus:border-yellow-500/40',
        activeNav: 'bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-500',
        iconColor: 'text-yellow-400',
        badgeText: '[ HISTOGRAM: DECRYPTED ]'
      };
    case 'sovereignty':
      return {
        accent: 'text-vani-accent',
        accentBg: 'bg-[#ff0055]',
        glow: 'glow-accent',
        border: 'border-[#ff0055]/20',
        focusBorder: 'focus:border-[#ff0055]/40',
        activeNav: 'bg-[#ff0055]/10 text-white border-l-2 border-[#ff0055]',
        iconColor: 'text-[#ff0055]',
        badgeText: '[ OVERLORD: ON-LINE ]'
      };
    case 'donate':
      return {
        accent: 'text-red-400',
        accentBg: 'bg-red-500',
        glow: 'glow-red',
        border: 'border-red-500/20',
        focusBorder: 'focus:border-red-500/40',
        activeNav: 'bg-red-500/10 text-red-400 border-l-2 border-red-500',
        iconColor: 'text-red-400',
        badgeText: '[ CONTRIBUTE: APPRECIATED ]'
      };
  }
};

const TechCard = ({ title, subtitle, icon, children, glowClass, borderClass, themeColor, statusText }: any) => (
  <div className={`relative bg-[#07070a]/40 backdrop-blur-md border ${borderClass || 'border-white/5'} rounded-2xl p-6 lg:p-8 ${glowClass || ''} overflow-hidden group`}>
    <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
    <div className="absolute top-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
    <div className="absolute bottom-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
    <div className="absolute bottom-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
    
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 mb-6 gap-4">
       <div className="flex items-center gap-3">
          {icon && <span className={themeColor}>{icon}</span>}
          <div>
             <div className="text-sm font-black text-white uppercase tracking-wider font-mono">{title}</div>
             {subtitle && <p className="text-[9px] text-gray-500 font-medium uppercase tracking-tight mt-0.5">{subtitle}</p>}
          </div>
       </div>
       {statusText && (
          <div className={`text-[8px] font-black font-mono tracking-widest px-3 py-1 rounded border ${borderClass} bg-black/40 ${themeColor} self-start md:self-auto`}>
             {statusText}
          </div>
       )}
    </div>
    {children}
  </div>
);

const TechInput = ({ label, value, onChange, type = "text", disabled = false, placeholder, error, themeColor, borderClass, focusBorderClass }: any) => (
  <div className="space-y-2">
     <label className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5 font-mono">
        <span>[ {label} ]</span>
        {disabled && <LockKeyhole size={10} className={themeColor || "text-vani-blue"} />}
     </label>
     <div className="relative flex items-center w-full">
        <input 
          type={type} 
          className={`w-full bg-[#050507]/60 border ${borderClass || 'border-white/5'} ${focusBorderClass || 'focus:border-vani-blue/50'} p-4 rounded-xl text-white outline-none font-mono font-medium transition-all ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} 
          value={value} 
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
        />
     </div>
     {error && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest ml-2 font-mono">{error}</p>}
  </div>
);

const TechSelect = ({ label, value, onChange, options, disabled = false, themeColor, borderClass, focusBorderClass }: any) => (
  <div className="space-y-2">
     <label className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5 font-mono">
        <span>[ {label} ]</span>
        {disabled && <LockKeyhole size={10} className={themeColor || "text-vani-blue"} />}
     </label>
     <div className="relative flex items-center w-full">
        <select 
          className={`w-full bg-[#050507]/60 border ${borderClass || 'border-white/5'} ${focusBorderClass || 'focus:border-vani-blue/50'} p-4 rounded-xl text-white outline-none font-mono font-bold transition-all appearance-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} 
          value={value} 
          onChange={onChange}
          disabled={disabled}
        >
           {options.map((opt: any) => (
             <option key={opt.value} value={opt.value} className="bg-[#0a0a0c] text-white">{opt.label}</option>
           ))}
        </select>
     </div>
  </div>
);

const TechSwitch = ({ label, description, active, onToggle, activeBgClass }: any) => (
  <div className="flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors rounded-xl border border-white/5">
     <div>
        <div className="text-[10px] font-black text-white uppercase tracking-widest font-mono">{label}</div>
        {description && <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">{description}</div>}
     </div>
     <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-all shrink-0 ${active ? (activeBgClass || 'bg-vani-blue') : 'bg-gray-800'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`} />
     </button>
  </div>
);

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

export const UserSettingsModal = ({ user, onClose, onSave, dockPosition, setDockPosition, kineticTransitions, setKineticTransitions }: Props) => {
  const { language, setLanguage, t } = useLanguage();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy' | 'interface' | 'archive' | 'sovereignty' | 'donate'>('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  
  // Profile States
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [gender, setGender] = useState(user.gender || 'none');
  const [dob, setDob] = useState(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
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
      setDob(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

      let autoSwitchedLang = false;
      const initialDob = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
      if (dob && dob !== initialDob) {
         fd.append('dob', dob);
         
         const age = calculateAge(dob);
         if (age >= 30 && language === 'en') {
            setLanguage('en-simple');
            autoSwitchedLang = true;
         }
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
         if (autoSwitchedLang) {
            addToast('Auto-switched to Simple English based on age calibration (30+)', 'info');
         }
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
  const theme = getThemeColors(activeTab);

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[2500] flex bg-grid-pattern" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="w-full h-full bg-[#0a0a0c]/90 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Sidebar Region */}
        <div className={`w-full lg:w-[35%] xl:w-[30%] bg-[#08080a]/90 backdrop-blur-md border-r border-white/5 flex justify-end shrink-0 ${isMobile && !isMobileMenuOpen ? 'hidden' : 'flex'}`}>
           <div className="w-full lg:w-[280px] xl:w-80 flex flex-col h-full lg:py-12">
              <div className="p-6 lg:p-4 border-b lg:border-none border-white/5 flex justify-between items-center">
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Settings size={24} className="text-vani-blue animate-spin-slow" /> {t('nav.settings')}</h2>
                 <button onClick={onClose} className="lg:hidden p-2 bg-white/5 rounded-xl text-white"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 lg:p-2 space-y-2">
                 {navItems.map(item => {
                   const isSelected = activeTab === item.id && (isMobile ? !isMobileMenuOpen : true);
                   const itemTheme = getThemeColors(item.id as any);
                   return (
                     <button 
                       key={item.id} 
                       onClick={() => { setActiveTab(item.id as any); if(isMobile) setIsMobileMenuOpen(false); }} 
                       className={`w-full flex items-center justify-between px-5 py-4 lg:py-3.5 rounded-xl transition-all group relative overflow-hidden ${isSelected ? itemTheme.activeNav + ' font-bold' : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300'}`}
                     >
                        <div className="flex items-center space-x-4">
                           <span className={isSelected ? itemTheme.iconColor : item.color}>{item.icon}</span>
                           <span className="text-[10px] font-black uppercase tracking-[0.15em] font-mono">{item.label}</span>
                        </div>
                        <ChevronRight size={14} className={`transition-all duration-200 ${isSelected ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                     </button>
                   );
                 })}
              </div>
           </div>
        </div>

        {/* Right Content Region */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-[#0d0d11]/85 backdrop-blur-sm relative ${isMobile && isMobileMenuOpen ? 'hidden' : 'flex'}`}>
           {/* Subtle background glow effect */}
           <div className={`absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full filter blur-[150px] opacity-[0.03] pointer-events-none transition-all duration-500 ${activeTab === 'sovereignty' ? 'bg-[#ff0055]' : activeTab === 'security' ? 'bg-[#4ade80]' : activeTab === 'privacy' ? 'bg-[#c084fc]' : activeTab === 'archive' ? 'bg-[#facc15]' : activeTab === 'interface' ? 'bg-pink-500' : 'bg-[#00d2ff]'}`} />

           <div className="border-b lg:border-none border-white/5 bg-white/[0.01] lg:bg-transparent z-10">
              <div className="max-w-3xl xl:max-w-4xl w-full mx-auto px-6 lg:px-12 py-6 lg:py-12 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl text-white"><ArrowLeft size={20} /></button>
                    <div>
                       <span className={`text-[8px] font-black uppercase tracking-[0.2em] font-mono ${theme.accent}`}>{theme.badgeText}</span>
                       <h3 className="text-xl lg:text-3xl font-black text-white uppercase tracking-tighter mt-1">
                          {navItems.find(i => i.id === activeTab)?.label.split(' ')[0] || activeTab}_{t('settings.matrix_matrix')}
                       </h3>
                    </div>
                 </div>
                 <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500 transition-all text-white flex items-center gap-2 group shadow-lg border border-white/5 hover:border-red-500/30">
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-200" />
                    <span className="hidden md:inline text-[9px] font-black tracking-widest text-gray-400 group-hover:text-white uppercase font-mono">ESC</span>
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar z-10">
              <div className="max-w-3xl xl:max-w-4xl w-full mx-auto px-6 lg:px-12 pb-24">
                 <AnimatePresence mode="wait">
                   {activeTab === 'profile' && (
                     <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 lg:space-y-12">
                        <div className="relative mb-16 lg:mb-24">
                           <div className="h-32 md:h-40 lg:h-48 bg-gray-900 rounded-[24px] lg:rounded-[40px] overflow-hidden border border-white/5 group cursor-pointer" onClick={() => bannerRef.current?.click()}>
                              {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-40" /> : <div className="w-full h-full bg-vani-gradient opacity-10" />}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20"><ImageIcon size={40} className="text-white" /></div>
                           </div>
                           <div className="absolute -bottom-10 lg:-bottom-14 left-6 lg:left-14 p-1.5 bg-[#0a0a0c] rounded-[28px] lg:rounded-[36px] shadow-2xl group cursor-pointer" onClick={(e) => { e.stopPropagation(); avatarRef.current?.click(); }}>
                              <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-[20px] md:rounded-[24px] lg:rounded-[32px] bg-gray-800 border-4 border-[#0a0a0c] overflow-hidden relative">
                                 {avatarPreview ? (
                                   <>
                                     <div className="scanner-line animate-pulse" />
                                     <img src={avatarPreview} className="w-full h-full object-cover animate-none" />
                                   </>
                                 ) : (
                                   <div className="w-full h-full bg-vani-gradient" />
                                 )}
                                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40"><Camera size={32} className="text-white" /></div>
                              </div>
                           </div>
                        </div>

                        <TechCard title="Biological Matrix" subtitle="Calibrate your node identifier, birthday, and physical descriptors." icon={<User size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="SYS.PROFILE: VERIFIED">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                             <TechInput label={t('profile.displayname')} value={displayName} onChange={(e: any) => setDisplayName(e.target.value)} borderClass={theme.border} focusBorderClass={theme.focusBorder} themeColor={theme.accent} />
                             <TechInput label={t('profile.dob')} type="date" value={dob} onChange={(e: any) => setDob(e.target.value)} disabled={!!user.dob} borderClass={theme.border} focusBorderClass={theme.focusBorder} themeColor={theme.accent} />
                             <TechSelect 
                               label={t('profile.gender')} 
                               value={gender} 
                               onChange={(e: any) => setGender(e.target.value as any)} 
                               disabled={!!(user.gender && user.gender !== 'none')} 
                               options={[
                                 { value: 'male', label: t('profile.gender_male') },
                                 { value: 'female', label: t('profile.gender_female') },
                                 { value: 'other', label: t('profile.gender_other') },
                                 { value: 'none', label: t('profile.gender_none') }
                               ]} 
                               borderClass={theme.border}
                               focusBorderClass={theme.focusBorder}
                               themeColor={theme.accent}
                             />
                          </div>
                          
                          {(user.gender && user.gender !== 'none') || user.dob ? (
                            <div className="mb-6 p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
                               {user.gender && user.gender !== 'none' && (
                                 <p className="text-[9px] font-mono text-gray-500 flex items-center gap-2">
                                    <LockKeyhole size={12} className={theme.accent} /> {t('profile.gender_locked')}
                                 </p>
                               )}
                               {user.dob && (
                                 <p className="text-[9px] font-mono text-gray-500 flex items-center gap-2">
                                    <LockKeyhole size={12} className={theme.accent} /> {t('profile.dob_locked') || "Date of Creation (Birthday) is locked."}
                                 </p>
                               )}
                            </div>
                          ) : null}

                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 font-mono">[ {t('profile.bio')} ]</label>
                                <textarea className={`w-full bg-[#050507]/60 border ${theme.border} ${theme.focusBorder} p-4 rounded-xl text-white outline-none font-mono font-medium h-32 resize-none transition-all`} value={bio} onChange={(e) => setBio(e.target.value)} />
                             </div>
                             <button onClick={() => handleSave()} disabled={loading} className="w-full bg-vani-gradient text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 font-mono">
                               {loading ? t('common.scanning') : t('common.save')}
                             </button>
                          </div>
                        </TechCard>
                     </motion.div>
                   )}

                   {activeTab === 'interface' && (
                     <motion.div key="interface" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <TechCard title={t('settings.appearance')} subtitle={t('settings.appearance_desc')} icon={<Layout size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="SYS.UI: STABLE">
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {[{ id: 'auto', label: 'Auto', icon: <Layout size={20} /> }, { id: 'bar', label: 'Bar', icon: <Monitor size={20} /> }, { id: 'button', label: 'Float', icon: <Smartphone size={20} /> }].map(opt => (
                                <div key={opt.id} onClick={() => setCreationUI(opt.id as any)} className={`p-5 rounded-xl border cursor-pointer transition-all ${creationUI === opt.id ? 'bg-pink-500/10 border-pink-500 text-white shadow-[0_0_15px_rgba(244,114,182,0.2)]' : 'bg-black/30 border-white/5 text-gray-500 hover:border-white/10'}`}><div className="mb-3">{opt.icon}</div><div className="text-[10px] font-black uppercase tracking-widest font-mono">{opt.label}</div></div>
                              ))}
                           </div>
                        </TechCard>

                        <TechCard title={t('settings.system_metrics')} subtitle={t('settings.system_metrics_desc')} icon={<Zap size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="SYS.ALIGN: OK">
                           <div className="space-y-6">
                              <div className="space-y-3">
                                 <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2 font-mono">[ {t('settings.dock_alignment')} ]</label>
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['top', 'bottom', 'left', 'right'].map(pos => (
                                      <button key={pos} onClick={() => setDockPosition(pos as any)} className={`py-2.5 rounded-xl border text-[9px] font-black uppercase transition-all font-mono ${dockPosition === pos ? 'bg-pink-500/10 border-pink-500 text-white shadow-[0_0_15px_rgba(244,114,182,0.2)]' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white hover:border-white/10'}`}>{pos}</button>
                                    ))}
                                 </div>
                              </div>
                              
                              <TechSwitch 
                                label={t('settings.kinetic_transitions')} 
                                description={t('settings.kinetic_desc')} 
                                active={kineticTransitions} 
                                onToggle={() => setKineticTransitions?.(!kineticTransitions)} 
                                activeBgClass={theme.accentBg}
                              />
                           </div>
                        </TechCard>

                        <TechCard title={t('settings.language')} subtitle={t('settings.language_desc')} icon={<Globe size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="SYS.LOCALE: CALIBRATED">
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                              {VISIBLE_LANGUAGE_OPTIONS.map(l => (
                                <button key={l.id} onClick={() => setLanguage(l.id as any)} className={`py-3 rounded-xl border font-black uppercase text-[10px] transition-all font-mono ${language === l.id ? 'bg-pink-500/10 border-pink-500 text-white shadow-[0_0_15px_rgba(244,114,182,0.2)]' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white hover:border-white/10'}`}>{l.label}</button>
                              ))}
                           </div>
                        </TechCard>

                        <button onClick={() => handleSave()} className="w-full bg-vani-gradient text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-[1.01] active:scale-95 font-mono">{t('common.save')}</button>
                     </motion.div>
                   )}

                   {activeTab === 'security' && (
                     <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <TechCard title={t('settings.identity_matrix')} subtitle={t('settings.identity_matrix_desc')} icon={<Shield size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="SEC.PROTOCOL: OK">
                           <div className="space-y-6">
                              <div className="p-5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl space-y-4">
                                 <div className="flex items-center gap-3 text-yellow-500 font-mono">
                                    <LockKeyhole size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('settings.saviour_protocol')}</span>
                                 </div>
                                 <p className="text-[9px] text-gray-500 font-medium leading-relaxed uppercase tracking-wider font-mono">{t('settings.saviour_desc')}</p>
                                 
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {backupKeys.length > 0 ? (
                                      backupKeys.map((k, i) => (
                                        <div key={i} className={`p-3.5 rounded-xl border font-mono text-[10px] flex items-center justify-between ${k.isUsed ? 'bg-red-500/5 border-red-500/20 text-red-500 line-through' : 'bg-black/40 border-white/5 text-green-400'}`}>
                                          <span>{k.code}</span>
                                          {k.isUsed ? <X size={12} /> : <Shield size={12} />}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="col-span-full py-4 text-center text-gray-600 text-[9px] font-black uppercase tracking-widest font-mono">{t('settings.no_keys')}</div>
                                    )}
                                 </div>

                                 <button onClick={async () => {
                                    try {
                                       const res = await api.generateRecoveryKeys();
                                       setBackupKeys(res.keys);
                                       addToast(t('settings.keys_generated'), 'success');
                                    } catch (e) { addToast(t('app.sync_failed'), 'error'); }
                                 }} className="w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all border border-white/5 font-mono">{t('settings.generate_keys')}</button>
                              </div>

                              <TechSwitch 
                                label={t('settings.biometric_lock')} 
                                description={t('settings.biometric_desc')} 
                                active={false} 
                                onToggle={() => {}} 
                                activeBgClass={theme.accentBg}
                              />

                              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl space-y-6 relative overflow-hidden">
                                 {newTOTP && <div className="scanner-line-green" />}
                                 <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 gap-4">
                                    <div className="flex items-center gap-3">
                                       <RefreshCcw size={16} className={theme.accent} />
                                       <div>
                                          <div className="text-[10px] font-black text-white uppercase tracking-widest font-mono">{t('settings.totp_keys')}</div>
                                          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight mt-0.5 font-mono">{t('settings.totp_desc')}</p>
                                       </div>
                                    </div>
                                 </div>

                                 {newTOTP ? (
                                   <div className="space-y-4 text-center">
                                      <div className="p-4 bg-white rounded-xl inline-block shadow-2xl">
                                         <img src={newTOTP.qrCode} alt="TOTP QR" className="w-32 h-32" />
                                      </div>
                                      <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 font-mono text-[9px] text-[#4ade80] select-all uppercase break-all">
                                         Secret: {newTOTP.secret}
                                      </div>
                                      <p className="text-[8px] text-red-400 font-black uppercase tracking-widest font-mono">⚠️ {t('settings.sync_authenticator')}</p>
                                   </div>
                                 ) : (
                                   <button onClick={async () => {
                                      if(confirm(t('settings.mfa_confirm'))) {
                                         try {
                                            const token = window.prompt('Enter your current 6-digit authenticator code to continue:')?.trim() || '';
                                            if (!token) return;
                                            const res = await api.resetTOTP(token);
                                            setNewTOTP(res);
                                            addToast(t('settings.identity_synced'), 'success');
                                         } catch (e) { addToast(t('app.sync_failed'), 'error'); }
                                      }
                                   }} className="w-full py-3.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-green-400 transition-all font-mono">
                                      {t('settings.regenerate_mfa')}
                                   </button>
                                 )}
                              </div>
                           </div>
                        </TechCard>
                     </motion.div>
                   )}

                   {activeTab === 'privacy' && (
                     <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <TechCard title={t('settings.privacy_matrix')} subtitle={t('settings.privacy_matrix_desc')} icon={<Lock size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="PRIV.CLOAK: ACTIVE">
                           <div className="space-y-4">
                              <TechSwitch 
                                label={t('settings.cloaked_identity')} 
                                description={t('settings.cloaked_desc')} 
                                active={isPrivate} 
                                onToggle={() => setIsPrivate(!isPrivate)} 
                                activeBgClass={theme.accentBg}
                              />
                              <TechSwitch 
                                label={t('profile.temporal_signature')} 
                                description={t('settings.temporal_desc')} 
                                active={showAge} 
                                onToggle={() => setShowAge(!showAge)} 
                                activeBgClass={theme.accentBg}
                              />
                              <TechSwitch 
                                label={t('profile.show_gender')} 
                                description={t('profile.show_gender_desc')} 
                                active={showGender} 
                                onToggle={() => setShowGender(!showGender)} 
                                activeBgClass={theme.accentBg}
                              />
                           </div>
                        </TechCard>
                        <button onClick={() => handleSave()} className="w-full bg-vani-gradient text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-[1.01] active:scale-95 font-mono">{t('common.save')}</button>
                     </motion.div>
                   )}

                   {activeTab === 'archive' && (
                     <motion.div key="archive" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <TechCard title={t('settings.billing')} subtitle={t('settings.ledger_desc')} icon={<HistoryIcon size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="SYS.LEDGER: DECRYPTED">
                           <div className="space-y-4">
                              {transactions?.length > 0 ? (
                                <div className="overflow-hidden border border-white/5 rounded-xl">
                                   <table className="w-full text-left border-collapse font-mono text-[10px]">
                                      <thead>
                                         <tr className="bg-white/[0.02] border-b border-white/5 text-gray-500 uppercase tracking-wider">
                                            <th className="p-4 font-black">METHOD</th>
                                            <th className="p-4 font-black">TRANSACTION ID</th>
                                            <th className="p-4 font-black">DATE</th>
                                            <th className="p-4 font-black text-right">MAGNITUDE</th>
                                            <th className="p-4 font-black text-center">STATUS</th>
                                         </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                         {transactions.map((tx, i) => (
                                           <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                              <td className="p-4 font-black text-white">{tx.method?.toUpperCase()}</td>
                                              <td className="p-4 text-gray-400 select-all">{tx.transactionId ? tx.transactionId.substring(0, 14) : 'N/A'}</td>
                                              <td className="p-4 text-gray-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}</td>
                                              <td className="p-4 font-black text-white text-right">₹{tx.amount}</td>
                                              <td className="p-4 text-center">
                                                 <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${tx.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : tx.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                                    {tx.status}
                                                 </span>
                                              </td>
                                           </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                </div>
                              ) : (
                                <div className="py-16 text-center space-y-4 bg-white/[0.01] border border-white/5 rounded-xl">
                                   <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-gray-700"><CreditCard size={24} /></div>
                                   <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] font-mono">{t('settings.ledger_empty')}</div>
                                </div>
                              )}
                              
                              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl space-y-3 mt-4">
                                 <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2 font-mono"><Zap size={14} /> {t('settings.data_portability')}</div>
                                 <p className="text-[9px] text-gray-500 font-medium leading-relaxed uppercase tracking-wider font-mono">{t('settings.data_portability_desc')}</p>
                                 <button onClick={() => api.exportData()} className="flex items-center gap-2 px-5 py-3 bg-yellow-500 text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all font-mono w-full sm:w-auto justify-center"><ExternalLink size={12} /> {t('settings.request_export')}</button>
                              </div>
                           </div>
                        </TechCard>
                     </motion.div>
                   )}

                   {activeTab === 'sovereignty' && (
                     <motion.div key="sovereignty" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <TechCard title={t('ui.session_protocols')} subtitle="Manage your signal routes, severe active nodes, or sever your identity matrix." icon={<Zap size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="CORE.OVERLORD: CALIBRATED">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <button onClick={() => window.location.reload()} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 border border-white/5 transition-all font-mono">{t('ui.reroute')}</button>
                              <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 transition-all font-mono">{t('logout.btn_logout')}</button>
                              <button onClick={async () => {
                                 if(confirm(t('settings.severance_confirm'))) {
                                    try {
                                       await api.terminateIdentity();
                                       localStorage.clear();
                                       window.location.href = '/login';
                                    } catch (e) { addToast(t('app.sever_failed'), 'error'); }
                                 }
                              }} className="p-4 bg-red-900/15 hover:bg-red-900/25 border border-red-900/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-900 transition-all col-span-full font-mono">{t('settings.permanent_severance')}</button>
                           </div>
                        </TechCard>
                        
                        <TechCard title={t('settings.neural_camouflage')} subtitle={t('settings.camouflage_desc')} icon={<Shield size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent}>
                           <div className="flex items-center justify-between">
                              <div className="text-[8px] text-gray-500 font-bold uppercase tracking-tight font-mono">Status: {isDisabled ? 'ACTIVE CAMOUFLAGE ON-LINE' : 'SIGNALS UNCLOAKED'}</div>
                              <button onClick={handleToggleDisable} className={`w-14 h-8 rounded-full relative transition-all shrink-0 ${isDisabled ? 'bg-vani-accent' : 'bg-gray-800'}`}><div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isDisabled ? 'left-7' : 'left-1'}`} /></button>
                           </div>
                        </TechCard>
                     </motion.div>
                   )}

                   {activeTab === 'donate' && (
                     <motion.div key="donate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div className="text-center space-y-3 py-4">
                           <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500 border border-red-500/20 shadow-2xl"><Heart size={30} fill="currentColor" /></div>
                           <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter font-mono">{t('donate.title')}</h3>
                           <p className="text-gray-500 text-[10px] max-w-md mx-auto leading-relaxed uppercase tracking-widest font-mono">{t('donate.subtitle')}</p>
                        </div>

                        <div className="flex justify-center space-x-3.5 font-mono">
                           <button onClick={() => { setPaymentMethod('upi'); setDonateCurrency('INR'); }} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2.5 ${paymentMethod === 'upi' ? 'bg-[#00d2ff] text-black shadow-[0_0_20px_rgba(0,210,255,0.3)]' : 'bg-white/5 text-gray-500'}`}><Zap size={14} /> UPI</button>
                           <button onClick={() => { setPaymentMethod('paypal'); setDonateCurrency('USD'); }} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2.5 ${paymentMethod === 'paypal' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-gray-500'}`}><Globe size={14} /> PayPal</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                           {/* LEFT: PAYMENT DETAILS */}
                           <div className="space-y-8">
                              <TechCard title="Transaction Vector" subtitle="Choose your preset amount or enter a custom overrides value." icon={<CreditCard size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent}>
                                 {paymentMethod === 'upi' ? (
                                   <div className="space-y-6 text-center">
                                      <div className="p-4 bg-white rounded-2xl shadow-2xl inline-block relative overflow-hidden group">
                                         <div className="scanner-line" />
                                         <img src={upiQr} alt="UPI QR" className="w-40 h-40" />
                                      </div>
                                      <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 font-mono text-[9px] text-[#00d2ff] select-all break-all">{upiId}</div>
                                      <div className="grid grid-cols-3 gap-2">
                                         {['50', '500', '5000'].map(v => <button key={v} onClick={() => setDonateAmount(v)} className={`py-3 rounded-xl border font-black text-[10px] transition-all font-mono ${donateAmount === v ? 'bg-[#00d2ff]/10 border-[#00d2ff] text-white shadow-[0_0_10px_rgba(0,210,255,0.1)]' : 'bg-white/5 border-transparent text-gray-500'}`}>₹{v}</button>)}
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="space-y-6 text-center font-mono">
                                      <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-500"><Globe size={36} /></div>
                                      <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 font-mono text-[9px] text-purple-400 select-all break-all">{paypalId}</div>
                                      <div className="grid grid-cols-3 gap-2">
                                         {['5', '10', '20'].map(v => <button key={v} onClick={() => setDonateAmount(v)} className={`py-3 rounded-xl border font-black text-[10px] transition-all ${donateAmount === v ? 'bg-purple-500/10 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-transparent text-gray-500'}`}>${v}</button>)}
                                      </div>
                                      <a href={paypalUrl} target="_blank" className="w-full bg-vani-gradient py-4 rounded-xl block text-[10px] font-black uppercase tracking-widest text-white shadow-xl text-center hover:scale-[1.01] transition-all">Go to PayPal Vector</a>
                                   </div>
                                 )}
                                 
                                 <div className="mt-6">
                                    <TechInput label={t('settings.magnitude_override')} type="number" value={donateAmount} onChange={(e: any) => setDonateAmount(e.target.value)} borderClass={theme.border} focusBorderClass={theme.focusBorder} themeColor={theme.accent} />
                                 </div>
                              </TechCard>
                           </div>

                           {/* RIGHT: VERIFICATION FORM */}
                           <div className="space-y-8">
                              <TechCard title={t('settings.proof_of_link')} subtitle={t('settings.proof_desc')} icon={<Shield size={18} />} borderClass={theme.border} glowClass={theme.glow} themeColor={theme.accent} statusText="SYS.VERIFY: STANDBY">
                                 <div className="space-y-6">
                                    <TechInput label={t('settings.transaction_id')} placeholder="XXXX-XXXX-XXXX" value={transactionId} onChange={(e: any) => setTransactionId(e.target.value)} borderClass={theme.border} focusBorderClass={theme.focusBorder} themeColor={theme.accent} />

                                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                       <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed font-mono">{t('settings.verification_protocol')}</p>
                                    </div>

                                    <button onClick={handleSubmitTransaction} disabled={isSubmittingTx} className="w-full bg-vani-gradient text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 font-mono">
                                       {isSubmittingTx ? <RefreshCcw size={16} className="animate-spin" /> : <Send size={16} />}
                                       {isSubmittingTx ? t('common.loading') : t('settings.transmit_signal')}
                                    </button>
                                 </div>
                              </TechCard>
                           </div>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

        <input type="file" ref={avatarRef} hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setAvatarBlob(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
        <input type="file" ref={bannerRef} hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setBannerBlob(f); setBannerPreview(URL.createObjectURL(f)); } }} />
      </motion.div>
    </div>
  );
};
