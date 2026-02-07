import { Plus, Compass, Home, Settings, Bell, Heart, MessageCircle, UserPlus, ShieldAlert, ArrowRight, LogOut, CheckCircle2, UserCircle, ShieldX, Search, Users } from 'lucide-react';
import type { IRealm, IUser, INotification } from '../services/api';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ContextMenu } from './ContextMenu';

interface Props {
  realms: IRealm[];
  selectedRealmId: string | null;
  onSelect: (realm: any) => void;
  onCreate: () => void;
  user: IUser;
  onSettings: () => void;
  onProfile: () => void;
  onSeeAllNotifications?: () => void;
  onLeaveRealm?: (id: string) => void;
  onDeleteRealm?: (id: string) => void;
  onLogout?: () => void;
  onSearch: () => void;
  onSocial: () => void;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const TopNavbar = ({ realms, selectedRealmId, onSelect, onCreate, user, onSettings, onProfile, onSeeAllNotifications, onLeaveRealm, onDeleteRealm, onLogout, onSearch, onSocial, position }: Props) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [menu, setMenu] = useState<{ x: number, y: number, items: any[] } | null>(null);

  const isVertical = position === 'left' || position === 'right';

  const handleContextMenu = (e: React.MouseEvent, type: 'realm' | 'profile', realmId?: string) => {
    e.preventDefault();
    const items = type === 'realm' && realmId ? [
      { label: 'Sync as Read', icon: <CheckCircle2 size={14} />, onClick: () => alert('Synced') },
      { label: realms.find(r => r._id === realmId)?.owner === (user.id || user._id) ? 'Collapse Node' : 'Sever Link', icon: <ShieldX size={14} />, variant: 'danger' as const, onClick: () => realms.find(r => r._id === realmId)?.owner === (user.id || user._id) ? onDeleteRealm?.(realmId) : onLeaveRealm?.(realmId) }
    ] : [
      { label: 'Identity Hub', icon: <UserCircle size={14} />, onClick: onProfile },
      { label: 'System Config', icon: <Settings size={14} />, onClick: onSettings },
      { label: 'Disconnect', icon: <LogOut size={14} />, variant: 'danger' as const, onClick: () => onLogout?.() }
    ];
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  useEffect(() => {
    const fetchNotifs = async () => { try { const d = await api.getNotifications(); setNotifications(d); } catch (e) {} };
    fetchNotifs(); const i = setInterval(fetchNotifs, 30000); return () => clearInterval(i);
  }, []);

  const borderClass = position === 'top' ? 'border-b' : position === 'bottom' ? 'border-t' : position === 'left' ? 'border-r' : 'border-l';
  const sizeClass = isVertical ? 'w-[72px] h-full flex-col py-4' : 'h-16 w-full flex-row px-4';

  return (
    <div className={`${sizeClass} bg-discord-sidebar flex items-center ${borderClass} border-gray-900 z-30 shadow-xl overflow-hidden`}>
      {/* Brand Actions */}
      <div className={`flex ${isVertical ? 'flex-col space-y-3' : 'flex-row space-x-3'}`}>
        <DockIcon icon={<Home size={22} />} active={selectedRealmId === 'home'} onClick={() => onSelect({ _id: 'home' })} />
        <DockIcon icon={<Compass size={22} />} active={selectedRealmId === 'explore'} onClick={() => onSelect({ _id: 'explore' })} />
        <DockIcon icon={<Search size={20} />} active={false} onClick={onSearch} />
        <DockIcon icon={<Users size={20} />} active={selectedRealmId === 'social'} onClick={onSocial} />
        {user.isAdmin && (
          <DockIcon icon={<Shield size={20} className="text-nexus-blue" />} active={selectedRealmId === 'architect'} onClick={() => onSelect({ _id: 'architect' })} />
        )}
      </div>

      <div className={`${isVertical ? 'w-8 h-[1px] my-4' : 'w-[1px] h-8 mx-4'} bg-gray-800`} />

      {/* Realms List */}
      <div className={`flex-1 flex ${isVertical ? 'flex-col space-y-3 overflow-y-auto' : 'flex-row space-x-3 overflow-x-auto'} no-scrollbar py-2`}>
        {realms.map(realm => (
          <div key={realm._id} onClick={() => onSelect(realm)} onContextMenu={(e) => handleContextMenu(e, 'realm', realm._id)} className="relative group cursor-pointer flex-shrink-0">
            <div className={`w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center overflow-hidden border ${selectedRealmId === realm._id ? 'bg-nexus-gradient border-white/20 shadow-lg scale-110' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
              {realm.icon ? <img src={realm.icon} alt="r" className="w-full h-full object-cover" /> : <span className="font-black text-xs text-white uppercase">{realm.name[0]}</span>}
            </div>
            {selectedRealmId === realm._id && <div className={`absolute ${isVertical ? '-left-1 top-1/2 -translate-y-1/2 w-1 h-4' : '-bottom-2 left-1/2 -translate-x-1/2 w-4 h-1'} bg-nexus-gradient rounded-full`} />}
          </div>
        ))}
        <button onClick={onCreate} className="w-10 h-10 rounded-xl bg-gray-800 border border-dashed border-gray-700 flex items-center justify-center text-gray-500 hover:border-nexus-blue hover:text-nexus-blue transition-all flex-shrink-0"><Plus size={20} /></button>
      </div>

      <div className={`${isVertical ? 'w-8 h-[1px] my-4' : 'w-[1px] h-8 mx-4'} bg-gray-800`} />

      {/* Profile & Alerts */}
      <div className={`flex items-center ${isVertical ? 'flex-col space-y-6' : 'flex-row space-x-6'} ml-auto`}>
        <div className="relative">
           <div onClick={() => { setShowNotifs(!showNotifs); }} className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${showNotifs ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}><Bell size={20} />{unreadCount > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-nexus-accent text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-discord-sidebar animate-bounce">{unreadCount}</div>}</div>
           <AnimatePresence>
             {showNotifs && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute ${isVertical ? 'left-14 bottom-0' : 'top-14 right-0'} w-80 bg-discord-channel border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50`}>
                  <div className="p-4 border-b border-gray-800 bg-discord-sidebar/50"><span className="text-[10px] font-black text-white uppercase tracking-widest">Pulse</span></div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                     {notifications.map(n => <div key={n._id} className="p-4 border-b border-gray-900/50 flex items-start space-x-3"><div className="flex-1 text-xs text-gray-300"> <span className="font-black text-white">{n.sender?.username || 'System'}</span> {n.content}</div></div>)}
                  </div>
                  <div onClick={onSeeAllNotifications} className="p-3 bg-discord-sidebar/50 text-center text-[10px] font-black text-gray-500 hover:text-white cursor-pointer border-t border-gray-800">Expand Logs</div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="relative group" onContextMenu={(e) => handleContextMenu(e, 'profile')}>
           <div onClick={onProfile} className={`w-10 h-10 rounded-xl bg-gray-800 overflow-hidden border-2 transition-all shadow-lg cursor-pointer ${selectedRealmId === 'profile' ? 'border-nexus-accent scale-110' : 'border-gray-800 group-hover:border-nexus-blue'}`}><img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-full h-full object-cover" /></div>
           <div onClick={onSettings} className="absolute -top-1 -right-1 p-1 bg-discord-sidebar rounded-lg border border-gray-800 hover:border-nexus-blue transition-all cursor-pointer"><Settings size={12} className="text-gray-500 hover:text-white" /></div>
        </div>
      </div>
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  );
};

const DockIcon = ({ icon, active, onClick }: any) => (
  <div onClick={onClick} className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${active ? 'bg-nexus-gradient text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{icon}</div>
);
