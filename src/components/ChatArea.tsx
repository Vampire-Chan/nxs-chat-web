import { useState, useEffect, useRef } from 'react';
import type { IUser, IMessage, IRealm, IChannel } from '../services/api';
import { api } from '../services/api';
import { Plus, Smile, Sparkles, Phone, Video, Lock, ShieldCheck, Zap, Trash2, Mic, Camera, Image as ImageIcon, File as FileIcon, X, Send, Play, Pause, Settings, Forward, Edit3, AlertTriangle, MoreVertical, Reply, CornerUpRight } from 'lucide-react';
import { CUSTOM_EMOJI_MAP } from './CustomIcons';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ProfileMiniCard } from './ProfileMiniCard';
import { NeuralSuggester } from './NeuralSuggester';
import { useToast } from '../context/ToastContext';

const AudioPlayer = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const togglePlay = () => {
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play();
    setIsPlaying(!isPlaying);
  };
  return (
    <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/5 w-64 mt-2">
      <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} hidden />
      <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-vani-blue/20 flex items-center justify-center text-vani-blue hover:bg-vani-blue/30 transition-all">
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-1" fill="currentColor" />}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-vani-blue" initial={{ width: 0 }} animate={{ width: isPlaying ? '100%' : '0%' }} transition={{ duration: 10, ease: "linear" }} />
        </div>
        <div className="text-[8px] font-mono text-gray-500 mt-1 uppercase tracking-widest">Neural_Voice_Data</div>
      </div>
    </div>
  );
};

interface Props {
  channelName: string;
  messages: IMessage[];
  onSendMessage: (content: string, parentMessageId?: string) => void;
  currentUser: IUser | null;
  channelId: string;
  onViewOtherProfile: (userId: string) => void;
  channelType?: string;
  activeRealm?: IRealm | null;
  activeChannel?: IChannel | null;
  socket?: any;
  onRefreshMatrix?: () => void;
  onGroupSettings?: () => void;
  onOpenMedia?: (type: 'image' | 'video' | 'audio', url: string) => void;
}

