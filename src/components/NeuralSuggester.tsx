import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, Hash, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, IUser } from '../services/api';

interface Props {
  query: string;
  type: 'mention' | 'tag';
  onSelect: (value: string) => void;
  position: { top: number, left: number };
}

export const NeuralSuggester = ({ query, type, onSelect, position }: Props) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type === 'mention') {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const data = await fetch(`http://localhost:5000/api/search/mentions?q=${query.slice(1)}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
          }).then(res => res.json());
          setResults(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
      };
      fetchUsers();
    } else {
      // Hashtag logic (Local/Hardcoded for now)
      const tags = ['nexus', 'cyber', 'matrix', 'cinema', 'identity', 'transmission'].filter(t => t.startsWith(query.slice(1)));
      setResults(tags);
    }
  }, [query, type]);

  if (results.length === 0 && !loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute bg-[#0a0a0c] border border-nexus-blue/30 rounded-2xl shadow-[0_0_30px_rgba(0,210,255,0.15)] overflow-hidden z-[1000] min-w-[200px]"
      style={{ bottom: '100%', left: position.left, marginBottom: '12px' }}
    >
      <div className="p-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
         <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Neural_Suggestions</span>
         <Zap size={10} className="text-nexus-blue animate-pulse" />
      </div>
      
      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {results.map((item, i) => (
          <div 
            key={i}
            onClick={() => onSelect(type === 'mention' ? item.username : item)}
            className="p-3 hover:bg-nexus-blue/10 flex items-center space-x-3 cursor-pointer transition-colors group border-b border-white/[0.02] last:border-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-nexus-blue border border-white/5 group-hover:border-nexus-blue/50">
               {type === 'mention' ? (
                 item.avatar ? <img src={item.avatar} className="w-full h-full object-cover rounded-lg" /> : <AtSign size={14} />
               ) : <Hash size={14} />}
            </div>
            <div>
               <div className="text-xs font-black text-white uppercase tracking-tight group-hover:text-nexus-blue transition-colors">
                  {type === 'mention' ? item.username : item}
               </div>
               {type === 'mention' && <div className="text-[9px] text-gray-600 font-mono">{item.displayName || 'Identity_Node'}</div>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
