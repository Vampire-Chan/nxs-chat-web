import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              layout
              className="pointer-events-auto"
            >
              <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 min-w-[300px] shadow-2xl flex items-center gap-3 ${
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-200' :
                'bg-vani-blue/10 border-vani-blue/30 text-blue-200'
              }`}>
                {/* GLOW EFFECT */}
                <div className={`absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer`} />
                
                <div className={`p-2 rounded-xl bg-black/20 ${
                  toast.type === 'error' ? 'text-red-500' : 
                  toast.type === 'success' ? 'text-green-500' : 'text-vani-blue'
                }`}>
                  {toast.type === 'error' ? <AlertCircle size={18} /> : 
                   toast.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {toast.type === 'error' ? 'System_Error' : 
                     toast.type === 'success' ? 'Operation_Success' : 'Neural_Info'}
                  </h4>
                  <p className="text-xs font-medium leading-tight mt-0.5">{toast.message}</p>
                </div>

                <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
