import { motion } from 'framer-motion';
import { X, LogOut, RefreshCw, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onClose: () => void;
}

export const LogoutModal = ({ onClose }: Props) => {
  const { t } = useLanguage();
  const { user, accounts, logout, switchAccount } = useAuth();

  const handleLogout = () => {
    if (window.confirm(t('logout.confirm'))) {
      logout();
      onClose();
    }
  };

  const handleSwitch = (id: string) => {
    switchAccount(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-4 backdrop-blur-xl">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0c] w-full max-w-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center space-x-3 text-red-500">
              <ShieldAlert size={20} />
              <h2 className="text-lg font-black uppercase tracking-widest text-white">Sever_Protocol</h2>
           </div>
           <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-8">
           <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm font-medium">{t('logout.desc')}</p>
           </div>

           {/* ACTIVE NODES */}
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Active_Identity_Nodes</label>
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                 {accounts.map(acc => {
                   const isCurrent = (acc.user._id || acc.user.id) === (user?._id || user?.id);
                   return (
                     <div 
                       key={acc.user._id || acc.user.id} 
                       onClick={() => !isCurrent && handleSwitch(acc.user._id || acc.user.id)}
                       className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isCurrent ? 'bg-vani-blue/10 border-vani-blue/30 cursor-default' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 cursor-pointer'}`}
                     >
                        <div className="flex items-center space-x-3">
                           <img src={acc.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.user.username}`} className="w-8 h-8 rounded-lg" />
                           <div>
                              <div className="text-xs font-black text-white uppercase">{acc.user.username}</div>
                              {isCurrent && <div className="text-[8px] text-vani-blue font-black uppercase">Current_Link</div>}
                           </div>
                        </div>
                        {!isCurrent && <RefreshCw size={14} className="text-gray-600" />}
                     </div>
                   );
                 })}
              </div>
           </div>

           <div className="pt-4 space-y-3">
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-500/20 transition-all flex items-center justify-center space-x-3"
              >
                 <LogOut size={16} />
                 <span>{t('logout.btn_logout')}</span>
              </button>
              <button onClick={() => window.location.href = '/login'} className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-white/5 transition-all flex items-center justify-center space-x-3">
                 <User size={16} />
                 <span>Establish_New_Link</span>
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
