import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { INotification } from '../services/api';
import { Heart, MessageCircle, UserPlus, ShieldAlert, CheckCircle2, Activity, X, Zap } from 'lucide-react';

export const NotificationsPage = ({ onClose }: { onClose?: () => void }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleClear = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleAcceptSync = async (id: string) => {
    try {
      await api.acceptSync(id);
      fetchNotifs();
    } catch (e) { alert("Sync established failed."); }
  };

  return (
    <div className="flex-1 bg-discord-dark overflow-y-auto custom-scrollbar p-4 lg:p-10 flex flex-col">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 lg:mb-12">
           <div className="flex items-center space-x-4 lg:space-x-6">
              {onClose && <button onClick={onClose} className="p-2 lg:p-3 bg-white/5 rounded-xl lg:rounded-2xl hover:bg-white/10 transition-all border border-white/5"><X size={18} className="lg:w-5 lg:h-5" /></button>}
              <div>
                 <h2 className="text-xl lg:text-4xl font-black text-white uppercase tracking-tight">System Logs</h2>
                 <p className="text-gray-500 font-mono text-[8px] lg:text-[10px] tracking-[0.2em] lg:tracking-[0.3em] mt-1 lg:mt-2 uppercase">Full Pulse History established</p>
              </div>
           </div>
           <button 
             onClick={handleClear}
             className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 lg:px-6 py-2 rounded-xl transition-all border border-white/5"
           >
              <CheckCircle2 size={14} className="lg:w-4 lg:h-4" />
              <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Wipe</span>
           </button>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-vani-blue font-black tracking-widest uppercase text-sm">Fetching Node History...</div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {notifications.map((n, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={n._id} 
                className={`p-4 lg:p-6 rounded-[24px] lg:rounded-3xl border transition-all ${!n.isRead ? 'bg-vani-blue/5 border-vani-blue/20 shadow-lg shadow-blue-500/5' : 'bg-discord-channel border-gray-800 opacity-60 hover:opacity-100'}`}
              >
                 <div className="flex items-start space-x-4 lg:space-x-6">
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ${n.type === 'like' ? 'bg-red-500/10 text-red-500' : n.type === 'comment' ? 'bg-blue-500/10 text-blue-500' : n.type === 'login' ? 'bg-yellow-500/10 text-yellow-500' : n.type === 'sync_request' ? 'bg-vani-blue/10 text-vani-blue' : n.type === 'mention' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'}`}>
                       {n.type === 'like' && <Heart size={20} className={`lg:w-6 lg:h-6 ${!n.isRead ? 'fill-red-500' : ''}`} />}
                       {n.type === 'comment' && <MessageCircle size={20} className="lg:w-6 lg:h-6" />}
                       {n.type === 'follow' && <UserPlus size={20} className="lg:w-6 lg:h-6" />}
                       {n.type === 'login' && <ShieldAlert size={20} className="lg:w-6 lg:h-6" />}
                       {n.type === 'sync_request' && <Activity size={20} className="lg:w-6 lg:h-6" />}
                       {n.type === 'mention' && <Zap size={20} className="lg:w-6 lg:h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{n.type === 'sync_request' ? 'IDENTITY SYNC' : n.type === 'mention' ? 'NEURAL SIGNAL' : n.type} transmission</span>
                          <span className="text-[8px] lg:text-[10px] font-mono text-gray-600 whitespace-nowrap ml-2">{new Date(n.createdAt).toLocaleDateString()}</span>
                       </div>
                       <p className="text-white text-sm lg:text-lg font-medium leading-snug break-words">
                          {n.type !== 'login' && <span className="font-black mr-2 uppercase tracking-tighter text-vani-blue">{n.sender?.username}</span>}
                          {n.content}
                       </p>
                       
                       {n.type === 'sync_request' && !n.isRead && (
                         <div className="mt-4">
                            <button 
                              onClick={() => handleAcceptSync(n.sender?._id || n.sender?.id || '')}
                              className="bg-vani-gradient text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl font-black uppercase tracking-widest text-[8px] lg:text-[10px] shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                            >
                               Establish Mutual Link
                            </button>
                         </div>
                       )}

                       {n.type === 'login' && (
                         <div className="mt-3 flex flex-wrap gap-2 lg:gap-4">
                            <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 text-[8px] lg:text-[9px] font-mono text-gray-500 uppercase">
                               DEVICE: {n.metadata?.deviceName || 'UNKNOWN_NODE'}
                            </div>
                            <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 text-[8px] lg:text-[9px] font-mono text-gray-500 uppercase">
                               STATUS: SECURE_LINK_ACTIVE
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
              </motion.div>
            ))}

            {notifications.length === 0 && (
              <div className="py-20 lg:py-40 text-center border-2 border-dashed border-gray-800 rounded-[32px] lg:rounded-[48px]">
                 <div className="text-gray-700 font-black text-xl lg:text-2xl tracking-widest opacity-20 uppercase">No Data Found in Matrix</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
