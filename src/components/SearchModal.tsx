import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User as UserIcon, Globe, Image as ImageIcon, Zap, X, ArrowRight, Filter, SortAsc, Star } from 'lucide-react';
import { api } from '../services/api';
import type { IUser, IRealm, IPost } from '../services/api';

interface Props {
  onClose: () => void;
  onSelectUser: (id: string) => void;
  onSelectRealm: (realm: IRealm) => void;
  currentUser: IUser;
  userStatuses: Record<string, 'online' | 'idle' | 'dnd' | 'offline'>;
}

export const SearchModal = ({ onClose, onSelectUser, onSelectRealm, currentUser, userStatuses }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    users: IUser[];
    realms: IRealm[];
    posts: IPost[];
    tags: { name: string; count: number }[];
    counts: { users: number; realms: number; posts: number; tags: number };
  }>({
    users: [],
    realms: [],
    posts: [],
    tags: [],
    counts: { users: 0, realms: 0, posts: 0, tags: 0 }
  });
  const [cachedCounts, setCachedCounts] = useState({ users: 0, realms: 0, posts: 0, tags: 0 });
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({
          users: [],
          realms: [],
          posts: [],
          tags: [],
          counts: { users: 0, realms: 0, posts: 0, tags: 0 }
        });
        setCachedCounts({ users: 0, realms: 0, posts: 0, tags: 0 });
        return;
      }

      setLoading(true);
      try {
        const filters: any = {};
        if (activeType !== 'all') filters.type = activeType;
        if (sortBy !== 'newest') filters.sortBy = sortBy;
        
        const data = await api.globalSearch(query, filters);
        setResults(data);
        
        if (data.counts) {
          if (activeType === 'all' || (cachedCounts.users === 0 && cachedCounts.realms === 0 && cachedCounts.posts === 0)) {
            setCachedCounts(data.counts);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };

    const delayDebounceFn = setTimeout(fetchResults, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, activeType, sortBy]);

  const handleTagClick = (tagName: string) => {
    setQuery(tagName);
    setActiveType('posts');
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[300] flex items-start justify-center pt-[10vh] backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0a0a0c] border border-white/5 rounded-[30px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-mono"
      >
        {/* Search Bar */}
        <div className="p-6 flex items-center space-x-4 border-b border-white/5 bg-white/[0.01]">
           <Search size={22} className={loading ? 'text-vani-blue animate-pulse' : 'text-gray-600'} />
           <input 
             ref={inputRef}
             className="flex-1 bg-transparent border-none focus:outline-none text-xl font-black text-white placeholder-gray-800 uppercase tracking-tighter"
             placeholder="Synchronize Signature..."
             value={query}
             onChange={(e) => setQuery(e.target.value)}
           />
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all ${showFilters ? 'bg-vani-blue text-black font-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                 <Filter size={16} />
              </button>
              <button onClick={onClose} className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all"><X size={16} /></button>
           </div>
        </div>

        {/* Filter Bar */}
        <AnimatePresence>
           {showFilters && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }} 
               animate={{ height: 'auto', opacity: 1 }} 
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden bg-black/40 border-b border-white/5"
             >
                <div className="p-5 flex flex-wrap gap-6">
                   <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2">Temporal_Pulse</label>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                         {['newest', 'likes', 'comments'].map(s => (
                           <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${sortBy === s ? 'bg-vani-accent text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{s}</button>
                         ))}
                      </div>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Results Area */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-6">
           {!query && (
              <div className="py-20 text-center opacity-25 flex flex-col items-center">
                 <div className="w-20 h-20 bg-vani-gradient rounded-[24px] mb-6 rotate-12 flex items-center justify-center"><Search size={36} className="-rotate-12 text-white" /></div>
                 <div className="text-2xl font-black text-white uppercase tracking-widest mb-2">Awaiting_Input</div>
                 <p className="text-[9px] tracking-widest uppercase text-gray-500">Scan for Identities, Sovereign Nodes, or Transmissions</p>
              </div>
           )}

           {query && (
             <>
               {/* Cartridge Tabs */}
               <div className="flex flex-wrap gap-2 mb-5">
                 {[
                   { id: 'all', label: 'All SIGNATURES', count: cachedCounts.users + cachedCounts.realms + cachedCounts.posts },
                   { id: 'users', label: 'IDENTITIES', count: cachedCounts.users },
                   { id: 'realms', label: 'REALMS', count: cachedCounts.realms },
                   { id: 'posts', label: 'BROADCASTS', count: cachedCounts.posts },
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveType(tab.id)}
                     className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all flex items-center space-x-2 ${
                       activeType === tab.id
                         ? 'bg-black border-vani-blue text-white shadow-[0_0_15px_rgba(0,210,255,0.08)]'
                         : 'bg-black/30 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                     }`}
                   >
                     <span>{tab.label}</span>
                     <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${activeType === tab.id ? 'bg-vani-blue/10 text-vani-blue border border-vani-blue/20' : 'bg-white/5 text-gray-600'}`}>
                       {tab.count}
                     </span>
                   </button>
                 ))}
               </div>

               {/* Tag Cartridges Row */}
               {results.tags && results.tags.length > 0 && (
                 <div className="mb-6 p-4 bg-black/20 border border-white/5 rounded-xl">
                   <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1 flex justify-between">
                     <span>[ MATCHING DIRECTORY TAGS ]</span>
                     <span className="text-vani-blue">{cachedCounts.tags} MATCHES</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {results.tags.map(t => (
                       <button
                         key={t.name}
                         onClick={() => handleTagClick(t.name)}
                         className="px-2 py-1 rounded border border-white/5 bg-black/30 text-[9px] text-gray-400 hover:border-vani-accent hover:text-white transition-all uppercase flex items-center space-x-1.5"
                       >
                         <span className="text-vani-accent">#</span>
                         <span>{t.name}</span>
                         <span className="text-[8px] bg-white/5 px-1 py-0.2 rounded text-gray-600 font-bold">{t.count}</span>
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               {/* Loader */}
               {loading && (
                 <div className="py-16 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-white/5">
                   <div className="relative w-10 h-10 mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-vani-blue/10 border-t-vani-blue binding-ring animate-spin" />
                      <div className="absolute inset-1 rounded-full border-2 border-vani-accent/10 border-b-vani-accent animate-spin [animation-duration:1.2s] [animation-direction:reverse]" />
                   </div>
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-vani-blue animate-pulse">Scanning Neural Network...</span>
                 </div>
               )}

               {/* Empty Results */}
               {!loading && results.users.length === 0 && results.realms.length === 0 && results.posts.length === 0 && (
                 <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl bg-black/20">
                    <div className="text-vani-accent font-black tracking-[0.2em] uppercase text-xs animate-pulse">[ ZERO MATRIX SIGNATURES DETECTED ]</div>
                    <p className="text-gray-600 text-[8px] uppercase mt-2 tracking-widest">Protocol failed to sync with the provided identifier.</p>
                 </div>
               )}

               {/* Result Tables */}
               {!loading && (
                 <div className="space-y-6">
                   {/* Identities Section */}
                   {(activeType === 'all' || activeType === 'users') && results.users.length > 0 && (
                     <div className="space-y-2">
                       <h3 className="px-1 text-[9px] font-black text-vani-blue uppercase tracking-[0.3em] flex items-center gap-2">
                         <div className="w-1 h-1 bg-vani-blue rounded-full animate-pulse" />
                         <span>Linked Identities</span>
                       </h3>
                       <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10 divide-y divide-white/5">
                         {/* Header */}
                         <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 bg-black/40">
                           <div className="col-span-4">[ IDENTITY DESIGNATION ]</div>
                           <div className="col-span-3">[ SUITE ADDRESS ]</div>
                           <div className="col-span-3">[ SECURITY LAYER ]</div>
                           <div className="col-span-2 text-right">[ SYNC STATE ]</div>
                         </div>
                         {/* Rows */}
                         {results.users.map(u => {
                           const isMe = (u._id || u.id) === (currentUser.id || currentUser._id);
                           const isFollowing = currentUser.following?.includes(u._id || u.id);
                           const addr = (u._id || u.id || '').slice(-6).toUpperCase();
                           const userStatus = userStatuses[(u._id || u.id || '').toString()] || 'offline';
                           return (
                             <div 
                               key={u._id}
                               onClick={(e) => (window as any).__vani_show_mini_profile?.(e, u)}
                               className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center p-4 bg-black/20 hover:bg-vani-blue/[0.02] cursor-pointer transition-all text-[11px] uppercase border-l-2 border-l-transparent hover:border-l-vani-blue group"
                             >
                               <div className="col-span-4 flex items-center space-x-3 w-full min-w-0">
                                 <div className="w-7 h-7 rounded-lg bg-gray-800 border border-white/5 overflow-hidden flex-shrink-0 relative">
                                   <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                                   <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-[#0d0d11] rounded-full ${
                                     userStatus === 'dnd' ? 'bg-red-500' :
                                     userStatus === 'idle' ? 'bg-yellow-500' :
                                     userStatus === 'offline' ? 'bg-gray-500' : 'bg-green-500'
                                   }`} />
                                 </div>
                                 <div className="truncate">
                                   <div className="font-bold text-white flex items-center gap-1 group-hover:text-vani-blue transition-colors">
                                     <span>{u.username}</span>
                                     {u.tier === 'elite' && <Star size={8} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                                   </div>
                                   <div className="text-[8px] text-gray-500 truncate">{u.displayName || 'NO_ALIAS'}</div>
                                 </div>
                               </div>

                               <div className="col-span-3 text-[10px] text-gray-400">
                                 <span className="text-[8px] text-gray-600 block md:hidden">NODE_ADDRESS:</span>
                                 <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">NODE_0X{addr}</span>
                               </div>

                               <div className="col-span-3 text-[10px]">
                                 <span className="text-[8px] text-gray-600 block md:hidden">SECURITY_LEVEL:</span>
                                 <span className="text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-0.5 rounded font-black text-[8px] font-mono">
                                   [ PUBLIC_NODE ]
                                 </span>
                               </div>

                               <div className="col-span-2 text-right w-full flex md:justify-end items-center gap-2">
                                 <span className="text-[8px] text-gray-600 block md:hidden">SYNC_STATE:</span>
                                 {isMe ? (
                                   <span className="text-vani-blue bg-vani-blue/5 border border-vani-blue/20 text-[8px] px-1.5 py-0.5 rounded font-black">SELF</span>
                                 ) : isFollowing ? (
                                   <span className="text-green-400 bg-green-500/5 border border-green-500/20 text-[8px] px-1.5 py-0.5 rounded font-black">LINKED</span>
                                 ) : (
                                   <span className="text-gray-500 bg-white/5 border border-white/5 text-[8px] px-1.5 py-0.5 rounded font-black">READY</span>
                                 )}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   {/* Realms Section */}
                   {(activeType === 'all' || activeType === 'realms') && results.realms.length > 0 && (
                     <div className="space-y-2">
                       <h3 className="px-1 text-[9px] font-black text-vani-blue uppercase tracking-[0.3em] flex items-center gap-2">
                         <div className="w-1 h-1 bg-vani-blue rounded-full animate-pulse" />
                         <span>Sovereign Realms</span>
                       </h3>
                       <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10 divide-y divide-white/5">
                         {/* Header */}
                         <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 bg-black/40">
                           <div className="col-span-4">[ REALM SOVEREIGNTY ]</div>
                           <div className="col-span-3">[ SYNC HANDLE ]</div>
                           <div className="col-span-3">[ PRIVACY MODE ]</div>
                           <div className="col-span-2 text-right">[ PEER QUANTITY ]</div>
                         </div>
                         {/* Rows */}
                         {results.realms.map(r => {
                           const addr = (r._id || '').slice(-6).toUpperCase();
                           const memberCount = r.members?.length || 0;
                           return (
                             <div 
                               key={r._id}
                               onClick={() => { onSelectRealm(r); onClose(); }}
                               className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center p-4 bg-black/20 hover:bg-vani-blue/[0.02] cursor-pointer transition-all text-[11px] uppercase border-l-2 border-l-transparent hover:border-l-vani-blue group"
                             >
                               <div className="col-span-4 flex items-center space-x-3 w-full min-w-0">
                                 <div className="w-7 h-7 rounded-lg bg-gray-800 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
                                   {r.icon ? <img src={r.icon} className="w-full h-full object-cover" /> : <Globe size={12} />}
                                 </div>
                                 <div className="truncate">
                                   <div className="font-bold text-white group-hover:text-vani-blue transition-colors truncate">{r.name}</div>
                                   <div className="text-[8px] text-gray-500 truncate">BY @{(r.owner as any)?.username || 'UNKNOWN'}</div>
                                 </div>
                               </div>

                               <div className="col-span-3 text-[10px] text-gray-400">
                                 <span className="text-[8px] text-gray-600 block md:hidden">REALM_ADDRESS:</span>
                                 <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">REALM_0X{addr}</span>
                               </div>

                               <div className="col-span-3 text-[10px]">
                                 <span className="text-[8px] text-gray-600 block md:hidden">PRIVACY_MODE:</span>
                                 <span className="text-vani-blue border border-vani-blue/20 bg-vani-blue/5 px-2 py-0.5 rounded font-black text-[8px] font-mono">
                                   [ SECURE_REALM ]
                                 </span>
                               </div>

                               <div className="col-span-2 text-right w-full flex md:justify-end items-center gap-2">
                                 <span className="text-[8px] text-gray-600 block md:hidden">PEERS:</span>
                                 <span className="text-vani-accent bg-vani-accent/5 border border-vani-accent/20 text-[8px] px-1.5 py-0.5 rounded font-black font-mono">
                                   {memberCount} {memberCount === 1 ? 'NODE' : 'NODES'}
                                 </span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   {/* Broadcasts Section */}
                   {(activeType === 'all' || activeType === 'posts') && results.posts.length > 0 && (
                     <div className="space-y-2">
                       <h3 className="px-1 text-[9px] font-black text-vani-blue uppercase tracking-[0.3em] flex items-center gap-2">
                         <div className="w-1 h-1 bg-vani-blue rounded-full animate-pulse" />
                         <span>Matrix Transmissions</span>
                       </h3>
                       <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10 divide-y divide-white/5">
                         {/* Header */}
                         <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 bg-black/40">
                           <div className="col-span-4">[ BROADCAST FREQUENCY ]</div>
                           <div className="col-span-3">[ TRANSMITTER ]</div>
                           <div className="col-span-3">[ DECRYPTION LEVEL ]</div>
                           <div className="col-span-2 text-right">[ LINK METRICS ]</div>
                         </div>
                         {/* Rows */}
                         {results.posts.map(p => {
                           const addr = (p._id || '').slice(-6).toUpperCase();
                           const likesCount = p.likes?.length || 0;
                           return (
                             <div 
                               key={p._id}
                               onClick={() => onClose()}
                               className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center p-4 bg-black/20 hover:bg-vani-blue/[0.02] cursor-pointer transition-all text-[11px] uppercase border-l-2 border-l-transparent hover:border-l-vani-blue group"
                             >
                               <div className="col-span-4 flex items-center space-x-3 w-full min-w-0">
                                 <div className="w-7 h-7 rounded-lg bg-gray-800 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
                                   {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={12} />}
                                 </div>
                                 <div className="truncate">
                                   <div className="font-bold text-white group-hover:text-vani-blue transition-colors truncate">{p.caption || 'ENCRYPTED BROADCAST'}</div>
                                   <div className="text-[8px] text-gray-500 truncate">BY @{p.author.username}</div>
                                 </div>
                               </div>

                               <div className="col-span-3 text-[10px] text-gray-400">
                                 <span className="text-[8px] text-gray-600 block md:hidden">SIGNAL_ADDRESS:</span>
                                 <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">SIGNAL_0X{addr}</span>
                               </div>

                               <div className="col-span-3 text-[10px]">
                                 <span className="text-[8px] text-gray-600 block md:hidden">DECRYPTION:</span>
                                 <span className="text-vani-accent border border-vani-accent/20 bg-vani-accent/5 px-2 py-0.5 rounded font-black text-[8px] font-mono">
                                   [ BROADCAST ]
                                 </span>
                               </div>

                               <div className="col-span-2 text-right w-full flex md:justify-end items-center gap-2">
                                 <span className="text-[8px] text-gray-600 block md:hidden">LINKS:</span>
                                 <span className="text-white bg-white/5 border border-white/10 text-[8px] px-1.5 py-0.5 rounded font-black font-mono">
                                   {likesCount} {likesCount === 1 ? 'LINK' : 'LINKS'}
                                 </span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </>
           )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-discord-sidebar/50 border-t border-white/5 flex justify-between items-center px-8">
           <div className="flex items-center space-x-6 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
              <span className="flex items-center space-x-2"><Zap size={12} className="text-vani-blue" /> <span>Real-time_Sync</span></span>
              <span className="flex items-center space-x-2"><SortAsc size={12} className="text-vani-accent" /> <span>Neural_Filtering</span></span>
           </div>
           <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest drop-shadow-md">Yantravani Core // Matrix_v1.42</div>
        </div>
      </motion.div>
    </div>
  );
};
