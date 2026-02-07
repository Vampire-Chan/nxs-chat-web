import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { IPost, IUser } from '../services/api';
import { Grid, Layers, User as UserIcon, Heart, MessageCircle, Lock } from 'lucide-react';
import { PostViewerModal } from './PostViewerModal';

interface Props {
  user: IUser;
  isOwnProfile: boolean;
  onEdit?: () => void;
  onFollow?: () => void;
  currentUser?: IUser | null;
}

export const ProfileNode = ({ user, isOwnProfile, onEdit, onFollow, currentUser }: Props) => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const currentUserId = currentUser?.id || currentUser?._id;
  const isFollowing = user.followers?.some((f: any) => (f._id || f) === currentUserId);

  const fetchPosts = async () => {
    try {
      const data = await api.getUserPosts(user.id || user._id);
      setPosts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user.isLocked) { setLoading(false); return; }
    fetchPosts();
  }, [user]);

  return (
    <div className="flex-1 bg-discord-dark overflow-y-auto custom-scrollbar relative">
      <div className="relative">
         <div className="h-64 bg-gray-900 overflow-hidden border-b border-gray-800 z-0">
            {user.banner ? <img src={user.banner} className="w-full h-full object-cover opacity-60" /> : <div className="w-full h-full bg-nexus-gradient opacity-10" />}
            <div className="absolute inset-0 bg-gradient-to-t from-discord-dark to-transparent" />
         </div>
         <div className="max-w-5xl mx-auto px-10 -mt-24 relative z-10 pb-16">
            <div className="flex flex-col md:flex-row items-end md:items-end space-y-6 md:space-y-0 md:space-x-10">
               <div className="relative group z-20">
                  <div className="w-44 h-44 rounded-[48px] bg-nexus-gradient p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-red-500/20">
                     <div className="w-full h-full rounded-[44px] bg-discord-dark overflow-hidden border-8 border-discord-dark">
                        <img src={user.avatar || defaultAvatar} className="w-full h-full object-cover" alt="pfp" />
                     </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-nexus-blue w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-discord-dark shadow-xl z-30"><UserIcon size={18} className="text-white" /></div>
               </div>
               <div className="flex-1 pb-4 z-10">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-6">
                     <h2 className="text-4xl font-black text-white uppercase tracking-tight drop-shadow-2xl">{user.username}</h2>
                     <div className="flex space-x-3 mt-4 md:mt-0">
                        {isOwnProfile ? (
                          <button onClick={onEdit} className="bg-white/5 hover:bg-white/10 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all backdrop-blur-md">Modify Node</button>
                        ) : (
                          <button onClick={onFollow} className={`px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${isFollowing ? 'bg-white/5 text-white border border-white/10' : 'bg-nexus-gradient text-white shadow-red-500/20'}`}>{isFollowing ? 'Break Sync' : 'Establish Sync'}</button>
                        )}
                     </div>
                  </div>
                  <div className="flex space-x-12 mb-6">
                     <Stat label="Broadcasts" value={posts.length} />
                     <Stat label="Followers" value={user.followers?.length || 0} />
                     <Stat label="Following" value={user.following?.length || 0} />
                  </div>
               </div>
            </div>
            <div className="mt-10 max-w-2xl bg-white/[0.02] p-6 rounded-3xl border border-white/5 backdrop-blur-sm z-10 relative">
               <p className="text-gray-300 text-sm leading-relaxed font-medium">{user.bio ? <span className="italic">"{user.bio}"</span> : <span className="text-gray-600 font-mono text-[10px] uppercase tracking-widest">Awaiting bio transmission...</span>}</p>
            </div>
         </div>
      </div>

      {user.isLocked && !isOwnProfile ? (
        <div className="max-w-5xl mx-auto px-10 py-32 flex flex-col items-center border-t border-gray-900">
           <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-6 border border-white/5"><Lock size={40} className="text-gray-600" /></div>
           <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Private Identity Locked</h3>
           <p className="text-gray-500 text-xs font-mono uppercase tracking-widest text-center max-w-xs leading-relaxed">Establishing a mutual sync link is required to access this node's visual matrix.</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-10">
           <div className="flex justify-center space-x-16 mb-12 text-[10px] font-black uppercase tracking-[0.4em] border-t border-gray-900 pt-8">
              <button className="flex items-center space-x-3 text-white border-b-2 border-nexus-blue pb-4 transition-all"><Grid size={16} /> <span>Visual_Matrix</span></button>
              <button className="flex items-center space-x-3 text-gray-600 hover:text-gray-400 transition-all pb-4"><Layers size={16} /> <span>Stored_Nodes</span></button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 pb-20">
              {posts.map((post) => (
                <motion.div key={post._id} onClick={() => setSelectedPost(post)} whileHover={{ y: -5, scale: 1.02 }} className="aspect-square bg-discord-channel rounded-3xl overflow-hidden border border-gray-800 relative group cursor-pointer shadow-xl transition-all">
                   <img src={post.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                   <div className="absolute inset-0 bg-nexus-gradient/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center space-x-8 backdrop-blur-[3px]">
                      <div className="flex flex-col items-center text-white space-y-1"><Heart size={24} className="fill-white" /><span className="font-black text-xs uppercase tracking-tighter">{post.likes?.length || 0}</span></div>
                      <div className="flex flex-col items-center text-white space-y-1"><MessageCircle size={24} className="fill-white" /><span className="font-black text-xs uppercase tracking-tighter">{post.comments?.length || 0}</span></div>
                   </div>
                </motion.div>
              ))}
           </div>
           {posts.length === 0 && !loading && <div className="text-center py-32 opacity-20 border-2 border-dashed border-gray-800 rounded-[64px] mb-20"><div className="text-5xl font-black text-gray-700 uppercase tracking-[0.2em] mb-6">ZERO_DATA</div><p className="text-xs font-mono tracking-widest uppercase">Node transmission history is empty.</p></div>}
        </div>
      )}

      {selectedPost && <PostViewerModal post={selectedPost} onClose={() => setSelectedPost(null)} currentUser={currentUser} onUpdate={fetchPosts} />}
    </div>
  );
};

const Stat = ({ label, value }: { label: string, value: number }) => (
  <div className="text-left">
     <div className="text-2xl font-black text-white tracking-tighter leading-none">{value}</div>
     <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${value > 0 ? 'text-nexus-blue' : 'text-gray-600'}`}>{label}</div>
  </div>
);
