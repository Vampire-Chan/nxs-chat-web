
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import type { IUser } from '../services/api';

interface Props {
  user: IUser;
  status: 'calling' | 'receiving' | 'active';
  onAccept: () => void;
  onReject: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const CallModal = ({ user, status, onAccept, onReject, isMuted, onToggleMute }: Props) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-[400] flex flex-col items-center justify-center p-10 backdrop-blur-xl">
       <div className="relative mb-12">
          <div className="w-40 h-40 rounded-[48px] bg-vani-gradient p-1 animate-pulse shadow-[0_0_80px_rgba(255,60,60,0.3)]">
             <div className="w-full h-full rounded-[44px] bg-discord-dark overflow-hidden border-8 border-discord-dark">
                <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-full h-full object-cover" />
             </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-vani-blue w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-discord-dark shadow-xl">
             <User size={18} className="text-white" />
          </div>
       </div>

       <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2">{user.username}</h2>
          <p className="text-vani-blue font-mono text-xs uppercase tracking-[0.4em] animate-pulse">
             {status === 'calling' && 'Establishing Connection...'}
             {status === 'receiving' && 'Incoming Transmission...'}
             {status === 'active' && 'Neural Link Secured'}
          </p>
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
