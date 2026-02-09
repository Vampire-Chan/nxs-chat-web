import { motion } from 'framer-motion';


interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'danger' | 'default';
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: Props) => {
  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ top: y, left: x }}
        className="fixed z-[101] w-56 bg-discord-sidebar border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-1.5 backdrop-blur-xl"
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${item.variant === 'danger' ? 'text-nexus-accent hover:bg-red-500/10' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'}`}
          >
            <span>{item.label}</span>
            <div className="opacity-50 group-hover:opacity-100">{item.icon}</div>
          </button>
        ))}
      </motion.div>
    </>
  );
};
