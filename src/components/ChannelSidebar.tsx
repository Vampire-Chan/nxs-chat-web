import { Plus, Hash, Volume2, Image as ImageIcon, Megaphone, Settings, ChevronDown, Shield, UserPlus, LogOut, ShieldX } from 'lucide-react';
import type { IRealm, IChannel, IUser } from '../services/api';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ContextMenu } from './ContextMenu';

export const hasRealmPermission = (realm: IRealm | null, userId: string | undefined, permission: string): boolean => {
  if (!realm || !userId) return false;
  if (realm.owner === userId) return true;

  // Get the user's role in this realm
  const userRoleMapping = realm.memberRoles?.find(mr => (mr.user as any) === userId || (mr.user as any)?._id === userId);

  // Apply everyone role if exists
  const everyoneRole = realm.roles?.find(r => r.key === 'everyone');
  const permissions = new Set<string>(everyoneRole?.permissions || []);

  if (userRoleMapping) {
    const assignedRole = realm.roles?.find(r => r._id === userRoleMapping.roleId);
    if (assignedRole) {
      assignedRole.permissions.forEach(p => permissions.add(p));
    }
  }

  if (permissions.has('ADMINISTRATOR')) return true;
  return permissions.has(permission);
};


interface Props {
  realm: IRealm | null;
  channels: IChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channel: IChannel) => void;
  user: IUser;
  onAddChannel: () => void;
  onSettings?: () => void;
  onLeaveRealm?: (id: string) => void;
  onDeleteRealm?: (id: string) => void;
  onManageInvites?: (id: string) => void;
  oversightMode?: boolean;
  setOversightMode?: (val: boolean) => void;
}

