import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import type { IPost, IUser } from '../services/api';
import { Heart, MessageCircle, Send, Music, Zap } from 'lucide-react';

interface Props {
  posts: IPost[];
  onOpenCreateModal: () => void;
  currentUser: IUser;
}

export const ReelsArea = ({ posts, onOpenCreateModal, currentUser }: Props) => {
  return (
    <div className="flex-1 bg-black flex flex-col items-center overflow-y-scroll snap-y snap-mandatory custom-scrollbar h-full">
      {/* Create Trigger - Floating at top */}
      <div 
        onClick={onOpenCreateModal}
        className="fixed top-20 z-40 bg-vani-gradient px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-red-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
      >
         Initiate Broadcast
      </div>

      {posts.map((post) => (
        <ReelItem key={post._id} post={post} currentUser={currentUser} />
      ))}

      {posts.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center opacity-20">
           <Zap size={64} className="text-vani-blue mb-4 animate-pulse" />
           <p className="font-black tracking-[0.3em] uppercase text-xs text-white">No active streams found</p>
        </div>
      )}
    </div>
  );
};

const ReelItem = ({ post, currentUser }: { post: IPost, currentUser: IUser }) => {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser.id || currentUser._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLike = async () => {
    try {
      const res = await api.likePost(post._id); 
      setIsLiked(res.likes.includes(currentUser.id || currentUser._id));
      setLikesCount(res.likes.length);
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.addComment(post._id, commentText.trim());
      setComments(prev => [...prev, res]);
      setCommentText('');
    } catch (e) { console.error(e); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleSync = async () => {
    try {
      await api.syncIdentity(post.author._id || (post.author as any).id);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="h-full w-full max-w-[450px] flex-shrink-0 snap-start relative bg-[#050507] border-x border-gray-900 overflow-hidden">
      
      {/* Media Layer */}
      {post.imageUrl.endsWith('.mp4') || post.imageUrl.includes('/video/') ? (
        <video 
          ref={videoRef}
          src={post.imageUrl} 
          className="h-full w-full object-cover" 
          loop 
          muted 
          playsInline
        />
      ) : (
        <img src={post.imageUrl} className="h-full w-full object-cover opacity-80" alt="content" />
      )}

      {/* Overlay Layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center space-y-6 z-20">
         <div className="flex flex-col items-center">
            <div 
              onClick={handleLike}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isLiked ? 'bg-vani-accent shadow-lg shadow-red-500/40' : 'bg-white/10 hover:bg-white/20'}`}
            >
               <Heart size={24} className={isLiked ? 'fill-white text-white' : 'text-white'} />
            </div>
            <span className="text-[10px] font-black text-white mt-2 drop-shadow-md">{likesCount}</span>
         </div>

         <div className="flex flex-col items-center">
            <div 
              onClick={() => setShowComments(!showComments)}
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-all">
               <MessageCircle size={24} className="text-white" />
            </div>
            <span className="text-[10px] font-black text-white mt-2 drop-shadow-md">{comments.length}</span>
         </div>

         <div 
           onClick={handleShare}
           className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-all">
            <Send size={24} className="text-white" />
         </div>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
         <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-800 border-2 border-vani-blue overflow-hidden shadow-lg">
               <img src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`} className="w-full h-full object-cover" />
            </div>
            <div>
               <h4 className="font-black text-white uppercase tracking-tight text-sm flex items-center">
                  {post.author.username}
                  <Zap size={12} className="text-vani-blue ml-2 fill-vani-blue" />
               </h4>
               <p className="text-[9px] text-vani-blue font-mono uppercase tracking-widest opacity-70">Stream_Active</p>
            </div>
            <button onClick={handleSync} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-lg border border-white/10 transition-all ml-2 uppercase tracking-widest">Sync</button>
         </div>

         <p className="text-sm text-gray-200 line-clamp-2 font-medium mb-4 pr-12">{post.caption}</p>

         <div className="flex items-center space-x-3 text-gray-400">
            <Music size={12} />
            <div className="overflow-hidden flex-1">
               <div className="whitespace-nowrap animate-scroll text-[10px] font-bold uppercase tracking-widest">
                  Original Audio - {post.author.username} - Initializing Matrix Sync...
               </div>
            </div>
         </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl z-30 max-h-[50%] flex flex-col border-t border-white/10 rounded-t-2xl">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Feedback ({comments.length})</span>
            <button onClick={() => setShowComments(false)} className="text-white/50 hover:text-white text-xs">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {comments.map((c: any, i: number) => (
              <div key={i} className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  <img src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.username || 'anon'}`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-vani-blue">{c.user?.username || 'Unknown'}</span>
                  <p className="text-xs text-gray-300">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center p-3 border-t border-white/5 gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Add feedback..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-vani-blue"
            />
            <button onClick={handleComment} className="text-vani-blue font-black text-[10px] uppercase">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};
