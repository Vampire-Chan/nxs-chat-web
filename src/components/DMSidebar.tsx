import { MessageSquare, CheckCircle2, ShieldQuestion } from 'lucide-react';
import type { IChannel, IUser } from '../services/api';
import { api } from '../services/api';
import { useState } from 'react';
import { ContextMenu } from './ContextMenu';

interface Props {
  dms: IChannel[];
  selectedDmId: string | null;
  onSelectDm: (dm: IChannel) => void;
  user: IUser | null;
  onLogout: () => void;
  onlineUserIds: Set<string>;
}

export const DMSidebar = ({ dms, selectedDmId, onSelectDm, user, onlineUserIds }: Props) => {
  const [menu, setMenu] = useState<{ x: number, y: number, items: any[] } | null>(null);

  const activeDms = dms.filter(d => d.status === 'active');
  const pendingDms = dms.filter(d => d.status === 'pending');

  const handleContextMenu = (e: React.MouseEvent, dmId: string) => {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Sync as Read', icon: <CheckCircle2 size={14} />, onClick: () => alert('Private Link Synchronized') },
      ]
    });
  };

  const handleAccept = async (e: React.MouseEvent, dmId: string) => {
    e.stopPropagation();
    try {
      await api.acceptDM(dmId);
      window.location.reload(); // Quick sync
    } catch (e) { alert("Activation failed."); }
  };

  return (
    <div className="w-60 bg-discord-channel flex flex-col h-full border-r border-gray-900">
      <div className="h-12 border-b border-gray-900 flex items-center px-4 font-black text-white truncate uppercase tracking-widest text-[10px]">
        Encrypted DM Link
      </div>

      <div className="p-2 space-y-0.5 overflow-y-auto flex-1 custom-scrollbar">
        
        {/* PENDING REQUESTS */}
        {pendingDms.length > 0 && (
          <div className="mb-6">
             <div className="px-3 text-[9px] font-black text-nexus-blue uppercase tracking-widest mb-2 flex items-center">
                <ShieldQuestion size={10} className="mr-1" /> Identity Requests
             </div>
             {pendingDms.map(dm => {
                const otherUser = dm.members?.find(m => (m._id || m.id) !== (user?.id || user?._id)) || dm.members?.[0];
                return (
                  <div key={dm._id} className="p-2 rounded-xl bg-white/[0.02] border border-gray-800 mx-2 mb-1 flex items-center justify-between group">
                     <div className="flex items-center min-w-0 mr-2">
                        <img src={otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`} className="w-7 h-7 rounded-lg mr-2" />
                        <span className="text-[10px] font-bold text-gray-300 truncate">{otherUser?.username}</span>
                     </div>
                     <button 
                       onClick={(e) => handleAccept(e, dm._id)}
                       className="bg-nexus-blue text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest hover:scale-105 transition-all"
                     >
                        Accept
                     </button>
                  </div>
                );
             })}
          </div>
        )}

        {/* ACTIVE LINKS */}
        <div className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Active Nodes</div>
        {activeDms.map(dm => {
          const otherUser = dm.members?.find(m => (m._id || m.id) !== (user?.id || user?._id)) || dm.members?.[0];
          const isOnline = otherUser ? onlineUserIds.has(otherUser._id || otherUser.id) : false;

          return (
            <div 
              key={dm._id}
              onClick={() => onSelectDm(dm)}
              onContextMenu={(e) => handleContextMenu(e, dm._id)}
              className={`group flex items-center px-2 py-2 rounded-xl mx-2 cursor-pointer transition-all ${selectedDmId === dm._id ? 'bg-nexus-gradient text-white shadow-md shadow-red-500/10' : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'}`}
            >
              <div className="relative mr-3">
                 <div className={`w-9 h-9 rounded-xl bg-gray-800 overflow-hidden border border-gray-700 transition-all ${selectedDmId === dm._id ? 'border-white/20' : ''}`}>
                    <img src={otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`} className="w-full h-full object-cover" alt="u" />
                 </div>
                 {isOnline && (
                   <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-discord-channel shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                 )}
              </div>
              <div className="flex-1 min-w-0">
                 <div className={`font-black text-xs truncate uppercase tracking-tighter ${selectedDmId === dm._id ? 'text-white' : 'text-gray-300'}`}>
                    {otherUser?.username || 'Unknown'}
                 </div>
                 <div className="text-[9px] text-gray-500 truncate font-mono uppercase">Node_Connected</div>
              </div>
            </div>
          );
        })}

        {dms.length === 0 && (
           <div className="text-center py-10 px-4">
              <MessageSquare size={24} className="mx-auto text-gray-700 mb-2 opacity-20" />
              <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">No Active Nodes</div>
           </div>
        )}
      </div>
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  );
};
