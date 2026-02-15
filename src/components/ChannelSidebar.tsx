import { Plus, Hash, Volume2, Image as ImageIcon, Megaphone, Settings, ChevronDown } from 'lucide-react';
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
}

export const ChannelSidebar = ({ 
  realm, 
  channels, 
  selectedChannelId, 
  onSelectChannel, 
  user, 
  onAddChannel, 
  onSettings 
}: Props) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState({ announcements: true, chat: true, voice: true, media: true });
  const toggle = (key: keyof typeof expanded) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const announcements = channels.filter(c => c.type === 'announcement');
  const chatChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');
  const mediaChannels = channels.filter(c => c.type === 'feed' || c.type === 'reels');

  return (
    <div className="flex-1 flex flex-col bg-discord-channel h-full border-r border-white/5">
      <div onClick={onSettings} className="relative h-24 flex flex-col justify-end p-4 border-b border-white/5 shadow-sm group cursor-pointer overflow-hidden transition-all">
         {realm?.banner && (
           <div className="absolute inset-0 z-0">
             <img src={realm.banner} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
           </div>
         )}
         <div className="relative z-10 flex items-center justify-between w-full">
           <div className="flex flex-col">
              <h2 className="text-sm font-black text-white uppercase tracking-tighter truncate max-w-[140px] drop-shadow-lg">{realm?.name || 'Loading_Node'}</h2>
              <div className="text-[8px] font-black text-vani-blue uppercase tracking-[0.2em] drop-shadow-md">{realm?.tier || 'STANDARD'}_REALM</div>
           </div>
           <div className="flex items-center space-x-2">
              {realm?.owner === (user.id || user._id) && <Settings size={14} className="text-gray-400 group-hover:text-white drop-shadow-md" />}
              <ChevronDown size={16} className="text-gray-400 group-hover:text-white drop-shadow-md" />
           </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6 pt-4">
         {announcements.length > 0 && (
           <div className="space-y-1">
              <CornerHeader label={t('help.realms')} onToggle={() => toggle('announcements')} />
              {expanded.announcements && announcements.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Megaphone size={14} className="text-vani-accent" />} />)}
           </div>
         )}
         <div className="space-y-1">
            <CornerHeader label={t('nav.social')} onToggle={() => toggle('chat')} onAdd={onAddChannel} />
            {expanded.chat && chatChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Hash size={16} />} />)}
         </div>
         <div className="space-y-1">
            <CornerHeader label={t('help.matrix')} onToggle={() => toggle('voice')} />
            {expanded.voice && voiceChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<Volume2 size={16} />} />)}
         </div>
         <div className="space-y-1">
            <CornerHeader label={t('nav.explore')} onToggle={() => toggle('media')} />
            {expanded.media && mediaChannels.map(c => <ChannelItem key={c._id} channel={c} active={selectedChannelId === c._id} onClick={() => onSelectChannel(c)} icon={<ImageIcon size={16} />} />)}
         </div>
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

const ChannelItem = ({ channel, active, onClick, icon }: any) => (
  <div onClick={onClick} className={`group flex items-center space-x-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}><div className={`${active ? 'text-vani-blue' : 'text-gray-600'}`}>{icon}</div><span className={`text-xs font-bold uppercase tracking-tight ${active ? 'text-white' : ''}`}>{channel.name}</span></div>
);
