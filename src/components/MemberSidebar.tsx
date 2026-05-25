import { useState, useEffect } from 'react';
import type { IUser } from '../services/api';

interface Props {
  members: IUser[];
  onMemberClick: (userId: string) => void;
  currentUser: IUser;
}

export const MemberSidebar = ({ members, onMemberClick, currentUser }: Props) => {
  const [localMembers, setLocalMembers] = useState(members);

  // Sync with props (via effect, not during render)
  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  return (
    <div className="w-64 bg-discord-channel hidden lg:flex flex-col p-4 space-y-6 overflow-y-auto h-full border-l border-gray-900 relative font-mono">
      <div>
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 ml-2">Identities — {members.length}</h3>
        <div className="space-y-1">
          {localMembers.map(member => {
            const memberId = member._id || member.id;
            const isMe = memberId === (currentUser.id || currentUser._id);
            const isFollowing = currentUser.following?.some((f: any) => (f._id || f || '').toString() === memberId.toString());

            return (
              <div 
                key={memberId} 
                onClick={(e) => (window as any).__vani_show_mini_profile?.(e, member)}
                className={`group flex items-center p-2 rounded-xl transition-all duration-200 hover:bg-white/[0.03] cursor-pointer`}
              >
                {/* Avatar */}
                <div className="relative mr-3">
                  <div className={`w-9 h-9 rounded-xl bg-gray-800 overflow-hidden border border-gray-700 group-hover:border-vani-blue transition-all ${isMe ? 'border-vani-blue/50' : ''}`}>
                    <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} className="w-full h-full object-cover" alt="u" />
                  </div>
                  {isMe && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-vani-blue rounded-full border-2 border-discord-channel shadow-lg" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-black truncate uppercase tracking-tighter ${isMe ? 'text-vani-blue' : 'text-gray-200'}`}>
                      {member.username}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono truncate">
                    {isMe ? 'OWN_IDENTITY' : isFollowing ? 'SYNC_ACTIVE' : 'NODE_GUEST'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
