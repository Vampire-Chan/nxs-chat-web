import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import type { IPost, IUser, IRealm } from '../services/api';
import { Image as ImageIcon, Heart, MessageCircle, MoreHorizontal, Plus, Users, Hash, X, Send, WifiOff, RefreshCcw, Radio, Activity } from 'lucide-react';
import { ExploreLeftSidebar } from './ExploreLeftSidebar';
import { ExploreRightSidebar } from './ExploreRightSidebar';
import { getIdentityName, getIdentityAvatar } from '../services/identity';
import { PostViewerModal } from './PostViewerModal';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  posts: IPost[];
  onOpenCreateModal: () => void;
  currentUser: IUser;
  channelId?: string;
  onViewProfile?: (userId: string) => void;
  onSelectTag?: (tag: string | null) => void;
  onRetry?: () => void;
  isSyncing?: boolean;
  liveStreamers?: IUser[];
}

export const FeedArea = ({ posts: initialPosts, onOpenCreateModal, currentUser, channelId, onViewProfile, liveStreamers = [] }: Props) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [posts, setPosts] = useState(initialPosts);
  const [showHeart, setShowHeart] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [activeStream, setActiveStream] = useState<IUser | null>(null);
  
  // Explore States
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [popularPosts, setPopularPosts] = useState<IPost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<IUser[]>([]);
  const [pulseEvents, setPulseEvents] = useState<any[]>([]);

  if (initialPosts.length !== posts.length && !activeTag) setPosts(initialPosts);

  const isGlobal = channelId === 'global' || !channelId;
  const canPost = true;

  const useMobileUI = window.innerWidth < 1024;
  const creationPref = currentUser.creationUI || 'auto';
  
  const showBar = (creationPref === 'bar') || (creationPref === 'auto' && !useMobileUI);
  const showButton = (creationPref === 'button') || (creationPref === 'auto' && useMobileUI) || (useMobileUI && creationPref === 'bar');

  const handleTagSelect = async (tag: string | null) => {
    setActiveTag(tag);
    if (tag) {
      const ps = await api.getGlobalPosts(tag);
      setPosts(ps);
    } else {
      const ps = await api.getGlobalPosts();
      setPosts(ps);
    }
  };

  const triggerRefresh = async () => {
    setIsSyncing(true);
    setSyncError(false);
    try {
      if (isGlobal) {
        const ps = await api.getGlobalPosts(activeTag || undefined);
        setPosts(ps);
        if (selectedPost) {
          const updated = ps.find(p => p._id === selectedPost._id);
          if (updated) setSelectedPost(updated);
        }
      } else {
        const ps = await api.getPosts(channelId!);
        setPosts(ps);
      }
    } catch (err) {
      setSyncError(true);
      addToast(t('feed.matrix_sync_interrupted'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isGlobal) {
      api.getSuggestedUsers().then(setSuggestedUsers).catch(console.error);
      api.getTrends().then(trends => {
        if (trends && trends.length > 0) {
          setTrendingTags(trends.map((t: any) => t.name));
        } else {
          setTrendingTags(['Yantravani', 'matrix', 'cyberpunk', 'web3', 'identity', 'privacy']);
        }
      }).catch(() => setTrendingTags(['Yantravani', 'matrix', 'cyberpunk', 'web3', 'identity', 'privacy']));

      setPopularPosts(initialPosts.slice(0, 5));
      const mockEvents = [
        { id: '1', type: 'like', user: 'System_Admin', timestamp: new Date() },
        { id: '2', type: 'sync', user: 'Ghost_Node', timestamp: new Date() },
        { id: '3', type: 'broadcast', user: 'Reality_Coder', timestamp: new Date() },
      ];
      setPulseEvents(mockEvents);
    }
  }, [isGlobal, initialPosts]);

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post && (post.author._id === currentUser.id || post.author.id === currentUser.id)) return;
    try {
      const { likes } = await api.likePost(postId);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes } : p));
      if (selectedPost?._id === postId) {
        setSelectedPost(prev => prev ? { ...prev, likes } : null);
      }
    } catch (err) { console.error(err); }
  };

  const handleDoubleTap = (postId: string) => {
    handleLike(postId);
    setShowHeart(postId);
    setTimeout(() => setShowHeart(null), 1000);
  };

  const handleSyncActionFromUser = async (targetUser: IUser) => {
    try {
      await api.syncIdentity(targetUser._id || targetUser.id);
      setSuggestedUsers(prev => prev.filter(u => (u._id || u.id) !== (targetUser._id || targetUser.id)));
      addToast(t('feed.identity_synced'), 'success');
    } catch (e) { addToast(t('feed.sync_failed'), 'error'); }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-[#050507]">
      {isGlobal && (
        <ExploreLeftSidebar 
          trendingTags={trendingTags} 
          popularPosts={popularPosts} 
          suggestedUsers={suggestedUsers}
          onSelectTag={handleTagSelect}
          onSelectUser={(u) => onViewProfile?.(u)}
          liveStreamers={liveStreamers}
          onSelectStream={(u) => setActiveStream(u)}
        />
      )}

      <div className="flex-1 flex flex-col bg-discord-dark min-w-0 h-full overflow-y-auto custom-scrollbar p-4 md:p-6 lg:px-12">
        {activeStream ? (
          <div className="flex-1 flex flex-col h-full space-y-6">
             <div className="flex items-center justify-between bg-white/[0.02] p-6 rounded-[32px] border border-white/5">
                <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                      <Radio size={24} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter">{(t as any)('feed.transmission', { username: activeStream.username })}</h2>
                      <div className="flex items-center space-x-2">
                         <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{(t as any)('feed.live_from_matrix', { count: Math.floor(Math.random()*1000) })}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setActiveStream(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500 transition-all text-gray-400 hover:text-white"><X size={20} /></button>
             </div>

             <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                <div className="lg:col-span-3 bg-[#0a0a0c] rounded-[48px] border-2 border-white/5 overflow-hidden relative shadow-2xl group">
                   <div className="absolute inset-0 bg-vani-gradient opacity-10 animate-pulse" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Activity size={100} className="text-white/10" />
                   </div>
                   <div className="absolute bottom-10 left-10 flex items-center space-x-4">
                      <img src={getIdentityAvatar(activeStream)} className="w-16 h-16 rounded-[24px] border-4 border-[#0a0a0c] shadow-2xl" />
                      <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                         <span className="text-xs font-black text-white uppercase tracking-widest">{activeStream.displayName || activeStream.username}</span>
                      </div>
                   </div>
                </div>

                <div className="hidden lg:flex flex-col bg-white/[0.01] rounded-[40px] border border-white/5 overflow-hidden">
                   <div className="p-6 border-b border-white/5 flex items-center space-x-3">
                      <MessageCircle size={16} className="text-vani-blue" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('feed.neural_chat')}</span>
                   </div>
                   <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar opacity-40">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex space-x-2">
                           <div className="w-2 h-2 rounded-full bg-white/10 mt-1" />
                           <div className="flex-1 h-2 bg-white/5 rounded-full" />
                        </div>
                      ))}
                   </div>
                   <div className="p-4 border-t border-white/5">
                      <div className="bg-white/5 p-3 rounded-2xl text-[10px] text-gray-600 font-black uppercase text-center border border-white/5">{t('feed.link_established')}</div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <>
            {syncError ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                 <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center border border-red-500/20">
                    <WifiOff className="text-red-500" size={32} />
                 </div>
                 <div className="text-center">
                    <h3 className="text-white font-black uppercase tracking-widest">{t('feed.link_severed_title')}</h3>
                    <p className="text-gray-500 text-[10px] uppercase font-mono mt-2">{t('feed.connection_loss')}</p>
                 </div>
                 <button 
                   onClick={triggerRefresh}
                   className="px-8 py-3 bg-white/5 hover:bg-vani-blue hover:text-black text-white rounded-xl font-black uppercase text-[10px] border border-white/10 transition-all flex items-center space-x-3"
                 >
                    <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{t('feed.retry_sync')}</span>
                 </button>
              </div>
            ) : (
              <>
                {activeTag && (
                  <div className="max-w-2xl mx-auto w-full mb-6 flex items-center justify-between bg-vani-blue/10 border border-vani-blue/30 p-4 rounded-2xl">
                     <div className="flex items-center space-x-3">
                        <Hash className="text-vani-blue" size={20} />
                        <span className="text-sm font-black text-white uppercase tracking-widest">{(t as any)('feed.signal_filter', { tag: activeTag })}</span>
                     </div>
                     <button onClick={() => handleTagSelect(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={18} /></button>
                  </div>
                )}

                {isGlobal && !activeTag && suggestedUsers.length > 0 && (
                  <div className="max-w-2xl mx-auto w-full mb-12">
                     <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{t('feed.suggested_identities')}</span>
                        <button className="text-[9px] font-black text-vani-blue uppercase tracking-widest hover:text-white transition-colors">{t('feed.see_all')}</button>
                     </div>
                     <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                        {suggestedUsers.map((user) => (
                          <motion.div 
                            key={user._id}
                            whileHover={{ y: -5 }}
                            className="flex-shrink-0 w-32 bg-discord-channel border border-white/5 rounded-3xl p-4 flex flex-col items-center text-center group cursor-pointer hover:border-vani-blue/30 transition-all shadow-xl"
                          >
                             <div className="w-16 h-16 rounded-2xl bg-vani-gradient p-0.5 mb-3 shadow-lg group-hover:scale-110 transition-transform">
                                <div className="w-full h-full rounded-[14px] overflow-hidden bg-discord-dark">
                                   <img src={getIdentityAvatar(user)} className="w-full h-full object-cover" />
                                </div>
                             </div>
                             <span className="text-[10px] font-black text-white uppercase truncate w-full mb-1">{getIdentityName(user)}</span>
                             <span className="text-[8px] text-gray-600 font-mono truncate w-full mb-3">@{user.username}</span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleSyncActionFromUser(user); }}
                               className="w-full py-1.5 bg-white/5 hover:bg-vani-blue text-white hover:text-black rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/5 hover:border-vani-blue transition-all"
                             >
                               {t('feed.sync_btn')}
                             </button>
                          </motion.div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="max-w-2xl mx-auto w-full mb-10">
                   {canPost && showBar && (
                     <div onClick={onOpenCreateModal} className="bg-discord-channel p-4 rounded-2xl cursor-pointer hover:bg-discord-sidebar transition-all flex items-center space-x-4 text-gray-400 border border-gray-800 shadow-xl group">
                        <div className="w-10 h-10 rounded-xl bg-vani-gradient flex items-center justify-center text-white shadow-lg shadow-red-500/20"><ImageIcon size={20} /></div>
                        <div className="flex-1 bg-discord-dark h-11 rounded-xl flex items-center px-4 border border-gray-800 text-sm font-medium group-hover:border-gray-700 transition-all truncate">
                          {isGlobal ? t('feed.broadcast') : t('feed.share_sector')}
                        </div>
                        <div className="p-2 text-vani-blue group-hover:scale-110 transition-transform hidden sm:block"><span className="text-xs font-black uppercase tracking-widest text-vani-blue">{t('feed.share')}</span></div>
                     </div>
                   )}
                </div>

                <div className="max-w-2xl mx-auto w-full space-y-12 md:space-y-16 pb-40 lg:pb-20">
                  {posts.map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      currentUser={currentUser} 
                      onDoubleTap={() => handleDoubleTap(post._id)} 
                      isHearting={showHeart === post._id} 
                      onOpen={() => setSelectedPost(post)} 
                      isGlobal={isGlobal} 
                      isActive={selectedPost?._id === post._id}
                      onSelectTag={handleTagSelect}
                      onViewProfile={onViewProfile}
                      t={t}
                    />
                  ))}
                  {posts.length === 0 && <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl"><div className="text-vani-blue font-black text-xl mb-2 opacity-20 uppercase">{t('feed.no_data')}</div></div>}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {selectedPost && (window.innerWidth < 1280 || !isGlobal) && (
        <PostViewerModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          currentUser={currentUser} 
          onUpdate={triggerRefresh}
          onSelectTag={handleTagSelect}
          onViewProfile={onViewProfile}
        />
      )}

      {canPost && showButton && (
        <button 
          onClick={onOpenCreateModal}
          className="fixed bottom-28 right-6 w-16 h-16 bg-vani-gradient rounded-2xl flex items-center justify-center text-white shadow-[0_10px_40px_rgba(255,60,60,0.4)] z-[3000] active:scale-90 transition-transform lg:hidden"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      {isGlobal && (
        <ExploreRightSidebar 
          events={pulseEvents} 
          selectedPost={selectedPost} 
          currentUser={currentUser}
          onClosePost={() => setSelectedPost(null)}
          onRefresh={triggerRefresh}
          onSelectTag={handleTagSelect}
          onViewProfile={onViewProfile}
        />
      )}
    </div>
  );
};

const PostCard = ({ post, currentUser, onDoubleTap, isHearting, onOpen, isGlobal, isActive, onSelectTag, onViewProfile, t }: any) => {
  const { addToast } = useToast();
  const [quickComment, setQuickComment] = useState('');
  const [localLikes, setLocalLikes] = useState(post.likes || []);
  const isMe = (post.author?._id || post.author?.id) === (currentUser.id || currentUser._id);
  const isFollowing = currentUser.following?.some((id: string) => id === (post.author?._id || post.author?.id));
  const isFriend = currentUser.friends?.some((id: string) => id === (post.author?._id || post.author?.id));
  const isSyncing = isFollowing || isFriend;
  const isLiked = localLikes.includes(currentUser.id || currentUser._id);

  const handleQuickLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { likes } = await api.likePost(post._id);
      setLocalLikes(likes);
    } catch (err) { console.error(err); }
  };

  const handleQuickComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComment.trim()) return;
    try {
      await api.addComment(post._id, quickComment);
      setQuickComment('');
      addToast(t('feed.feedback_synced'), 'success');
    } catch (err) { console.error(err); }
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        const tag = part.substring(1).replace(/[^\w]/g, '');
        return <span key={i} onClick={(e) => { e.stopPropagation(); onSelectTag?.(tag); }} className="text-vani-blue hover:underline cursor-pointer">#{tag}</span>;
      }
      if (part.startsWith('@') && part.length > 1) {
        const username = part.substring(1).replace(/[^\w]/g, '');
        return (
          <span 
            key={i} 
            onClick={async (e) => { 
              e.stopPropagation(); 
              try {
                const res = await api.getUserByHandle(username);
                if (res.id) onViewProfile?.(res.id);
              } catch (e) { console.error("Identity resolution failed"); }
            }} 
            className="text-vani-accent hover:underline cursor-pointer"
          >
            @{username}
          </span>
        );
      }
      return part;
    });
  };

  const sourceRealm = post.sourceRealm as IRealm | undefined;
  const isDiscoverable = sourceRealm?.isDiscoverable;
  const isMemberOfSource = currentUser.realms?.includes(sourceRealm?._id || '');

  const handleSyncAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSyncing) {
        await api.unfollowUser(post.author._id || post.author.id);
        addToast(t('feed.identity_unsynced'), 'success');
      } else {
        await api.syncIdentity(post.author._id || post.author.id);
        addToast(t('feed.identity_synced'), 'success');
      }
    } catch (e) { addToast(t('feed.sync_failed'), 'error'); }
  };

  const handleJoinRealm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sourceRealm) return;
    try {
      await api.joinRealm(sourceRealm._id);
      addToast(t('feed.realm_synced', { name: sourceRealm.name }), 'success');
      window.location.reload(); 
    } catch (e) { addToast(t('feed.realm_access_denied'), 'error'); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      className={`bg-discord-channel rounded-[32px] lg:rounded-[40px] overflow-hidden shadow-2xl border transition-all duration-500 ${isActive ? 'border-vani-blue ring-4 ring-vani-blue/10' : (isMe ? 'border-vani-blue/30' : 'border-gray-800')} group`}
    >
      <div className="p-4 lg:p-5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-gray-800 overflow-hidden border border-gray-700 shadow-lg group-hover:scale-105 transition-transform">
            <img src={getIdentityAvatar(post.author)} alt="a" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
              <div className="font-black tracking-tight text-xs lg:text-sm uppercase text-white truncate max-w-[120px] lg:max-w-none">{getIdentityName(post.author)}</div>
              {isGlobal && sourceRealm && (
                <div className="flex items-center space-x-1.5 px-1.5 py-0.5 bg-white/5 rounded-md border border-white/5 shrink-0">
                  <span className="text-[7px] lg:text-[8px] text-gray-500 font-black uppercase tracking-tighter">{t('feed.in')}</span>
                  <span className="text-[8px] lg:text-[9px] text-vani-blue font-black uppercase tracking-tight truncate max-w-[80px] lg:max-w-[100px]">
                    {isDiscoverable ? sourceRealm.name : t('feed.encrypted')}
                  </span>
                </div>
              )}
            </div>
            <div className="text-gray-500 text-[8px] lg:text-[10px] font-mono tracking-tighter uppercase">{new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1.5 lg:space-x-2">
          {isGlobal && sourceRealm && isDiscoverable && !isMemberOfSource && (
            <button onClick={handleJoinRealm} className="flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-vani-blue/10 hover:bg-vani-blue text-vani-blue hover:text-black rounded-xl lg:rounded-2xl border border-vani-blue/20 transition-all font-black text-[8px] lg:text-[10px] uppercase tracking-widest"><Plus size={12} className="lg:w-3.5 lg:h-3.5" /><span>{t('feed.join_btn')}</span></button>
          )}
          {isGlobal && !isMe && !isSyncing && (
            <button onClick={handleSyncAction} className="flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-white/5 text-white border border-white/5 hover:border-vani-blue hover:text-vani-blue rounded-xl lg:rounded-2xl transition-all font-black text-[8px] lg:text-[10px] uppercase tracking-widest"><Users size={12} className="lg:w-3.5 lg:h-3.5" /><span>{t('feed.sync_btn')}</span></button>
          )}
          <MoreHorizontal className="text-gray-600 hover:text-white cursor-pointer ml-1 lg:ml-2" size={18} />
        </div>
      </div>

      <div className="bg-[#050507] relative overflow-hidden flex items-center justify-center cursor-pointer min-h-[350px] lg:min-h-[500px]" onDoubleClick={!isMe ? onDoubleTap : undefined} onClick={onOpen}>
         <img src={post.imageUrl || ""} alt="Post" className="w-full object-contain transition-transform duration-1000 group-hover:scale-[1.03]" />
         <AnimatePresence>
           {isHearting && (
             <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute z-20 pointer-events-none">
               <Heart size={80} className="lg:w-[120px] lg:h-[120px] text-white fill-vani-accent drop-shadow-[0_0_30px_rgba(255,60,60,0.8)]" />
             </motion.div>
           )}
         </AnimatePresence>
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 lg:p-8 z-10">
            <div className="flex items-center justify-between w-full">
               <div className="flex items-center space-x-4 lg:space-x-6 text-white">
                  <button onClick={handleQuickLike} className="flex items-center space-x-1.5 lg:space-x-2 group/btn">
                     <Heart size={18} className={`lg:w-6 lg:h-6 transition-all ${isLiked ? 'fill-vani-accent text-vani-accent scale-110' : 'group-hover/btn:scale-110'}`} /> 
                     <span className="font-black text-xs lg:text-sm">{localLikes.length || 0}</span>
                  </button>
                  <div className="flex items-center space-x-1.5 lg:space-x-2">
                     <MessageCircle size={18} className="lg:w-6 lg:h-6" /> 
                     <span className="font-black text-xs lg:text-sm">{post.comments?.length || 0}</span>
                  </div>
               </div>
               <div className="lg:hidden text-white/40"><MoreHorizontal size={20} /></div>
            </div>
         </div>
      </div>

      <div className="px-4 lg:px-6 py-4 space-y-4 bg-white/[0.02]">
        {post.caption && (
           <p className="text-[11px] lg:text-sm text-gray-300 leading-relaxed font-medium line-clamp-2">
              {renderContent(post.caption)}
           </p>
        )}
        <form onSubmit={handleQuickComment} className="flex items-center space-x-3">
           <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
              <img src={getIdentityAvatar(currentUser)} className="w-full h-full object-cover" />
           </div>
           <div className="flex-1 relative">
              <input type="text" placeholder={t('feed.quick_feedback')} value={quickComment} onChange={(e) => setQuickComment(e.target.value)} className="w-full bg-black/40 border border-white/5 focus:border-vani-blue/50 rounded-xl px-4 py-2 text-[10px] lg:text-xs text-white outline-none transition-all" />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-vani-blue opacity-50 hover:opacity-100"><Send size={14} /></button>
           </div>
        </form>
      </div>
    </motion.div>
  );
};
