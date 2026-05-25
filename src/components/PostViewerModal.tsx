import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Send, Trash2, Edit3, Share2, AlertTriangle } from 'lucide-react';
import type { IPost, IUser } from '../services/api';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MarkdownRenderer } from './MarkdownRenderer';


interface Props {
  post: IPost;
  onClose: () => void;
  currentUser: IUser | null;
  onUpdate: () => void;
  onSelectTag?: (tag: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const PostViewerModal = ({ post, onClose, currentUser, onUpdate, onSelectTag, onViewProfile }: Props) => {
  const { addToast } = useToast();
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [editCaption, setEditCaption] = useState(post.caption);
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id || currentUser?._id || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [replyingTo, setReplyingTo] = useState<{ id: string, username: string, userId?: string } | null>(null);
  const [showCommentsMobile, setShowCommentsMobile] = useState(false);

  useEffect(() => {
    if (post._id && currentUser) {
      api.markNotificationsReadByPost(post._id).catch(() => {});
    }
  }, [post._id, currentUser]);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await api.submitReport({
        targetType: 'post',
        targetId: post._id,
        reason: reportReason
      });
      setShowReportModal(false);
      addToast("Anomaly Logged with the Architect.", 'success');
    } catch (e) { addToast("Transmission failed.", 'error'); }
  };

  const renderCaption = (text: string) => {
    if (!text) return null;
    return (
      <MarkdownRenderer
        content={text}
        onSelectTag={onSelectTag}
        onViewProfile={onViewProfile}
      />
    );
  };

  const renderComment = (text: string) => {
    if (!text) return null;
    return (
      <MarkdownRenderer
        content={text}
        onSelectTag={onSelectTag}
        onViewProfile={onViewProfile}
      />
    );
  };

  const handleLike = async () => {
    try {
      const res = await api.likePost(post._id);
      setIsLiked(res.likes.includes(currentUser?.id || currentUser?._id || ''));
      setLikeCount(res.likes.length);
      onUpdate();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: Sever this broadcast from the global matrix?")) return;
    try {
      await api.deletePost(post._id);
      onClose();
      onUpdate();
    } catch (e) { alert("Severance failed."); }
  };

  const handleEdit = async () => {
    try {
      await api.editPost(post._id, editCaption);
      setIsEditing(false);
      onUpdate();
    } catch (e) { alert("Modification failed."); }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.addComment(post._id, comment, replyingTo?.id);
      setComment('');
      setReplyingTo(null);
      onUpdate();
    } catch (e) { console.error(e); }
  };

  const isOwner = (currentUser?.id || currentUser?._id) === (post.author._id || post.author.id);

