import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Film, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { api } from '../services/api';

// --- Create Realm Modal ---
export const CreateRealmModal = ({ onClose, onSubmit }: { onClose: () => void, onSubmit: (name: string) => void }) => {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-discord-channel w-[440px] rounded-2xl shadow-2xl p-8 text-center border border-gray-800 animate-in fade-in zoom-in duration-200">
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Initiate Realm</h2>
        <p className="text-gray-500 text-sm mb-8 font-medium">Define a new node in the matrix for your collective.</p>
        
        <div className="text-left mb-8">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Realm Identifier</label>
          <input 
            className="w-full bg-discord-dark text-white p-3.5 rounded-xl border border-gray-800 focus:outline-none focus:border-nexus-blue transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Identity Name"
            autoFocus
          />
        </div>

        <div className="flex items-center space-x-4">
           <button onClick={onClose} className="flex-1 text-gray-500 hover:text-white text-sm font-bold uppercase tracking-widest transition">Cancel</button>
           <button 
             onClick={() => onSubmit(name)}
             className="flex-[2] bg-nexus-gradient text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
           >
             Establish
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Create Channel Modal ---
export const CreateChannelModal = ({ onClose, onSubmit }: { onClose: () => void, onSubmit: (name: string, type: string) => void }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-discord-channel w-[440px] rounded-2xl shadow-2xl p-8 text-center border border-gray-800 animate-in fade-in zoom-in duration-200">
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Construct Node</h2>
        <p className="text-gray-500 text-sm mb-8 font-medium">Select the transmission type for this node.</p>
        
        <div className="text-left space-y-6 mb-8">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Node Identifier</label>
            <input 
              className="w-full bg-discord-dark text-white p-3.5 rounded-xl border border-gray-800 focus:outline-none focus:border-nexus-blue transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="channel-name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Transmission Mode</label>
            <div className="grid grid-cols-1 gap-2">
               <TypeOption active={type === 'text'} onClick={() => setType('text')} label="Encrypted Comms" sub="Text-based data exchange" icon={<FileText size={16} />} />
               <TypeOption active={type === 'feed'} onClick={() => setType('feed')} label="Visual Matrix" sub="Grid-style image broadcasts" icon={<ImageIcon size={16} />} />
               <TypeOption active={type === 'reels'} onClick={() => setType('reels')} label="Flash Stream" sub="Vertical high-speed video" icon={<Film size={16} />} />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           <button onClick={onClose} className="flex-1 text-gray-500 hover:text-white text-sm font-bold uppercase tracking-widest transition">Cancel</button>
           <button 
             onClick={() => onSubmit(name, type)}
             className="flex-[2] bg-nexus-gradient text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
           >
             Initialize
           </button>
        </div>
      </div>
    </div>
  );
};

const TypeOption = ({ active, onClick, label, sub, icon }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${active ? 'bg-nexus-blue/10 border-nexus-blue shadow-lg shadow-blue-500/10' : 'bg-discord-dark border-gray-800 hover:border-gray-700'}`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${active ? 'bg-nexus-blue text-white' : 'bg-gray-800 text-gray-500'}`}>
       {icon}
    </div>
    <div className="text-left flex-1">
       <div className={`text-xs font-black uppercase tracking-tighter ${active ? 'text-white' : 'text-gray-400'}`}>{label}</div>
       <div className="text-[9px] text-gray-600 font-medium uppercase tracking-tight">{sub}</div>
    </div>
    {active && <div className="w-2 h-2 bg-nexus-blue rounded-full" />}
  </div>
);

// --- Create Post Modal (Broadcast System with Progress) ---
export const CreatePostModal = ({ onClose, channelId, onComplete }: { onClose: () => void, channelId: string, onComplete: (post: any) => void }) => {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('caption', caption);
    formData.append('channelId', channelId);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/posts', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setProgress(percentCompleted);
        }
      });
      onComplete(res.data);
      onClose();
    } catch (err) {
      alert('Transmission failed. Network interference detected.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-[#0a0a0c] w-[650px] rounded-[32px] shadow-2xl overflow-hidden border border-gray-800 animate-in fade-in slide-in-from-bottom-8 duration-500">
         
         {/* System Header */}
         <div className="p-6 border-b border-gray-900 flex justify-between items-center bg-discord-sidebar/30">
            <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse" />
               <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs">Broadcast Protocol</h3>
            </div>
            <X className="text-gray-500 cursor-pointer hover:text-white transition" onClick={onClose} />
         </div>

         <div className="p-8">
            <textarea 
               className="w-full bg-transparent text-white resize-none focus:outline-none h-20 placeholder-gray-700 text-xl font-bold mb-6"
               placeholder="Encrypt your transmission..."
               value={caption}
               onChange={(e) => setCaption(e.target.value)}
               disabled={isUploading}
            />
            
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl h-80 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden group ${file ? 'border-nexus-blue bg-black' : 'border-gray-800 hover:border-nexus-blue hover:bg-white/[0.02]'}`}
            >
               {preview ? (
                 <>
                   {file?.type.startsWith('video') ? (
                     <video src={preview} className="h-full w-full object-cover opacity-60" autoPlay muted loop />
                   ) : (
                     <img src={preview} alt="Preview" className="h-full w-full object-cover opacity-60" />
                   )}
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-black text-xs uppercase tracking-widest">Change Media</span>
                   </div>
                 </>
               ) : (
                 <div className="text-center">
                   <div className="w-20 h-20 bg-gray-900 rounded-[24px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Upload size={32} className="text-gray-500 group-hover:text-nexus-blue" />
                   </div>
                   <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Attach System Media (IMG/VID)</p>
                 </div>
               )}

               {/* PROGRESS OVERLAY */}
               {isUploading && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-12">
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         className="h-full bg-nexus-gradient shadow-[0_0_15px_rgba(255,60,60,0.5)]"
                       />
                    </div>
                    <div className="flex justify-between w-full font-mono text-[10px] tracking-widest">
                       <span className="text-nexus-accent">UPLOADING_{progress}%</span>
                       <span className="text-gray-500 font-black">BIT_STREAM_ACTIVE</span>
                    </div>
                 </div>
               )}
            </div>
            <input type="file" hidden ref={fileInputRef} accept="image/*,video/*" onChange={handleFile} />
         </div>

         <div className="p-8 bg-discord-sidebar/20 flex justify-end items-center space-x-8 border-t border-gray-900">
            {!isUploading && (
              <div className="flex items-center space-x-4 opacity-40">
                 <ImageIcon size={18} />
                 <Film size={18} />
                 <FileText size={18} />
              </div>
            )}
            <button 
              onClick={handleUpload}
              disabled={isUploading || !file}
              className={`px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white transition-all shadow-xl ${isUploading || !file ? 'bg-gray-900 text-gray-700 cursor-not-allowed' : 'bg-nexus-gradient hover:scale-105 active:scale-95 shadow-red-500/30'}`}
            >
              {isUploading ? 'SYNCHRONIZING...' : 'Establish Link'}
            </button>
         </div>
      </div>
    </div>
  );
};
