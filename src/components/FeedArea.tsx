import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import type { IPost, IUser } from '../services/api';
import { Image as ImageIcon, Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import { PostViewerModal } from './PostViewerModal';

interface Props {
  posts: IPost[];
  onOpenCreateModal: () => void;
  currentUser: IUser;
}

export const FeedArea = ({ posts: initialPosts, onOpenCreateModal, currentUser }: Props) => {
  const [posts, setPosts] = useState(initialPosts);
  const [showHeart, setShowHeart] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  if (initialPosts.length !== posts.length) setPosts(initialPosts);

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post && (post.author._id === currentUser.id || post.author.id === currentUser.id)) return;
    try {
      const { likes } = await api.likePost(postId);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes } : p));
    } catch (err) { console.error(err); }
  };

  const handleDoubleTap = (postId: string) => {
    handleLike(postId);
    setShowHeart(postId);
    setTimeout(() => setShowHeart(null), 1000);
  };

  const refreshFeed = () => {
    // This is a placeholder, ideally fetch from parent but we'll let parent trigger refresh via props
  };

  return (
    <div className="flex-1 flex flex-col bg-discord-dark min-w-0 h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-xl mx-auto w-full mb-10">
         <div onClick={onOpenCreateModal} className="bg-discord-channel p-4 rounded-2xl cursor-pointer hover:bg-discord-sidebar transition-all flex items-center space-x-4 text-gray-400 border border-gray-800 shadow-xl group">
            <div className="w-10 h-10 rounded-xl bg-nexus-gradient flex items-center justify-center text-white shadow-lg shadow-red-500/20"><ImageIcon size={20} /></div>
            <div className="flex-1 bg-discord-dark h-11 rounded-xl flex items-center px-4 border border-gray-800 text-sm font-medium group-hover:border-gray-700 transition-all">Broadcast to the Matrix...</div>
            <div className="p-2 text-nexus-blue group-hover:scale-110 transition-transform"><span className="text-xs font-black uppercase tracking-widest text-nexus-blue">Share</span></div>
         </div>
      </div>

      <div className="max-w-xl mx-auto w-full space-y-12 pb-20">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} currentUser={currentUser} onLike={() => handleLike(post._id)} onDoubleTap={() => handleDoubleTap(post._id)} isHearting={showHeart === post._id} onOpen={() => setSelectedPost(post)} />
        ))}
        {posts.length === 0 && <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl"><div className="text-nexus-blue font-black text-xl mb-2 opacity-20 uppercase">No Data Found</div></div>}
      </div>

      {selectedPost && <PostViewerModal post={selectedPost} onClose={() => setSelectedPost(null)} currentUser={currentUser} onUpdate={refreshFeed} />}
    </div>
  );
};

const PostCard = ({ post, currentUser, onLike, onDoubleTap, isHearting, onOpen }: any) => {
  const isLiked = post.likes?.includes(currentUser.id || currentUser._id);
  const isMe = post.author._id === (currentUser.id || currentUser._id) || post.author.id === (currentUser.id || currentUser._id);

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`bg-discord-channel rounded-3xl overflow-hidden shadow-2xl border ${isMe ? 'border-nexus-blue/30' : 'border-gray-800'} group`}>
      <div className="p-4 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-800 overflow-hidden border border-gray-700"><img src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`} alt="a" className="w-full h-full object-cover" /></div>
          <div><div className="font-black tracking-tight text-sm uppercase text-white">{post.author.username}</div><div className="text-gray-500 text-[10px] font-mono tracking-tighter uppercase">{new Date(post.createdAt).toLocaleDateString()}</div></div>
        </div>
        <MoreHorizontal className="text-gray-600 hover:text-white cursor-pointer" size={20} />
      </div>
      <div className="bg-[#050507] relative overflow-hidden flex items-center justify-center cursor-pointer min-h-[400px]" onDoubleClick={!isMe ? onDoubleTap : undefined} onClick={onOpen}>
         <img src={post.imageUrl} alt="Post" className="max-h-[700px] w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" />
         <AnimatePresence>{isHearting && <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute z-20 pointer-events-none"><Heart size={100} className="text-white fill-nexus-accent drop-shadow-[0_0_20px_rgba(255,60,60,0.8)]" /></motion.div>}</AnimatePresence>
      </div>
      <div className="p-5">
        <div className="flex items-center space-x-5 mb-4">
           <button onClick={onLike}><Heart className={`${isLiked ? 'text-nexus-accent fill-nexus-accent' : 'text-gray-400'} transition-colors`} size={26} /></button>
           <button onClick={onOpen}><MessageCircle className="text-gray-400 hover:text-nexus-blue" size={26} /></button>
           <Send className="text-gray-400 hover:text-white" size={24} />
        </div>
        <div className="text-sm font-black text-white mb-2 uppercase tracking-tighter">{post.likes?.length || 0} Identities Linked</div>
        <p className="text-sm leading-relaxed text-gray-200"><span className="font-black mr-2 text-white uppercase">{post.author.username}</span>{post.caption}</p>
      </div>
    </motion.div>
  );
};
