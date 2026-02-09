import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Share2, Forward, Reply, Play, Volume2, Download } from 'lucide-react';

interface Props {
  type: 'image' | 'video' | 'audio';
  url: string;
  onClose: () => void;
  onForward?: () => void;
  onReply?: () => void;
}

export const MediaPlayer = ({ type, url, onClose, onForward, onReply }: Props) => {
  const [zoom, setZoom] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleZoom = (delta: number) => setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));

  const cycleRate = () => {
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) videoRef.current.playbackRate = nextRate;
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Nexus Media', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[2000] flex flex-col backdrop-blur-2xl">
      {/* HEADER */}
      <div className="h-20 px-6 flex items-center justify-between bg-black/40 border-b border-white/5">
         <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-nexus-blue/10 flex items-center justify-center text-nexus-blue border border-nexus-blue/20">
               {type === 'image' ? <ZoomIn size={20} /> : type === 'video' ? <Play size={20} /> : <Volume2 size={20} />}
            </div>
            <div>
               <h3 className="text-white font-black uppercase tracking-tighter text-sm">Media_Link_Active</h3>
               <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">{type}_STREAMING_STABLE</div>
            </div>
         </div>
         <div className="flex items-center space-x-2">
            <button onClick={handleShare} className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Share2 size={20} /></button>
            <button onClick={onForward} className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Forward size={20} /></button>
            <button onClick={onReply} className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Reply size={20} /></button>
            <div className="w-[1px] h-6 bg-gray-800 mx-2" />
            <button onClick={onClose} className="p-3 bg-white/5 text-white rounded-xl hover:bg-red-500 transition-all"><X size={20} /></button>
         </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-10">
         {type === 'image' && (
           <motion.div 
             drag 
             dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
             style={{ scale: zoom }}
             className="relative cursor-grab active:cursor-grabbing"
           >
              <img src={url} className="max-h-[70vh] rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] select-none" draggable={false} />
           </motion.div>
         )}

         {type === 'video' && (
           <div className="w-full max-w-4xl relative group">
              <video ref={videoRef} src={url} controls className="w-full rounded-3xl shadow-2xl border border-white/5" />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={cycleRate} className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-white font-black text-[10px] uppercase border border-white/10 hover:bg-nexus-blue transition-all">
                    {playbackRate}x speed
                 </button>
              </div>
           </div>
         )}

         {type === 'audio' && (
           <div className="w-full max-w-xl bg-[#0a0a0c] border border-white/5 p-10 rounded-[48px] shadow-2xl text-center">
              <div className="w-24 h-24 bg-nexus-gradient rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-lg shadow-red-500/20">
                 <Volume2 size={40} className="text-white" />
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Neural_Audio_Transmission</h4>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-[0.2em] mb-10">
                {url.includes('voice_note') ? 'Captured Identity Voice (.WEBM)' : 
                 url.toLowerCase().endsWith('.mp3') ? 'MPEG Audio Resource (.MP3)' :
                 url.toLowerCase().endsWith('.wav') ? 'Waveform Data (.WAV)' :
                 'Generic Audio Resource'}
              </p>
              <audio ref={audioRef} src={url} controls className="w-full h-12 invert" />
              <div className="mt-8 flex justify-center">
                 <button onClick={cycleRate} className="px-6 py-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-white/5">
                    Playback: {playbackRate}x
                 </button>
              </div>
           </div>
         )}
      </div>

      {/* FOOTER CONTROLS (FOR IMAGE) */}
      {type === 'image' && (
        <div className="h-24 bg-black/40 border-t border-white/5 flex items-center justify-center space-x-6">
           <button onClick={() => handleZoom(-0.25)} className="p-4 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all"><ZoomOut size={24} /></button>
           <div className="text-xs font-mono text-gray-500 bg-white/5 px-6 py-2 rounded-full border border-white/5">ZOOM: {Math.round(zoom * 100)}%</div>
           <button onClick={() => handleZoom(0.25)} className="p-4 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all"><ZoomIn size={24} /></button>
           <div className="w-[1px] h-8 bg-gray-800 mx-4" />
           <a href={url} download className="p-4 bg-nexus-blue/10 text-nexus-blue rounded-2xl hover:bg-nexus-blue hover:text-white transition-all border border-nexus-blue/20"><Download size={24} /></a>
        </div>
      )}
    </motion.div>
  );
};