  return (
    <div className="fixed inset-0 bg-black z-[2000] flex items-center justify-center lg:p-10 lg:bg-black/95 lg:backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full lg:max-w-6xl lg:h-auto lg:max-h-[85vh] bg-[#0a0a0c] lg:rounded-[48px] lg:border border-gray-800 flex flex-col lg:flex-row overflow-hidden shadow-2xl relative"
      >
        {/* SHORTS STYLE OVERLAY - ONLY MOBILE */}
        <div className="lg:hidden absolute inset-0 z-10 pointer-events-none">
           {/* Top Controls */}
           <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center pointer-events-auto">
              <button onClick={onClose} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white/80"><X size={24} /></button>
              <div className="flex items-center space-x-2">
                 {isOwner && (
                   <div className="flex space-x-2">
                      <button onClick={() => setIsEditing(true)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white/80"><Edit3 size={20} /></button>
                      <button onClick={handleDelete} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-red-400/80"><Trash2 size={20} /></button>
                   </div>
                 )}
                 <button onClick={() => setShowReportModal(true)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-red-500/80"><AlertTriangle size={24} /></button>
              </div>
           </div>

           {/* Bottom Content Info */}
           <div className="absolute bottom-0 inset-x-0 p-6 pt-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-auto">
              <div className="flex items-center space-x-3 mb-4">
                 <div onClick={() => onViewProfile?.(post.author._id || post.author.id)} className="w-10 h-10 rounded-full border-2 border-vani-blue overflow-hidden shadow-lg shadow-blue-500/20 cursor-pointer">
                    <img src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`} className="w-full h-full object-cover" />
                 </div>
                 <span className="font-black text-white uppercase tracking-tighter text-sm">@{post.author.username}</span>
                 <button className="px-4 py-1 bg-vani-blue text-black font-black text-[10px] uppercase rounded-full tracking-widest ml-2">Sync</button>
              </div>
              <div className="space-y-2 max-w-[85%]">
                 <p className="text-sm text-gray-200 leading-relaxed font-medium line-clamp-3">
                    {renderCaption(post.caption)}
                 </p>
                 <div className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Transmission_Buffer // {new Date(post.createdAt).toLocaleDateString()}</div>
              </div>
           </div>

           {/* Right Floating Actions */}
           <div className="absolute right-4 bottom-32 flex flex-col items-center space-y-6 pointer-events-auto">
              <div className="flex flex-col items-center group">
                 <button onClick={handleLike} className={`p-3 rounded-full transition-all backdrop-blur-md ${isLiked ? 'bg-vani-accent text-white scale-110' : 'bg-white/10 text-white'}`}>
                    <Heart size={28} fill={isLiked ? 'currentColor' : 'none'} />
                 </button>
                 <span className="text-[10px] font-black text-white mt-1 drop-shadow-md">{likeCount}</span>
              </div>
              
              <div className="flex flex-col items-center group">
                 <button onClick={() => setShowCommentsMobile(true)} className="p-3 rounded-full bg-white/10 text-white transition-all backdrop-blur-md">
                    <MessageCircle size={28} />
                 </button>
                 <span className="text-[10px] font-black text-white mt-1 drop-shadow-md">{post.comments?.length || 0}</span>
              </div>

              <button className="p-3 rounded-full bg-white/10 text-white transition-all backdrop-blur-md">
                 <Share2 size={28} />
              </button>
           </div>
        </div>

        {/* LEFT: MEDIA AREA (Background on mobile, Panel on PC) */}
        <div className="flex-1 bg-black flex items-center justify-center relative group min-h-full lg:min-h-0">
           <img src={post.imageUrl} className="w-full h-full object-contain lg:object-contain" alt="broadcast" />
           <div className="hidden lg:flex absolute top-8 left-8 space-x-2">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 flex items-center space-x-2">
                 <div className="w-2 h-2 bg-vani-blue rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">High_Res_Link</span>
              </div>
           </div>
        </div>

        {/* RIGHT: INTERACTION PANEL (Desktop Sidebar / Mobile Overlay Bottom Sheet) */}
        <AnimatePresence>
          {(showCommentsMobile || window.innerWidth >= 1024) && (
            <motion.div 
              initial={window.innerWidth < 1024 ? { y: '100%' } : { x: '100%' }}
              animate={window.innerWidth < 1024 ? { y: 0 } : { x: 0 }}
              exit={window.innerWidth < 1024 ? { y: '100%' } : { x: '100%' }}
              className={`w-full lg:w-96 border-l border-gray-800 flex flex-col bg-[#0a0a0c] fixed lg:relative inset-x-0 bottom-0 h-[70vh] lg:h-auto z-[3000] lg:z-0 lg:flex rounded-t-[40px] lg:rounded-none`}
            >
               {/* Mobile Pull Indicator */}
               <div className="lg:hidden w-12 h-1.5 bg-gray-800 rounded-full mx-auto mt-4 mb-2" onClick={() => setShowCommentsMobile(false)} />
               
               {/* Header */}
               <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className="hidden lg:block w-10 h-10 rounded-xl overflow-hidden border border-gray-700">
                        <img src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`} className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <div className="text-xs font-black text-white uppercase tracking-tight lg:block hidden">Node_Author</div>
                        <div className="text-sm font-black text-white uppercase tracking-tight lg:hidden block">Neural Feedback</div>
                        <div className="text-[9px] text-gray-500 font-mono uppercase lg:block hidden">@{post.author.username}</div>
                     </div>
                  </div>
                  <button onClick={() => window.innerWidth < 1024 ? setShowCommentsMobile(false) : onClose()} className="p-2 text-gray-500 hover:text-white"><X size={20} /></button>
               </div>

               {/* Caption / Comments */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                  <div className="space-y-4 lg:block hidden">
                     {isEditing ? (
                       <div className="space-y-3">
                          <textarea className="w-full bg-black/40 border border-vani-blue p-4 rounded-2xl text-sm text-gray-200 outline-none resize-none h-24" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
                          <div className="flex space-x-2"><button onClick={handleEdit} className="bg-vani-blue text-black font-black text-[10px] px-4 py-2 rounded-lg uppercase tracking-widest">Apply</button><button onClick={() => setIsEditing(false)} className="text-gray-500 text-[10px] px-4 py-2 uppercase font-black">Cancel</button></div>
                       </div>
                     ) : (
                       <p className="text-sm text-gray-300 leading-relaxed font-medium">{renderCaption(post.caption)}</p>
                     )}
                     <div className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">{new Date(post.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="space-y-6 pt-6 lg:border-t border-gray-900">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Neural_Comments</span>
                     <div className="space-y-5">
                        {post.comments?.map((c, i) => {
                          const isAuthorPrivate = c.user?.isPrivate;
                          const parentComment = c.parentCommentId ? post.comments.find(pc => pc._id === c.parentCommentId) : null;
                          return (
                            <div key={i} className={`flex space-x-3 group ${c.parentCommentId ? 'ml-6' : ''}`}>
                               <div className="relative">
                                  <div onClick={() => !isAuthorPrivate && onViewProfile?.(c.user?._id || c.user?.id)} className={`w-8 h-8 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden border border-white/5 cursor-pointer ${isAuthorPrivate ? 'filter blur-[4px] grayscale' : ''}`}>
                                     <img src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.username}`} className="w-full h-full object-cover" />
                                  </div>
                                  {isAuthorPrivate && <div className="absolute -top-1 -right-1 bg-black text-[6px] font-black text-vani-accent px-1 rounded border border-vani-accent/30 tracking-tighter">GHOST</div>}
                               </div>
                               <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                     <div onClick={() => onViewProfile?.(c.user?._id || c.user?.id)} className="text-[10px] font-black text-white uppercase tracking-tight cursor-pointer hover:text-vani-blue transition-colors">
                                       {isAuthorPrivate ? 'Encrypted_Node' : (c.user?.username || 'Identity_Lost')}
                                     </div>
                                     {parentComment && (
                                       <div onClick={() => onViewProfile?.(parentComment.user?._id || parentComment.user?.id)} className="text-[7px] text-gray-600 font-mono flex items-center space-x-1 cursor-pointer hover:text-vani-accent">
                                          <Send size={8} className="rotate-180" /><span>@{parentComment.user?.username}</span>
                                       </div>
                                     )}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">{renderComment(c.text)}</div>
                                  <button onClick={() => setReplyingTo({ id: c._id, username: c.user?.username || 'Unknown', userId: c.user?._id || c.user?.id })} className="text-[8px] font-black text-vani-blue uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all hover:text-white">Reply</button>
                               </div>
                            </div>
                          );
                        })}
                        {post.comments?.length === 0 && <div className="py-10 text-center text-[10px] font-mono text-gray-700 uppercase italic">Zero input detected.</div>}
                     </div>
                  </div>
               </div>

               {/* Actions Sidebar - Desktop only here */}
               <div className="p-6 bg-black/20 border-t border-gray-800 space-y-4">
                  <div className="lg:flex hidden items-center justify-between">
                     <div className="flex items-center space-x-6">
                        <button onClick={handleLike} className={`transition-all hover:scale-110 ${isLiked ? 'text-vani-accent' : 'text-gray-500'}`}><Heart size={24} fill={isLiked ? 'currentColor' : 'none'} /></button>
                        <button className="text-gray-500 hover:text-vani-blue transition-all"><MessageCircle size={24} /></button>
                        <button onClick={() => setShowReportModal(true)} className="text-gray-500 hover:text-red-500 transition-all"><AlertTriangle size={24} /></button>
                     </div>
                     {isOwner && <div className="flex space-x-2"><button onClick={() => setIsEditing(true)} className="p-2 text-gray-600 hover:text-white transition-colors"><Edit3 size={18} /></button><button onClick={handleDelete} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></div>}
                  </div>
                  <div className="lg:block hidden">
                     <div className="text-sm font-black text-white uppercase tracking-tighter">{likeCount} Identities Linked</div>
                     <div className="text-[9px] text-gray-600 font-mono uppercase mt-1">Transmission_Stability: 99.9%</div>
                  </div>

                  <div className="space-y-2">
                     {replyingTo && (
                       <div className="flex items-center justify-between px-3 py-1 bg-vani-blue/5 rounded-lg border border-vani-blue/10">
                          <span className="text-[8px] font-mono text-vani-blue uppercase">Replying to @{replyingTo.username}</span>
                          <button onClick={() => setReplyingTo(null)}><X size={10} className="text-gray-500 hover:text-white" /></button>
                       </div>
                     )}
                     <div className="relative">
                        <input type="text" placeholder={replyingTo ? "Input neural reply..." : "Input neural comment..."} className="w-full bg-black/40 border border-gray-800 focus:border-vani-blue p-4 rounded-2xl text-xs text-gray-300 outline-none transition-all pr-12" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                        <button onClick={handleAddComment} className="absolute right-4 top-1/2 -translate-y-1/2 text-vani-blue opacity-50 hover:opacity-100 transition-opacity"><ArrowRightIcon size={18} /></button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
           {showReportModal && (
             <div className="fixed inset-0 bg-black/90 z-[5000] flex items-center justify-center p-4 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0a0a0c] w-full max-w-md rounded-[40px] border border-red-500/20 p-8 shadow-2xl">
                   <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><AlertTriangle size={20} /></div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter">Report_Anomaly</h2>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-2">Anomalous Activity Reason</label>
                         <textarea className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-red-500/50 resize-none h-32" placeholder="Describe the anomaly..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
                      </div>
                      <div className="flex gap-3">
                         <button onClick={handleReport} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20">Log Anomaly</button>
                         <button onClick={() => setShowReportModal(false)} className="px-6 py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px]">Abort</button>
                      </div>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const ArrowRightIcon = ({ size }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
