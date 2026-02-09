import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Server, Globe, Shield, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HelpPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-discord-dark text-white p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-nexus-blue to-purple-500">
          {t('help.title')}
        </h1>
        <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed">
          {t('help.intro')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <HelpCard 
            icon={<Server size={32} className="text-nexus-blue" />}
            title={t('help.realms')}
            desc={t('help.realms_desc')}
          />
          <HelpCard 
            icon={<Globe size={32} className="text-green-400" />}
            title={t('help.matrix')}
            desc={t('help.matrix_desc')}
          />
          <HelpCard 
            icon={<Shield size={32} className="text-red-400" />}
            title={t('help.identity')}
            desc={t('help.identity_desc')}
          />
          <HelpCard 
            icon={<User size={32} className="text-yellow-400" />}
            title={t('nav.profile')}
            desc={t('help.identity_desc')}
          />
        </div>

        <div className="mt-16 p-8 bg-white/5 rounded-3xl border border-white/10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Book size={24} /> FAQ</h2>
          <div className="space-y-4 text-gray-300">
            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-white flex items-center justify-between">How do I create a Realm? <span className="text-nexus-blue">+</span></summary>
              <p className="mt-2 text-sm text-gray-500 pl-4 border-l-2 border-white/10">Navigate to the main dock (left/bottom) and click the '+' icon. Assign a name and initialize your sovereign node.</p>
            </details>
            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-white flex items-center justify-between">Why can't I post to the Matrix? <span className="text-nexus-blue">+</span></summary>
              <p className="mt-2 text-sm text-gray-500 pl-4 border-l-2 border-white/10">If your identity is set to 'Private', you cannot broadcast to the global feed. Disable privacy in Settings &gt; Identity Hub.</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

const HelpCard = ({ icon, title, desc }: any) => (
  <div className="bg-discord-channel p-8 rounded-3xl border border-white/5 hover:border-nexus-blue/30 transition-all hover:translate-y-[-5px] shadow-xl">
    <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center">{icon}</div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
  </div>
);