export const ChannelSidebar = ({ 
  realm, 
  channels, 
  selectedChannelId, 
  onSelectChannel, 
  user, 
  onAddChannel, 
  onSettings,
  onLeaveRealm,
  onDeleteRealm,
  onManageInvites,
  oversightMode,
  setOversightMode
}: Props) => {
  const { t } = useLanguage();
  const userId = user.id || user._id;
  const canManageRealm = realm && (
    realm.owner === userId ||
    hasRealmPermission(realm, userId, 'MANAGE_REALM') ||
    hasRealmPermission(realm, userId, 'MANAGE_ROLES') ||
    hasRealmPermission(realm, userId, 'MANAGE_CHANNELS') ||
    hasRealmPermission(realm, userId, 'MANAGE_CATEGORIES')
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ announcements: true, categories: true, chat: true, voice: true, media: true, mod: true, talk: true });
  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const [dropdownMenu, setDropdownMenu] = useState<{ x: number; y: number; items: any[] } | null>(null);

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!realm) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left;
    const y = rect.bottom + window.scrollY + 8;

    const isOwner = realm.owner === userId;
    const canCreateChannel = isOwner || hasRealmPermission(realm, userId, 'MANAGE_CHANNELS');
    const canCreateCategory = isOwner || hasRealmPermission(realm, userId, 'MANAGE_CATEGORIES');

    const items = [];

    if (canCreateChannel) {
      items.push({
        label: t('modals.new_sector') || 'Create Channel',
        icon: <Plus size={14} />,
        onClick: () => onAddChannel()
      });
    }

    if (canCreateCategory) {
      items.push({
        label: 'Create Category',
        icon: <Plus size={14} />,
        onClick: () => onAddChannel()
      });
    }

    items.push({
      label: t('common.invite') || 'Invite Friends',
      icon: <UserPlus size={14} />,
      onClick: () => onManageInvites?.(realm._id)
    });

    items.push({ type: 'divider' });

    if (isOwner) {
      items.push({
        label: t('common.collapse') || 'Delete Realm',
        icon: <ShieldX size={14} />,
        variant: 'danger' as const,
        onClick: () => onDeleteRealm?.(realm._id)
      });
    } else {
      items.push({
        label: t('common.sever') || 'Leave Realm',
        icon: <LogOut size={14} />,
        variant: 'danger' as const,
        onClick: () => onLeaveRealm?.(realm._id)
      });
    }

    setDropdownMenu({ x, y, items });
  };

  const isSystem = (realm as any)?.isSystem || realm?.name === "Architect_Nexus";

  // --- SYSTEM REALM CATEGORIES ---
  const modChannels = channels.filter(c => c.type.startsWith('mod_'));
  const modTalkChannels = channels.filter(c => c.type === 'text' && isSystem);
  
  // --- STANDARD CATEGORIES ---
  const announcements = channels.filter(c => c.type === 'announcement');
  const categories = channels.filter(c => c.type === 'category');
  const chatChannels = channels.filter(c => c.type === 'text' && !isSystem);
  const voiceChannels = channels.filter(c => c.type === 'voice');
  const richMediaChannels = channels.filter(c => ['media', 'gallery', 'matrix', 'feed', 'reels'].includes(c.type));

  return (
    <div className="flex-1 flex flex-col bg-discord-channel h-full border-r border-white/5">
      {/* SYSTEM MODE TOGGLE */}
      {isSystem && (
        <div className="p-4 bg-black/20 border-b border-white/5">
           <button 
             onClick={() => setOversightMode?.(!oversightMode)}
             className={`w-full py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 ${oversightMode ? 'bg-vani-blue text-black shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
           >
              <Shield size={14} /> {oversightMode ? 'Oversight Active' : 'Enter Oversight'}
           </button>
        </div>
      )}

      <div 
        className="relative h-24 flex flex-col justify-end p-4 border-b border-white/5 shadow-sm group overflow-hidden cursor-default"
      >
         {realm?.banner && (
           <div className="absolute inset-0 z-0">
             <img src={realm.banner} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
           </div>
         )}
         <div className="relative z-10 flex items-center justify-between w-full">
           <div className="flex flex-col">
              <h2 className="text-sm font-black text-white uppercase tracking-tighter truncate max-w-[140px] drop-shadow-lg">{realm?.name || t('ui.loading_node')}</h2>
              <div className="text-[8px] font-black text-vani-blue uppercase tracking-[0.2em] drop-shadow-md">{(realm?.tier || t('common.standard')).toUpperCase()}_REALM</div>
           </div>
           <div className="flex items-center space-x-1.5">
              {canManageRealm && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onSettings?.(); }} 
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                  title={t('nav.settings')}
                >
                  <Settings size={14} className="drop-shadow-md" />
                </button>
              )}
              <button 
                onClick={handleArrowClick} 
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronDown size={16} className="drop-shadow-md" />
              </button>
           </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6 pt-4">
         {/* SYSTEM MODERATION CATEGORY */}
         {isSystem && modChannels.length > 0 && (
           <div className="space-y-1">
              <CornerHeader label="COMMAND CENTER" onToggle={() => toggle('mod')} />
              {expanded.mod && modChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Shield size={14} className="text-vani-blue" />} />)}
           </div>
         )}

         {isSystem && modTalkChannels.length > 0 && (
           <div className="space-y-1">
              <CornerHeader label="MODERATOR TALKS" onToggle={() => toggle('talk')} />
              {expanded.talk && modTalkChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Hash size={16} />} />)}
           </div>
         )}

         {/* STANDARD CHANNELS (ONLY SHOWN FOR NON-SYSTEM OR AS FALLBACK) */}
         {!isSystem && announcements.length > 0 && (
           <div className="space-y-1">
              <CornerHeader label={t('channels.announcements')} onToggle={() => toggle('announcements')} />
              {expanded.announcements && announcements.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Megaphone size={14} className="text-vani-accent" />} />)}
           </div>
         )}

         {!isSystem && (
           <div className="space-y-1">
              <CornerHeader label="Categories" onToggle={() => toggle('categories')} onAdd={onAddChannel} />
              {expanded.categories && categories.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<ChevronDown size={14} />} />)}
           </div>
         )}
         
         {!isSystem && (
           <div className="space-y-1">
              <CornerHeader label={t('channels.text')} onToggle={() => toggle('chat')} onAdd={onAddChannel} />
              {expanded.chat && chatChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Hash size={16} />} />)}
         </div>
         )}

         {voiceChannels.length > 0 && (
           <div className="space-y-1">
              <CornerHeader label={isSystem ? "VOICE LINKS" : t('channels.voice')} onToggle={() => toggle('voice')} />
              {expanded.voice && voiceChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Volume2 size={16} />} />)}
           </div>
         )}

         {richMediaChannels.length > 0 && (
           <div className="space-y-1">
              <CornerHeader label={isSystem ? "MEDIA MATRIX" : t('channels.media')} onToggle={() => toggle('media')} onAdd={!isSystem ? onAddChannel : undefined} />
              {expanded.media && richMediaChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<ImageIcon size={16} />} />)}
           </div>
         )}
      </div>

      {dropdownMenu && (
        <ContextMenu 
          x={dropdownMenu.x} 
          y={dropdownMenu.y} 
          items={dropdownMenu.items} 
          onClose={() => setDropdownMenu(null)} 
        />
      )}
    </div>
  );
};

const CornerHeader = ({ label, onToggle, onAdd }: any) => (
  <div className="flex items-center justify-between px-2 mb-1 group">
     <div onClick={(e) => { e.stopPropagation(); onToggle(); }} className="flex items-center space-x-1 cursor-pointer text-gray-500 hover:text-gray-300 transition-colors"><span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
     {onAdd && <Plus size={14} className="text-gray-500 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); onAdd(); }} />}
  </div>
);

const ChannelItem = ({ channel, active, onClick, icon, membersInVoice }: any) => (
  <div className="space-y-0.5">
    <div 
      onClick={onClick} 
      className={`group flex items-center space-x-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
    >
      <div className={`${active ? 'text-vani-blue' : 'text-gray-600'}`}>{icon}</div>
      <span className={`text-xs font-bold uppercase tracking-tight ${active ? 'text-white' : ''}`}>{channel.name}</span>
    </div>
    
    {/* VOICE MEMBERS LIST */}
    {channel.type === 'voice' && membersInVoice && membersInVoice.length > 0 && (
      <div className="ml-9 pb-2 space-y-1">
        {membersInVoice.map((m: any) => (
          <div key={m._id} className="flex items-center space-x-2 opacity-60">
            <img src={m.avatar} className="w-4 h-4 rounded-md" />
            <span className="text-[9px] font-black text-gray-400 uppercase truncate">{m.username}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);
