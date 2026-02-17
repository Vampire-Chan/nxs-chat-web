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
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">{t('faq.title')}</h1>
          <div className="h-1 w-20 bg-vani-gradient rounded-full" />
          <p className="mt-6 text-gray-500 uppercase text-xs font-bold tracking-widest leading-relaxed">{t('faq.subtitle')}</p>
        </header>

        <div className="space-y-16">
          <FAQSection title={t('faq.sec_identity')} icon={<User className="text-vani-blue" size={24} />}>
            <FAQItem 
              q={t('faq.q_alias')} 
              a={t('faq.a_alias')} 
            />
            <FAQItem 
              q={t('faq.q_dob')} 
              a={t('faq.a_dob')} 
            />
            <FAQItem 
              q={t('faq.q_ghost')} 
              a={t('faq.a_ghost')} 
            />
          </FAQSection>

          <FAQSection title={t('faq.sec_realm')} icon={<Zap className="text-yellow-400" size={24} />}>
            <FAQItem 
              q={t('faq.q_realm_diff')} 
              a={t('faq.a_realm_diff')} 
            />
            <FAQItem 
              q={t('faq.q_limit')} 
              a={t('faq.a_limit')} 
            />
          </FAQSection>

          <FAQSection title={t('faq.sec_matrix')} icon={<Globe className="text-purple-500" size={24} />}>
            <FAQItem 
              q={t('faq.q_broadcast')} 
              a={t('faq.a_broadcast')} 
            />
          </FAQSection>
        </div>

        <footer className="mt-32 p-10 bg-white/5 rounded-[40px] border border-white/5 text-center">
           <HelpCircle size={40} className="mx-auto mb-6 text-gray-600" />
           <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">{t('faq.footer_title')}</h3>
           <p className="text-gray-500 text-sm mb-8">{t('faq.footer_desc')}</p>
           <button onClick={() => navigate('/help')} className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-vani-blue hover:text-white transition-all">{t('faq.footer_btn')}</button>
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
