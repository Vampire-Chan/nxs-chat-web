import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Camera, ArrowRight, User as UserIcon, Calendar, Info, Check } from 'lucide-react';
import { API_URL } from '../services/api';

type AuthStep = 'start' | 'register-info' | 'register-qr' | 'register-setup' | 'login-code';

export default function AuthPage() {
  const { t, language, setLanguage } = useLanguage();
  const [step, setStep] = useState<AuthStep>('start');
  const [formData, setFormData] = useState({ 
    username: '', 
    displayName: '', 
    dob: '',
    bio: ''
  });
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [otpSecret, setOtpSecret] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getErrorMessage = (err: any) => err.response?.data?.message || "Transmission Error";

  // Step 1: Initial Identity Creation
  const handleRegisterStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { 
        username: formData.username,
        displayName: formData.displayName,
        dob: formData.dob
      });
      setQrImage(res.data.qrCode);
      setOtpSecret(res.data.secret);
      setStep('register-qr');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  // Step 2: TOTP Verification
  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/verify-registration`, { 
        username: formData.username, 
        token: code 
      });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      setStep('register-setup');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  // Step 3: Identity Calibration (Avatar/Bio)
  const handleSetup = async () => {
    setLoading(true);
    setError('');
    const fd = new FormData();
    if (avatarFile) fd.append('avatar', avatarFile);
    fd.append('bio', formData.bio);

    try {
      const res = await axios.post(`${API_URL}/auth/setup`, fd);
      login(localStorage.getItem('token')!, res.data.user);
      navigate('/app');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  // Login Flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { 
        username: formData.username, 
        token: code 
      });
      login(res.data.token, res.data.user);
      navigate('/app');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0c] text-white overflow-hidden relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <motion.div 
        layout
        className="w-full max-w-md bg-[#141418]/80 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl border border-white/5 z-10"
      >
        <AnimatePresence mode="wait">
          {/* 1. START VIEW */}
          {step === 'start' && (
            <motion.div key="start" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8">
               <div className="text-center">
                  <div className="w-20 h-20 bg-vani-gradient rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-12">
                     <Zap size={40} className="-rotate-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase">Yantravani Core</h2>
                  <p className="text-gray-500 text-sm mt-2 font-medium tracking-widest uppercase">{t('login.subtitle')}</p>
               </div>

               <div className="flex justify-center space-x-2 bg-black/20 p-1 rounded-xl">
                  {['en', 'hi', 'ne'].map((lang) => (
                    <button key={lang} type="button" onClick={() => setLanguage(lang as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${language === lang ? 'bg-vani-blue text-black' : 'text-gray-500 hover:text-white'}`}>
                      {lang}
                    </button>
                  ))}
               </div>

               <div className="space-y-4">
                  <button onClick={() => setStep('login-code')} className="w-full bg-vani-gradient text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/20 hover:scale-105 transition-all uppercase tracking-widest text-xs">{t('login.submit')}</button>
                  <button onClick={() => setStep('register-info')} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl border border-white/5 transition-all uppercase tracking-widest text-xs">{t('login.register')}</button>
               </div>
            </motion.div>
          )}

          {/* 2. REGISTER INFO */}
          {step === 'register-info' && (
            <motion.form key="info" onSubmit={handleRegisterStart} className="space-y-6">
               <h2 className="text-2xl font-black uppercase tracking-tight">{t('register.title')}</h2>
               <div className="space-y-4">
                  <InputField label={t('register.handle')} icon={<UserIcon size={14}/>} value={formData.username} onChange={(v: string) => setFormData({...formData, username: v})} placeholder="username" />
                  <InputField label={t('profile.displayname')} icon={<Info size={14}/>} value={formData.displayName} onChange={(v: string) => setFormData({...formData, displayName: v})} placeholder="Public Name" />
                  <InputField label={t('profile.dob')} icon={<Calendar size={14}/>} type="date" value={formData.dob} onChange={(v: string) => setFormData({...formData, dob: v})} />
               </div>
               <button type="submit" disabled={loading} className="w-full bg-vani-gradient text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs flex items-center justify-center space-x-2">
                  <span>{t('common.continue')}</span> <ArrowRight size={16} />
               </button>
               <button type="button" onClick={() => setStep('start')} className="w-full text-[10px] text-gray-600 uppercase font-black tracking-widest">{t('common.abort')}</button>
            </motion.form>
          )}

          {/* 3. QR SCAN */}
          {step === 'register-qr' && (
            <motion.form key="qr" onSubmit={handleVerifyRegistration} className="space-y-8 text-center">
               <h2 className="text-2xl font-black uppercase tracking-tight">{t('auth.security_link')}</h2>
               <div className="p-4 bg-white rounded-[32px] inline-block shadow-2xl">
                  {qrImage ? <img src={qrImage} className="w-48 h-48" /> : <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-2xl" />}
               </div>
               
               <div className="space-y-4 px-4 text-center">
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('auth.scan_desc')}</p>
                  
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-2">
                     <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block">{t('auth.manual_key')}</span>
                     <div className="flex items-center justify-between gap-3">
                        <code className="text-vani-blue font-mono text-[10px] bg-black/40 px-3 py-1.5 rounded-lg flex-1 truncate">{otpSecret}</code>
                        <button 
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(otpSecret); alert(t('auth.key_buffered')); }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                        >
                          {t('common.copy')}
                        </button>
                     </div>
                  </div>
               </div>

               <div className="pt-2">
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">{t('auth.auth_code')}</label>
                  <input 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.4em] text-vani-blue"
                    placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)}
                  />
               </div>
               <button type="submit" className="w-full bg-vani-gradient text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs">{t('auth.establish')}</button>
            </motion.form>
          )}

          {/* 4. IDENTITY CALIBRATION (AVATAR) */}
          {step === 'register-setup' && (
            <motion.div key="setup" className="space-y-8 text-center">
               <h2 className="text-2xl font-black uppercase tracking-tight">{t('auth.identity_calib')}</h2>
               <div className="relative inline-block group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-[40px] bg-vani-gradient p-1 shadow-2xl">
                     <div className="w-full h-full rounded-[36px] bg-[#141418] overflow-hidden flex items-center justify-center">
                        {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Camera size={32} className="text-gray-700" />}
                     </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-vani-blue w-8 h-8 rounded-xl flex items-center justify-center border-4 border-[#141418]">
                     <Zap size={14} className="text-white" />
                  </div>
               </div>
               <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
               }} />
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest text-left ml-2">{t('auth.bio_transmission')}</label>
                  <textarea 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-gray-300 h-24 focus:border-vani-blue outline-none transition-all"
                    placeholder="Add a bio..."
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
               </div>
               <button onClick={handleSetup} className="w-full bg-vani-gradient text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs flex items-center justify-center space-x-2">
                  <span>{t('auth.enter_matrix')}</span> <Check size={16} />
               </button>
            </motion.div>
          )}

          {/* 5. LOGIN VIEW */}
          {step === 'login-code' && (
            <motion.form key="login" onSubmit={handleLogin} className="space-y-8">
               <div className="text-center">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{t('auth.access_protocol')}</h2>
                  <p className="text-gray-500 text-xs mt-2 uppercase font-black tracking-widest">{t('login.subtitle')}</p>
               </div>
               <div className="space-y-4">
                  <InputField label={t('register.handle')} icon={<UserIcon size={14}/>} value={formData.username} onChange={(v: string) => setFormData({...formData, username: v})} placeholder="username" />
                  <div className="pt-4">
                    <div className="flex justify-between items-end mb-3 ml-1">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{useBackup ? t('auth.backup_key') : t('login.password')}</label>
                       <button 
                         type="button" 
                         onClick={() => { setUseBackup(!useBackup); setCode(''); }} 
                         className="text-[9px] font-black uppercase tracking-widest text-vani-blue hover:text-white transition-colors"
                       >
                         {useBackup ? t('auth.use_totp') : t('auth.use_backup')}
                       </button>
                    </div>
                    <input 
                      className={`w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-center font-black tracking-[0.2em] text-vani-accent ${useBackup ? 'text-lg' : 'text-3xl'}`}
                      placeholder={useBackup ? t('auth.backup_placeholder') : "000000"} 
                      maxLength={useBackup ? 20 : 6} 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
               </div>
               <button type="submit" className="w-full bg-vani-gradient text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs">{t('login.submit')}</button>
               <button type="button" onClick={() => setStep('start')} className="w-full text-[10px] text-gray-600 uppercase font-black tracking-widest">{t('common.cancel')}</button>
            </motion.form>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
}

const InputField = ({ label, icon, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative flex items-center group">
       <div className="absolute left-4 text-gray-600 group-focus-within:text-vani-blue transition-colors">{icon}</div>
       <input 
         type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
         className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:border-vani-blue outline-none transition-all placeholder-gray-800"
       />
    </div>
  </div>
);
