import { motion } from 'framer-motion';


interface MenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'danger' | 'default';
  type?: 'divider' | 'item';
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
      <div className="fixed inset-0 z-[150]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ top: Math.min(y, window.innerHeight - 300), left: Math.min(x, window.innerWidth - 240) }}
        className="fixed z-[151] w-56 bg-discord-sidebar border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-1.5 backdrop-blur-xl"
      >
        {items.map((item, i) => {
          if (item.type === 'divider') {
            return <div key={i} className="h-[1px] bg-gray-800 my-1 mx-2" />;
          }
          return (
            <button
              key={i}
              onClick={() => { item.onClick?.(); onClose(); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${item.variant === 'danger' ? 'text-vani-accent hover:bg-red-500/10' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'}`}
            >
              <span>{item.label}</span>
              <div className="opacity-50">{item.icon}</div>
            </button>
          );
        })}
      </motion.div>
    </>
  );
};
