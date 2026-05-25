import { CheckCircle2, Users, BellOff, XCircle, WifiOff, RefreshCcw } from 'lucide-react';
import type { IChannel, IUser } from '../services/api';
import { api } from '../services/api';
import { useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { useLanguage } from '../context/LanguageContext';

import { getIdentityAvatar } from '../services/identity';

interface Props {
  dms: IChannel[];
  selectedDmId: string | null;
  onSelectDm: (dm: IChannel) => void;
  user: IUser | null;
  userStatuses: Record<string, 'online' | 'idle' | 'dnd' | 'offline'>;
  onInitGroup?: () => void;
  onRetry?: () => void;
  isSyncing?: boolean;
  onRefresh?: () => void;
}

export const DMSidebar = ({ dms, selectedDmId, onSelectDm, user, userStatuses, onInitGroup, onRetry, isSyncing, onRefresh }: Props) => {
  const { t } = useLanguage();
  const [menu, setMenu] = useState<{ x: number, y: number, items: any[] } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, dmId: string) => {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: t('ui.sync_read'), icon: <CheckCircle2 size={14} />, onClick: () => api.markChannelRead(dmId).then(() => onRefresh?.()).catch(() => {}) },
        { label: t('ui.mark_unread'), icon: <BellOff size={14} />, onClick: () => api.markChannelUnread(dmId).then(() => onRefresh?.()).catch(() => {}) },
        { label: t('ui.close_link'), icon: <XCircle size={14} />, variant: 'danger' as const, onClick: () => {
            if(window.confirm(t('logout.confirm'))) {
              api.closeDM(dmId).then(() => onRefresh?.()).catch(() => {});
            }
        }}
      ]
    });
  };

  const activeDms = dms
    .filter(d => d.type === 'dm' || d.type === 'group_dm')
    .sort((a, b) => new Date((b as any).lastMessageAt || 0).getTime() - new Date((a as any).lastMessageAt || 0).getTime());

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-discord-channel relative">
      <div className="h-16 border-b border-gray-900 flex items-center justify-between px-6 flex-shrink-0">
        <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono flex items-center gap-2">
           <Users size={14} className="text-vani-blue" />
           <span>{t('ui.direct_matrix')}</span>
        </h3>
        {onInitGroup && (
          <button 
            onClick={onInitGroup} 
            className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest bg-white/5 border border-white/5 hover:border-vani-blue/30 px-2.5 py-1.5 rounded-lg transition-all"
          >
             + Group
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {activeDms.length === 0 && !navigator.onLine ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 h-full space-y-4">
             <WifiOff size={24} className="text-gray-700" />
             <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Neural_Link_Lost</p>
             <button onClick={onRetry} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
                <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
             </button>
          </div>
        ) : (
          activeDms.map(dm => {
            const isGroup = dm.type === 'group_dm';
            const otherUser = !isGroup ? dm.members?.find(m => (m._id || m.id).toString() !== (user?.id || user?._id)?.toString()) : null;
            
            const otherUserId = otherUser ? (otherUser._id || otherUser.id).toString() : '';
            const realTimeStatus = otherUserId ? userStatuses[otherUserId] : 'offline';
            const isOnline = realTimeStatus && realTimeStatus !== 'offline';
            
            const myLastSeen = (dm as any).lastSeen?.[(user?.id || user?._id || '').toString()];
            const isUnread = !myLastSeen || new Date((dm as any).lastMessageAt) > new Date(myLastSeen);

            const renderStatus = () => {
              if (isGroup) return <span className="text-[7px] font-black text-vani-blue uppercase tracking-widest px-1.5 py-0.5 rounded bg-vani-blue/5 border border-vani-blue/15">Grid: {dm.members?.length} Node</span>;
              if (isUnread && selectedDmId !== dm._id) return <span className="text-[7px] font-black text-red-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 animate-pulse">New signal</span>;
              if (!isOnline) return <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 border border-white/5">Offline</span>;
              if (otherUser?.customStatus) return <span className="text-[7px] text-gray-400 font-mono tracking-wide truncate max-w-[120px] block uppercase">{otherUser.customStatus}</span>;
              
              switch (realTimeStatus) {
                case 'dnd': return <span className="text-[7px] font-black text-red-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/5 border border-red-500/15">DND</span>;
                case 'idle': return <span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-500/5 border border-yellow-500/15">Idle</span>;
                default: return <span className="text-[7px] font-black text-green-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-green-500/5 border border-green-500/15">Online</span>;
              }
            };

            return (
              <div 
                key={dm._id}
                onClick={() => onSelectDm(dm)}
                onContextMenu={(e) => handleContextMenu(e, dm._id)}
                className={`group relative flex items-center px-3 py-2 rounded-xl mx-2 my-0.5 cursor-pointer transition-all border ${selectedDmId === dm._id ? 'bg-[#0b0b0e] border-vani-blue/20 text-white shadow-[0_0_15px_rgba(0,210,255,0.06)]' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/[0.02] hover:border-white/5 hover:text-gray-200'}`}
              >
                <div 
                  className="relative mr-2.5 flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    if (otherUser) {
                      e.stopPropagation();
                      (window as any).__vani_show_mini_profile?.(e, otherUser);
                    }
                  }}
                >
                   <div className={`w-8 h-8 rounded-lg overflow-hidden border border-gray-700 transition-all ${selectedDmId === dm._id ? 'border-vani-blue/30' : ''} ${isGroup ? 'bg-vani-blue/10 flex items-center justify-center' : 'bg-gray-800'}`}>
                      {isGroup ? (
                        dm.icon ? <img src={dm.icon} alt={dm.name || 'Group'} className="w-full h-full object-cover" /> : <Users size={14} className="text-vani-blue" />
                      ) : <img src={getIdentityAvatar(otherUser)} alt={otherUser?.username || 'User'} className="w-full h-full object-cover" />}
                   </div>
                   {isOnline && !isGroup && (
                     <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-discord-channel ${
                       realTimeStatus === 'dnd' ? 'bg-red-500' : realTimeStatus === 'idle' ? 'bg-yellow-500' : 'bg-green-500'
                     }`} />
                   )}
                   {isUnread && selectedDmId !== dm._id && <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-discord-channel shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />}
                </div>
                <div className="flex-1 min-w-0">
                   <div className={`font-black text-[10px] md:text-xs truncate uppercase tracking-tighter ${isUnread && selectedDmId !== dm._id ? 'text-white' : (selectedDmId === dm._id ? 'text-white' : 'text-gray-400')}`}>
                      {isGroup ? (dm.name || 'Unnamed_Group') : (dm.nicknames?.[otherUser?._id || ''] || otherUser?.displayName || otherUser?.username || 'Ghost_Node')}
                   </div>
                   <div className="flex items-center gap-1 mt-0.5">{renderStatus()}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
};
