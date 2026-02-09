import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShieldCheck, Users, Zap, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function GuidelinesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-[#0a0a0c] text-white p-8 md:p-20 overflow-y-auto font-sans custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-12 flex items-center space-x-3 text-gray-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={18} />
          <span>{t('common.back')}</span>
        </button>

        <header className="mb-20">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4">
            <Users size={40} className="text-nexus-blue" /> CG
          </h1>
          <div className="h-1 w-20 bg-nexus-gradient rounded-full" />
          <p className="mt-6 text-gray-500 uppercase text-[10px] font-black tracking-[0.3em]">Protocol for Harmonious Matrix Interaction</p>
        </header>

        <div className="space-y-12 text-sm text-gray-400 leading-relaxed max-w-3xl">
          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <Heart size={18} className="text-nexus-accent" /> 01. Mutual Identity Sync
            </h2>
            <p>Respect every unique node in the Matrix. Harassment, targeted hate transmissions, and persistent unauthorized sync requests are strictly prohibited. The Nexus is a place for evolved identity exchange.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <ShieldCheck size={18} className="text-nexus-blue" /> 02. Data Integrity
            </h2>
            <p>Do not broadcast misinformation, fraudulent financial data, or malicious binary content. Every transmission should contribute positively to the Matrix's collective consciousness.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <Zap size={18} className="text-yellow-400" /> 03. Realm Sovereignty
            </h2>
            <p>Realm owners (Sovereigns) have full authority over their nodes. However, global Matrix guidelines still apply within private sectors. Report violation of core protocols using the 'Report' feature on any transmission.</p>
          </section>

          <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[32px] mt-20">
             <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-red-500" size={24} />
                <h3 className="text-white font-black uppercase tracking-widest text-lg">Enforcement Protocol</h3>
             </div>
             <p className="text-[13px] text-gray-500 uppercase leading-relaxed">
                Failure to calibrate your node to these guidelines will result in temporary synchronization locks, Sector bans, or permanent Identity Severance from the Nexus Network.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}