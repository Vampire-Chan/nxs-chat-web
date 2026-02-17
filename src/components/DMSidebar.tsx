import { CheckCircle2, Users, BellOff, XCircle } from 'lucide-react';
import type { IChannel, IUser } from '../services/api';
import { api } from '../services/api';
import { useState } from 'react';
import { ContextMenu } from './ContextMenu';

interface Props {
  dms: IChannel[];
  selectedDmId: string | null;
  onSelectDm: (dm: IChannel) => void;
  user: IUser | null;
  onlineUserIds: Set<string>;
  onInitGroup?: () => void;
}

export const DMSidebar = ({ dms, selectedDmId, onSelectDm, user, onlineUserIds, onInitGroup }: Props) => {
  const [menu, setMenu] = useState<{ x: number, y: number, items: any[] } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, dmId: string) => {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Sync as Read', icon: <CheckCircle2 size={14} />, onClick: () => api.markChannelRead(dmId).then(() => window.location.reload()) },
        { label: 'Mark as Unread', icon: <BellOff size={14} />, onClick: () => api.markChannelUnread(dmId).then(() => window.location.reload()) },
        { label: 'Close Link', icon: <XCircle size={14} />, variant: 'danger' as const, onClick: () => {
            if(window.confirm("Sever this identity link?")) {
              api.closeDM(dmId).then(() => window.location.reload());
            }
        }}
      ]
    });
  };

  const activeDms = dms
    .filter(d => d.type === 'dm' || d.type === 'group_dm')
    .sort((a, b) => new Date((b as any).lastMessageAt || 0).getTime() - new Date((a as any).lastMessageAt || 0).getTime());

  return (
    <div className="flex-1 flex flex-col bg-discord-channel h-full border-r border-gray-900">
      <div className="h-16 px-4 border-b border-gray-900 flex items-center justify-between shadow-sm">
         <div className="flex flex-col">
            <span className="font-black text-white uppercase tracking-widest text-[10px]">Neural Links</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Secure_Layer_Active</span>
         </div>
         <button onClick={onInitGroup} className="p-2.5 bg-white/5 hover:bg-vani-blue/20 hover:text-vani-blue rounded-xl transition-all border border-white/5 group" title="Initialize Group">
            <Users size={16} className="group-hover:scale-110 transition-transform" />
         </button>
      </div>

      <div className="p-2 space-y-0.5 overflow-y-auto flex-1 custom-scrollbar">
        {activeDms.map(dm => {
          const isGroup = dm.type === 'group_dm';
          // RE-CALIBRATED USER RESOLUTION: Always look in members array first
          const otherUser = !isGroup ? dm.members?.find(m => (m._id || m.id).toString() !== (user?.id || user?._id)?.toString()) : null;
          const isOnline = otherUser ? onlineUserIds.has((otherUser._id || otherUser.id).toString()) : false;
          
          const myLastSeen = (dm as any).lastSeen?.[(user?.id || user?._id || '').toString()];
          const isUnread = !myLastSeen || new Date((dm as any).lastMessageAt) > new Date(myLastSeen);

          const getStatusDisplay = () => {
            if (isGroup) return `${dm.members?.length} Nodes`;
            if (isUnread && selectedDmId !== dm._id) return 'NEW_TRANSMISSION';
            if (!isOnline) return 'OFFLINE';
            
            if (otherUser?.customStatus) return otherUser.customStatus;
            
            switch (otherUser?.status) {
              case 'dnd': return 'BUSY';
              case 'idle': return 'AWAY';
              default: return 'ONLINE';
            }
          };

          return (
            <div 
              key={dm._id}
              onClick={() => onSelectDm(dm)}
              onContextMenu={(e) => handleContextMenu(e, dm._id)}
              className={`group flex items-center px-2 py-2.5 rounded-xl mx-2 cursor-pointer transition-all ${selectedDmId === dm._id ? 'bg-vani-gradient text-white shadow-md' : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'}`}
            >
              <div className="relative mr-3 flex-shrink-0">
                 <div className={`w-10 h-10 rounded-xl overflow-hidden border border-gray-700 transition-all ${selectedDmId === dm._id ? 'border-white/20' : ''} ${isGroup ? 'bg-vani-blue/10 flex items-center justify-center' : 'bg-gray-800'}`}>
                    {isGroup ? (
                      dm.icon ? <img src={dm.icon} className="w-full h-full object-cover" /> : <Users size={18} className="text-vani-blue" />
                    ) : <img src={otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`} className="w-full h-full object-cover" />}
                 </div>
                 {isOnline && !isGroup && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-discord-channel" />}
                 {isUnread && selectedDmId !== dm._id && <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-discord-channel shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />}
              </div>
              <div className="flex-1 min-w-0">
                 <div className={`font-black text-xs truncate uppercase tracking-tighter ${isUnread && selectedDmId !== dm._id ? 'text-white' : (selectedDmId === dm._id ? 'text-white' : 'text-gray-400')}`}>
                    {isGroup ? (dm.name || 'Unnamed_Group') : (otherUser?.username || 'Ghost_Node')}
                 </div>
                 <div className="text-[9px] text-gray-500 truncate font-mono uppercase tracking-widest">{getStatusDisplay()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  );
};
