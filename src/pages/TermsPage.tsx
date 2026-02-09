import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScrollText, Scale, ShieldAlert, FileWarning } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TermsPage() {
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
            <Scale size={40} className="text-nexus-blue" /> {t('settings.legal')}
          </h1>
          <div className="h-1 w-20 bg-nexus-gradient rounded-full" />
          <p className="mt-6 text-gray-500 uppercase text-[10px] font-black tracking-[0.3em]">Revision 2026.04.AT // Matrix Legal Framework</p>
        </header>

        <div className="space-y-12 text-sm text-gray-400 leading-relaxed max-w-3xl">
          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <ScrollText size={18} className="text-nexus-blue" /> 01. Identity Ownership
            </h2>
            <p>By Establishing a Node in the Nexus Matrix, you maintain primary sovereignty over your generated visual data and neural transmissions. However, you grant Nexus a global, non-exclusive license to host, cache, and synchronize this data across the network.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <ShieldAlert size={18} className="text-red-500" /> 02. Prohibited Transmissions
            </h2>
            <p>The following data packets are restricted and will result in immediate node severance (Banning):</p>
            <ul className="list-disc pl-6 space-y-2 text-[13px]">
              <li>Malicious code or binary exploits intended to disrupt realm stability.</li>
              <li>Unauthorized access to high-tier identity nodes.</li>
              <li>Transmissions violating the community neural guidelines (see /guidelines).</li>
              <li>Impersonation of the Architect Core or System Administrators.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <FileWarning size={18} className="text-yellow-500" /> 03. Financial Contributions
            </h2>
            <p>Elite Node upgrades and manual payment submissions are final. Any attempt to reverse a verified financial sync without authorization will result in a permanent security lock on your identity.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest">04. Matrix Connectivity</h2>
            <p>Nexus does not guarantee 100% neural link uptime. System maintenance and matrix recalibrations may occur without notice. We are not liable for any data loss occurring during sector collapses or unauthorized node breaches.</p>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-[10px] font-mono text-gray-600">
          BY CLICKING "ENTER THE MATRIX", YOU ACKNOWLEDGE AND CALIBRATE YOUR NODE TO THESE TERMS. FAILURE TO COMPLY WILL RESULT IN SEVERANCE.
        </div>
      </div>
    </div>
  );
}