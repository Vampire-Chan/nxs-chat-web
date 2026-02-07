import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  progress: number;
}

const NEXUS_LORE = [
  "Initializing identity kernels...",
  "Calibrating neural frequencies...",
  "Syncing with the Global Matrix...",
  "Encrypting social fragments...",
  "Booting Nexus Core v1.0.42...",
  "Did you know? The first version of Nexus was coded in a basement during a power outage.",
  "Easter Egg: Pressing F12 won't help you find the secret mojais.",
  "Absolute Cinema: Why did the identity go to therapy? Because it had too many multiple personalities in its following list. 🗿💀",
  "Establishing secure P2P audio link...",
  "Establishing trust with remote nodes...",
  "Nexus Lore: Created by the Great Architect to bridge Discord and Instagram.",
];

export const LaunchScreen = ({ progress }: Props) => {
  const [message, setMessage] = useState(NEXUS_LORE[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(NEXUS_LORE[Math.floor(Math.random() * NEXUS_LORE.length)]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[1000] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-12"
      >
        <div className="w-24 h-24 bg-nexus-gradient rounded-[32px] flex items-center justify-center shadow-[0_0_60px_rgba(255,60,60,0.3)] rotate-12">
           <Zap size={48} className="text-white -rotate-12" />
        </div>
      </motion.div>

      <div className="w-64">
         <div className="flex justify-between items-end mb-2 font-mono text-[9px] tracking-[0.2em] text-gray-500 uppercase h-4 overflow-hidden">
            <motion.span key={message} initial={{y:10, opacity:0}} animate={{y:0, opacity:1}}>{message}</motion.span>
            <span className="text-nexus-blue">{Math.round(progress)}%</span>
         </div>
         <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden border border-white/5">
            <motion.div animate={{ width: `${progress}%` }} className="h-full bg-nexus-gradient" />
         </div>
      </div>
    </div>
  );
};