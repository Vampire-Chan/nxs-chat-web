import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User as UserIcon, Globe, Image as ImageIcon, Zap, X, ArrowRight } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], realms: [], posts: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.globalSearch(query);
        setResults(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[300] flex items-start justify-center pt-[10vh] backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0c] border border-gray-800 rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Search Bar */}
        <div className="p-6 flex items-center space-x-4 border-b border-gray-900 bg-white/[0.02]">
           <Search size={24} className={loading ? 'text-nexus-blue animate-pulse' : 'text-gray-500'} />
           <input 
             ref={inputRef}
             className="flex-1 bg-transparent border-none focus:outline-none text-2xl font-bold text-white placeholder-gray-700"
             placeholder="Search the Matrix..."
             value={query}
             onChange={(e) => setQuery(e.target.value)}
           />
           <div 
             onClick={onClose}
             className="p-2 hover:bg-white/5 rounded-xl cursor-pointer text-gray-500 hover:text-white transition-all"
           >
              <X size={20} />
           </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4">
           {!query && (
             <div className="py-20 text-center opacity-20">
                <div className="text-4xl font-black text-gray-700 uppercase tracking-widest mb-4">Awaiting Input</div>
                <p className="text-xs font-mono tracking-widest uppercase text-gray-500">Search for Identities, Nodes, or Broadcasts</p>
             </div>
           )}

           {query && !loading && results.users.length === 0 && results.realms.length === 0 && results.posts.length === 0 && (
             <div className="py-20 text-center">
                <div className="text-nexus-accent font-black tracking-widest uppercase">Zero Results Match This Signature</div>
             </div>
           )}

           {/* Identities Section */}
           {results.users.length > 0 && (
             <Section label="Identities Established">
                {results.users.map(u => {
                  const isMe = (u._id || u.id) === (currentUser.id || currentUser._id);
                  const isFollowing = currentUser.following?.includes(u._id || u.id);
                  
                  return (
                    <ResultItem 
                      key={u._id} 
                      icon={<UserIcon size={16} />} 
                      title={u.username} 
                      sub={isMe ? "YOUR_OWN_IDENTITY" : u.bio || "No public bio transmission."}
                      avatar={u.avatar}
                      badge={isFollowing ? "SYNC_ACTIVE" : null}
                      onClick={() => { if(!isMe) onSelectUser(u._id || u.id); onClose(); }}
                    />
                  );
                })}
             </Section>
           )}

           {/* Realms Section */}
           {results.realms.length > 0 && (
             <Section label="Operational Realms">
                {results.realms.map(r => (
                  <ResultItem 
                    key={r._id} 
                    icon={<Globe size={16} />} 
                    title={r.name} 
                    sub={`${r.members?.length || 0} members synchronized`}
                    avatar={r.icon}
                    onClick={() => { onSelectRealm(r); onClose(); }}
                  />
                ))}
             </Section>
           )}

           {/* Broadcasts Section */}
           {results.posts.length > 0 && (
             <Section label="Broadcast Transmissions">
                {results.posts.map(p => (
                  <ResultItem 
                    key={p._id} 
                    icon={<ImageIcon size={16} />} 
                    title={p.caption || "Untitled Broadcast"} 
                    sub={`By ${p.author.username}`}
                    avatar={p.imageUrl}
                    onClick={() => { onClose(); }}
                  />
                ))}
             </Section>
           )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-discord-sidebar/50 border-t border-gray-900 flex justify-between items-center px-8">
           <div className="flex items-center space-x-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
              <span className="flex items-center space-x-1"><Zap size={10} className="text-nexus-blue" /> <span>Real-time Sync</span></span>
              <span>Encrypted Search</span>
           </div>
           <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Nexus Core v1.0</div>
        </div>
      </motion.div>
    </div>
  );
};

const Section = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="mb-8">
     <h3 className="px-4 text-[10px] font-black text-nexus-blue uppercase tracking-[0.3em] mb-4">{label}</h3>
     <div className="space-y-1">{children}</div>
  </div>
);

const ResultItem = ({ icon, title, sub, avatar, badge, onClick }: any) => (
  <div 
    onClick={onClick}
    className="flex items-center p-3 rounded-2xl hover:bg-white/[0.03] cursor-pointer transition-all border border-transparent hover:border-gray-800 group"
  >
     <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden mr-4">
        {avatar ? <img src={avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-700">{icon}</div>}
     </div>
     <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
           <div className="text-sm font-black text-white uppercase tracking-tight group-hover:text-nexus-blue transition-colors">{title}</div>
           {badge && <span className="text-[7px] font-black text-nexus-blue border border-nexus-blue/30 px-1 rounded bg-nexus-blue/5">{badge}</span>}
        </div>
        <div className="text-[10px] text-gray-500 truncate font-medium uppercase tracking-tighter mt-0.5">{sub}</div>
     </div>
     <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-4 text-nexus-blue">
        <ArrowRight size={16} />
     </div>
  </div>
);