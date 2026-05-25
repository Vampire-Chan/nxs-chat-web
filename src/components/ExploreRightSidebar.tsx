import { Activity, Radio, MessageSquare, Heart, UserPlus, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { IPost, IUser } from '../services/api';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getIdentityName, getIdentityAvatar } from '../services/identity';
import { useLanguage } from '../context/LanguageContext';

interface PulseEvent {
  id: string;
  type: 'like' | 'comment' | 'sync' | 'broadcast' | 'reply' | 'follow' | 'sync_request' | 'system' | 'login' | 'mention';
  user: string;
  target?: string;
  timestamp: Date;
}

interface Props {
  events: PulseEvent[];
  selectedPost: IPost | null;
  currentUser: IUser | null;
  onClosePost: () => void;
  onRefresh: () => void;
  onSelectTag?: (tag: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const ExploreRightSidebar = ({ events, selectedPost, currentUser, onClosePost, onRefresh, onSelectTag, onViewProfile }: Props) => {
  const { t } = useLanguage();
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<{ id: string, username: string, userId?: string } | null>(null);

  const renderCaption = (text: string) => {
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

  const renderComment = (text: string) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        const tag = part.substring(1).replace(/[^\w]/g, '');
        return <span key={i} onClick={(e) => { e.stopPropagation(); onSelectTag?.(tag); }} className="text-vani-blue hover:underline cursor-pointer">#{tag}</span>;
      }
      return part;
    });
  };

  useEffect(() => {
    if (selectedPost) {
      setIsLiked(selectedPost.likes?.includes(currentUser?.id || currentUser?._id || ''));
      setLikeCount(selectedPost.likes?.length || 0);
    }
  }, [selectedPost, currentUser]);

  const handleLike = async () => {
    if (!selectedPost) return;
    try {
      const res = await api.likePost(selectedPost._id);
      setIsLiked(res.likes.includes(currentUser?.id || currentUser?._id || ''));
      setLikeCount(res.likes.length);
      onRefresh();
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !comment.trim()) return;
    try {
      await api.addComment(selectedPost._id, comment, replyingTo?.id);
      setComment('');
      setReplyingTo(null);
      onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="hidden xl:flex flex-col bg-discord-channel h-full border-l border-gray-900 w-80 lg:w-96 shrink-0 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {selectedPost ? (
          <motion.div 
            key="post-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full overflow-hidden"
          >
            {/* Post Header */}
            <div className="h-16 px-4 border-b border-gray-900 flex items-center justify-between shadow-sm bg-white/[0.01]">
               <div className="flex items-center space-x-3">
                  <div onClick={(e) => (window as any).__vani_show_mini_profile?.(e, selectedPost.author)} className="w-8 h-8 rounded-lg overflow-hidden border border-gray-800 cursor-pointer hover:border-vani-blue transition-all">
                     <img src={getIdentityAvatar(selectedPost.author)} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                     <span onClick={(e) => (window as any).__vani_show_mini_profile?.(e, selectedPost.author)} className="font-black text-white uppercase tracking-tighter text-[10px] cursor-pointer hover:underline">{getIdentityName(selectedPost.author)}</span>
                     <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{t('feed.active_transmission')}</span>
                  </div>
               </div>
               <button onClick={onClosePost} className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-white">
                  <X size={18} />
               </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
               <div className="space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                     {renderCaption(selectedPost.caption) || t('feed.no_description')}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                     {(selectedPost.tags && selectedPost.tags.length > 0 ? selectedPost.tags : ['identity', 'vani', 'matrix']).map((tag: string) => (
                       <span key={tag} onClick={() => onSelectTag?.(tag)} className="text-[9px] font-black text-vani-blue uppercase tracking-widest px-2 py-1 bg-vani-blue/5 rounded-lg border border-vani-blue/10 cursor-pointer hover:bg-vani-blue/10 transition-all">#{tag}</span>
                     ))}
                  </div>

                  <div className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.2em] pt-2">
                     Synced: {new Date(selectedPost.createdAt).toLocaleString()}
                  </div>
               </div>

               {/* Comments Section */}
               <div className="space-y-6 pt-6 border-t border-gray-900">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{t('feed.neural_feedback')}</span>
                     <span className="text-[9px] font-mono text-vani-blue">{selectedPost.comments?.length || 0} Nodes</span>
                  </div>
                  <div className="space-y-5">
                     {selectedPost.comments?.map((c, i) => {
                       const isAuthorPrivate = c.user?.isPrivate;
                       const parentComment = c.parentCommentId ? selectedPost.comments.find(pc => pc._id === c.parentCommentId) : null;
                       
                       return (
                        <div key={i} className={`flex space-x-3 group ${c.parentCommentId ? 'ml-8' : ''}`}>
                           <div className="relative shrink-0">
                              <div 
                                onClick={(e) => { if (!isAuthorPrivate && c.user) (window as any).__vani_show_mini_profile?.(e, c.user); }}
                                className={`w-7 h-7 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden border border-white/5 cursor-pointer ${isAuthorPrivate ? 'filter blur-[4px] grayscale' : ''}`}
                              >
                                 <img src={getIdentityAvatar(c.user)} className="w-full h-full object-cover" />
                              </div>
                              {isAuthorPrivate && (
                                <div className="absolute -top-1 -right-1 bg-black text-[6px] font-black text-vani-accent px-1 rounded border border-vani-accent/30 tracking-tighter shadow-lg">GHOST</div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                 <div 
                                   onClick={(e) => { if (!isAuthorPrivate && c.user) (window as any).__vani_show_mini_profile?.(e, c.user); }}
                                   className="text-[9px] font-black text-white uppercase tracking-tight truncate cursor-pointer hover:text-vani-blue transition-colors"
                                 >
                                   {isAuthorPrivate ? 'Encrypted_Node' : getIdentityName(c.user)}
                                 </div>
                                 {parentComment && (
                                   <div 
                                     onClick={(e) => { if (parentComment.user) (window as any).__vani_show_mini_profile?.(e, parentComment.user); }}
                                     className="text-[7px] text-gray-600 font-mono flex items-center space-x-1 cursor-pointer hover:text-vani-accent"
                                   >
                                      <Send size={8} className="rotate-180" />
                                      <span>@{parentComment.user?.username}</span>
                                   </div>
                                 )}
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5 leading-snug break-words">{renderComment(c.text)}</div>
                              <button 
                                onClick={() => setReplyingTo({ id: c._id, username: c.user?.username || 'Unknown', userId: c.user?._id || c.user?.id })}
                                className="text-[8px] font-black text-vani-blue uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all hover:text-white"
                              >
                                {t('chat.reply_transmission')}
                              </button>
                           </div>
                        </div>
                       );
                     })}
                     {selectedPost.comments?.length === 0 && (
                       <div className="py-10 text-center flex flex-col items-center opacity-20">
                          <MessageSquare size={24} className="mb-2" />
                          <span className="text-[8px] font-black uppercase tracking-widest">{t('feed.awaiting_input')}</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Interaction Footer */}
            <div className="p-6 bg-black/20 border-t border-gray-900 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                     <button onClick={handleLike} className={`transition-all hover:scale-110 ${isLiked ? 'text-vani-accent' : 'text-gray-500'}`}>
                        <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                     </button>
                     <button className="text-gray-500 hover:text-vani-blue transition-all"><MessageSquare size={22} /></button>
                     <button className="text-gray-500 hover:text-white transition-all"><Send size={20} /></button>
                  </div>
                  <div className="text-right">
                     <div className="text-xs font-black text-white uppercase tracking-tighter">{likeCount} {t('feed.links_detected')}</div>
                  </div>
               </div>

               <div className="space-y-2">
                  {replyingTo && (
                    <div className="flex items-center justify-between px-3 py-1 bg-vani-blue/5 rounded-lg border border-vani-blue/10">
                       <span className="text-[8px] font-mono text-vani-blue uppercase">{t('chat.replying_to')} @{replyingTo.username}</span>
                       <button onClick={() => setReplyingTo(null)}><X size={10} className="text-gray-500 hover:text-white" /></button>
                    </div>
                  )}
                  <div className="relative">
                     <input 
                       type="text" 
                       placeholder={replyingTo ? t('feed.reply_placeholder') : t('feed.feedback_placeholder')}
                       className="w-full bg-black/40 border border-gray-800 focus:border-vani-blue p-3.5 rounded-2xl text-xs text-gray-300 outline-none transition-all pr-12"
                       value={comment}
                       onChange={(e) => setComment(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                     />
                     <button onClick={handleAddComment} className="absolute right-4 top-1/2 -translate-y-1/2 text-vani-blue hover:scale-110 transition-all">
                        <Send size={16} />
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="h-16 px-4 border-b border-gray-900 flex items-center justify-between shadow-sm bg-white/[0.01]">
               <div className="flex flex-col">
                  <span className="font-black text-white uppercase tracking-widest text-[10px]">Global Pulse</span>
                  <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                     Live_Stream_Active
                  </span>
               </div>
               <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-vani-blue">
                  <Activity size={16} />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5 pt-4">
              {events.map((event) => (
                <div key={event.id} className="group flex flex-col p-3 rounded-xl mx-2 bg-white/[0.02] border border-white/5 mb-2 hover:border-vani-blue/20 transition-all">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <div className="p-1.5 bg-gray-800 rounded-lg text-gray-500">
                      {event.type === 'like' && <Heart size={10} className="fill-current text-vani-accent" />}
                      {(event.type === 'comment' || event.type === 'reply') && <MessageSquare size={10} className="text-vani-blue" />}
                      {(event.type === 'sync' || event.type === 'follow' || event.type === 'sync_request') && <UserPlus size={10} className="text-green-500" />}
                      {(event.type === 'broadcast' || event.type === 'system' || event.type === 'login' || event.type === 'mention') && <Radio size={10} className="text-yellow-500" />}
                    </div>
                    <span className="text-[10px] font-black text-white uppercase truncate">{event.user}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-tight mb-2 pl-1 border-l border-white/5 ml-2.5">
                    {event.type === 'like' && 'Linked to a transmission'}
                    {(event.type === 'comment' || event.type === 'reply') && 'Added data to a post'}
                    {(event.type === 'sync' || event.type === 'follow' || event.type === 'sync_request') && 'Established a new node link'}
                    {(event.type === 'broadcast' || event.type === 'system' || event.type === 'login' || event.type === 'mention') && 'Started a global broadcast'}
                  </p>
                  <div className="text-[7px] font-mono text-gray-700 uppercase self-end">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <Radio size={24} className="mb-2" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t('feed.pulse_scanning')}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-900 bg-black/20">
               <div className="bg-vani-blue/10 border border-vani-blue/20 p-4 rounded-2xl text-center">
                  <div className="text-[9px] font-black text-vani-blue uppercase tracking-[0.2em] mb-1">{t('feed.select_transmission')}</div>
                  <div className="text-[8px] text-gray-500 font-mono uppercase">{t('feed.select_desc')}</div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
