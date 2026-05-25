import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, Shield, ExternalLink, Clock } from 'lucide-react';
import { api } from '../services/api';
import type { IUser } from '../services/api';
import { getIdentityName, getIdentityAge } from '../services/identity';
import { MarkdownRenderer } from './MarkdownRenderer';


interface Props {
  user: IUser;
  currentUser: IUser;
  onViewFull: () => void;
  onStartDM: () => void;
  onFollow: () => void;
  onClose: () => void;
  position: { x: number, y: number };
}

export const ProfileMiniCard = ({ user, currentUser, onViewFull, onStartDM, onFollow, onClose, position }: Props) => {
  const [detailedUser, setDetailedUser] = useState<IUser>(user);
  
  useEffect(() => {
    setDetailedUser(user);
    const userId = user._id || user.id;
    if (userId) {
      api.getUserProfile(userId)
        .then(res => setDetailedUser(res))
        .catch(err => console.error('Failed to load profile for minicard:', err));
    }
  }, [user]);

  // Calculate constrained position
  const cardWidth = 288; // w-72 = 18rem = 288px
  const cardHeight = 350; // approximate height
  
  let x = position.x;
  let y = position.y;

  if (typeof window !== 'undefined') {
    if (x + cardWidth > window.innerWidth) x = window.innerWidth - cardWidth - 10;
    if (y + cardHeight > window.innerHeight) y = window.innerHeight - cardHeight - 10;
    if (x < 10) x = 10;
    if (y < 10) y = 10;
  }

  const detailedUserId = detailedUser._id || detailedUser.id;
  const isMe = detailedUserId === (currentUser?.id || currentUser?._id);
  const isFollowing = currentUser?.following?.some((f: any) => (f._id || f || '').toString() === detailedUserId.toString()) || false;
  const isFriend = currentUser?.friends?.some((f: any) => (f._id || f || '').toString() === detailedUserId.toString()) || false;
  const isPending = currentUser?.outboundRequests?.some((f: any) => (f._id || f || '').toString() === detailedUserId.toString()) || false;

  const renderFollowButton = () => {
    if (isMe) return null;
    
    let btnClass = 'bg-vani-gradient text-white shadow-lg shadow-red-500/20';
    let icon = <Zap size={16} />;
    
    if (isFriend) {
      btnClass = 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20';
      icon = <Shield size={16} />;
    } else if (isFollowing) {
      btnClass = 'bg-white/5 text-white border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20';
      icon = <Shield size={16} />;
    } else if (isPending) {
      btnClass = 'bg-white/5 text-yellow-500 border border-yellow-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 animate-pulse';
      icon = <Clock size={16} />;
    }
    
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onFollow(); }}
        className={`p-2 rounded-xl transition-all ${btnClass}`}
        title={isFriend ? 'Sever Link' : isFollowing ? 'Unsync Node' : isPending ? 'Cancel Request' : 'Sync Identity'}
      >
        {icon}
      </button>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[150]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ top: y, left: x }}
        className="fixed z-[151] w-72 bg-[#0a0a0c] border border-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden font-mono"
      >
        {/* Banner */}
        <div className="h-20 bg-vani-gradient opacity-40 relative">
           {detailedUser.banner && <img src={detailedUser.banner} className="w-full h-full object-cover" />}
        </div>

        {/* Profile Header */}
        <div className="px-4 pb-4">
           <div className="flex justify-between items-end -mt-10 mb-3">
              <div className="w-20 h-20 rounded-[24px] bg-[#0a0a0c] p-1 shadow-xl">
                 <img 
                   src={detailedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${detailedUser.username}`} 
                   className="w-full h-full rounded-[20px] object-cover border-2 border-discord-dark" 
                 />
              </div>
              <div className="flex space-x-2 pb-1">
                 {renderFollowButton()}
              </div>
           </div>

           <div className="space-y-1">
              <div className="flex items-center space-x-2">
                 <h3 className="font-black text-white uppercase tracking-tighter text-lg">{getIdentityName(detailedUser)}</h3>
                 {isMe && <span className="text-[7px] bg-vani-blue/10 text-vani-blue px-1.5 py-0.5 rounded font-black">YOU</span>}
                 {getIdentityAge(detailedUser) !== null && (
                   <span className="text-[10px] font-black text-vani-blue/60 ml-1">{getIdentityAge(detailedUser)}Y</span>
                 )}
              </div>
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Node_Established: {new Date(detailedUser.createdAt || '2024-01-01').getFullYear()}</p>
              {detailedUser.displayName && (
                <p className="text-[8px] text-gray-600 font-mono uppercase tracking-tighter">@{detailedUser.username}</p>
              )}
           </div>

           {detailedUser.bio && (
             <div className="mt-4 text-[11px] text-gray-400 line-clamp-2 italic leading-relaxed border-l-2 border-gray-800 pl-3">
                <MarkdownRenderer content={detailedUser.bio} />
             </div>
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
