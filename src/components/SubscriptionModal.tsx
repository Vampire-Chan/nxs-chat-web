import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Zap, Smartphone, Globe, CreditCard } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onClose: () => void;
  currentUser: any;
}

export const SubscriptionModal = ({ onClose, currentUser }: Props) => {
  const [method, setMethod] = useState<'UPI' | 'CRYPTO'>('UPI');
  const [txnId, setTxnId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!txnId) return;
    try {
      await api.submitPayment({
        method,
        transactionId: txnId,
        amount: '1000' // Example: 1000 INR or Equivalent
      });
      setSubmitted(true);
    } catch (e: any) { alert(e.response?.data?.message || "Transmission failed"); }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[900] flex items-center justify-center p-4 backdrop-blur-md">
         <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0c] p-10 rounded-[40px] border border-green-500/30 text-center max-w-md">
            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Proof Transmitted</h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">Your transaction ID has been logged in the Architect's Ledger. Access will be granted upon verification.</p>
            <button onClick={onClose} className="bg-white/10 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition-all">Return to Matrix</button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-[900] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#0a0a0c] w-full max-w-4xl h-[80vh] rounded-[48px] border border-gray-800 flex overflow-hidden shadow-2xl relative">
         <div onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl cursor-pointer transition-all z-50"><X size={20} /></div>

         {/* Left: Pitch */}
         <div className="w-1/2 bg-gradient-to-br from-gray-900 to-black p-12 flex flex-col relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-vani-gradient opacity-10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
               <div className="inline-flex items-center space-x-2 bg-vani-blue/10 text-vani-blue px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-vani-blue/20">
                  <Zap size={12} /> <span>Status: {currentUser.tier === 'elite' ? 'ACTIVE' : 'STANDARD'}</span>
               </div>
               <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6 leading-tight">Elevate Your<br /><span className="text-vani-gradient-text">Digital Reality</span></h2>
               
               <div className="space-y-6 mt-8">
                  <Perk label="64-Slot Visual Mosaic Grid" />
                  <Perk label="Exclusive 'Elite' Identity Badge" />
                  <Perk label="Priority Neural Transmission" />
                  <Perk label="Founder's Access to Beta Features" />
               </div>
            </div>
            
            <div className="mt-auto pt-10 border-t border-white/5">
               <div className="text-3xl font-black text-white tracking-tighter">₹1,000 <span className="text-lg text-gray-500 font-medium">/ Lifetime</span></div>
               <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">One-time Sovereign Payment</div>
            </div>
         </div>

         {/* Right: Payment */}
         <div className="w-1/2 bg-discord-channel p-12 flex flex-col justify-center">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><CreditCard size={24} className="text-vani-blue" /> Secure Payment</h3>
            
            <div className="flex bg-gray-900 p-1 rounded-xl mb-8">
               <MethodBtn label="UPI (India)" active={method === 'UPI'} onClick={() => setMethod('UPI')} icon={<Smartphone size={16} />} />
               <MethodBtn label="Global Crypto" active={method === 'CRYPTO'} onClick={() => setMethod('CRYPTO')} icon={<Globe size={16} />} />
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mb-8 text-center">
               {method === 'UPI' ? (
                 <>
                    <div className="w-48 h-48 bg-white mx-auto rounded-xl mb-4 flex items-center justify-center">
                       {/* Placeholder for QR Code */}
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=YOUR_VPA_HERE&pn=YantravaniCorp&am=1000&tn=YantravaniElite`} alt="QR" className="w-40 h-40" />
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Scan with GPay / PhonePe / Paytm</div>
                 </>
               ) : (
                 <div className="py-10">
                    <div className="font-mono text-xs text-vani-blue bg-vani-blue/10 p-4 rounded-xl break-all">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-4">Send USDT/ETH (ERC-20)</div>
                 </div>
               )}
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Transaction Reference (UTR / Hash)</label>
                  <input 
                    className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-xl focus:border-vani-blue outline-none font-mono text-xs"
                    placeholder="Enter 12-digit UTR or Tx Hash..."
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                  />
               </div>
               <button onClick={handleSubmit} className="w-full bg-vani-gradient text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-red-500/20">Submit Proof</button>
            </div>
         </div>
      </div>
    </div>
  );
};

const Perk = ({ label }: any) => (
  <div className="flex items-center space-x-3">
     <div className="bg-green-500/20 text-green-500 p-1 rounded-lg"><CheckCircle2 size={14} /></div>
     <span className="text-sm font-bold text-gray-300">{label}</span>
  </div>
);

const MethodBtn = ({ label, active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
  >
     {icon} <span>{label}</span>
  </button>
);
