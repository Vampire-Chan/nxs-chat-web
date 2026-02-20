import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- DATE PICKER ---
export const NeuralDatePicker = ({ value, onChange, onClose }: { value: string, onChange: (v: string) => void, onClose: () => void }) => {
  const [currentDate] = useState(value ? new Date(value) : new Date());
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [viewMode, setViewMode] = useState<'calendar' | 'months' | 'years'>('calendar');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const offset = selected.getTimezoneOffset();
    const corrected = new Date(selected.getTime() - (offset * 60 * 1000));
    onChange(corrected.toISOString().split('T')[0]);
    onClose();
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const selectMonth = (mIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), mIndex, 1));
    setViewMode('calendar');
  };

  const selectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('calendar');
  };

  const days = Array.from({ length: daysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => i);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - 50) + i);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1b1e] border border-white/10 rounded-[32px] w-full max-w-[320px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-4 bg-vani-gradient text-white">
          <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Select Dispatch Date</div>
          <button onClick={() => setViewMode('years')} className={`text-2xl font-black block transition-opacity hover:opacity-100 ${viewMode === 'years' ? 'opacity-100' : 'opacity-60'}`}>{viewDate.getFullYear()}</button>
          <button onClick={() => setViewMode('months')} className={`text-sm font-bold block transition-opacity hover:opacity-100 ${viewMode === 'months' ? 'opacity-100' : 'opacity-60'}`}>{months[viewDate.getMonth()]} {currentDate.getDate()}</button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar min-h-[300px]">
          <AnimatePresence mode="wait">
            {viewMode === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setViewMode('months')} className="font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-white transition-colors">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</button>
                  <div className="flex space-x-1">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white"><ChevronLeft size={16} /></button>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white"><ChevronRight size={16} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center text-[9px] font-black text-gray-600 py-1">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {padding.map(i => <div key={`p-${i}`} />)}
                  {days.map(d => {
                    const isSelected = currentDate.getDate() === d && currentDate.getMonth() === viewDate.getMonth() && currentDate.getFullYear() === viewDate.getFullYear();
                    return (
                      <button 
                        key={d} 
                        onClick={() => handleDateSelect(d)}
                        className={`aspect-square rounded-full text-[10px] font-bold transition-all flex items-center justify-center ${isSelected ? 'bg-vani-blue text-black shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {viewMode === 'months' && (
              <motion.div key="months" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-3 gap-2">
                {months.map((m, i) => (
                  <button 
                    key={m} 
                    onClick={() => selectMonth(i)}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewDate.getMonth() === i ? 'bg-vani-blue text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </motion.div>
            )}

            {viewMode === 'years' && (
              <motion.div key="years" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {years.map(y => (
                  <button 
                    key={y} 
                    onClick={() => selectYear(y)}
                    className={`py-3 rounded-2xl text-xs font-black transition-all ${viewDate.getFullYear() === y ? 'bg-vani-blue text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    {y}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-3 border-t border-white/5 bg-black/20 flex justify-end">
          <button onClick={() => viewMode === 'calendar' ? onClose() : setViewMode('calendar')} className="px-4 py-2 text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors">
            {viewMode === 'calendar' ? 'Cancel' : 'Return'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- TIME PICKER ---
export const NeuralTimePicker = ({ value, onChange, onClose }: { value: string, onChange: (v: string) => void, onClose: () => void }) => {
  const [hours, setHours] = useState(value ? parseInt(value.split(':')[0]) : 12);
  const [minutes, setMinutes] = useState(value ? parseInt(value.split(':')[1]) : 0);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');

  const finalize = () => {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    onChange(`${h}:${m}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1b1e] border border-white/10 rounded-[32px] w-full max-w-[300px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 bg-vani-gradient flex flex-col items-center justify-center text-white shrink-0">
          <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Set Dispatch Time</div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setMode('hours')} className={`text-4xl font-black transition-opacity ${mode === 'hours' ? 'opacity-100' : 'opacity-40'}`}>{hours.toString().padStart(2, '0')}</button>
            <span className="text-3xl font-black opacity-40">:</span>
            <button onClick={() => setMode('minutes')} className={`text-4xl font-black transition-opacity ${mode === 'minutes' ? 'opacity-100' : 'opacity-40'}`}>{minutes.toString().padStart(2, '0')}</button>
          </div>
        </div>

        <div className="p-6 flex items-center justify-center overflow-y-auto">
          <div className="relative w-52 h-52 bg-black/40 rounded-full border border-white/5 flex items-center justify-center shadow-inner">
            {/* Center Dot */}
            <div className="w-1.5 h-1.5 bg-vani-blue rounded-full z-10" />
            
            {/* Clock Hand */}
            <motion.div 
              className="absolute bottom-1/2 left-1/2 w-0.5 bg-vani-blue origin-bottom z-0" 
              style={{ 
                height: mode === 'hours' ? '65px' : '85px',
                rotate: mode === 'hours' ? (hours * 30) : (minutes * 6)
              }} 
            />

            {/* Numbers */}
            {(mode === 'hours' ? Array.from({ length: 12 }, (_, i) => i + 1) : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).map((n, i) => {
              const angle = (i + 1) * 30;
              const x = Math.sin((angle * Math.PI) / 180) * (mode === 'hours' ? 75 : 85);
              const y = -Math.cos((angle * Math.PI) / 180) * (mode === 'hours' ? 75 : 85);
              const isActive = mode === 'hours' ? (hours === (n === 12 ? 0 : n) || hours === n) : minutes === n;

              return (
                <button
                  key={n}
                  onClick={() => mode === 'hours' ? (setHours(n === 12 ? 0 : n), setMode('minutes')) : setMinutes(n)}
                  className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${isActive ? 'bg-vani-blue text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  {n === 0 && mode === 'minutes' ? '00' : n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 flex space-x-3">
          <button onClick={onClose} className="flex-1 py-3 text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors">Discard</button>
          <button onClick={finalize} className="flex-1 py-3 bg-vani-blue text-black rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg">Set Time</button>
        </div>
      </motion.div>
    </div>
  );
};
