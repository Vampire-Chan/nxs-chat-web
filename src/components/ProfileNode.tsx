import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { IPost, IUser } from '../services/api';
import { getIdentityName, getIdentityAge, getIdentityAvatar } from '../services/identity';
import { User as UserIcon, Heart, MessageCircle, Lock, Share2, Check, Clock, Shield, Star } from 'lucide-react';
import { PostViewerModal } from './PostViewerModal';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

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
      <div className="flex-1 bg-discord-dark flex flex-col items-center justify-center p-10 text-center">
         <div className="w-20 h-20 bg-red-500/10 rounded-[32px] mb-6 flex items-center justify-center border border-red-500/20 text-red-500"><Shield size={40} /></div>
         <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">{t('profile.severed_identity')}</h3>
         <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest max-w-xs leading-relaxed">{t('profile.purged_desc')}</p>
      </div>
    );
  }

  const displayedPosts = posts.slice(0, gridLimit);

  const renderActionButton = () => {
    if (isOwnProfile) return <button onClick={onEdit} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all backdrop-blur-md">{t('profile.modify_node')}</button>;
    
    // FIXED: Added onClick to Break Link
    if (isFriend) return <button onClick={() => onFollow?.(user.id || user._id)} className="bg-green-500/10 text-green-500 border border-green-500/20 px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all">{t('profile.break_link')}</button>;
    
    if (isFollowing && !user.isPrivate) return <button onClick={() => onFollow?.(user.id || user._id)} className="bg-white/5 text-white border border-white/10 px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all">{t('profile.unsync_node')}</button>;
    
    if (isRequestReceived) return <button onClick={handleAccept} className="bg-green-500/20 text-green-500 border border-green-500/50 px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-green-500/10"><Check size={12} /> {t('profile.accept_invasion')}</button>;
    
    if (isRequestSent) return <button disabled className="bg-white/5 text-gray-500 border border-white/10 px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-2 animate-pulse"><Clock size={12} /> {t('profile.sync_pending')}</button>;
    
    return (
      <button onClick={() => onFollow?.(user.id || user._id)} className="bg-vani-gradient text-white shadow-red-500/20 px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">
        {user.isPrivate ? t('profile.request_access') : t('profile.establish_sync')}
      </button>
    );
  };

  return (
    <div className="flex-1 bg-discord-dark overflow-y-auto custom-scrollbar relative">
      <div className="relative">
         <div className="h-48 bg-gray-900 overflow-hidden border-b border-gray-800/50 z-0">
            {user.banner ? <img src={user.banner} className="w-full h-full object-cover opacity-40" /> : <div className="w-full h-full bg-vani-gradient opacity-5" />}
            <div className="absolute inset-0 bg-gradient-to-t from-discord-dark via-discord-dark/40 to-transparent" />
         </div>
         <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10 pb-10">
            <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-8">
               <div className="relative group z-20">
                  <div className="w-32 h-32 rounded-[32px] bg-vani-gradient p-0.5 shadow-2xl">
                     <div className="w-full h-full rounded-[30px] bg-discord-dark overflow-hidden border-4 border-discord-dark">
                        <img src={getIdentityAvatar(user)} className="w-full h-full object-cover" alt="pfp" />
                     </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-vani-blue w-8 h-8 rounded-xl flex items-center justify-center border-4 border-discord-dark shadow-xl z-30">
                     {user.isPrivate ? <Shield size={14} className="text-white" /> : <UserIcon size={14} className="text-white" />}
                  </div>
               </div>
               <div className="flex-1 pb-2 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                     <div className="flex items-center justify-center md:justify-start gap-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                          {getIdentityName(user)}
                        </h2>
                        {getIdentityAge(user) !== null && (
                          <span className="text-sm font-black text-vani-blue/60">{getIdentityAge(user)}Y</span>
                        )}
                        {user.tier === 'elite' && <Star size={18} className="text-yellow-500 fill-yellow-500" />}
                     </div>
                     <div className="flex space-x-2 mt-3 md:mt-0 justify-center">
                        <button onClick={handleShare} className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-xl border border-white/10 flex items-center justify-center"><Share2 size={14} /></button>
                        {renderActionButton()}
                     </div>
                  </div>
                  <div className="flex justify-center md:justify-start space-x-8 opacity-80">
                     <Stat label={t('profile.transmissions')} value={posts.length} />
                     {isOwnProfile && (
                       <Stat label={t('profile.parallel')} value={user.friends?.length || 0} onClick={() => onViewSocials?.('friends', user.id || user._id)} />
                     )}
                     <Stat label={t('profile.synced')} value={user.following?.length || 0} onClick={() => onViewSocials?.('following', user.id || user._id)} />
                     <Stat label={t('profile.nodes')} value={user.followers?.length || 0} onClick={() => onViewSocials?.('followers', user.id || user._id)} />
                  </div>
               </div>
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-4 items-start">
               <div className="flex-1 bg-white/[0.02] p-5 rounded-2xl border border-white/5 backdrop-blur-sm relative overflow-hidden group">
                  <p className="text-gray-300 text-sm leading-relaxed font-medium relative z-10">{user.bio || t('profile.awaiting_calib')}</p>
               </div>
               <div className="w-full md:w-48 bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col space-y-2">
                  <div className="flex justify-between items-center"><span className="text-[8px] font-black text-gray-600 uppercase">{t('profile.handle')}</span><span className="text-[8px] font-mono text-vani-blue">@{user.username}</span></div>
                  {user.displayName && (
                    <div className="flex justify-between items-center"><span className="text-[8px] font-black text-gray-600 uppercase">{t('profile.alias')}</span><span className="text-[8px] font-mono text-white truncate max-w-[80px]">{user.displayName}</span></div>
                  )}
                  {user.showGender && user.gender && user.gender !== 'none' && (
                    <div className="flex justify-between items-center"><span className="text-[8px] font-black text-gray-600 uppercase">{t('profile.gender')}</span><span className="text-[8px] font-mono text-white uppercase">{t(`profile.gender_${user.gender}`)}</span></div>
                  )}
                  <div className="flex justify-between items-center"><span className="text-[8px] font-black text-gray-600 uppercase">{t('profile.tier')}</span><span className="text-[8px] font-mono text-yellow-500 uppercase">{user.tier}</span></div>
               </div>
            </div>
         </div>
      </div>

      {user.isLocked && !isOwnProfile && !isFriend ? (
        <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center border-t border-gray-900/50">
           <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5"><Lock size={24} className="text-gray-600" /></div>
           <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1">{t('profile.stealth_node')}</h3>
           <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest text-center max-w-xs leading-relaxed">{t('profile.mutual_sync_desc')}</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6">
           <div className="grid gap-3 md:gap-4 pb-20 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayedPosts.map((post) => (
                <motion.div key={post._id} onClick={() => setSelectedPost(post)} whileHover={{ y: -3, scale: 1.01 }} className="aspect-square bg-discord-channel rounded-2xl overflow-hidden border border-gray-800/50 relative group cursor-pointer shadow-lg transition-all">
                   <img src={post.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center space-x-4 backdrop-blur-[1px]">
                      <div className="flex items-center text-white text-[10px] font-black"><Heart size={12} className="fill-white mr-1" />{post.likes?.length || 0}</div>
                      <div className="flex items-center text-white text-[10px] font-black"><MessageCircle size={12} className="fill-white mr-1" />{post.comments?.length || 0}</div>
                   </div>
                </motion.div>
              ))}
           </div>
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

const Stat = ({ label, value, onClick }: any) => (
  <div className={`flex flex-col ${onClick ? 'cursor-pointer hover:opacity-100 transition-opacity group' : ''}`} onClick={onClick}>
     <div className="text-xl font-black text-white tracking-tighter group-hover:text-vani-blue">{value}</div>
     <div className={`text-[8px] font-black uppercase text-gray-600 group-hover:text-gray-400`}>{label}</div>
  </div>
);
