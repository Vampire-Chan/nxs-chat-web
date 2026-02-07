import { Hash, Image as ImageIcon, Settings, Plus, Film, Mic } from 'lucide-react';
import type { IRealm, IChannel, IUser } from '../services/api';

interface Props {
  realm: IRealm | null;
  channels: IChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channel: IChannel) => void;
  user: IUser | null;
  onLogout: () => void;
  onAddChannel?: () => void;
}

export const ChannelSidebar = ({ realm, channels, selectedChannelId, onSelectChannel, user, onAddChannel }: Props) => {
  if (!realm) return <div className="w-60 bg-discord-channel border-r border-gray-900" />;

  const textChannels = channels.filter(c => c.type === 'text');
  const feedChannels = channels.filter(c => c.type === 'feed' || c.type === 'reels');
  const voiceChannels = channels.filter(c => c.type === 'voice');
  const isOwner = realm.owner === (user?.id || user?._id);

  return (
    <div className="w-60 bg-discord-channel flex flex-col h-full border-r border-gray-900">
      {/* Realm Header */}
      <div className="h-12 border-b border-gray-900 flex items-center justify-between px-4 hover:bg-white/[0.03] transition cursor-pointer group">
        <span className="font-black text-white uppercase tracking-wider text-[10px] truncate">{realm.name}</span>
        {isOwner && (
          <Plus 
            size={14} 
            className="text-gray-500 hover:text-nexus-blue transition-colors" 
            onClick={(e) => { e.stopPropagation(); onAddChannel?.(); }}
          />
        )}
      </div>

      {/* Channel List */}
      <div className="p-2 space-y-0.5 overflow-y-auto flex-1 custom-scrollbar">
        
        {/* VOICE CHANNELS */}
        {voiceChannels.length > 0 && (
          <div className="pt-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Neural Links
          </div>
        )}
        {voiceChannels.map(channel => (
          <ChannelItem 
            key={channel._id} 
            channel={channel} 
            active={selectedChannelId === channel._id} 
            onClick={() => onSelectChannel(channel)} 
          />
        ))}

        {/* FEEDS & REELS */}
        {feedChannels.length > 0 && (
          <div className="pt-4 px-2 flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Visual Matrix</span>
          </div>
        )}
        {feedChannels.map(channel => (
          <ChannelItem 
            key={channel._id} 
            channel={channel} 
            active={selectedChannelId === channel._id} 
            onClick={() => onSelectChannel(channel)} 
          />
        ))}

        {/* CHATS */}
        {textChannels.length > 0 && (
           <div className="pt-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
             Encrypted Comms
           </div>
        )}
        {textChannels.map(channel => (
          <ChannelItem 
            key={channel._id} 
            channel={channel} 
            active={selectedChannelId === channel._id} 
            onClick={() => onSelectChannel(channel)} 
          />
        ))}

      </div>
    </div>
  );
};

const ChannelItem = ({ channel, active, onClick }: { channel: IChannel, active: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`group flex items-center px-2 py-1.5 rounded-xl mx-1 cursor-pointer transition-all ${active ? 'bg-nexus-gradient text-white shadow-md shadow-red-500/10' : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'}`}
  >
    <div className={`mr-2 transition-colors ${active ? 'text-white' : 'text-gray-500 group-hover:text-nexus-blue'}`}>
       {channel.type === 'voice' ? <Mic size={16} /> : channel.type === 'reels' ? <Film size={16} /> : channel.type === 'feed' ? <ImageIcon size={16} /> : <Hash size={16} />}
    </div>
    <span className={`text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-gray-400'}`}>{channel.name}</span>
  </div>
);