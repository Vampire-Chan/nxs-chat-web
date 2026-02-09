import { motion } from 'framer-motion';
import { Zap, Heart, Cpu, Activity, Ghost } from 'lucide-react';

// ==========================================
//         ANIMATED NEURAL EMOTES
// ==========================================

export const PulseEmoji = () => (
  <motion.span
    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className="inline-block"
  >
    <Zap size={18} className="text-yellow-400 fill-yellow-400" />
  </motion.span>
);

export const HeartBeatEmoji = () => (
  <motion.span
    animate={{ scale: [1, 1.3, 1] }}
    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    className="inline-block"
  >
    <Heart size={18} className="text-nexus-accent fill-nexus-accent" />
  </motion.span>
);

export const GlitchEmoji = () => (
  <motion.span
    animate={{ x: [-1, 1, -1, 0], skewX: [0, 5, -5, 0] }}
    transition={{ duration: 0.2, repeat: Infinity }}
    className="inline-block"
  >
    <Activity size={18} className="text-green-500" />
  </motion.span>
);

export const MatrixSpinEmoji = () => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    className="inline-block"
  >
    <Cpu size={18} className="text-nexus-blue" />
  </motion.span>
);

export const GhostEmoji = () => (
  <motion.span
    animate={{ y: [0, -4, 0], opacity: [0.4, 0.8, 0.4] }}
    transition={{ duration: 2, repeat: Infinity }}
    className="inline-block"
  >
    <Ghost size={18} className="text-white" />
  </motion.span>
);

// MAP FOR CHAT PARSER
export const CUSTOM_EMOJI_MAP: Record<string, React.FC> = {
  ':pulse:': PulseEmoji,
  ':heart_beat:': HeartBeatEmoji,
  ':glitch:': GlitchEmoji,
  ':matrix:': MatrixSpinEmoji,
  ':ghost:': GhostEmoji,
};