
import { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { IUser } from '../services/api';

interface Props {
  user: IUser;
  status: 'calling' | 'receiving' | 'active';
  onAccept: () => void;
  onReject: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const CallModal = ({ user, status, onAccept, onReject, isMuted, onToggleMute }: Props) => {
  const { t } = useLanguage();
  const [elapsed, setElapsed] = useState(0);

  // Call duration timer
  useEffect(() => {
    if (status !== 'active') { setElapsed(0); return; }
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Escape key to reject / hang up
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onReject();
  }, [onReject]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[400] flex flex-col items-center justify-center p-10 backdrop-blur-xl">
       <div className="relative mb-12">
          <div className="w-40 h-40 rounded-[48px] bg-vani-gradient p-1 animate-pulse shadow-[0_0_80px_rgba(255,60,60,0.3)]">
             <div className="w-full h-full rounded-[44px] bg-discord-dark overflow-hidden border-8 border-discord-dark">
                <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="w-full h-full object-cover" />
             </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-vani-blue w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-discord-dark shadow-xl">
             <User size={18} className="text-white" />
          </div>
       </div>

       <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2">{user.username}</h2>
          <p className="text-vani-blue font-mono text-xs uppercase tracking-[0.4em] animate-pulse">
             {status === 'calling' && t('call.establishing')}
             {status === 'receiving' && t('call.incoming')}
             {status === 'active' && t('call.active')}
          </p>
          {status === 'active' && (
            <p className="text-gray-400 font-mono text-sm mt-2">{formatDuration(elapsed)}</p>
          )}
       </div>

       <div className="flex items-center space-x-12">
          {status === 'receiving' ? (
            <>
              <button onClick={onReject} className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 active:scale-95 transition-all">
                 <PhoneOff size={32} />
              </button>
              <button onClick={onAccept} className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-500/20 hover:scale-110 active:scale-95 transition-all animate-bounce">
                 <Phone size={32} />
              </button>
            </>
          ) : (
            <>
              <button onClick={onToggleMute} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-vani-accent text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                 {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button onClick={onReject} className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 active:scale-95 transition-all">
                 <PhoneOff size={32} />
              </button>
            </>
          )}
       </div>
    </div>
  );
};
