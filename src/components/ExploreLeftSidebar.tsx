import { Hash, TrendingUp, Users, ArrowUpRight, Radio } from 'lucide-react';
import type { IPost, IUser } from '../services/api';

interface Props {
  trendingTags: string[];
  popularPosts: IPost[];
  suggestedUsers: IUser[];
  onSelectTag: (tag: string) => void;
  onSelectUser: (userId: string) => void;
  liveStreamers?: IUser[];
  onSelectStream?: (user: IUser) => void;
}

export const ExploreLeftSidebar = ({ trendingTags, popularPosts, suggestedUsers, onSelectTag, onSelectUser, liveStreamers = [], onSelectStream }: Props) => {
  return (
    <div className="hidden lg:flex flex-col bg-discord-channel h-full border-r border-gray-900 w-72">
      {/* Header - Consistent with DMSidebar */}
      <div className="h-16 px-4 border-b border-gray-900 flex items-center justify-between shadow-sm">
         <div className="flex flex-col">
            <span className="font-black text-white uppercase tracking-widest text-[10px]">Vani Matrix</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Global_Discovery_Active</span>
         </div>
         <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-vani-blue">
            <TrendingUp size={16} />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6 pt-4">
        {/* LIVE TRANSMISSIONS */}
        <div className="space-y-1">
           <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Live_Transmissions</span>
              <div className="flex items-center space-x-1.5 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
                 <div className="w-1 h-1 bg-red-500 rounded-full" />
                 <span className="text-[7px] font-black text-red-500 uppercase">Live</span>
              </div>
           </div>
           <div className="space-y-0.5">
              {liveStreamers.map(streamer => (
                <div 
                  key={streamer._id}
                  onClick={() => onSelectStream?.(streamer)}
                  className="group flex items-center px-2 py-2.5 rounded-xl mx-2 cursor-pointer transition-all bg-vani-blue/5 border border-vani-blue/10 hover:bg-vani-blue/10 hover:border-vani-blue/30"
                >
                  <div className="relative mr-3 flex-shrink-0">
                     <div className="w-10 h-10 rounded-xl overflow-hidden border border-vani-blue/20 p-0.5 ring-2 ring-vani-blue/10">
                        <img src={streamer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.username}`} className="w-full h-full object-cover" />
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-lg border-2 border-discord-channel shadow-lg">
                        <Radio size={8} className="text-white" />
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="font-black text-xs truncate uppercase tracking-tighter text-white">
                        {streamer.username}
                     </div>
                     <div className="text-[8px] text-vani-blue truncate font-mono uppercase tracking-widest">
                        Broadcasting_Now
                     </div>
                  </div>
                </div>
              ))}
              {liveStreamers.length === 0 && (
                <div className="px-4 py-6 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/5 mx-2">
                   <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Zero Active Streams</div>
                </div>
              )}
           </div>
        </div>

        {/* Trending Tags Section */}
        <div className="space-y-1 px-2">
           <div className="flex items-center space-x-1 mb-2">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Trending_Tags</span>
           </div>
           <div className="flex flex-wrap gap-1.5">
              {trendingTags.map((tag) => (
                <div 
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white rounded-lg border border-white/5 cursor-pointer transition-all"
                >
                   <Hash size={10} className="text-vani-blue" />
                   <span className="text-[10px] font-bold uppercase tracking-tighter">{tag}</span>
                </div>
              ))}
           </div>
        </div>

        {/* High Pulse Posts Section (Visual) */}
        <div className="space-y-1">
           <div className="px-2 mb-2">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">High_Pulse_Data</span>
           </div>
           <div className="space-y-0.5">
              {popularPosts.map(post => (
                <div 
                  key={post._id}
                  className="group flex items-center px-2 py-2 rounded-xl mx-2 cursor-pointer transition-all text-gray-400 hover:bg-white/[0.03] hover:text-gray-200"
                >
                  <div className="relative mr-3 flex-shrink-0">
                     <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                        <img src={post.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="font-black text-xs truncate uppercase tracking-tighter group-hover:text-white">
                        {post.caption || 'Untitled_Pulse'}
                     </div>
                     <div className="text-[9px] text-gray-500 truncate font-mono uppercase tracking-widest">
                        {post.likes?.length || 0} Links Detected
                     </div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Suggested Identities Section (List format like DMs) */}
        <div className="space-y-1">
           <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sync_Suggestions</span>
              <Users size={12} className="text-gray-600" />
           </div>
           <div className="space-y-0.5">
              {suggestedUsers.map(user => (
                <div 
                  key={user._id}
                  onClick={() => onSelectUser(user._id || user.id)}
                  className="group flex items-center px-2 py-2 rounded-xl mx-2 cursor-pointer transition-all text-gray-400 hover:bg-white/[0.03] hover:text-gray-200"
                >
                  <div className="relative mr-3 flex-shrink-0">
                     <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 p-[1px]">
                        <div className="w-full h-full rounded-[7px] overflow-hidden bg-discord-dark">
                           <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-full h-full object-cover" />
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="font-black text-[11px] truncate uppercase tracking-tighter group-hover:text-white">
                        {user.displayName || user.username}
                     </div>
                     <div className="text-[8px] text-gray-600 truncate font-mono tracking-tight">
                        @{user.username}
                     </div>
                  </div>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 text-vani-blue transition-all" />
                </div>
              ))}
              {suggestedUsers.length === 0 && (
                <div className="px-4 py-8 text-center">
                   <div className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">No Identities Found</div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
