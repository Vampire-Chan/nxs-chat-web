import { Plus, Hash, Volume2, Image as ImageIcon, Megaphone, Settings, ChevronDown, Shield } from 'lucide-react';
import type { IRealm, IChannel, IUser } from '../services/api';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  realm: IRealm | null;
  channels: IChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channel: IChannel) => void;
  user: IUser;
  onAddChannel: () => void;
  onSettings?: () => void;
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
  oversightMode,
  setOversightMode
}: Props) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ announcements: true, categories: true, chat: true, voice: true, media: true, mod: true, talk: true });
  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

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

      <div onClick={onSettings} className="relative h-24 flex flex-col justify-end p-4 border-b border-white/5 shadow-sm group cursor-pointer overflow-hidden transition-all">
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
           <div className="flex items-center space-x-2">
              {realm?.owner === (user.id || user._id) && <Settings size={14} className="text-gray-400 group-hover:text-white drop-shadow-md" />}
              <ChevronDown size={16} className="text-gray-400 group-hover:text-white drop-shadow-md" />
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
