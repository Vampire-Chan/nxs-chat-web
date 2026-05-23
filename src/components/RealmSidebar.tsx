import { Plus, Compass, Home, Settings, Bell, UserPlus, LogOut, CheckCircle2, UserCircle, ShieldX, Search, Users, Shield, RefreshCcw } from 'lucide-react';
import type { IRealm, IUser, INotification } from '../services/api';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { ContextMenu } from './ContextMenu';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

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
  onManageInvites?: (id: string) => void;
  onLogout?: () => void;
  onSearch: () => void;
  onSocial: () => void;
  position: 'top' | 'bottom' | 'left' | 'right';
  refreshTrigger?: number;
  isSearchOpen?: boolean;
  isSettingsOpen?: boolean;
  isCreateOpen?: boolean;
}

export const TopNavbar = ({ realms, selectedRealmId, onSelect, onCreate, user, onSettings, onProfile, onSeeAllNotifications, onLeaveRealm, onDeleteRealm, onManageInvites, onSearch, onSocial, position, refreshTrigger, isSearchOpen, isSettingsOpen, isCreateOpen }: Props) => {
  const { t } = useLanguage();
  const { accounts, switchAccount, logout } = useAuth();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [menu, setMenu] = useState<{ x: number, y: number, items: any[] } | null>(null);

  const isVertical = position === 'left' || position === 'right';

  const fetchMatrixStatus = useCallback(async () => {
    try {
      const [notifs, dms] = await Promise.all([api.getNotifications(), api.getMyDMs()]);
      setNotifications(notifs);
      const unread = dms.filter((dm: any) => {
        const myLastSeen = dm.lastSeen?.[user.id || user._id];
        if (!myLastSeen) return true;
        return new Date(dm.lastMessageAt) > new Date(myLastSeen);
      }).length;
      setUnreadDmCount(unread);
    } catch (e) {}
  }, [user.id, user._id]);

  useEffect(() => {
    fetchMatrixStatus();
    const i = setInterval(fetchMatrixStatus, 15000);
    return () => clearInterval(i);
  }, [fetchMatrixStatus, refreshTrigger]);

  const unreadAlerts = notifications.filter(n => !n.isRead).length;
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleNotifClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifs(!showNotifs);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'realm' | 'profile', realmId?: string) => {
    e.preventDefault();
    
    if (type === 'realm' && realmId) {
      const items = [
        { label: t('common.edit'), icon: <CheckCircle2 size={14} />, onClick: () => alert('Synced') },
        { label: t('common.invite'), icon: <UserPlus size={14} />, onClick: () => onManageInvites?.(realmId) },
        { label: realms.find(r => r._id === realmId)?.owner === (user.id || user._id) ? t('common.collapse') : t('common.sever'), icon: <ShieldX size={14} />, variant: 'danger' as const, onClick: () => realms.find(r => r._id === realmId)?.owner === (user.id || user._id) ? onDeleteRealm?.(realmId) : onLeaveRealm?.(realmId) }
      ];
      setMenu({ x: e.clientX, y: e.clientY, items });
    } else {
      // PROFILE TERMINAL MENU
      const otherAccounts = accounts.filter(acc => (acc.user._id || acc.user.id) !== (user.id || user._id));
      
      const items: any[] = [
        { label: t('nav.profile'), icon: <UserCircle size={14} />, onClick: onProfile },
        { label: t('nav.settings'), icon: <Settings size={14} />, onClick: onSettings },
      ];

      if (otherAccounts.length > 0) {
        items.push({ type: 'divider' });
        otherAccounts.forEach(acc => {
          items.push({ 
            label: `${t('ui.switch_node')}: ${acc.user.username}`, 
            icon: <RefreshCcw size={14} />, 
            onClick: () => { switchAccount(acc.user._id || acc.user.id); window.location.reload(); }
          });
        });
      }

      items.push({ type: 'divider' });
      items.push({ label: `${t('common.sever')} (${t('nav.logout')})`, icon: <LogOut size={14} />, variant: 'danger', onClick: () => logout(false) });
      items.push({ label: t('ui.global_disconnect'), icon: <ShieldX size={14} />, variant: 'danger', onClick: () => logout(true) });

      setMenu({ x: e.clientX, y: e.clientY, items });
    }
  };

  const borderClass = position === 'top' ? 'border-b' : position === 'bottom' ? 'border-t' : position === 'left' ? 'border-r' : 'border-l';
  const sizeClass = isVertical ? 'w-[72px] h-full flex-col py-4' : 'h-16 w-full flex-row px-4';

  const getActiveLabel = () => {
    if (isSettingsOpen) return t('ui.node_calib');
    if (isSearchOpen) return t('ui.matrix_search');
    if (isCreateOpen) return t('ui.init_node');
    if (showNotifs) return t('ui.alert_buffer');
    
    if (selectedRealmId === 'profile') return t('ui.identity_node');
    if (selectedRealmId === 'home') return t('ui.neural_links');
    if (selectedRealmId === 'explore') return t('ui.global_matrix');
    if (selectedRealmId === 'social') return t('ui.social_matrix');
    if (selectedRealmId === 'architect') return t('ui.architect_realm');
    
    const activeRealm = realms.find(r => r._id === selectedRealmId);
    if (activeRealm) return activeRealm.name;
    
    return "Yantravani";
  };

  return (
    <motion.div 
      initial={position === 'top' ? { y: -100 } : position === 'bottom' ? { y: 100 } : position === 'left' ? { x: -100 } : { x: 100 }}
      animate={{ y: 0, x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`${sizeClass} bg-discord-sidebar flex items-center ${borderClass} border-gray-900 z-[100] shadow-xl`} 
      onClick={() => setShowNotifs(false)}
    >
      <div className={`flex flex-1 ${isVertical ? 'flex-col overflow-y-auto no-scrollbar' : 'flex-row overflow-x-auto no-scrollbar'} items-center scroll-smooth relative`}>
        <div className={`flex ${isVertical ? 'flex-col space-y-3' : 'flex-row space-x-3 items-center'}`}>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
             <div onClick={onProfile} className={`w-10 h-10 rounded-[18px] overflow-hidden border-2 transition-all cursor-pointer ${selectedRealmId === 'profile' ? 'border-vani-accent scale-110 rounded-xl shadow-[0_0_15px_rgba(255,60,60,0.3)]' : 'border-transparent hover:border-vani-blue hover:rounded-xl'}`}>
                <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-full h-full object-cover" />
             </div>
             {selectedRealmId === 'profile' && <motion.div layoutId="dock-indicator" className={`absolute ${isVertical ? '-left-1 top-1/2 -translate-y-1/2 w-1 h-4' : '-bottom-2 left-1/2 -translate-x-1/2 w-4 h-1'} bg-vani-accent rounded-full`} />}
          </motion.div>
          <div className="relative">
             <DockIcon icon={<Home size={22} />} active={selectedRealmId === 'home'} onClick={() => onSelect({ _id: 'home' })} isVertical={isVertical} />
             {unreadDmCount > 0 && (
               <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-discord-sidebar shadow-lg animate-pulse">
                  {unreadDmCount > 99 ? '99+' : unreadDmCount}
               </div>
             )}
          </div>
          <DockIcon icon={<Compass size={22} />} active={selectedRealmId === 'explore'} onClick={() => onSelect({ _id: 'explore' })} isVertical={isVertical} />
          <DockIcon icon={<Users size={20} />} active={selectedRealmId === 'social'} onClick={onSocial} isVertical={isVertical} />
          {user.isAdmin && (
            <DockIcon 
              icon={<Shield size={20} className="text-vani-blue" />} 
              active={selectedRealmId === 'architect' || realms.some(r => r._id === selectedRealmId && (r as any).isSystem)} 
              onClick={() => {
                const systemRealm = realms.find(r => (r as any).isSystem);
                if (systemRealm) onSelect(systemRealm);
                else onSelect({ _id: 'architect' });
              }} 
              isVertical={isVertical} 
            />
          )}
        </div>

        <div className={`${isVertical ? 'w-8 h-[1px] my-4' : 'w-[1px] h-8 mx-4'} bg-gray-800 flex-shrink-0`} />

        {/* SCROLLABLE REALMS LIST (Non-System Only) */}
        <div className={`flex ${isVertical ? 'flex-col space-y-3' : 'flex-row space-x-3'} py-2`}>
          {realms.filter(r => !(r as any).isSystem).map(realm => (
            <motion.div 
              key={realm._id} 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(realm)} 
              onContextMenu={(e) => handleContextMenu(e, 'realm', realm._id)} 
              className="relative group cursor-pointer flex-shrink-0"
            >
              <div className={`w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center overflow-hidden border ${selectedRealmId === realm._id ? 'bg-vani-gradient border-white/20 shadow-[0_0_15px_rgba(0,210,255,0.3)] scale-110' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                {realm.icon ? <img src={realm.icon} alt="r" className="w-full h-full object-cover" /> : <span className="font-black text-xs text-white uppercase">{realm.name[0]}</span>}
              </div>
              {selectedRealmId === realm._id && <motion.div layoutId="dock-indicator" className={`absolute ${isVertical ? '-left-1 top-1/2 -translate-y-1/2 w-1 h-4' : '-bottom-2 left-1/2 -translate-x-1/2 w-4 h-1'} bg-vani-gradient rounded-full`} />}
            </motion.div>
          ))}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCreate} 
            className="w-10 h-10 rounded-xl bg-gray-800 border border-dashed border-gray-700 flex items-center justify-center text-gray-500 hover:border-vani-blue hover:text-vani-blue transition-all flex-shrink-0"
          >
            <Plus size={20} />
          </motion.button>
        </div>

        <div className={`${isVertical ? 'w-8 h-[1px] my-4' : 'w-[1px] h-8 mx-4'} bg-gray-800 flex-shrink-0`} />

        {/* CENTRAL PAGE INDICATOR (PC ONLY) */}
        {!isVertical && (
          <div className="flex-1 hidden md:flex justify-center items-center pointer-events-none">
             <motion.div 
               key={getActiveLabel()}
               initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
               animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
               className="bg-white/5 border border-white/5 px-6 py-1.5 rounded-full shadow-inner"
             >
                <span className="text-[10px] font-black text-vani-blue uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(0,210,255,0.3)]">
                   {getActiveLabel()}
                </span>
             </motion.div>
          </div>
        )}

        <div className={`flex items-center ${isVertical ? 'flex-col space-y-6 mt-auto' : 'flex-row space-x-6 ml-auto'}`}>
          <div className="relative">
             <div onClick={handleNotifClick} className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${showNotifs ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}><Bell size={20} />{unreadAlerts > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-vani-accent text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-discord-sidebar animate-bounce">{unreadAlerts}</div>}</div>
             <AnimatePresence>
               {showNotifs && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }} 
                   animate={{ opacity: 1, scale: 1 }} 
                   exit={{ opacity: 0, scale: 0.95 }} 
                   className={`fixed ${isVertical ? (position === 'left' ? 'left-20' : 'right-20') : (position === 'top' ? 'top-20' : 'bottom-20')} w-80 bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[2000] overflow-hidden`}
                   onClick={(e) => e.stopPropagation()}
                   style={!isVertical ? { right: '1rem' } : { bottom: '1rem' }}
                 >
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('ui.vani_pulse')}</span>
                       {unreadAlerts > 0 && (
                         <button onClick={handleMarkAllRead} className="text-[9px] font-black text-vani-blue hover:text-white transition-colors uppercase tracking-wider flex items-center space-x-1">
                            <CheckCircle2 size={10} />
                            <span>{t('common.mark_all')}</span>
                         </button>
                       )}
                    </div>
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                       {unreadNotifications.map(n => (
                         <div 
                           key={n._id} 
                           onClick={async (e) => {
                             e.stopPropagation();
                             await api.markNotificationReadById(n._id);
                             fetchMatrixStatus();
                           }}
                           className="p-4 border-b border-white/5 flex items-start space-x-3 hover:bg-white/[0.05] transition-colors cursor-pointer group"
                         >
                           <div className="flex-1 text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors"> 
                             <span className="font-black text-white">{n.sender?.username || 'System'}</span> {n.content}
                           </div>
                           <div className="w-1.5 h-1.5 bg-vani-blue rounded-full mt-1.5 shrink-0" />
                         </div>
                       ))}
                       {unreadNotifications.length === 0 && <div className="p-12 text-center text-[10px] text-gray-600 uppercase font-black tracking-[0.2em]">{t('notifications.empty')}</div>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowNotifs(false); onSeeAllNotifications?.(); }} className="w-full p-3 bg-white/[0.02] text-center text-[9px] font-black text-gray-500 hover:text-white hover:bg-vani-blue/10 cursor-pointer border-t border-white/5 transition-all">{t('common.expand_logs')}</button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
          
          {/* PC ONLY SEARCH */}
          {window.innerWidth >= 768 && (
            <div onClick={onSearch} className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 hover:text-vani-blue hover:bg-gray-700 cursor-pointer transition-all border border-transparent hover:border-vani-blue/20 flex-shrink-0">
               <Search size={20} />
            </div>
          )}
          
          <div onClick={onSettings} className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700 cursor-pointer transition-all border border-transparent hover:border-gray-600 flex-shrink-0">
             <Settings size={20} />
          </div>
        </div>
      </div>
      
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </motion.div>
  );
};

const DockIcon = ({ icon, active, onClick, isVertical }: any) => (
  <motion.div 
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick} 
    className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all relative ${active ? 'bg-vani-gradient text-white shadow-[0_0_15px_rgba(0,210,255,0.3)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
  >
    {icon}
    {active && <motion.div layoutId="dock-indicator" className={`absolute ${isVertical ? '-left-1 top-1/2 -translate-y-1/2 w-1 h-4' : '-bottom-2 left-1/2 -translate-x-1/2 w-4 h-1'} bg-vani-gradient rounded-full`} />}
  </motion.div>
);
