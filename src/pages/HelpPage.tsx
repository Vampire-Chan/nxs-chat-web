import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Server, Globe, Shield, User, HelpCircle, Info, Zap, Terminal, Layout, MessageSquare, Newspaper, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function HelpPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'wit' | 'howto' | 'terms'>('wit');

  const tabs = [
    { id: 'wit', label: t('help.tab_wit'), icon: <Info size={16} /> },
    { id: 'howto', label: t('help.tab_howto'), icon: <Zap size={16} /> },
    { id: 'terms', label: t('help.tab_terms'), icon: <Terminal size={16} /> }
  ];

  return (
    <div className="h-screen bg-[#0a0a0c] text-white p-8 md:p-20 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-12 flex items-center space-x-3 text-gray-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={18} />
          <span>{t('common.back')}</span>
        </button>

        <header className="mb-16">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 bg-vani-gradient bg-clip-text text-transparent">
            {t('help.title')}
          </h1>
          <div className="h-1 w-20 bg-vani-gradient rounded-full mb-8" />
          <p className="text-gray-400 text-lg font-light leading-relaxed max-w-2xl">
            {t('help.subtitle')}
          </p>
        </header>

        {/* TAB NAVIGATION */}
        <div className="flex space-x-2 p-1 bg-white/5 rounded-2xl mb-12 border border-white/5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'wit' && (
              <div className="space-y-12">
                <section className="p-10 bg-white/5 rounded-[40px] border border-white/5">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center space-x-4">
                    <div className="p-3 bg-vani-blue/10 rounded-2xl text-vani-blue"><Info size={24} /></div>
                    <span>{t('help.tab_wit')}</span>
                  </h2>
                  <p className="text-gray-400 leading-relaxed text-lg mb-8">
                    {t('wit.intro')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <div className="space-y-4">
                      <h3 className="text-white font-black uppercase tracking-widest text-sm">{t('wit.hybrid_title')}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{t('wit.hybrid_desc')}</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-black uppercase tracking-widest text-sm">Genesis Philosophy</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{t('wit.philosophy')}</p>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <HelpCard icon={<Server className="text-vani-blue" />} title={t('landing.feat_realms')} desc={t('landing.feat_realms_desc')} />
                  <HelpCard icon={<Globe className="text-purple-500" />} title={t('landing.feat_matrix')} desc={t('landing.feat_matrix_desc')} />
                </div>
              </div>
            )}

            {activeTab === 'howto' && (
              <div className="space-y-20">
                <section className="space-y-12">
                  <StepItem number="01" title={t('howto.step1_title')} desc={t('howto.step1_desc')} />
                  <StepItem number="02" title={t('howto.step2_title')} desc={t('howto.step2_desc')} />
                  <StepItem number="03" title={t('howto.step3_title')} desc={t('howto.step3_desc')} />
                </section>

                {/* VISUAL INTERFACE GUIDE */}
                <section className="space-y-12">
                   <div className="flex items-center space-x-4 border-b border-white/5 pb-6">
                      <Layout className="text-vani-blue" size={24} />
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Interface Guide</h2>
                   </div>

                   <div className="grid grid-cols-1 gap-16">
                      {/* MINI APP LAYOUT */}
                      <div className="space-y-6">
                         <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">The 3-Pane Architecture</h3>
                         <div className="bg-[#050507] rounded-[40px] border border-white/10 p-4 shadow-2xl overflow-hidden aspect-video flex">
                            {/* DOCK MINI */}
                            <div className="w-12 h-full bg-white/5 rounded-2xl flex flex-col items-center py-4 space-y-3 mr-4 border border-white/5">
                               <div className="w-6 h-6 rounded-lg bg-vani-blue/40 ring-2 ring-vani-blue/20" />
                               <div className="w-6 h-6 rounded-lg bg-white/5" />
                               <div className="w-6 h-6 rounded-lg bg-white/5" />
                               <div className="mt-auto w-6 h-6 rounded-lg bg-white/10" />
                            </div>
                            
                            {/* NAVIGATOR MINI */}
                            <div className="w-32 h-full bg-white/[0.02] rounded-2xl p-4 mr-4 border border-white/5 space-y-4">
                               <div className="h-3 w-16 bg-white/10 rounded-full" />
                               <div className="space-y-2">
                                  {[...Array(5)].map((_, i) => <div key={i} className="h-2 w-full bg-white/5 rounded-full" />)}
                               </div>
                            </div>

                            {/* CONTENT MINI */}
                            <div className="flex-1 h-full bg-white/[0.01] rounded-2xl p-6 border border-white/5 flex flex-col">
                               <div className="flex items-center space-x-4 mb-6">
                                  <div className="w-8 h-8 rounded-xl bg-vani-gradient" />
                                  <div className="h-2 w-24 bg-white/10 rounded-full" />
                               </div>
                               <div className="flex-1 space-y-4">
                                  {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex space-x-3">
                                       <div className="w-6 h-6 rounded-lg bg-white/5" />
                                       <div className="flex-1 h-2 bg-white/5 rounded-full mt-2" />
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <UILabel icon={<Server size={14} />} title="Core Dock" desc="Left/Top sidebar for switching between your active Realms and the Matrix." />
                            <UILabel icon={<Terminal size={14} />} title="Navigator" desc="The inner sidebar where you find Channels (Sectors) and your DM list." />
                            <UILabel icon={<Globe size={14} />} title="The Stage" desc="The central content area where communication and feeds take place." />
                         </div>
                      </div>

                      {/* COMMUNICATION TYPES */}
                      <div className="space-y-8">
                         <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Transmission Types</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* TEXT SECTOR MINI */}
                            <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 space-y-6">
                               <div className="flex items-center space-x-3 mb-4">
                                  <MessageSquare className="text-vani-blue" size={20} />
                                  <span className="font-black uppercase tracking-widest text-xs">Text Sectors</span>
                               </div>
                               <div className="space-y-3 opacity-60">
                                  <div className="flex space-x-2">
                                     <div className="w-6 h-6 bg-white/10 rounded-lg" />
                                     <div className="flex-1 h-1.5 bg-white/5 rounded-full mt-2" />
                                  </div>
                                  <div className="h-1.5 w-3/4 bg-white/5 rounded-full" />
                                  <div className="h-8 w-full bg-black/40 rounded-xl border border-white/10" />
                               </div>
                               <p className="text-gray-500 text-xs">Fast-paced, real-time messaging protocol. Used for internal Realm discussions or DMs.</p>
                            </div>

                            {/* FEED SECTOR MINI */}
                            <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 space-y-6">
                               <div className="flex items-center space-x-3 mb-4">
                                  <Newspaper className="text-purple-500" size={20} />
                                  <span className="font-black uppercase tracking-widest text-xs">Visual Matrix (Feed)</span>
                               </div>
                               <div className="space-y-4 opacity-60">
                                  <div className="h-24 w-full bg-vani-gradient/20 rounded-2xl border border-white/10 flex items-center justify-center">
                                     <Globe size={32} className="text-white/10" />
                                  </div>
                                  <div className="flex space-x-2">
                                     <div className="w-6 h-6 bg-white/10 rounded-lg" />
                                     <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
                                        <div className="h-1.5 w-full bg-white/5 rounded-full" />
                                     </div>
                                  </div>
                               </div>
                               <p className="text-gray-500 text-xs">Visual broadcast system for mass discovery and public transmissions.</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </section>
                
                <div className="mt-12 p-8 bg-vani-gradient rounded-[40px] text-white">
                   <h3 className="text-xl font-black uppercase tracking-widest mb-4">Ready to Broadcast?</h3>
                   <p className="opacity-80 text-sm mb-6">Your identity node is waiting for its first synchronization.</p>
                   <button onClick={() => navigate('/login')} className="bg-white text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">Initialize Now</button>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TermCard term={t('term.realm')} def={t('term.realm_def')} />
                <TermCard term={t('term.sector')} def={t('term.sector_def')} />
                <TermCard term={t('term.matrix')} def={t('term.matrix_def')} />
                <TermCard term={t('term.node')} def={t('term.node_def')} />
                <TermCard term={t('term.architect')} def={t('term.architect_def')} />
                <TermCard term={t('term.ghost_mode')} def={t('term.ghost_mode_def')} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-32 pt-12 border-t border-white/5 text-center">
           <HelpCircle size={32} className="mx-auto mb-4 text-gray-700" />
           <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">End_Of_Manual // Version 1.0.42</p>
        </footer>
      </div>
    </div>
  );
}

const HelpCard = ({ icon, title, desc }: any) => (
  <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-vani-blue/30 transition-all group">
    <div className="mb-6 p-4 bg-black/40 w-fit rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-lg font-black uppercase tracking-tighter mb-3">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const StepItem = ({ number, title, desc }: any) => (
  <div className="flex items-start space-x-8 p-8 bg-white/5 rounded-[32px] border border-white/5">
    <div className="text-4xl font-black text-white/10">{number}</div>
    <div className="space-y-2">
      <h3 className="text-lg font-black uppercase tracking-tighter text-vani-blue">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

const UILabel = ({ icon, title, desc }: any) => (
  <div className="space-y-2">
     <div className="flex items-center space-x-2 text-vani-blue">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
     </div>
     <p className="text-gray-500 text-[11px] leading-relaxed">{desc}</p>
  </div>
);

const TermCard = ({ term, def }: any) => (
  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
    <h4 className="text-vani-blue font-black uppercase tracking-widest text-xs mb-2">{term}</h4>
    <p className="text-gray-500 text-sm leading-relaxed">{def}</p>
  </div>
);
