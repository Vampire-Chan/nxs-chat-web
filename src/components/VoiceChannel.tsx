import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Users, Activity, Video, VideoOff, Monitor, MonitorOff, LayoutGrid, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import type { IUser } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  channelId: string;
  socket: Socket;
  currentUser: IUser;
  onLeave: () => void;
  initialVideo?: boolean;
}

export const VoiceChannel = ({ channelId, socket, currentUser, onLeave, initialVideo }: Props) => {
  const { addToast } = useToast();
  const [peers, setPeers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(!!initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [layoutMode, setLayoutGrid] = useState<'grid' | 'focus'>('grid');
  const [micIntensity, setMicIntensity] = useState(0);
  
  const peersRef = useRef<any[]>([]);
  const userStream = useRef<MediaStream | null>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const localAudioCtx = useRef<AudioContext | null>(null);

  const initMedia = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: !!initialVideo });
      userStream.current = s;
      if (userVideoRef.current) userVideoRef.current.srcObject = s;

      try {
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new AudioCtx();
        localAudioCtx.current = ctx;
        const source = ctx.createMediaStreamSource(s);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const updateIntensity = () => {
          if (userStream.current) {
            analyser.getByteFrequencyData(data);
            const volume = data.reduce((a, b) => a + b, 0) / data.length;
            setMicIntensity(Math.min(volume * 2, 100));
            requestAnimationFrame(updateIntensity);
          }
        };
        updateIntensity();
      } catch (e) {}
      
      socket.emit('join_voice', { 
        roomID: channelId, 
        user: { username: currentUser.username, avatar: currentUser.avatar, id: currentUser.id || currentUser._id } 
      });

      socket.off('all_users');
      socket.on('all_users', (users: any[]) => {
        const p: any[] = [];
        users.forEach(uData => {
          // GUARD: Don't create duplicate peers
          if (peersRef.current.find(p => p.peerID === uData.socketId)) return;

          const peer = createPeer(uData.socketId, socket.id || '', s);
          const peerObj = { peerID: uData.socketId, peer, user: uData.user, status: 'connecting' };
          peersRef.current.push(peerObj);
          p.push(peerObj);
        });
        setPeers(prev => [...prev, ...p]);
      });

      socket.off('user_joined');
      socket.on('user_joined', (payload: any) => {
        // GUARD: Don't create duplicate peers
        if (peersRef.current.find(p => p.peerID === payload.callerID)) return;

        const peer = addPeer(payload.signal, payload.callerID, s);
        const peerObj = { peerID: payload.callerID, peer, user: payload.user, status: 'connecting' };
        peersRef.current.push(peerObj);
        setPeers(prev => [...prev, peerObj]);
      });

      socket.off('receiving_returned_signal');
      socket.on('receiving_returned_signal', (payload: any) => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        if (item && !item.peer.destroyed) {
          try {
            item.peer.signal(payload.signal);
          } catch (e) {
            console.warn("Signal processing error:", e);
          }
        }
      });

      socket.off('user_left_voice');
      socket.on('user_left_voice', (userId: string) => {
        const peerObj = peersRef.current.find(p => p.peerID === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
        setPeers(prev => prev.filter(p => p.peerID !== userId));

        // AUTO-DISCONNECT: If no peers are left, terminate the link for the last person
        if (peersRef.current.length === 0) {
          addToast("Identity Node De-synchronized. Terminating link.", 'info');
          setTimeout(() => {
            onLeave();
          }, 2000);
        }
      });
    } catch (err) {
      addToast("Media Access Denied", 'error');
    }
  }, [channelId, initialVideo, socket, addToast, currentUser]);

  useEffect(() => {
    initMedia();
    return () => {
      // CLEANUP ALL PEERS
      peersRef.current.forEach(p => p.peer.destroy());
      peersRef.current = [];
      setPeers([]);

      userStream.current?.getTracks().forEach(t => t.stop());
      screenStream.current?.getTracks().forEach(t => t.stop());
      socket.emit('leave_voice', { channelId });
      socket.off('all_users'); socket.off('user_joined'); socket.off('receiving_returned_signal'); socket.off('user_left_voice');
    };
  }, [initMedia, channelId, socket]);

  function createPeer(u: string, c: string, s: MediaStream) {
    const p = new Peer({ initiator: true, trickle: false, stream: s });
    p.on('signal', (signal: any) => socket.emit('sending_signal', { 
      userToSignal: u, callerID: c, signal,
      user: { username: currentUser.username, avatar: currentUser.avatar, id: currentUser.id || currentUser._id }
    }));
    
    p.on('connect', () => {
      setPeers(prev => prev.map(peer => peer.peerID === u ? { ...peer, status: 'connected' } : peer));
    });

    p.on('error', (err: any) => {
      console.error(`Peer error (${u}):`, err);
      setPeers(prev => prev.map(peer => peer.peerID === u ? { ...peer, status: 'failed' } : peer));
    });

    return p;
  }

  function addPeer(i: any, c: string, s: MediaStream) {
    const p = new Peer({ initiator: false, trickle: false, stream: s });
    p.on('signal', (signal: any) => socket.emit('returning_signal', { signal, callerID: c }));
    
    p.on('connect', () => {
      setPeers(prev => prev.map(peer => peer.peerID === c ? { ...peer, status: 'connected' } : peer));
    });

    p.on('error', (err: any) => {
      console.error(`Peer error (${c}):`, err);
      setPeers(prev => prev.map(peer => peer.peerID === c ? { ...peer, status: 'failed' } : peer));
    });

    p.signal(i);
    return p;
  }

  const handleControlClick = (action: () => void) => {
    if (localAudioCtx.current?.state === 'suspended') localAudioCtx.current.resume();
    action();
  };

  const toggleVideo = async () => {
    if (isScreenSharing) { addToast("Stop screen share first", 'error'); return; }
    if (isVideoOn) {
      userStream.current?.getVideoTracks().forEach(t => { t.stop(); userStream.current?.removeTrack(t); });
      setIsVideoOn(false);
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        userStream.current?.addTrack(videoTrack);
        setIsVideoOn(true);
        if (userVideoRef.current) userVideoRef.current.srcObject = userStream.current;
        peersRef.current.forEach(({ peer }) => peer.addTrack(videoTrack, userStream.current));
      } catch { addToast("Camera Access Denied", 'error'); }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) { screenStream.current?.getTracks().forEach(t => t.stop()); setIsScreenSharing(false); }
    else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStream.current = stream; setIsScreenSharing(true);
        if (userVideoRef.current) userVideoRef.current.srcObject = stream;
        const screenTrack = stream.getVideoTracks()[0];
        screenTrack.onended = () => { setIsScreenSharing(false); };
        peersRef.current.forEach(({ peer }) => peer.addTrack(screenTrack, userStream.current));
      } catch { addToast("Screen Share Cancelled", 'info'); }
    }
  };

  const toggleMute = () => {
    if (userStream.current) {
      const track = userStream.current.getAudioTracks()[0];
      if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
    }
  };

  return (
    <div className="flex-1 bg-black flex flex-col p-4 relative overflow-hidden font-sans select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.05)_0%,transparent_70%)]" />
      <div className="flex items-center justify-between z-20 mb-6">
         <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-vani-blue/10 rounded-xl flex items-center justify-center border border-vani-blue/20 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
               <Activity size={20} className="text-vani-blue animate-pulse" />
            </div>
            <div>
               <h2 className="text-lg font-black text-white uppercase tracking-tighter">Secure_Link_Matrix</h2>
               <div className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{peers.length + 1} NODES_SYNCED</span></div>
            </div>
         </div>
         <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
            <button onClick={() => setLayoutGrid(layoutMode === 'grid' ? 'focus' : 'grid')} className={`p-2 rounded-lg transition-all ${layoutMode === 'grid' ? 'text-vani-blue bg-vani-blue/10' : 'text-gray-400 hover:text-white'}`}><LayoutGrid size={18} /></button>
            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"><Users size={18} /></button>
         </div>
      </div>

      <div className={`flex-1 relative z-10 overflow-hidden ${layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-center' : 'flex flex-col lg:flex-row gap-4'}`}>
         <div className={`relative group bg-gray-900 rounded-[32px] overflow-hidden border-2 transition-all shadow-2xl ${layoutMode === 'focus' && (isVideoOn || isScreenSharing) ? 'flex-[3] order-first' : 'flex-1'} ${isVideoOn || isScreenSharing ? 'border-white/10' : 'border-white/5'}`}>
            {(isVideoOn || isScreenSharing) ? <video ref={userVideoRef} muted autoPlay playsInline className="w-full h-full object-contain bg-black" /> : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-discord-dark min-h-[200px]">
                 <div className="relative">
                    <AnimatePresence>{!isMuted && micIntensity > 5 && <motion.div animate={{ scale: [1, 1 + (micIntensity / 100), 1], opacity: [0.2, 0.5, 0.2], borderWidth: [2, 4, 2] }} transition={{ repeat: Infinity, duration: 0.5 }} className="absolute inset-[-20px] rounded-full border-vani-blue/40 pointer-events-none" style={{ borderColor: `rgba(0, 210, 255, ${micIntensity / 100})` }} />}</AnimatePresence>
                    <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} className="w-24 h-24 rounded-[36px] object-cover border-4 border-gray-800 shadow-xl transition-transform duration-75" style={{ transform: `scale(${1 + (micIntensity / 500)})` }} />
                    <div className="absolute -bottom-2 -right-2 bg-vani-blue w-8 h-8 rounded-xl flex items-center justify-center border-4 border-gray-800 shadow-xl">{isMuted ? <MicOff size={14} className="text-white" /> : <Mic size={14} className="text-white" />}</div>
                 </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2"><span className="text-[10px] font-black text-white uppercase tracking-widest">{currentUser.username} (YOU)</span></div>
         </div>
         {peers.map((p, i) => <RemoteNode key={p.peerID || i} peer={p.peer} user={p.user} status={p.status} isFocus={layoutMode === 'focus' && i === 0 && !(isVideoOn || isScreenSharing)} />)}
      </div>

      <div className="mt-6 flex justify-center z-20 pb-4">
         <div className="bg-[#050507]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[32px] flex items-center space-x-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <ControlBtn icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />} active={!isMuted} onClick={() => handleControlClick(toggleMute)} variant={isMuted ? 'danger' : 'normal'} />
            <ControlBtn icon={isVideoOn ? <Video size={20} /> : <VideoOff size={20} />} active={isVideoOn} onClick={() => handleControlClick(toggleVideo)} variant={isVideoOn ? 'active' : 'normal'} />
            <ControlBtn icon={isScreenSharing ? <Monitor size={20} /> : <MonitorOff size={20} />} active={isScreenSharing} onClick={() => handleControlClick(toggleScreenShare)} variant={isScreenSharing ? 'active' : 'normal'} />
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button onClick={onLeave} className="px-8 py-4 bg-red-500/80 hover:bg-red-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"><PhoneOff size={18} /> <span>Sever Link</span></button>
         </div>
      </div>
    </div>
  );
};

