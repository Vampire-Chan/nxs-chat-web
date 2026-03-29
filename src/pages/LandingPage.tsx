import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Globe, Users, ArrowRight, MessageSquare, Sparkles, Server, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, VISIBLE_LANGUAGE_OPTIONS } from '../context/LanguageContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const primaryLanguageIds = ['en', 'hi', 'ne'];
  const primaryLanguages = VISIBLE_LANGUAGE_OPTIONS.filter(l => primaryLanguageIds.includes(l.id));
  const secondaryLanguages = VISIBLE_LANGUAGE_OPTIONS.filter(l => !primaryLanguageIds.includes(l.id));

  return (
    <div className="h-screen bg-[#0a0a0c] text-white font-sans selection:bg-vani-blue selection:text-black overflow-y-auto custom-scrollbar">
      {/* BACKGROUND ORBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-vani-blue/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-vani-blue/10 blur-[120px] rounded-full" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 h-20 px-6 md:px-12 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-vani-gradient rounded-xl flex items-center justify-center shadow-lg rotate-12">
            <Zap size={24} className="-rotate-12" />
          </div>
          <span className="text-xl font-black uppercase tracking-tighter">Yantravani</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <button onClick={() => navigate('/help')} className="hover:text-white transition-colors uppercase tracking-widest">{t('nav.protocols')}</button>
          <button onClick={() => navigate('/faq')} className="hover:text-white transition-colors uppercase tracking-widest">{t('nav.knowledge')}</button>
          <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors uppercase tracking-widest">{t('nav.legal')}</button>
          
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-lg border border-white/5 relative group/lang">
            {primaryLanguages.map(l => (
              <button 
                key={l.id} 
                onClick={() => setLanguage(l.id as any)} 
                className={`px-3 py-1.5 rounded-md transition-all font-black text-[9px] uppercase ${language === l.id ? 'bg-vani-blue text-black shadow-[0_0_10px_rgba(0,210,255,0.3)]' : 'hover:text-white'}`}
              >
                {l.id}
              </button>
            ))}
            
            {/* DROPDOWN FOR OTHER LANGUAGES */}
            <div className="relative group">
              <button className={`px-3 py-1.5 rounded-md transition-all font-black text-[9px] uppercase flex items-center gap-1 ${!primaryLanguageIds.includes(language) ? 'bg-vani-blue text-black' : 'hover:text-white'}`}>
                {primaryLanguageIds.includes(language) ? <Globe size={12} /> : language}
                  <ChevronDown size={10} />
               </button>
               
               <div className="absolute top-full right-0 mt-2 w-32 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-[100] overflow-hidden">
                {secondaryLanguages.map(l => (
                    <button 
                      key={l.id} 
                      onClick={() => setLanguage(l.id as any)} 
                      className={`w-full text-left px-4 py-2.5 text-[8px] font-black uppercase hover:bg-white/5 transition-colors ${language === l.id ? 'text-vani-blue bg-vani-blue/5' : 'text-gray-500'}`}
                    >
                      {l.label}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
          className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-vani-blue hover:text-white transition-all shadow-xl"
        >
          {isAuthenticated ? t('nav.enter') : t('nav.link')}
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-20 md:pt-32 pb-20 px-6 text-center overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
            <Sparkles size={14} className="text-vani-blue" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('landing.hero_tag')}</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t('landing.hero_title') }} />
            
          <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('landing.hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
              className="w-full sm:w-auto bg-vani-gradient text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 transition-all flex items-center justify-center space-x-3"
            >
              <span>{t('landing.init_identity')}</span>
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => navigate('/help')}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
            >
              {t('landing.protocols_btn')}
            </button>
          </div>
        </motion.div>

        {/* MOCKUP PREVIEW (Inside Hero Section for proper layout) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="mt-20 max-w-6xl mx-auto relative px-4"
        >
          <div className="bg-gradient-to-b from-white/10 to-transparent p-px rounded-[40px]">
            <div className="bg-[#0a0a0c] rounded-[39px] aspect-video overflow-hidden shadow-2xl relative border border-white/5">
               {/* MOCKUP CONTENT */}
               <div className="absolute inset-0 bg-vani-blue/5 opacity-20 pointer-events-none" />
               <div className="flex h-full">
                  <div className="w-16 md:w-20 bg-discord-sidebar border-r border-white/5 flex flex-col items-center py-6 space-y-4">
                     {[...Array(4)].map((_, i) => <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 animate-pulse" />)}
                  </div>
                  <div className="w-40 md:w-60 bg-discord-channel border-r border-white/5 p-6 space-y-4">
                     <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
                     <div className="space-y-2 pt-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-2 bg-white/5 rounded-full" style={{ width: (40 + (i * 13) % 45) + '%' }} />)}
                     </div>
                  </div>
                  <div className="flex-1 p-10 relative">
                     <div className="flex items-center space-x-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-vani-gradient" />
                        <div className="space-y-2">
                           <div className="h-3 bg-white/10 rounded-full w-32" />
                           <div className="h-2 bg-white/5 rounded-full w-20" />
                        </div>
                     </div>
                     <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex space-x-4">
                             <div className="w-10 h-10 rounded-xl bg-white/5" />
                             <div className="flex-1 space-y-2">
                                <div className="h-2 bg-white/10 rounded-full w-24" />
                                <div className="h-3 bg-white/5 rounded-full w-full" />
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* GENESIS SECTION */}
      <section className="py-20 px-6 border-y border-white/5 bg-black/40">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
           <div className="w-32 h-32 flex-shrink-0 bg-vani-gradient rounded-[40px] flex items-center justify-center shadow-3xl shadow-vani-blue/20">
              <Zap size={64} className="text-white" />
           </div>
           <div className="text-center md:text-left space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">{t('landing.genesis_title')}</h2>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">
                {t('landing.genesis_desc')}
              </p>
           </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-32 px-6 md:px-12 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={<Server className="text-vani-blue" size={32} />}
            title={t('landing.feat_realms')}
            desc={t('landing.feat_realms_desc')}
          />
          <FeatureCard 
            icon={<Globe className="text-purple-500" size={32} />}
            title={t('landing.feat_matrix')}
            desc={t('landing.feat_matrix_desc')}
          />
          <FeatureCard 
            icon={<Shield className="text-vani-accent" size={32} />}
            title={t('landing.feat_identity')}
            desc={t('landing.feat_identity_desc')}
          />
        </div>
      </section>

      {/* ARCHITECT MODE SECTION */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-20">
           <div className="flex-1 space-y-8">
              <div className="text-vani-blue font-black uppercase tracking-[0.4em] text-[10px]">{t('landing.architect_tag')}</div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter" dangerouslySetInnerHTML={{ __html: t('landing.architect_title').replace('Realms', '<span class="text-vani-blue">Realms</span>').replace('लोकों', '<span class="text-vani-blue">लोकों</span>').replace('क्षेत्रहरू', '<span class="text-vani-blue">क्षेत्रहरू</span>') }}></h2>
              <p className="text-gray-400 leading-relaxed text-lg font-light">
                 {t('landing.architect_desc')}
              </p>
              <ul className="space-y-4">
                 {[
                   { icon: <Shield size={16} />, text: "Granular Authority Matrices" },
                   { icon: <Users size={16} />, text: "Infinite Identity Synchronization" },
                   { icon: <MessageSquare size={16} />, text: "Encrypted Neural Transmissions" }
                 ].map((item, i) => (
                   <li key={i} className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-white/60">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-vani-blue">{item.icon}</div>
                      <span>{item.text}</span>
                   </li>
                 ))}
              </ul>
           </div>
           <div className="flex-1 relative">
              <div className="absolute inset-0 bg-vani-blue/20 blur-[100px] rounded-full" />
              <motion.div initial={{ rotate: -5 }} whileHover={{ rotate: 0 }} className="relative bg-[#050507] border border-white/10 p-8 rounded-[48px] shadow-2xl overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity"><Settings size={100} className="text-vani-blue animate-spin-slow" /></div>
                 <h4 className="text-sm font-black uppercase tracking-widest mb-6">Console_Log // 0x42</h4>
                 <div className="font-mono text-[10px] text-vani-blue space-y-2 opacity-60">
                    <p>&gt; initializing_yantra_node...</p>
                    <p>&gt; applying_authority_Vani Matrix: standard_v1</p>
                    <p>&gt; encrypting_vani_transmissions...</p>
                    <p className="text-white">&gt; node_ready: sovereign_realm_online</p>
                 </div>
              </motion.div>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-white/5 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-10 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-3">
              <Zap size={20} className="text-vani-blue" />
              <span className="font-black uppercase tracking-tighter">Yantravani</span>
            </div>
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Voice_Of_The_Machine // v1.0.42</p>
          </div>
          <div className="flex space-x-12 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <div className="flex flex-col space-y-4">
              <span className="text-white">{t('landing.footer_arch')}</span>
              <button onClick={() => navigate('/help')} className="hover:text-vani-blue transition-colors text-left">{t('landing.protocols_btn')}</button>
              <button onClick={() => navigate('/faq')} className="hover:text-vani-blue transition-colors text-left">{t('nav.knowledge')}</button>
            </div>
            <div className="flex flex-col space-y-4">
              <span className="text-white">{t('landing.footer_sov')}</span>
              <button onClick={() => navigate('/terms')} className="hover:text-vani-blue transition-colors text-left">Vani_Terms</button>
              <button onClick={() => navigate('/guidelines')} className="hover:text-vani-blue transition-colors text-left">Community_CG</button>
            </div>
          </div>
        </div>
        <div className="text-center mt-20 pt-10 border-t border-white/5">
          <p className="text-[8px] font-mono text-gray-700 uppercase tracking-[0.5em]">{t('landing.footer_rights')}</p>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-10 bg-white/5 rounded-[40px] border border-white/5 hover:border-vani-blue/30 transition-all group">
    <div className="mb-8 bg-black/40 w-16 h-16 rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">{icon}</div>
    <h3 className="text-xl font-black uppercase tracking-tighter mb-4">{title}</h3>
    <p className="text-gray-500 leading-relaxed text-sm font-medium">{desc}</p>
  </div>
);
