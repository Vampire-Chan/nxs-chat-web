import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Users, Volume2, ShieldCheck, Activity } from 'lucide-react';
import { Socket } from 'socket.io-client';
import type { IUser } from '../services/api';

interface Props {
  channelId: string;
  socket: Socket;
  currentUser: IUser;
  onLeave: () => void;
}

export const VoiceChannel = ({ channelId, socket, currentUser, onLeave }: Props) => {
  const [peers, setPeers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const peersRef = useRef<any[]>([]);
  const userStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
      userStream.current = s;
      socket.emit('join_voice', channelId);

      socket.on('all_users', (users: string[]) => {
        const p: any[] = [];
        users.forEach(id => {
          const peer = createPeer(id, socket.id || '', s); // FIX: Ensure socket.id is string
          peersRef.current.push({ peerID: id, peer });
          p.push(peer);
        });
        setPeers(p);
      });

      socket.on('user_joined', (payload: any) => {
        const peer = addPeer(payload.signal, payload.callerID, s);
        peersRef.current.push({ peerID: payload.callerID, peer });
        setPeers(prev => [...prev, peer]);
      });

      socket.on('receiving_returned_signal', (payload: any) => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });
    });

    return () => {
      userStream.current?.getTracks().forEach(t => t.stop());
      socket.emit('leave_voice', { channelId });
      socket.off('all_users'); socket.off('user_joined'); socket.off('receiving_returned_signal');
    };
  }, [channelId]);

  function createPeer(u: string, c: string, s: MediaStream) {
    const p = new (window as any).SimplePeer({ initiator: true, trickle: false, stream: s });
    p.on('signal', (signal: any) => socket.emit('sending_signal', { userToSignal: u, callerID: c, signal }));
    return p;
  }

  function addPeer(i: any, c: string, s: MediaStream) {
    const p = new (window as any).SimplePeer({ initiator: false, trickle: false, stream: s });
    p.on('signal', (signal: any) => socket.emit('returning_signal', { signal, callerID: c }));
    p.signal(i);
    return p;
  }

  return (
    <div className="flex-1 bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.05)_0%,transparent_70%)]" />
      
      <div className="absolute top-10 left-10 flex items-center space-x-4 z-20">
         <div className="w-12 h-12 bg-nexus-blue/10 rounded-2xl flex items-center justify-center border border-nexus-blue/20 shadow-2xl">
            <Volume2 size={24} className="text-nexus-blue animate-pulse" />
         </div>
         <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Neural_Audio_Link</h2>
            <div className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">ENCRYPTION_LAYER_STABLE</span></div>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-12 w-full max-w-5xl relative z-10">
         <div className="flex flex-col items-center space-y-4">
            <div className="relative">
               <AnimatePresence>
                  {!isMuted && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1, 1.2, 1], opacity: [0, 0.3, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-[-20px] rounded-full border-2 border-nexus-blue/30 pointer-events-none" />
                  )}
               </AnimatePresence>
               <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-[48px] p-1 transition-all duration-500 ${isMuted ? 'bg-gray-900 grayscale' : 'bg-nexus-gradient shadow-[0_0_40px_rgba(255,0,85,0.2)]'}`}>
                  <div className="w-full h-full rounded-[44px] bg-discord-dark overflow-hidden border-8 border-discord-dark">
                     <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-nexus-blue w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-discord-dark shadow-xl">
                     {isMuted ? <MicOff size={18} className="text-red-500" /> : <Mic size={18} className="text-white" />}
                  </div>
               </div>
            </div>
            <div className="text-center"><div className="text-[10px] font-black text-white uppercase tracking-widest">{currentUser.username}</div><div className="text-[8px] font-mono text-gray-600 uppercase mt-1">LOCAL_NODE</div></div>
         </div>

         {peers.map((peer, i) => <RemoteNode key={i} peer={peer} />)}
      </div>

      <div className="absolute bottom-12 flex items-center space-x-8 z-20">
         <button onClick={() => setIsMuted(!isMuted)} className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white shadow-2xl' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{isMuted ? <MicOff size={24} /> : <Mic size={24} />}</button>
         <button onClick={onLeave} className="w-20 h-20 rounded-[32px] bg-nexus-gradient text-white flex items-center justify-center shadow-[0_0_50px_rgba(255,0,85,0.4)] hover:scale-110 active:scale-95 transition-all"><PhoneOff size={32} /></button>
         <button className="w-16 h-16 rounded-[24px] bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-all"><Users size={24} /></button>
      </div>
    </div>
  );
};

const RemoteNode = ({ peer }: any) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [talking, setTalking] = useState(false);

  useEffect(() => {
    peer.on('stream', (stream: MediaStream) => {
      if (audioRef.current) audioRef.current.srcObject = stream;
      // SIMPLE TALKING DETECTION
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const check = () => {
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((a, b) => a + b) / data.length;
        setTalking(volume > 10);
        requestAnimationFrame(check);
      };
      check();
    });
  }, [peer]);

  return (
    <div className="flex flex-col items-center space-y-4">
       <audio ref={audioRef} autoPlay hidden />
       <div className="relative">
          <AnimatePresence>
             {talking && (
               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1, 1.4, 1], opacity: [0, 0.4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-[-25px] rounded-full border-2 border-nexus-accent/40 pointer-events-none" />
             )}
          </AnimatePresence>
          <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-[48px] bg-white/5 border border-white/10 p-1 transition-all ${talking ? 'shadow-[0_0_30px_rgba(0,210,255,0.3)]' : ''}`}>
             <div className="w-full h-full rounded-[44px] bg-gray-900 flex items-center justify-center overflow-hidden">
                <Activity size={40} className={`transition-colors ${talking ? 'text-nexus-blue' : 'text-gray-800'}`} />
             </div>
             <div className="absolute -top-2 -right-2 bg-green-500 w-8 h-8 rounded-xl flex items-center justify-center border-4 border-discord-dark shadow-xl"><ShieldCheck size={14} className="text-white" /></div>
          </div>
       </div>
       <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Remote_Peer_Synced</div>
    </div>
  );
};