const ControlBtn = ({ icon, onClick, variant }: any) => {
  const bg = variant === 'danger' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : variant === 'active' ? 'bg-vani-blue text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5';
  return (<button onClick={onClick} className={`w-14 h-14 rounded-[24px] flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${bg}`}>{icon}</button>);
};

const RemoteNode = ({ peer, isFocus, user, status }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [micIntensity, setMicIntensity] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const scale = useMotionValue(1); const x = useMotionValue(0); const y = useMotionValue(0);

  useEffect(() => {
    peer.on('stream', (stream: MediaStream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
      const checkTracks = () => { const vTrack = stream.getVideoTracks()[0]; setHasVideo(!!vTrack && vTrack.enabled); };
      checkTracks();
      try {
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
        const audioContext = new AudioCtx();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser(); analyser.fftSize = 256;
        source.connect(analyser); const data = new Uint8Array(analyser.frequencyBinCount);
        const check = () => { if (!peer.destroyed) { analyser.getByteFrequencyData(data); const volume = data.reduce((a, b) => a + b, 0) / data.length; setMicIntensity(Math.min(volume * 2, 100)); requestAnimationFrame(check); } };
        check();
      } catch { }
    });
  }, [peer]);

  const resetZoom = useCallback(() => { setZoom(1); scale.set(1); x.set(0); y.set(0); }, [scale, x, y]);
  const handleScroll = (e: React.WheelEvent) => { if (!hasVideo) return; const delta = e.deltaY * -0.001; const newZoom = Math.min(Math.max(zoom + delta, 1), 5); setZoom(newZoom); scale.set(newZoom); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasVideo) return;
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); const nz = Math.min(zoom + 0.2, 5); setZoom(nz); scale.set(nz); }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); const nz = Math.max(zoom - 0.2, 1); setZoom(nz); scale.set(nz); }
      if (e.ctrlKey && e.key === '0') { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, hasVideo, scale, resetZoom]);

  const talking = micIntensity > 5;

  return (
    <div className={`relative group bg-gray-900 rounded-[32px] overflow-hidden border-2 transition-all shadow-2xl ${isFocus ? 'flex-[3]' : 'flex-1'} ${talking ? 'border-vani-blue shadow-[0_0_30px_rgba(0,210,255,0.2)]' : 'border-white/5'} ${hasVideo ? 'cursor-grab active:cursor-grabbing' : ''}`} onWheel={handleScroll}>
       <motion.div className="w-full h-full" style={{ scale, x, y }} drag={zoom > 1} dragConstraints={{ left: -500 * (zoom-1), right: 500 * (zoom-1), top: -300 * (zoom-1), bottom: 300 * (zoom-1) }}>
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain bg-black ${hasVideo ? 'block' : 'hidden'}`} />
       </motion.div>
       {!hasVideo && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-discord-dark">
            <div className="relative">
               <AnimatePresence>{talking && <motion.div animate={{ scale: [1, 1 + (micIntensity / 100), 1], opacity: [0.2, 0.5, 0.2], borderWidth: [2, 4, 2] }} transition={{ repeat: Infinity, duration: 0.5 }} className="absolute inset-[-25px] rounded-full border-vani-accent/40 pointer-events-none" style={{ borderColor: `rgba(255, 60, 60, ${micIntensity / 100})` }} />}</AnimatePresence>
               <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'node'}`} className="w-24 h-24 rounded-[36px] object-cover border-4 border-gray-800 shadow-xl transition-transform duration-75" style={{ transform: `scale(${1 + (micIntensity / 500)})` }} />
            </div>
         </div>
       )}

       {status === 'connecting' && (
         <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4">
               <div className="w-12 h-12 border-4 border-vani-blue border-t-transparent rounded-full animate-spin mx-auto" />
               <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Establishing_Link...</p>
            </div>
         </div>
       )}

       {status === 'failed' && (
         <div className="absolute inset-0 z-10 bg-red-500/20 backdrop-blur-md flex items-center justify-center">
            <div className="text-center space-y-2">
               <PhoneOff size={32} className="text-red-500 mx-auto" />
               <p className="text-[10px] font-black text-white uppercase tracking-widest">Link_Severed</p>
            </div>
         </div>
       )}
       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
          {hasVideo && (<><button onClick={() => { const nz = Math.min(zoom + 0.5, 5); setZoom(nz); scale.set(nz); }} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-vani-blue"><ZoomIn size={14} /></button><button onClick={() => { const nz = Math.max(zoom - 0.5, 1); setZoom(nz); scale.set(nz); }} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-vani-blue"><ZoomOut size={14} /></button><button onClick={resetZoom} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-vani-blue"><Minimize2 size={14} /></button></>)}
       </div>
       <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2"><div className={`w-2 h-2 rounded-full ${talking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} /><span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">{user?.username || 'REMOTE_NODE'}</span></div>
    </div>
  );
};
