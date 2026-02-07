import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Headphones, PhoneOff, Volume2 } from 'lucide-react';
import type { IUser } from '../services/api';
import { Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';

interface Props {
  channelId: string;
  currentUser: IUser;
  socket: Socket;
}

interface PeerData {
  peerId: string; // The Socket ID of the peer
  peer: SimplePeer.Instance;
  stream?: MediaStream; // Their audio stream
}

export const VoiceChannel = ({ channelId, currentUser, socket }: Props) => {
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  
  const userVideo = useRef<any>(null); // Ref to hold our own stream
  const peersRef = useRef<PeerData[]>([]); // Ref to keep track of peers without re-rendering loops

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        userVideo.current = stream;

        // JOIN THE ROOM
        socket.emit('join_voice', channelId);

        // RECEIVE ALL USERS ALREADY IN ROOM
        socket.on('all_users', (users: string[]) => {
          const peersList: PeerData[] = [];
          users.forEach(userID => {
            const peer = createPeer(userID, socket.id, stream);
            peersRef.current.push({
              peerId: userID,
              peer,
            });
            peersList.push({
              peerId: userID,
              peer,
            });
          });
          setPeers(peersList);
        });

        // SOMEONE ELSE JOINED (THEY ARE CALLING US)
        socket.on('user_joined', (payload: { signal: any, callerID: string }) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          const peerObj = {
            peerId: payload.callerID,
            peer,
          };
          peersRef.current.push(peerObj);
          setPeers(users => [...users, peerObj]);
        });

        // HANDSHAKE COMPLETE (WE CALLED THEM, THEY ANSWERED)
        socket.on('receiving_returned_signal', (payload: { signal: any, id: string }) => {
          const item = peersRef.current.find(p => p.peerId === payload.id);
          item?.peer.signal(payload.signal);
        });
      })
      .catch(err => alert("Microphone access denied. Neural link failed."));

    return () => {
      // Cleanup
      socket.off('all_users');
      socket.off('user_joined');
      socket.off('receiving_returned_signal');
      socket.emit('leave_voice', { channelId });
      userVideo.current?.getTracks().forEach((track: any) => track.stop());
      peersRef.current.forEach(p => p.peer.destroy());
    };
  }, [channelId]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('sending_signal', { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('returning_signal', { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleMute = () => {
    if (userVideo.current) {
      userVideo.current.getAudioTracks()[0].enabled = !userVideo.current.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex-1 bg-[#050507] flex flex-col items-center justify-center p-10 relative overflow-hidden">
       {/* Background Pulse */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-nexus-gradient opacity-5 blur-[120px] rounded-full animate-pulse" />

       <div className="text-center mb-16 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-black rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(60,130,255,0.2)] border border-gray-800">
             <div className={`w-3 h-3 rounded-full absolute top-6 right-6 ${isMuted ? 'bg-red-500' : 'bg-green-500 animate-ping'}`} />
             <Mic size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">Neural Link Established</h2>
          <p className="text-nexus-blue font-mono text-xs mt-3 uppercase tracking-[0.3em]">Frequency: {channelId.slice(-6)}</p>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl relative z-10">
          {/* Self */}
          <div className="bg-discord-channel rounded-[32px] p-6 flex flex-col items-center border border-nexus-blue/30 shadow-2xl shadow-blue-500/5 group hover:scale-105 transition-all">
             <div className="w-20 h-20 rounded-[24px] overflow-hidden border-2 border-nexus-blue mb-4 shadow-lg">
                <img src={currentUser.avatar} className="w-full h-full object-cover" />
             </div>
             <span className="text-white font-black text-sm uppercase tracking-tight">{currentUser.username}</span>
             <span className="text-[9px] text-gray-500 font-mono mt-1 uppercase tracking-widest">Signal_Source</span>
          </div>

          {/* Peers */}
          {peers.map(p => (
             <PeerNode key={p.peerId} peer={p.peer} />
          ))}
       </div>

       <div className="mt-24 bg-discord-channel/50 backdrop-blur-xl px-10 py-5 rounded-[32px] flex items-center space-x-8 border border-gray-800/50 shadow-2xl relative z-20">
          <button 
            onClick={toggleMute}
            className={`p-5 rounded-2xl transition-all shadow-lg ${isMuted ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
             {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button 
            onClick={() => setIsDeafened(!isDeafened)}
            className={`p-5 rounded-2xl transition-all shadow-lg ${isDeafened ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
             {isDeafened ? <PhoneOff size={20} /> : <Headphones size={20} />}
          </button>
       </div>
    </div>
  );
};

// Component to handle individual peer audio stream
const PeerNode = ({ peer }: { peer: SimplePeer.Instance }) => {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    peer.on('stream', stream => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div className="bg-discord-channel rounded-[32px] p-6 flex flex-col items-center border border-gray-800 group hover:border-gray-600 transition-all">
       <div className="w-20 h-20 rounded-[24px] overflow-hidden border-2 border-gray-700 mb-4 bg-gray-900 flex items-center justify-center">
          <Volume2 size={32} className="text-gray-600 animate-pulse" />
       </div>
       <span className="text-gray-400 font-black text-sm uppercase tracking-tight">Encrypted Signal</span>
       <span className="text-[9px] text-green-500 font-mono mt-1 uppercase tracking-widest">Receiving...</span>
       <audio ref={ref} autoPlay />
    </div>
  );
};