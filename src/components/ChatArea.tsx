import { useState, useEffect, useRef } from 'react';
import type { IUser, IMessage } from '../services/api';
import { api } from '../services/api';
import { Plus, Smile, Sparkles, Phone, Video, MoreVertical, X, Send, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { CUSTOM_EMOJI_MAP } from './CustomIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { CropModal } from './CropModal';
import { ProfileMiniCard } from './ProfileMiniCard';
import { NeuralSuggester } from './NeuralSuggester';
import axios from 'axios';

interface Props {
  channelName: string;
  messages: IMessage[];
  onSendMessage: (content: string) => void;
  currentUser: IUser | null;
  channelId: string;
  onViewOtherProfile: (userId: string) => void;
}

export const ChatArea = ({ channelName, messages, onSendMessage, currentUser, channelId, onViewOtherProfile }: Props) => {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMiniCard, setActiveMiniCard] = useState<{ user: IUser, position: { x: number, y: number } } | null>(null);
  const [suggestion, setSuggestion] = useState<{ query: string, type: 'mention' | 'tag', index: number } | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setSuggestion({ query: lastWord, type: 'mention', index: value.lastIndexOf(lastWord) });
    } else if (lastWord.startsWith('#') && lastWord.length > 1) {
      setSuggestion({ query: lastWord, type: 'tag', index: value.lastIndexOf(lastWord) });
    } else {
      setSuggestion(null);
    }
  };

  const handleSelectSuggestion = (value: string) => {
    if (!suggestion) return;
    const prefix = input.slice(0, suggestion.index);
    const suffix = input.slice(suggestion.index + suggestion.query.length);
    setInput(`${prefix}${suggestion.type === 'mention' ? '@' : '#'}${value} ${suffix}`);
    setSuggestion(null);
  };

  const handleSenderClick = (e: React.MouseEvent, user: IUser) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveMiniCard({ user, position: { x: rect.left + 50, y: Math.min(rect.top, window.innerHeight - 400) } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isUploading) {
      e.preventDefault();
      if (input.trim()) { onSendMessage(input); setInput(''); setSuggestion(null); }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) setTempImage(URL.createObjectURL(file));
      else uploadMedia(file);
    }
  };

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [pixelCrop, setPixelCrop] = useState<any>(null);

  const uploadMedia = async (fileBlob: Blob) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', fileBlob, 'upload.jpg');
    fd.append('content', input);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/channels/${channelId}/messages`, fd, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
      });
      setInput('');
    } catch (err) { alert("Fail"); }
    finally { setIsUploading(false); setTempImage(null); }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return (
      <span>
        {parts.map((part, i) => {
           if (CUSTOM_EMOJI_MAP[part.trim()]) {
             const Icon = CUSTOM_EMOJI_MAP[part.trim()];
             return <span key={i} className="inline-block align-middle mx-0.5"><Icon size={20} /></span>;
           }
           return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-discord-dark min-w-0 h-full relative" onClick={() => { setShowEmojiPicker(false); setShowCustomPicker(false); }}>
      <div className="h-16 border-b border-gray-900 flex items-center justify-between px-6 shadow-xl bg-discord-sidebar/20 backdrop-blur-md z-10">
         <div className="flex items-center space-x-3"><span className="text-nexus-blue font-black text-xl">#</span><span className="font-black text-white uppercase tracking-tighter">{channelName}</span></div>
         <div className="flex items-center space-x-4"><button className="p-2 text-gray-500 hover:text-nexus-blue transition-colors"><Phone size={20} /></button><button className="p-2 text-gray-500 hover:text-nexus-accent transition-colors"><Video size={20} /></button><div className="w-[1px] h-6 bg-gray-800 mx-2" /><button className="p-2 text-gray-500 hover:text-white transition-colors"><MoreVertical size={20} /></button></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, i) => {
           const isSequence = i > 0 && (messages[i-1].sender.username === msg.sender.username);
           return (
             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={msg._id || i} className={`flex space-x-4 group ${isSequence ? 'mt-1' : 'mt-6'}`}>
               {!isSequence ? (
                 <div onClick={(e) => handleSenderClick(e, msg.sender)} className="w-10 h-10 rounded-xl bg-gray-800 flex-shrink-0 mt-1 overflow-hidden border border-gray-800 cursor-pointer hover:border-nexus-blue transition-all"><img src={msg.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender.username}`} alt="u" className="w-full h-full object-cover" /></div>
               ) : <div className="w-10 flex-shrink-0" />}
               <div className="min-w-0 flex-1">
                 {!isSequence && (
                    <div className="flex items-baseline space-x-3 mb-1"><span onClick={(e) => handleSenderClick(e, msg.sender)} className="font-black text-white uppercase tracking-tighter text-sm cursor-pointer hover:text-nexus-blue transition-colors">{msg.sender.username}</span><span className="text-[9px] text-gray-600 font-mono uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span></div>
                 )}
                 <div className="text-gray-300 text-sm leading-relaxed">
                    {msg.mediaUrl && <div className="mb-3 max-w-sm rounded-2xl overflow-hidden border border-gray-800 shadow-2xl bg-black">{msg.mediaType === 'video' ? <video src={msg.mediaUrl} controls className="w-full" /> : <img src={msg.mediaUrl} alt="at" className="w-full cursor-pointer" onClick={() => window.open(msg.mediaUrl)} />}</div>}
                    {msg.content && <div className="markdown-content">{Object.keys(CUSTOM_EMOJI_MAP).some(code => msg.content.includes(code)) ? renderContent(msg.content) : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}</div>}
                 </div>
               </div>
             </motion.div>
           );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-6 pt-0 relative">
        <AnimatePresence>
          {suggestion && <NeuralSuggester query={suggestion.query} type={suggestion.type} onSelect={handleSelectSuggestion} position={{ top: 0, left: 60 }} />}
        </AnimatePresence>

        <div className={`bg-discord-sidebar rounded-[24px] p-1.5 flex items-center space-x-3 border transition-all ${isUploading ? 'border-nexus-blue animate-pulse' : 'border-gray-800 shadow-2xl'}`}>
           <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-nexus-blue hover:text-white transition-all ml-1"><Plus size={20} /></button>
           <input type="text" placeholder={isUploading ? "Transmitting Media..." : `Secure Transmission to #${channelName}`} className="bg-transparent flex-1 focus:outline-none text-gray-200 placeholder-gray-600 py-3 text-sm font-medium" value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={isUploading} />
           <div className="flex items-center space-x-1 pr-2">
              <div onClick={() => setShowCustomPicker(!showCustomPicker)} className="w-10 h-10 flex items-center justify-center cursor-pointer text-gray-500 hover:text-nexus-accent transition"><Sparkles size={20} /></div>
              <div onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-10 h-10 flex items-center justify-center cursor-pointer text-gray-500 hover:text-nexus-blue transition"><Smile size={20} /></div>
           </div>
        </div>
        <input type="file" hidden ref={fileInputRef} onChange={onFileChange} accept="image/*,video/*" />
      </div>

      {activeMiniCard && <ProfileMiniCard user={activeMiniCard.user} isMe={(activeMiniCard.user._id || activeMiniCard.user.id) === (currentUser?.id || currentUser?._id)} isFollowing={currentUser?.following?.includes(activeMiniCard.user._id || activeMiniCard.user.id) || false} onViewFull={() => { onViewOtherProfile(activeMiniCard.user._id || activeMiniCard.user.id); setActiveMiniCard(null); }} onStartDM={() => { onViewOtherProfile(activeMiniCard.user._id || activeMiniCard.user.id); setActiveMiniCard(null); }} onFollow={async () => { try { await api.syncIdentity(activeMiniCard.user._id || activeMiniCard.user.id); alert("Sync Sent"); } catch(e){} }} onClose={() => setActiveMiniCard(null)} position={activeMiniCard.position} />}
    </div>
  );
};

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image(); image.src = imageSrc; await new Promise(r => image.onload = r);
  const canvas = document.createElement('canvas'); canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d'); ctx?.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(r => canvas.toBlob(b => r(b!), 'image/jpeg'));
}
