import { Activity, Radio, MessageSquare, Heart, UserPlus, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { IPost, IUser } from '../services/api';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getIdentityName } from '../services/identity';

interface PulseEvent {
  id: string;
  type: 'like' | 'comment' | 'sync' | 'broadcast';
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
      // Manual @mentions in comments are plain text as per Protocol
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
    <div className="hidden xl:flex flex-col bg-discord-channel h-full border-l border-gray-900 w-80 lg:w-96 transition-all duration-500">
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
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-800">
                     <img src={selectedPost.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.author.username}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                     <span className="font-black text-white uppercase tracking-tighter text-[10px]">{getIdentityName(selectedPost.author)}</span>
                     <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Active_Transmission</span>
                  </div>
               </div>
               <button onClick={onClosePost} className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-white">
                  <X size={18} />
               </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
               {/* Description & Tags */}
               <div className="space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                     {renderCaption(selectedPost.caption) || "No description provided."}
                  </p>
                  
                  {/* Mock Tags - If real tags exist in your model, use selectedPost.tags */}
                  <div className="flex flex-wrap gap-2">
                     {(selectedPost.tags || ['identity', 'vani', 'matrix']).map((tag: string) => (
                       <span key={tag} onClick={() => onSelectTag?.(tag)} className="text-[9px] font-black text-vani-blue uppercase tracking-widest px-2 py-1 bg-vani-blue/5 rounded-lg border border-vani-blue/10 cursor-pointer hover:bg-vani-blue/10">#{tag}</span>
                     ))}
                  </div>

                  <div className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.2em] pt-2">
                     Synced: {new Date(selectedPost.createdAt).toLocaleString()}
                  </div>
               </div>

               {/* Comments Section */}
               <div className="space-y-6 pt-6 border-t border-gray-900">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Neural_Feedback</span>
                     <span className="text-[9px] font-mono text-vani-blue">{selectedPost.comments?.length || 0} Nodes</span>
                  </div>
                  <div className="space-y-5">
                     {selectedPost.comments?.map((c, i) => {
                       const isAuthorPrivate = c.user?.isPrivate;
                       const parentComment = c.parentCommentId ? selectedPost.comments.find(pc => pc._id === c.parentCommentId) : null;
                       
                       return (
                        <div key={i} className={`flex space-x-3 group ${c.parentCommentId ? 'ml-8' : ''}`}>
                           <div className="relative">
                              <div 
                                onClick={() => !isAuthorPrivate && onViewProfile?.(c.user?._id || c.user?.id)}
                                className={`w-7 h-7 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden border border-white/5 cursor-pointer ${isAuthorPrivate ? 'filter blur-[4px] grayscale' : ''}`}
                              >
                                 <img src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.username}`} className="w-full h-full object-cover" />
                              </div>
                              {isAuthorPrivate && (
                                <div className="absolute -top-1 -right-1 bg-black text-[6px] font-black text-vani-accent px-1 rounded border border-vani-accent/30 tracking-tighter">GHOST</div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                 <div 
                                   onClick={() => onViewProfile?.(c.user?._id || c.user?.id)}
                                   className="text-[9px] font-black text-white uppercase tracking-tight truncate cursor-pointer hover:text-vani-blue transition-colors"
                                 >
                                   {isAuthorPrivate ? 'Encrypted_Node' : getIdentityName(c.user)}
                                 </div>
                                 {parentComment && (
                                   <div 
                                     onClick={() => onViewProfile?.(parentComment.user?._id || parentComment.user?.id)}
                                     className="text-[7px] text-gray-600 font-mono flex items-center space-x-1 cursor-pointer hover:text-vani-accent"
                                   >
                                      <Send size={8} className="rotate-180" />
                                      <span>@{parentComment.user?.username}</span>
                                   </div>
                                 )}
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">{renderComment(c.text)}</div>
                              <button 
                                onClick={() => setReplyingTo({ id: c._id, username: c.user?.username || 'Unknown', userId: c.user?._id || c.user?.id })}
                                className="text-[8px] font-black text-vani-blue uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all hover:text-white"
                              >
                                Reply
                              </button>
                           </div>
                        </div>
                       );
                     })}
                     {selectedPost.comments?.length === 0 && (
                       <div className="py-10 text-center flex flex-col items-center opacity-20">
                          <MessageSquare size={24} className="mb-2" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Awaiting neural input...</span>
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
                     <div className="text-xs font-black text-white uppercase tracking-tighter">{likeCount} Links</div>
                  </div>
               </div>

               <div className="space-y-2">
                  {replyingTo && (
                    <div className="flex items-center justify-between px-3 py-1 bg-vani-blue/5 rounded-lg border border-vani-blue/10">
                       <span className="text-[8px] font-mono text-vani-blue uppercase">Replying to @{replyingTo.username}</span>
                       <button onClick={() => setReplyingTo(null)}><X size={10} className="text-gray-500 hover:text-white" /></button>
                    </div>
                  )}
                  <div className="relative">
                     <input 
                       type="text" 
                       placeholder={replyingTo ? "Broadcast reply..." : "Broadcast comment..."}
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
            {/* Original Pulse View as Fallback */}
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
                      {event.type === 'comment' && <MessageSquare size={10} className="text-vani-blue" />}
                      {event.type === 'sync' && <UserPlus size={10} className="text-green-500" />}
                      {event.type === 'broadcast' && <Radio size={10} className="text-yellow-500" />}
                    </div>
                    <span className="text-[10px] font-black text-white uppercase truncate">{event.user}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-tight mb-2 pl-1 border-l border-white/5 ml-2.5">
                    {event.type === 'like' && 'Linked to a transmission'}
                    {event.type === 'comment' && 'Added data to a post'}
                    {event.type === 'sync' && 'Established a new node link'}
                    {event.type === 'broadcast' && 'Started a global broadcast'}
                  </p>
                  <div className="text-[7px] font-mono text-gray-700 uppercase self-end">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <Radio size={24} className="mb-2" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Scanning Pulse...</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-900 bg-black/20">
               <div className="bg-vani-blue/10 border border-vani-blue/20 p-4 rounded-2xl text-center">
                  <div className="text-[9px] font-black text-vani-blue uppercase tracking-[0.2em] mb-1">Select Transmission</div>
                  <div className="text-[8px] text-gray-500 font-mono uppercase">To view metadata & feedback</div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
