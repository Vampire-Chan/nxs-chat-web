import { motion } from 'framer-motion';
import { MessageSquare, Zap, Shield, ExternalLink } from 'lucide-react';
import type { IUser } from '../services/api';
import { getIdentityName, getIdentityAge } from '../services/identity';

interface Props {
  user: IUser;
  isMe: boolean;
  isFollowing: boolean;
  onViewFull: () => void;
  onStartDM: () => void;
  onFollow: () => void;
  onClose: () => void;
  position: { x: number, y: number };
}

export const ProfileMiniCard = ({ user, isMe, isFollowing, onViewFull, onStartDM, onFollow, onClose, position }: Props) => {
  return (
    <>
      <div className="fixed inset-0 z-[150]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ top: position.y, left: position.x }}
        className="fixed z-[151] w-72 bg-[#0a0a0c] border border-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Banner */}
        <div className="h-20 bg-vani-gradient opacity-40 relative">
           {user.banner && <img src={user.banner} className="w-full h-full object-cover" />}
        </div>

        {/* Profile Header */}
        <div className="px-4 pb-4">
           <div className="flex justify-between items-end -mt-10 mb-3">
              <div className="w-20 h-20 rounded-[24px] bg-[#0a0a0c] p-1 shadow-xl">
                 <img 
                   src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                   className="w-full h-full rounded-[20px] object-cover border-2 border-discord-dark" 
                 />
              </div>
              <div className="flex space-x-2 pb-1">
                 {!isMe && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); onFollow(); }}
                     className={`p-2 rounded-xl transition-all ${isFollowing ? 'bg-white/5 text-vani-accent border border-red-500/20' : 'bg-vani-gradient text-white shadow-lg shadow-red-500/20'}`}
                   >
                      {isFollowing ? <Shield size={16} /> : <Zap size={16} />}
                   </button>
                 )}
              </div>
           </div>

           <div className="space-y-1">
              <div className="flex items-center space-x-2">
                 <h3 className="font-black text-white uppercase tracking-tighter text-lg">{getIdentityName(user)}</h3>
                 {isMe && <span className="text-[7px] bg-vani-blue/10 text-vani-blue px-1.5 py-0.5 rounded font-black">YOU</span>}
                 {getIdentityAge(user) !== null && (
                   <span className="text-[10px] font-black text-vani-blue/60 ml-1">{getIdentityAge(user)}Y</span>
                 )}
              </div>
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Node_Established: {new Date(user.createdAt || '2024-01-01').getFullYear()}</p>
              {user.displayName && (
                <p className="text-[8px] text-gray-600 font-mono uppercase tracking-tighter">@{user.username}</p>
              )}
           </div>

           {user.bio && (
             <p className="mt-4 text-[11px] text-gray-400 line-clamp-2 italic leading-relaxed border-l-2 border-gray-800 pl-3">
                "{user.bio}"
             </p>
           )}

           <div className="mt-6 grid grid-cols-2 gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onViewFull(); }}
                className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-white/5 transition-all"
              >
                 <ExternalLink size={12} />
                 <span>Full Node</span>
              </button>
              {!isMe && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onStartDM(); }}
                  className="flex items-center justify-center space-x-2 bg-vani-blue/10 hover:bg-vani-blue/20 text-vani-blue text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-vani-blue/20 transition-all"
                >
                   <MessageSquare size={12} />
                   <span>Direct Link</span>
                </button>
              )}
           </div>
        </div>

        <div className="bg-white/[0.02] p-2 text-center border-t border-white/5">
           <span className="text-[8px] text-gray-700 font-black uppercase tracking-[0.3em]">Identity Secure Link Active</span>
        </div>
      </motion.div>
    </>
  );
};
