import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { IPost, IUser } from '../services/api';
import { getIdentityName, getIdentityAge, getIdentityAvatar } from '../services/identity';
import { User as UserIcon, Heart, MessageCircle, Lock, Share2, Check, Clock, Shield, Star, Zap } from 'lucide-react';
import { PostViewerModal } from './PostViewerModal';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { MarkdownRenderer } from './MarkdownRenderer';


interface Props {
  user: IUser;
  isOwnProfile: boolean;
  onEdit?: () => void;
  onFollow?: (id: string) => void;
  onViewSocials?: (tab: 'friends' | 'following' | 'followers', userId: string) => void;
  currentUser?: IUser | null;
  onSelectTag?: (tag: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const ProfileNode = ({ user, isOwnProfile, onEdit, onFollow, onViewSocials, currentUser, onSelectTag, onViewProfile }: Props) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  const currentUserId = currentUser?.id || currentUser?._id;
  
  const isFollowing = user?.followers?.some((f: any) => (f._id || f) === currentUserId);
  const isFriend = user?.friends?.some((f: any) => (f._id || f) === currentUserId);
  const isRequestSent = user?.inboundRequests?.some((id: any) => (id._id || id) === currentUserId);
  const isRequestReceived = currentUser?.inboundRequests?.some((id: any) => (id._id || id) === (user?.id || user?._id));

  const gridLimit = user?.tier === 'elite' ? 64 : 8;

  const handleAccept = async () => {
    try {
      await api.acceptSync(user.id || user._id);
      addToast(t('profile.sync_established'), 'success');
      if (onFollow) onFollow(user.id || user._id); 
    } catch (err) {
      addToast(t('errors.generic'), 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/app/profile/${user.username}`;
    navigator.clipboard.writeText(url);
    addToast(t('profile.link_copied'), 'success');
  };

  const fetchPosts = async () => {
    if (!user?.id && !user?._id) return;
    try {
      const data = await api.getUserPosts(user.id || user._id);
      setPosts(data);
    } catch (err: any) { 
      if (err.response?.status !== 401) {
        console.error(err); 
      }
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    if (!user || (!user.id && !user._id)) {
      setLoading(false);
      return;
    }
    if (!user.isLocked || isOwnProfile || isFriend) fetchPosts(); 
    else setLoading(false); 
  }, [user, isOwnProfile, isFriend]);

  if (!user || (!user.id && !user._id)) {
    return (
      <div className="flex-1 bg-[#0a0a0c] flex flex-col items-center justify-center p-10 text-center bg-grid-pattern">
         <div className="w-20 h-20 bg-red-500/10 rounded-[32px] mb-6 flex items-center justify-center border border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]"><Shield size={40} /></div>
         <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2 font-mono">{t('profile.severed_identity')}</h3>
         <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest max-w-xs leading-relaxed">{t('profile.purged_desc')}</p>
      </div>
    );
  }

  const displayedPosts = posts.slice(0, gridLimit);
  const themeColor = user.tier === 'elite' ? 'text-yellow-500' : 'text-vani-blue';
  const glowColorClass = user.tier === 'elite' ? 'bg-yellow-500' : 'bg-[#00d2ff]';

  const renderActionButton = () => {
    if (isOwnProfile) {
      return (
        <button onClick={onEdit} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all backdrop-blur-md font-mono">
          {t('profile.modify_node')}
        </button>
      );
    }
    
    if (isFriend) {
      return (
        <button onClick={() => onFollow?.(user.id || user._id)} className="bg-green-500/10 text-green-500 border border-green-500/20 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all font-mono">
          {t('profile.break_link')}
        </button>
      );
    }
    
    if (isFollowing && !user.isPrivate) {
      return (
        <button onClick={() => onFollow?.(user.id || user._id)} className="bg-white/5 text-white border border-white/10 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all font-mono">
          {t('profile.unsync_node')}
        </button>
      );
    }
    
    if (isRequestReceived) {
      return (
        <button onClick={handleAccept} className="bg-green-500/20 text-green-500 border border-green-500/50 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-green-500/10 font-mono">
          <Check size={12} /> {t('profile.accept_invasion')}
        </button>
      );
    }
    
    if (isRequestSent) {
      return (
        <button 
          onClick={() => onFollow?.(user.id || user._id)} 
          className="bg-white/5 text-gray-400 border border-white/10 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-2 font-mono group cursor-pointer"
        >
          <Clock size={12} className="group-hover:text-red-400" />
          <span className="group-hover:hidden">{t('profile.sync_pending')}</span>
          <span className="hidden group-hover:inline">Cancel Request</span>
        </button>
      );
    }
    
    return (
      <button onClick={() => onFollow?.(user.id || user._id)} className="bg-vani-gradient text-white shadow-red-500/20 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 font-mono">
        {user.isPrivate ? t('profile.request_access') : t('profile.establish_sync')}
      </button>
    );
  };

  return (
    <div className="flex-1 bg-[#0a0a0c] overflow-y-auto custom-scrollbar relative bg-grid-pattern">
      {/* Background neon glow */}
      <div className={`absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full filter blur-[120px] opacity-[0.03] pointer-events-none transition-all duration-500 ${glowColorClass}`} />

      <div className="relative">
         {/* Top Banner section */}
         <div className="h-44 md:h-52 bg-[#07070a]/60 overflow-hidden border-b border-white/5 relative z-0">
            {user.banner ? (
              <img src={user.banner} className="w-full h-full object-cover opacity-35" />
            ) : (
              <div className="w-full h-full bg-vani-gradient opacity-[0.03] bg-grid-pattern" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
            <div className="scanner-line opacity-50" />
         </div>

         {/* Profile Details Container */}
         <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-16 md:-mt-20 relative z-10 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end space-y-5 md:space-y-0 md:space-x-8">
               
               {/* Avatar Frame */}
               <div className="relative group z-20">
                  <div className={`w-28 h-28 md:w-36 md:h-36 rounded-[28px] md:rounded-[36px] bg-vani-gradient p-0.5 shadow-2xl relative overflow-hidden`}>
                     <div className="scanner-line" />
                     <div className="w-full h-full rounded-[26px] md:rounded-[34px] bg-[#0a0a0c] overflow-hidden border-4 border-[#0a0a0c]">
                        <img src={getIdentityAvatar(user)} className="w-full h-full object-cover rounded-[inherit]" alt="pfp" />
                     </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-vani-blue w-8 h-8 rounded-xl flex items-center justify-center border-4 border-[#0a0a0c] shadow-xl z-30">
                     {user.isPrivate ? <Shield size={14} className="text-white" /> : <UserIcon size={14} className="text-white" />}
                  </div>
               </div>

               {/* Meta info & Stats */}
               <div className="flex-1 pb-1 text-center md:text-left w-full">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                     <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                          {getIdentityName(user)}
                        </h2>
                        {getIdentityAge(user) !== null && (
                          <span className="text-xs font-mono font-black text-vani-blue/70 border border-vani-blue/20 bg-vani-blue/5 px-2 py-0.5 rounded">
                            [ {getIdentityAge(user)}Y ]
                          </span>
                        )}
                        {user.tier === 'elite' && (
                          <div className="flex items-center gap-1 text-yellow-500 font-mono text-[9px] font-black border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-0.5 rounded">
                             <Star size={12} className="fill-yellow-500" />
                             <span>ELITE</span>
                          </div>
                        )}
                     </div>
                     <div className="flex space-x-2 justify-center md:justify-start">
                        <button onClick={handleShare} className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"><Share2 size={14} /></button>
                        {renderActionButton()}
                     </div>
                  </div>

                  {/* Diagnostic stats row */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full font-mono">
                     <Stat label={t('profile.transmissions')} value={posts.length} color="border-[#00d2ff]/20 text-[#00d2ff] bg-[#00d2ff]/5 hover:bg-[#00d2ff]/10 hover:border-[#00d2ff]/40 hover:shadow-[0_0_15px_rgba(0,210,255,0.1)]" />
                     {isOwnProfile && (
                       <Stat label={t('profile.parallel')} value={user.friends?.length || 0} onClick={() => onViewSocials?.('friends', user.id || user._id)} color="border-pink-500/20 text-pink-400 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(244,114,182,0.1)]" />
                     )}
                     <Stat label={t('profile.synced')} value={user.following?.length || 0} onClick={() => onViewSocials?.('following', user.id || user._id)} color="border-purple-500/20 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]" />
                     <Stat label={t('profile.nodes')} value={user.followers?.length || 0} onClick={() => onViewSocials?.('followers', user.id || user._id)} color="border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/40 hover:shadow-[0_0_15px_rgba(74,222,128,0.1)]" />
                  </div>
               </div>
            </div>

            {/* Bio and Diagnostic readout */}
            <div className="mt-8 flex flex-col md:flex-row gap-4 items-stretch w-full">
               <div className="flex-1 bg-[#07070a]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden group min-h-[110px]">
                  <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                  <div className="absolute top-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                  <div className="absolute bottom-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                  <div className="absolute bottom-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                  
                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono mb-3 flex items-center gap-1.5">
                     <Zap size={10} className={themeColor} />
                     <span>[ DEC_MATRIX_BIO ]</span>
                  </div>
                  <div className="text-gray-300 text-xs leading-relaxed font-mono font-medium relative z-10">
                    <MarkdownRenderer content={user.bio || t('profile.awaiting_calib')} />
                  </div>
               </div>
               
               <div className="w-full md:w-64 bg-[#07070a]/40 border border-white/5 rounded-2xl p-5 flex flex-col space-y-2.5 relative overflow-hidden group">
                  <div className="absolute top-2 left-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                  <div className="absolute bottom-2 right-2 text-white/5 select-none pointer-events-none font-mono text-[9px]">+</div >
                  
                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                     <UserIcon size={10} className={themeColor} />
                     <span>[ NODE_DIAGNOSTICS ]</span>
                  </div>
                  <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-500 uppercase font-mono">HANDLE</span><span className="text-[9px] font-mono text-vani-blue">@{user.username}</span></div>
                  {user.displayName && (
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-500 uppercase font-mono">ALIAS</span><span className="text-[9px] font-mono text-white truncate max-w-[120px]">{user.displayName}</span></div>
                  )}
                  {user.showGender && user.gender && user.gender !== 'none' && (
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-500 uppercase font-mono">DESCRIPTOR</span><span className="text-[9px] font-mono text-white uppercase">{t(`profile.gender_${user.gender}`)}</span></div>
                  )}
                  <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-500 uppercase font-mono">CLASS</span><span className="text-[9px] font-mono text-yellow-500 uppercase font-bold">{user.tier}</span></div>
               </div>
            </div>
         </div>
      </div>

      {user.isLocked && !isOwnProfile && !isFriend ? (
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center border-t border-white/5">
           <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5"><Lock size={24} className="text-gray-600 animate-pulse" /></div>
           <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1 font-mono">{t('profile.stealth_node')}</h3>
           <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest text-center max-w-xs leading-relaxed">{t('profile.mutual_sync_desc')}</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 pb-20">
           {/* Section divider */}
           <div className="mb-6">
              <div className="flex items-center gap-4">
                 <div className="text-[9px] font-black text-vani-blue uppercase tracking-[0.4em] font-mono flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-vani-blue rounded-full animate-pulse" />
                    [ TRANSMISSION_LEDGER ]
                 </div>
                 <div className="flex-1 h-[1px] bg-gradient-to-r from-vani-blue/30 via-white/5 to-transparent" />
              </div>
           </div>

           {/* Grid layout */}
           <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {displayedPosts.map((post) => (
                <motion.div 
                  key={post._id} 
                  onClick={() => setSelectedPost(post)} 
                  whileHover={{ y: -3, scale: 1.01 }} 
                  className="aspect-square bg-[#07070a]/40 rounded-2xl overflow-hidden border border-white/5 relative group cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(0,210,255,0.08)] hover:border-vani-blue/30 transition-all duration-300"
                >
                   <img src={post.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 rounded-[inherit]" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center space-x-4 backdrop-blur-[1px]">
                      <div className="flex items-center text-white text-[10px] font-black font-mono"><Heart size={12} className="fill-white mr-1" />{post.likes?.length || 0}</div>
                      <div className="flex items-center text-white text-[10px] font-black font-mono"><MessageCircle size={12} className="fill-white mr-1" />{post.comments?.length || 0}</div>
                   </div>
                </motion.div>
              ))}
           </div>
           
           {displayedPosts.length === 0 && (
             <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] font-mono">No Transmissions Logged</div>
             </div>
           )}
        </div>
      )}
      {selectedPost && (
        <PostViewerModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          currentUser={currentUser || null} 
          onUpdate={fetchPosts} 
          onSelectTag={onSelectTag}
          onViewProfile={onViewProfile}
        />
      )}
    </div>
  );
};

const Stat = ({ label, value, onClick, color }: any) => (
  <div 
    className={`flex-1 min-w-[70px] flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-300 ${color} ${onClick ? 'cursor-pointer' : ''}`} 
    onClick={onClick}
  >
     <div className="text-base md:text-lg font-black tracking-tighter">{value}</div>
     <div className="text-[8px] font-black uppercase tracking-wider mt-0.5 opacity-80 text-center">{label}</div>
  </div>
);
