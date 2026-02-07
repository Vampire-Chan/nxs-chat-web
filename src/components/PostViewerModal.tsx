import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, MoreHorizontal, Send, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import type { IPost, IUser } from '../services/api';
import { api } from '../services/api';

interface Props {
  post: IPost;
  onClose: () => void;
  currentUser: IUser | null;
  onUpdate: () => void;
}

export const PostViewerModal = ({ post, onClose, currentUser, onUpdate }: Props) => {
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id || currentUser?._id || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);

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
      await api.addComment(post._id, comment);
      setComment('');
      onUpdate();
    } catch (e) { console.error(e); }
  };

  const isOwner = (currentUser?.id || currentUser?._id) === (post.author._id || post.author.id);

  return (
    <div className="fixed inset-0 bg-black/95 z-[800] flex items-center justify-center backdrop-blur-xl p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl h-full max-h-[85vh] bg-[#0a0a0c] rounded-[48px] border border-gray-800 flex overflow-hidden shadow-2xl"
      >
        {/* LEFT: MEDIA AREA */}
        <div className="flex-1 bg-black flex items-center justify-center relative group">
           <img src={post.imageUrl} className="w-full h-full object-contain" alt="broadcast" />
           <div className="absolute top-8 left-8 flex space-x-2">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 flex items-center space-x-2">
                 <div className="w-2 h-2 bg-nexus-blue rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">High_Res_Link</span>
              </div>
           </div>
        </div>

        {/* RIGHT: INTERACTION PANEL */}
        <div className="w-96 border-l border-gray-800 flex flex-col bg-discord-sidebar/20">
           
           {/* Header */}
           <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-700">
                    <img src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`} className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <div className="text-xs font-black text-white uppercase tracking-tight">{post.author.username}</div>
                    <div className="text-[9px] text-gray-500 font-mono uppercase">Node_Author</div>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
           </div>

           {/* Caption / Comments */}
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <div className="space-y-4">
                 {isEditing ? (
                   <div className="space-y-3">
                      <textarea 
                        className="w-full bg-black/40 border border-nexus-blue p-4 rounded-2xl text-sm text-gray-200 outline-none resize-none h-24"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                      />
                      <div className="flex space-x-2">
                         <button onClick={handleEdit} className="bg-nexus-blue text-black font-black text-[10px] px-4 py-2 rounded-lg uppercase tracking-widest">Apply</button>
                         <button onClick={() => setIsEditing(false)} className="text-gray-500 text-[10px] px-4 py-2 uppercase font-black">Cancel</button>
                      </div>
                   </div>
                 ) : (
                   <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      {post.caption}
                   </p>
                 )}
                 <div className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">{new Date(post.createdAt).toLocaleString()}</div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-900">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Neural_Comments</span>
                 <div className="space-y-4">
                    {post.comments?.map((c, i) => (
                      <div key={i} className="flex space-x-3 group">
                         <div className="w-7 h-7 rounded-lg bg-gray-800 flex-shrink-0" />
                         <div className="flex-1">
                            <div className="text-[10px] font-black text-white uppercase tracking-tight">Node_Visitor</div>
                            <div className="text-xs text-gray-400 mt-0.5">{c.text}</div>
                         </div>
                      </div>
                    ))}
                    {post.comments?.length === 0 && <div className="py-10 text-center text-[10px] font-mono text-gray-700 uppercase italic">Zero input detected.</div>}
                 </div>
              </div>
           </div>

           {/* Actions */}
           <div className="p-6 bg-black/20 border-t border-gray-800 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-6">
                    <button onClick={handleLike} className={`transition-all hover:scale-110 ${isLiked ? 'text-nexus-accent' : 'text-gray-500'}`}>
                       <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button className="text-gray-500 hover:text-nexus-blue transition-all"><MessageCircle size={24} /></button>
                    <button className="text-gray-500 hover:text-white transition-all"><Send size={24} /></button>
                 </div>
                 {isOwner && (
                   <div className="flex space-x-2">
                      <button onClick={() => setIsEditing(true)} className="p-2 text-gray-600 hover:text-white transition-colors"><Edit3 size={18} /></button>
                      <button onClick={handleDelete} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                   </div>
                 )}
              </div>
              <div>
                 <div className="text-sm font-black text-white uppercase tracking-tighter">{likeCount} Identities Linked</div>
                 <div className="text-[9px] text-gray-600 font-mono uppercase mt-1">Transmission_Stability: 99.9%</div>
              </div>

              <div className="relative mt-4">
                 <input 
                   type="text" 
                   placeholder="Input neural comment..."
                   className="w-full bg-black/40 border border-gray-800 focus:border-nexus-blue p-4 rounded-2xl text-xs text-gray-300 outline-none transition-all pr-12"
                   value={comment}
                   onChange={(e) => setComment(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                 />
                 <button onClick={handleAddComment} className="absolute right-4 top-1/2 -translate-y-1/2 text-nexus-blue opacity-50 hover:opacity-100 transition-opacity">
                    <ArrowRight size={18} />
                 </button>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

const ArrowRight = ({ size }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
