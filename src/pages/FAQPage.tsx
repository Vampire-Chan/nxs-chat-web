import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, User, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function FAQPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-[#0a0a0c] text-white p-8 md:p-20 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-12 flex items-center space-x-3 text-gray-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={18} />
          <span>{t('common.back')}</span>
        </button>

        <header className="mb-20">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">Vani_Knowledge</h1>
          <div className="h-1 w-20 bg-vani-gradient rounded-full" />
          <p className="mt-6 text-gray-500 uppercase text-xs font-bold tracking-widest leading-relaxed">Frequently Asked Protocols & Vani Vani Matrix Queries</p>
        </header>

        <div className="space-y-16">
          <FAQSection title="Identity & Calibration" icon={<User className="text-vani-blue" size={24} />}>
            <FAQItem 
              q="How do I change my Public Alias?" 
              a="Navigate to Settings > Identity Hub. You can recalibrate your Public Name (Alias) at any time. Your Identity Handle (username) remains a permanent unique identifier." 
            />
            <FAQItem 
              q="Why is my Date of Creation locked?" 
              a="The Date of Creation (DOB) is a core biological anchor for your node. Once set and saved, it is encrypted and locked to maintain the integrity of your digital lifespan." 
            />
            <FAQItem 
              q="What is a 'Private Ghost Node'?" 
              a="Enabling Private Mode prevents your node from appearing in Yantravani searches and blocks you from broadcasting to the global feed. You can still participate in sovereign Realms." 
            />
          </FAQSection>

          <FAQSection title="Realm Sovereignty" icon={<Zap className="text-yellow-400" size={24} />}>
            <FAQItem 
              q="What is the difference between a Realm and a Sector?" 
              a="A Realm is a sovereign community server. A Sector is a specific channel within that Realm (Text, Voice, or Broadcast)." 
            />
            <FAQItem 
              q="How many Realms can I initialize?" 
              a="Standard nodes can initialize up to 10 sovereign realms. Elite tier nodes have unlimited realm generation capabilities." 
            />
          </FAQSection>

          <FAQSection title="Vani Vani Matrix Transmissions" icon={<Globe className="text-purple-500" size={24} />}>
            <FAQItem 
              q="Who can see my Broadcasts?" 
              a="If your node is Public, anyone synced with the Vani Vani Matrix can view your transmissions. If you post within a private Sector of a Realm, only members of that realm can access the data." 
            />
            <FAQItem 
              q="Supported media formats?" 
              a="Yantravani currently supports high-resolution images, video streams, and neural voice notes (WebM/WebP/AVIF optimized)." 
            />
          </FAQSection>
        </div>

        <footer className="mt-32 p-10 bg-white/5 rounded-[40px] border border-white/5 text-center">
           <HelpCircle size={40} className="mx-auto mb-6 text-gray-600" />
           <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">Still Uncalibrated?</h3>
           <p className="text-gray-500 text-sm mb-8">Reach out to the Architect core or consult the Vani Protocols.</p>
           <button onClick={() => navigate('/help')} className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-vani-blue hover:text-white transition-all">System Protocols</button>
        </footer>
      </div>
    </div>
  );
}

const FAQSection = ({ title, icon, children }: any) => (
  <div className="space-y-8">
    <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
      {icon}
      <h2 className="text-xl font-black uppercase tracking-widest">{title}</h2>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const FAQItem = ({ q, a }: any) => (
  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="group">
    <h4 className="text-sm font-black uppercase tracking-tight text-white mb-2 group-hover:text-vani-blue transition-colors">{q}</h4>
    <p className="text-gray-500 text-sm leading-relaxed font-medium pl-4 border-l border-white/10">{a}</p>
  </motion.div>
);
