import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User as UserIcon, Globe, Image as ImageIcon, Zap, X, ArrowRight, Filter, SortAsc } from 'lucide-react';
import { api } from '../services/api';
import type { IUser, IRealm, IPost } from '../services/api';

interface Props {
  onClose: () => void;
  onSelectUser: (id: string) => void;
  onSelectRealm: (realm: IRealm) => void;
  currentUser: IUser;
}

export const SearchModal = ({ onClose, onSelectUser, onSelectRealm, currentUser }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ users: IUser[], realms: IRealm[], posts: IPost[] }>({ users: [], realms: [], posts: [] });
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
        setResults({ users: [], realms: [], posts: [] });
        return;
      }

      setLoading(true);
      try {
        const filters: any = {};
        if (activeType !== 'all') filters.type = activeType;
        if (sortBy !== 'newest') filters.sortBy = sortBy;
        
        const data = await api.globalSearch(query, filters);
        setResults(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };

    const delayDebounceFn = setTimeout(fetchResults, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, activeType, sortBy]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[300] flex items-start justify-center pt-[10vh] backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0a0a0c] border border-white/5 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >
        {/* Search Bar */}
        <div className="p-8 flex items-center space-x-6 border-b border-white/5 bg-white/[0.01]">
           <Search size={28} className={loading ? 'text-vani-blue animate-pulse' : 'text-gray-600'} />
           <input 
             ref={inputRef}
             className="flex-1 bg-transparent border-none focus:outline-none text-2xl lg:text-3xl font-black text-white placeholder-gray-800 uppercase tracking-tighter"
             placeholder="Synchronize Signature..."
             value={query}
             onChange={(e) => setQuery(e.target.value)}
           />
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-2xl transition-all ${showFilters ? 'bg-vani-blue text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                 <Filter size={20} />
              </button>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all"><X size={20} /></button>
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
                <div className="p-6 flex flex-wrap gap-8">
                   <div className="space-y-3">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2">Signature_Type</label>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                         {['all', 'users', 'realms', 'posts'].map(t => (
                           <button key={t} onClick={() => setActiveType(t)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeType === t ? 'bg-vani-blue text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2">Temporal_Pulse</label>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                         {['newest', 'likes', 'comments'].map(s => (
                           <button key={s} onClick={() => setSortBy(s)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${sortBy === s ? 'bg-vani-accent text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{s}</button>
                         ))}
                      </div>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Results Area */}
        <div className="max-h-[55vh] overflow-y-auto custom-scrollbar p-6">
           {!query && (
             <div className="py-24 text-center opacity-20 flex flex-col items-center">
                <div className="w-24 h-24 bg-vani-gradient rounded-[32px] mb-8 rotate-12 flex items-center justify-center"><Search size={48} className="-rotate-12 text-white" /></div>
                <div className="text-4xl font-black text-white uppercase tracking-widest mb-4">Awaiting_Input</div>
                <p className="text-xs font-mono tracking-widest uppercase text-gray-500">Scan for Identities, Sovereign Nodes, or Transmissions</p>
             </div>
           )}

           {query && !loading && results.users.length === 0 && results.realms.length === 0 && results.posts.length === 0 && (
             <div className="py-24 text-center">
                <div className="text-vani-accent font-black tracking-[0.2em] uppercase text-xl animate-pulse">Zero Matrix Signatures Detected</div>
                <p className="text-gray-600 text-[10px] font-black uppercase mt-2 tracking-widest">Protocol failed to sync with the provided identifier.</p>
             </div>
           )}

           {/* Identities Section */}
           {(activeType === 'all' || activeType === 'users') && results.users.length > 0 && (
             <Section label="Linked Identities">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   {results.users.map(u => {
                     const isMe = (u._id || u.id) === (currentUser.id || currentUser._id);
                     const isFollowing = currentUser.following?.includes(u._id || u.id);
                     return (
                       <ResultItem 
                         key={u._id} 
                         icon={<UserIcon size={16} />} 
                         title={u.username} 
                         sub={u.displayName || "Node Calibration Active"}
                         avatar={u.avatar}
                         badge={isFollowing ? "LINKED" : isMe ? "SELF" : null}
                         onClick={() => { onSelectUser(u._id || u.id); onClose(); }}
                       />
                     );
                   })}
                </div>
             </Section>
           )}

           {/* Realms Section */}
           {(activeType === 'all' || activeType === 'realms') && results.realms.length > 0 && (
             <Section label="Sovereign Realms">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   {results.realms.map(r => (
                     <ResultItem 
                       key={r._id} 
                       icon={<Globe size={16} />} 
                       title={r.name} 
                       sub={`Owner: ${(r.owner as any)?.username || 'Unknown'} • ${r.members?.length || 0} Nodes`}
                       avatar={r.icon}
                       onClick={() => { onSelectRealm(r); onClose(); }}
                     />
                   ))}
                </div>
             </Section>
           )}

           {/* Broadcasts Section */}
           {(activeType === 'all' || activeType === 'posts') && results.posts.length > 0 && (
             <Section label="Matrix Transmissions">
                {results.posts.map(p => (
                  <ResultItem 
                    key={p._id} 
                    icon={<ImageIcon size={16} />} 
                    title={p.caption || "Encrypted Broadcast"} 
                    sub={`Pulse by ${p.author.username} • ${p.likes?.length || 0} Links`}
                    avatar={p.imageUrl}
                    onClick={() => { onClose(); }}
                  />
                ))}
             </Section>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-discord-sidebar/50 border-t border-white/5 flex justify-between items-center px-10">
           <div className="flex items-center space-x-6 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
              <span className="flex items-center space-x-2"><Zap size={12} className="text-vani-blue" /> <span>Real-time_Sync</span></span>
              <span className="flex items-center space-x-2"><SortAsc size={12} className="text-vani-accent" /> <span>Neural_Filtering</span></span>
           </div>
           <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest drop-shadow-md">Yantravani Core // Matrix_v1.42</div>
        </div>
      </motion.div>
    </div>
  );
};

const Section = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="mb-10 last:mb-0">
     <h3 className="px-4 text-[10px] font-black text-vani-blue uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-vani-blue rounded-full animate-pulse" />
        {label}
     </h3>
     <div className="space-y-1">{children}</div>
  </div>
);

const ResultItem = ({ icon, title, sub, avatar, badge, onClick }: any) => (
  <div 
    onClick={onClick}
    className="flex items-center p-4 rounded-3xl hover:bg-white/[0.03] cursor-pointer transition-all border border-transparent hover:border-white/10 group"
  >
     <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-white/5 overflow-hidden mr-5 shadow-2xl">
        {avatar ? <img src={avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-gray-700">{icon}</div>}
     </div>
     <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
           <div className="text-sm font-black text-white uppercase tracking-tight group-hover:text-vani-blue transition-colors truncate">{title}</div>
           {badge && <span className={`text-[7px] font-black px-2 py-0.5 rounded-full border ${badge === 'LINKED' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-vani-blue/10 border-vani-blue/30 text-vani-blue'}`}>{badge}</span>}
        </div>
        <div className="text-[10px] text-gray-500 truncate font-medium uppercase tracking-widest mt-1 opacity-60">{sub}</div>
     </div>
     <div className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 pr-2 text-vani-blue">
        <ArrowRight size={20} />
     </div>
  </div>
);