export const ChatArea = ({ channelName, messages: initialMessages, onSendMessage, currentUser, channelId, onViewOtherProfile, channelType, activeRealm, activeChannel, socket, onRefreshMatrix, onGroupSettings, onOpenMedia }: Props) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setRecording] = useState<MediaRecorder | null>(null);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [msgContextMenu, setMsgContextMenu] = useState<{ x: number, y: number, msgId: string, isMe: boolean } | null>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  
  const [activeMiniCard, setActiveMiniCard] = useState<{ user: IUser, position: { x: number, y: number } } | null>(null);
  const [suggestion, setSuggestion] = useState<{ query: string, type: 'mention' | 'tag', index: number } | null>(null);
  const [reactionPicker, setReactionPicker] = useState<{ messageId: string, position: { x: number, y: number } } | null>(null);
  
  const [previewFile, setPreviewFile] = useState<{ file: File, type: string, previewUrl: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewCaption, setPreviewCaption] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const longPressTimer = useRef<any>(null);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => { setMessages(initialMessages); }, [initialMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (channelId && currentUser) api.markChannelRead(channelId).then(() => onRefreshMatrix?.()).catch(() => {});
  }, [channelId, messages.length]);

  useEffect(() => {
    if (!socket) return;
    const updateHandler = (updated: IMessage) => {
      setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
    };
    const reactHandler = ({ messageId, reactions }: any) => {
      setMessages(prev => prev.map(m => {
        if (m._id === messageId) return { ...m, reactions };
        return m;
      }));
    };
    socket.on('message_updated', updateHandler);
    socket.on('message_reaction_update', reactHandler);
    return () => { 
      socket.off('message_updated', updateHandler); 
      socket.off('message_reaction_update', reactHandler); 
    };
  }, [socket]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, preferredType?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let type = preferredType || 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';
    setPreviewFile({ file, type, previewUrl: URL.createObjectURL(file) });
    setShowMediaMenu(false);
  };

  const confirmUpload = async () => {
    if (!previewFile) return;
    const fd = new FormData(); fd.append('file', previewFile.file); fd.append('channelId', channelId); fd.append('mediaType', previewFile.type);
    if (previewCaption) fd.append('content', previewCaption);
    try {
      setUploadProgress(0);
      await api.uploadMedia(fd, (pe) => setUploadProgress(Math.round((pe.loaded * 100) / (pe.total || pe.loaded))));
      setPreviewFile(null); setPreviewCaption(''); setUploadProgress(null);
      addToast("Transmission Success", 'success');
    } catch (err: any) { addToast(`Matrix Sync Failed: ${err.message}`, 'error'); setUploadProgress(null); }
  };

  const startRecording = async () => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') return addToast("HTTPS Required", 'error');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const file = new File([new Blob(chunks, { type: 'audio/webm' })], "v_note.webm", { type: 'audio/webm' });
        const fd = new FormData(); fd.append('file', file); fd.append('channelId', channelId); fd.append('mediaType', 'audio');
        try {
          setUploadProgress(0);
          await api.uploadMedia(fd, (pe) => setUploadProgress(Math.round((pe.loaded * 100) / (pe.total || pe.loaded))));
          setUploadProgress(null);
          addToast("Audio Note Synced", 'success');
        } catch (e: any) { addToast("Audio Sync Failed", 'error'); setUploadProgress(null); }
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start(); setRecording(recorder); setIsRecording(true); setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err: any) { addToast(`Access Denied: ${err.message}`, 'error'); }
  };

  const stopRecording = (shouldSend: boolean) => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      if (!shouldSend) mediaRecorder.onstop = () => {};
      mediaRecorder.stop();
    }
    clearInterval(timerRef.current); setIsRecording(false); setRecording(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value; setInput(v);
    const words = v.split(' '); const last = words[words.length - 1] || '';
    if (last.startsWith('@') && last.length > 1) setSuggestion({ query: last, type: 'mention', index: v.lastIndexOf(last) });
    else if (last.startsWith('#') && last.length > 1) setSuggestion({ query: last, type: 'tag', index: v.lastIndexOf(last) });
    else setSuggestion(null);
  };

  const handleSelectSuggestion = (v: string) => {
    if (!suggestion) return;
    setInput(`${input.slice(0, suggestion.index)}${suggestion.type === 'mention' ? '@' : '#'}${v} ${input.slice(suggestion.index + suggestion.query.length)}`);
    setSuggestion(null);
  };

  const handleReact = (messageId: string, emoji: string) => {
    socket?.emit('react_message', { messageId, emoji, userId: currentUser?.id || currentUser?._id, channelId });
    setReactionPicker(null);
  };

  const handleSeverMessage = async (id: string) => {
    try { await api.deleteMessage(id); setMessages(prev => prev.filter(m => m._id !== id)); addToast("Transmission Severed", 'success'); } catch (e) { addToast("Severance failed", 'error'); }
  };

  const handleStartEdit = (msg: IMessage) => {
    setEditingMessageId(msg._id); setEditInput(msg.content); setMsgContextMenu(null);
  };

  const handleFinishEdit = async () => {
    if (!editingMessageId || !editInput.trim()) return;
    try {
      await api.editMessage(editingMessageId, editInput);
      setEditingMessageId(null); setEditInput('');
      addToast("Recalibrated", 'success');
    } catch (e) { addToast("Calibration Failed", 'error'); }
  };

  const onMessageContextMenu = (e: React.MouseEvent, msgId: string, isMe: boolean) => {
    e.preventDefault(); setMsgContextMenu({ x: e.clientX, y: e.clientY, msgId, isMe });
  };

  const handleLongPressStart = (msgId: string, isMe: boolean, e: any) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    longPressTimer.current = setTimeout(() => { setMsgContextMenu({ x, y, msgId, isMe }); }, 500);
  };

  const handleLongPressEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const getRoleColor = (user: IUser) => {
    if (!activeRealm?.roles || !activeRealm?.memberRoles) return '#ffffff';
    const mapping = activeRealm.memberRoles.find(mr => (mr.user as any) === (user._id || user.id));
    if (!mapping) return '#ffffff';
    const role = activeRealm.roles.find(r => r._id === mapping.roleId);
    return role?.color || '#ffffff';
  };

  const renderBadge = (user: IUser) => {
    if (user.isAdmin) return <ShieldCheck size={12} className="text-vani-blue" />;
    return null;
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return (
      <span className="inline-flex flex-wrap items-center gap-x-1">
        {parts.map((part, i) => {
           const trimmed = part.trim();
           if (CUSTOM_EMOJI_MAP[trimmed]) { const EmojiComp = CUSTOM_EMOJI_MAP[trimmed]; return <EmojiComp key={i} />; }
           if (trimmed.startsWith('@')) return <span key={i} className="text-vani-blue font-black">{trimmed}</span>;
           return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const renderMedia = (msg: IMessage) => {
    if (!msg.mediaUrl) return null;
    const type = msg.mediaType as any;
    if (type === 'image') return <div className="mt-2 rounded-2xl overflow-hidden border border-white/5 max-w-sm"><img src={msg.mediaUrl} className="w-full h-auto cursor-zoom-in" onClick={() => onOpenMedia?.('image', msg.mediaUrl!)} /></div>;
    if (type === 'video') return <div className="relative max-w-sm mt-2 rounded-2xl overflow-hidden border border-white/5"><video src={msg.mediaUrl} className="w-full" /><div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer" onClick={() => onOpenMedia?.('video', msg.mediaUrl!)}><Play size={32} className="text-white" /></div></div>;
    if (type === 'audio') return <AudioPlayer url={msg.mediaUrl} />;
    return (
      <a href={msg.mediaUrl} target="_blank" className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 mt-2 hover:bg-white/10 transition-all group max-w-xs">
        <FileIcon className="text-vani-blue" size={24} /><div className="flex-1 min-w-0"><div className="text-xs font-black text-white truncate uppercase tracking-tight">Attachment_{msg._id.slice(-4)}</div><div className="text-[8px] font-mono text-gray-500 uppercase">Binary_Data_Node</div></div><Plus size={16} className="text-gray-500 group-hover:text-white rotate-45" />
      </a>
    );
  };

  const getDisplayName = (sender: IUser | null | undefined) => {
    if (!sender) return 'Deleted_Node';
    if (activeChannel?.nicknames?.[sender._id || sender.id]) return activeChannel.nicknames[sender._id || sender.id];
    return sender.username;
  };

  const isOwner = currentUser && activeRealm?.owner === (currentUser.id || currentUser._id);
  const canPost = channelType !== 'announcement' || isOwner;

  return (
    <div className="flex-1 flex flex-col bg-discord-dark h-full relative" onClick={() => { setShowCustomPicker(false); setReactionPicker(null); setShowMediaMenu(false); setMsgContextMenu(null); }}>
      <AnimatePresence>
        {previewFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0a0a0c] w-full max-w-2xl rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-vani-blue/10 rounded-lg flex items-center justify-center text-vani-blue"><ImageIcon size={18} /></div><span className="text-xs font-black text-white uppercase tracking-widest">Media_Preview</span></div>
                   <button onClick={() => setPreviewFile(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
                   {previewFile.type === 'image' ? <div className="relative group"><img src={previewFile.previewUrl} className="max-h-[40vh] rounded-2xl shadow-2xl transition-transform duration-300" id="p-img" /><button onClick={() => {const i=document.getElementById('p-img'); if(i){const r=(parseInt(i.getAttribute('data-r')||'0')+90)%360; i.style.transform=`rotate(${r}deg)`; i.setAttribute('data-r',r.toString());}}} className="absolute bottom-4 right-4 p-3 bg-black/60 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all"><Zap size={16} /></button></div> : previewFile.type === 'video' ? <video src={previewFile.previewUrl} controls className="max-h-[40vh] rounded-2xl shadow-2xl" /> : <div className="w-full p-10 bg-white/5 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center space-y-4"><FileIcon size={48} className="text-gray-600" /><div className="text-center"><div className="text-sm font-black text-white uppercase">{previewFile.file.name}</div><div className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-widest">{(previewFile.file.size/1024/1024).toFixed(2)} MB</div></div></div>}
                   <div className="w-full mt-8"><div className="bg-white/5 p-4 rounded-2xl border border-white/5"><label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Encryption_Caption</label><input type="text" placeholder="Add a transmission note..." className="bg-transparent w-full outline-none text-white text-sm" value={previewCaption} onChange={(e)=>setPreviewCaption(e.target.value)} /></div></div>
                </div>
                <div className="p-6 border-t border-white/5 bg-black/40">
                   {uploadProgress !== null ? <div className="space-y-3"><div className="flex justify-between text-[10px] font-black uppercase text-vani-blue"><span>Uploading...</span><span>{uploadProgress}%</span></div><div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full bg-vani-gradient" initial={{width:0}} animate={{width:`${uploadProgress}%`}} /></div></div> : <div className="flex space-x-4"><button onClick={()=>setPreviewFile(null)} className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-500 font-black uppercase text-[10px]">Cancel</button><button onClick={confirmUpload} className="flex-[2] py-4 rounded-2xl bg-vani-gradient text-white font-black uppercase text-[10px] shadow-2xl flex items-center justify-center space-x-3"><Send size={16} /><span>Confirm Sync</span></button></div>}
                </div>
             </motion.div>
          </motion.div>
        )}

        {msgContextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed bg-[#0a0a0c] border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[5000] overflow-hidden p-2 min-w-[220px] backdrop-blur-xl"
            style={{ left: Math.min(msgContextMenu.x, window.innerWidth - 240), top: Math.min(msgContextMenu.y, window.innerHeight - 300) }}
            onClick={(e) => e.stopPropagation()}
          >
             {/* EMOJI SLIDER */}
             <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar p-2 bg-white/5 rounded-[24px] mb-2 border border-white/5">
                {Object.keys(CUSTOM_EMOJI_MAP).map(code => {
                  const Icon = CUSTOM_EMOJI_MAP[code];
                  return (
                    <button 
                      key={code} 
                      onClick={() => { handleReact(msgContextMenu.msgId, code); setMsgContextMenu(null); }}
                      className="p-2 hover:bg-white/10 rounded-xl transition-all flex-shrink-0"
                    >
                      <div className="scale-110"><Icon /></div>
                    </button>
                  );
                })}
             </div>

             <div className="space-y-1">
                <ContextItem label="Reply Transmission" icon={<Reply size={14} />} onClick={() => { const m = messages.find(msg => msg._id === msgContextMenu.msgId); if (m) { setReplyingTo(m); setMsgContextMenu(null); } }} />
                {msgContextMenu.isMe && (
                  <>
                    <ContextItem label="Edit Transmission" icon={<Edit3 size={14} />} onClick={() => { const m = messages.find(msg => msg._id === msgContextMenu.msgId); if (m) handleStartEdit(m); }} />
                    <ContextItem label="Sever Transmission" icon={<Trash2 size={14} />} variant="danger" onClick={() => handleSeverMessage(msgContextMenu.msgId)} />
                  </>
                )}
                <ContextItem label="Forward Link" icon={<Forward size={14} />} onClick={() => addToast("Forward Stub", 'info')} />
                <ContextItem label="Report Violation" icon={<AlertTriangle size={14} />} variant="danger" onClick={() => addToast("Oversight notified.", 'info')} />
             </div>
          </motion.div>
        )}

        {reactionPicker && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed bg-[#0a0a0c] border border-white/10 p-2 rounded-2xl shadow-2xl flex gap-2 z-[5000]"
            style={{ left: Math.min(reactionPicker.position.x, window.innerWidth - 200), top: Math.min(reactionPicker.position.y, window.innerHeight - 100) }}
            onClick={(e) => e.stopPropagation()}
          >
             {Object.keys(CUSTOM_EMOJI_MAP).map(code => { const Icon = CUSTOM_EMOJI_MAP[code]; return <div key={code} onClick={() => handleReact(reactionPicker.messageId, code)} className="p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-all"><Icon /></div> })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-discord-sidebar/20 backdrop-blur-md z-10">
         <div className="flex items-center space-x-3">
            <span className="text-vani-blue font-black text-xl">{channelType === 'dm' ? '@' : channelType === 'group_dm' ? '' : '#'}</span>
            <span className="font-black text-white uppercase tracking-tighter text-sm">{(channelType === 'group_dm' ? activeChannel?.name : channelName?.replace(/^@/, '')) || 'Unknown_Link'}</span>
            {channelType === 'group_dm' && <button onClick={onGroupSettings} className="p-1.5 text-gray-500 hover:text-white transition-all bg-white/5 rounded-lg ml-2"><Settings size={14} /></button>}
         </div>
         <div className="flex items-center space-x-4"><button className="p-2 text-gray-500 hover:text-vani-blue"><Phone size={20} /></button><button className="p-2 text-gray-500 hover:text-vani-accent"><Video size={20} /></button></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {messages.map((msg, i) => {
           const isSequence = i > 0 && (messages[i-1].sender?.username === msg.sender?.username);
           const isMe = msg.sender && (msg.sender._id || msg.sender.id) === (currentUser?.id || currentUser?._id);
           const isDeleted = !msg.sender;
           const displayName = getDisplayName(msg.sender);
           const roleColor = msg.sender ? getRoleColor(msg.sender) : '#666666';
           const isEditing = editingMessageId === msg._id;
           const hasReactions = msg.reactions && Object.values(msg.reactions).some(u => u.length > 0);

           return (
             <div key={msg._id || i} className="relative group/msg-outer">
               {msg.parentMessage && !isSequence && (
                 <div className="flex items-center space-x-2 ml-12 mb-1 opacity-40 hover:opacity-100 transition-opacity cursor-pointer overflow-hidden max-w-[80%]" onClick={() => {
                   const el = document.getElementById(`msg-${msg.parentMessage?._id}`);
                   el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                   el?.classList.add('bg-vani-blue/10');
                   setTimeout(() => el?.classList.remove('bg-vani-blue/10'), 2000);
                 }}>
                    <CornerUpRight size={12} className="text-vani-blue" />
                    <img src={msg.parentMessage.sender?.avatar} className="w-4 h-4 rounded-md" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">
                      {msg.parentMessage.sender?.username}: {msg.parentMessage.content || 'Visual_Data'}
                    </span>
                 </div>
               )}
               <MessageItem 
                 msg={msg} 
                 isSequence={isSequence} 
                 isMe={!!isMe} 
                 isDeleted={isDeleted} 
                 displayName={displayName} 
                 roleColor={roleColor} 
                 isEditing={isEditing} 
                 hasReactions={!!hasReactions} 
                 currentUser={currentUser} 
                 activeRealm={activeRealm}
                 onReact={handleReact}
                 onStartEdit={handleStartEdit}
                 onSever={handleSeverMessage}
                 onContext={onMessageContextMenu}
                 onLongPressStart={handleLongPressStart}
                 onLongPressEnd={handleLongPressEnd}
                 onViewProfile={setActiveMiniCard}
                 onReply={() => setReplyingTo(msg)}
                 editInput={editInput}
                 setEditInput={setEditInput}
                 onFinishEdit={handleFinishEdit}
                 setEditingMessageId={setEditingMessageId}
                 renderContent={renderContent}
                 renderMedia={renderMedia}
                 renderBadge={renderBadge}
               />
             </div>
           );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 pt-0 relative pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <AnimatePresence>
          {replyingTo && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-[#0a0a0c] border border-white/5 border-b-0 rounded-t-2xl p-3 flex items-center justify-between">
               <div className="flex items-center space-x-3 overflow-hidden">
                  <Reply size={14} className="text-vani-blue shrink-0" />
                  <div className="text-[10px] text-gray-400 truncate">
                    Replying to <span className="font-black text-white uppercase">{replyingTo.sender?.username}</span>
                    <p className="opacity-50 italic truncate">{replyingTo.content || 'Visual_Data'}</p>
                  </div>
               </div>
               <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={14} /></button>
            </motion.div>
          )}
          {suggestion && <NeuralSuggester query={suggestion.query} type={suggestion.type} onSelect={handleSelectSuggestion} position={{ top: 0, left: 60 }} />}
          {showMediaMenu && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-20 left-6 bg-[#0a0a0c] border border-white/5 p-2 rounded-3xl shadow-2xl z-50 flex space-x-2"><MediaBtn icon={<ImageIcon size={18} />} label="Image" onClick={() => imageInputRef.current?.click()} color="text-blue-500" /><MediaBtn icon={<Camera size={18} />} label="Camera" onClick={() => cameraInputRef.current?.click()} color="text-green-500" /><MediaBtn icon={<FileIcon size={18} />} label="File" onClick={() => fileInputRef.current?.click()} color="text-yellow-500" /><MediaBtn icon={<Mic size={18} />} label="Audio" onClick={startRecording} color="text-red-500" /></motion.div>}
          {isRecording && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-4 bottom-4 bg-[#0a0a0c] border border-red-500/30 p-4 rounded-[32px] shadow-2xl z-50 flex items-center justify-between"><div className="flex items-center space-x-4"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /><span className="font-mono text-white font-black">{Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}</span><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recording...</span></div><div className="flex items-center space-x-3"><button onClick={() => stopRecording(false)} className="p-3 text-gray-500 hover:text-white transition-all"><X size={20} /></button><button onClick={() => stopRecording(true)} className="w-12 h-12 bg-vani-gradient rounded-2xl flex items-center justify-center text-white shadow-lg"><Send size={20} /></button></div></motion.div>}
          {showCustomPicker && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-20 right-6 bg-[#0a0a0c] border border-white/5 p-4 rounded-[32px] shadow-2xl grid grid-cols-3 gap-4 z-50">{Object.keys(CUSTOM_EMOJI_MAP).map(code => { const Icon = CUSTOM_EMOJI_MAP[code]; return <div key={code} onClick={() => setInput(prev => prev + ' ' + code + ' ')} className="p-3 bg-white/5 rounded-2xl hover:bg-vani-blue/20 cursor-pointer transition-all flex items-center justify-center"><Icon /></div> })}</motion.div>}
          {uploadProgress !== null && !previewFile && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-vani-blue/10 backdrop-blur-md border border-vani-blue/30 px-6 py-3 rounded-2xl shadow-2xl z-[60] flex items-center space-x-4 min-w-[240px]"><div className="w-2 h-2 bg-vani-blue rounded-full animate-ping" /><div className="flex-1"><div className="flex justify-between items-center mb-1"><span className="text-[8px] font-black text-white uppercase tracking-widest">Neural_Syncing...</span><span className="text-[10px] font-mono text-vani-blue">{uploadProgress}%</span></div><div className="h-1 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-vani-blue" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} /></div></div></motion.div>}
        </AnimatePresence>
        <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFileUpload(e)} />
        <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
        <input type="file" ref={cameraInputRef} hidden accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e, 'image')} />
        {canPost ? (
          <div className={`bg-discord-sidebar p-1.5 flex items-center space-x-2 border transition-all shadow-2xl border-gray-800 min-h-[56px] ${replyingTo ? 'rounded-b-[32px]' : 'rounded-[32px]'}`}>
             <button onClick={(e) => { e.stopPropagation(); setShowMediaMenu(!showMediaMenu); }} className={`w-10 h-10 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-vani-blue hover:text-white transition-all ml-1 shrink-0 ${showMediaMenu ? 'bg-vani-blue text-white rotate-45' : ''}`}><Plus size={18} /></button>
             
             <textarea 
               placeholder={`Secure Transmission...`} 
               className="bg-transparent flex-1 focus:outline-none text-gray-200 placeholder-gray-600 py-2.5 text-sm font-medium resize-none max-h-32 min-h-[24px] leading-tight custom-scrollbar" 
               rows={1}
               value={input} 
               onChange={(e) => {
                 handleInputChange(e as any);
                 e.target.style.height = 'auto';
                 e.target.style.height = e.target.scrollHeight + 'px';
               }} 
               onKeyDown={(e) => { 
                 if (e.key === 'Enter' && !e.shiftKey) { 
                   if (!isMobile) {
                     e.preventDefault(); 
                     if (input.trim()) {
                       onSendMessage(input, replyingTo?._id); setInput(''); setReplyingTo(null);
                       e.currentTarget.style.height = 'auto';
                     }
                   }
                 } 
               }} 
             />

             <div className="flex items-center space-x-1 pr-2 shrink-0">
                {!isMobile && <div onClick={(e) => { e.stopPropagation(); setShowCustomPicker(!showCustomPicker); }} className="w-9 h-9 flex items-center justify-center cursor-pointer text-gray-500 hover:text-vani-accent transition"><Sparkles size={18} /></div>}
                <button 
                  onClick={() => { if (input.trim()) { onSendMessage(input, replyingTo?._id); setInput(''); setReplyingTo(null); const el = document.querySelector('textarea'); if (el) el.style.height = 'auto'; } }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${input.trim() ? 'bg-vani-gradient text-white shadow-lg' : 'text-gray-600 grayscale'}`}
                >
                   <Send size={16} />
                </button>
             </div>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-3 flex items-center justify-center space-x-3 text-gray-600 grayscale grayscale-100"><Lock size={14} /><span className="text-[9px] font-black uppercase tracking-[0.3em]">Read-Only Protocol Active</span></div>
        )}
      </div>
      {activeMiniCard && <ProfileMiniCard user={activeMiniCard.user} isMe={(activeMiniCard.user._id || activeMiniCard.user.id) === (currentUser?.id || currentUser?._id)} isFollowing={currentUser?.following?.some((f:any) => (f._id || f) === (activeMiniCard.user._id || activeMiniCard.user.id)) || false} onViewFull={() => { onViewOtherProfile(activeMiniCard.user._id || activeMiniCard.user.id); setActiveMiniCard(null); }} onStartDM={() => { onViewOtherProfile(activeMiniCard.user._id || activeMiniCard.user.id); setActiveMiniCard(null); }} onFollow={async () => { try { await api.syncIdentity(activeMiniCard.user._id || activeMiniCard.user.id); addToast("Sync Request Buffered", 'success'); } catch(e){} }} onClose={() => setActiveMiniCard(null)} position={activeMiniCard.position} />}
    </div>
  );
};

const MessageItem = ({ msg, isSequence, isMe, isDeleted, displayName, roleColor, isEditing, hasReactions, currentUser, onReact, onStartEdit, onSever, onContext, onLongPressStart, onLongPressEnd, onViewProfile, onReply, editInput, setEditInput, onFinishEdit, setEditingMessageId, renderContent, renderMedia, renderBadge }: any) => {
  const x = useMotionValue(0);
  const swipeThreshold = 60;
  const opacity = useTransform(x, [0, swipeThreshold], [0, 1]);
  const scale = useTransform(x, [0, swipeThreshold], [0.5, 1.2]);

  return (
    <motion.div 
      id={`msg-${msg._id}`}
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      drag="x"
      dragConstraints={{ left: 0, right: swipeThreshold + 20 }}
      dragElastic={0.2}
      style={{ x, marginTop: isSequence ? 'calc(var(--vani-spacing) * 0.1)' : 'var(--vani-spacing)', marginBottom: hasReactions ? '1rem' : '0' }}
      onDragEnd={(_, info) => { if (info.offset.x > swipeThreshold) { onReply(); x.set(0); } else { x.set(0); } }}
      className={`flex space-x-4 group/msg ${isDeleted ? 'opacity-50' : ''} relative transition-colors duration-500 rounded-xl p-1`} 
      onContextMenu={!isDeleted ? (e) => onContext(e, msg._id, !!isMe) : undefined} 
      onTouchStart={!isDeleted ? (e) => onLongPressStart(msg._id, !!isMe, e) : undefined} 
      onTouchEnd={onLongPressEnd}
    >
      {/* SWIPE REPLY INDICATOR */}
      <motion.div style={{ opacity, scale }} className="absolute -left-10 top-1/2 -translate-y-1/2 text-vani-blue">
         <Reply size={20} />
      </motion.div>

      {/* FLOATING ACTION BAR (OVERLAY) */}
      {!isDeleted && !isEditing && (
        <div className="absolute -top-4 right-0 opacity-0 group-hover/msg:opacity-100 transition-all z-20 flex items-center bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl overflow-hidden p-0.5 pointer-events-auto">
           <button 
             onClick={(e) => { e.stopPropagation(); const r=e.currentTarget.getBoundingClientRect(); onReact(msg._id, ':matrix:'); }} 
             className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-vani-blue transition-colors"
           >
             <Smile size={14} />
           </button>
           <button onClick={onReply} className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
             <Reply size={14} />
           </button>
           {isMe && (
             <button onClick={() => onStartEdit(msg)} className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
               <Edit3 size={14} />
             </button>
           )}
           <button className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
             <MoreVertical size={14} />
           </button>
        </div>
      )}

      {!isSequence ? (
        <div 
          onClick={(e) => { 
            if (isDeleted) return;
            const rect = e.currentTarget.getBoundingClientRect(); 
            onViewProfile({ user: msg.sender, position: { x: rect.left + 50, y: Math.min(rect.top, window.innerHeight - 400) } }); 
          }} 
          className={`w-9 h-9 rounded-xl bg-gray-800 flex-shrink-0 mt-1 overflow-hidden border border-gray-800 transition-all ${!isDeleted ? 'cursor-pointer hover:border-vani-blue' : ''}`}
        >
          <img src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.username || 'deleted'}`} className="w-full h-full object-cover" />
        </div>
      ) : <div className="w-9 flex-shrink-0" />}
        <div className="min-w-0 flex-1 relative">
           {!isSequence && (
             <div className="flex items-center space-x-2 mb-0.5">
               <span style={{ color: roleColor }} className="font-black uppercase tracking-tighter text-[11px] cursor-pointer hover:underline text-white">
                 {displayName}
               </span>
               {msg.sender && renderBadge(msg.sender)}
               <span className="text-[8px] text-gray-600 font-mono uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
             </div>
           )}
           <div className="text-gray-300 text-sm leading-snug group-hover/msg:bg-white/[0.02] px-2 py-0.5 rounded-lg transition-colors relative whitespace-pre-wrap break-all max-w-full">
              {isEditing ? (
             <div className="space-y-2 py-2">
                <textarea 
                  className="w-full bg-[#050507] border border-vani-blue/50 p-3 rounded-xl text-white outline-none resize-none" 
                  rows={2} 
                  value={editInput} 
                  onChange={(e) => setEditInput(e.target.value)} 
                  autoFocus 
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onFinishEdit(); } 
                    if (e.key === 'Escape') setEditingMessageId(null); 
                  }} 
                />
                <div className="text-[8px] font-black uppercase text-gray-500">SHIFT+ENTER for new line • ESC to cancel • ENTER to save</div>
             </div>
           ) : (
             <>
               {isDeleted ? (
                 <div className="italic text-[10px] text-gray-600 uppercase tracking-widest py-1 flex items-center gap-2">
                   <Lock size={10} /> Transmission_Purged_By_Author
                 </div>
               ) : (
                 <>
                   {msg.content && <div className="markdown-content">{renderContent(msg.content)}</div>}
                   {renderMedia(msg)}
                 </>
               )}
             </>
           )}
           
           {/* REACTION CHIPS (OVERLAY STYLE) */}
           {!isEditing && !isDeleted && hasReactions && (
             <div className="flex flex-wrap gap-1 mt-1 absolute -bottom-4 left-2 z-10 pointer-events-auto">
               {msg.reactions && Object.entries(msg.reactions).map(([emoji, users]) => users.length > 0 && (
                 <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }} 
                   animate={{ scale: 1, opacity: 1 }}
                   key={emoji} 
                   onClick={(e) => { e.stopPropagation(); onReact(msg._id, emoji); }} 
                   className={`px-1.5 py-0.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-all shadow-lg backdrop-blur-md ${users.includes(currentUser?.id || currentUser?._id || '') ? 'bg-vani-blue/20 border-vani-blue/40 text-white' : 'bg-[#0a0a0c]/80 border-white/10 text-gray-400'}`}
                 >
                   {CUSTOM_EMOJI_MAP[emoji] ? (() => {const C=CUSTOM_EMOJI_MAP[emoji]; return <div className="scale-50"><C/></div>;})() : <span className="text-[10px]">{emoji}</span>}
                   <span className="text-[9px] font-black">{users.length}</span>
                 </motion.div>
               ))}
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const ContextItem = ({ label, icon, onClick, variant }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-black uppercase tracking-tight transition-all ${variant === 'danger' ? 'text-red-500 hover:bg-red-500 hover:text-white' : 'text-gray-400 hover:bg-vani-blue hover:text-white'}`}>
    {icon} <span>{label}</span>
  </button>
);

const MediaBtn = ({ icon, label, onClick, color }: any) => (
  <button onClick={onClick} className={`p-4 bg-white/5 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:bg-white/10 transition-all border border-transparent hover:border-white/5`}><div className={color}>{icon}</div><span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{label}</span></button>
);
