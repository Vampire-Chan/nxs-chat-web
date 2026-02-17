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
            <Scale size={40} className="text-vani-blue" /> {t('terms.title')}
          </h1>
          <div className="h-1 w-20 bg-vani-gradient rounded-full" />
          <p className="mt-6 text-gray-500 uppercase text-[10px] font-black tracking-[0.3em]">{t('terms.revision')}</p>
        </header>

        <div className="space-y-12 text-sm text-gray-400 leading-relaxed max-w-3xl">
          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <ScrollText size={18} className="text-vani-blue" /> {t('terms.sec1_title')}
            </h2>
            <p>{t('terms.sec1_desc')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <ShieldAlert size={18} className="text-red-500" /> {t('terms.sec2_title')}
            </h2>
            <p>{t('terms.sec2_desc')}</p>
            <ul className="list-disc pl-6 space-y-2 text-[13px]">
              <li>{t('terms.sec2_li1')}</li>
              <li>{t('terms.sec2_li2')}</li>
              <li>{t('terms.sec2_li3')}</li>
              <li>{t('terms.sec2_li4')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <FileWarning size={18} className="text-yellow-500" /> {t('terms.sec3_title')}
            </h2>
            <p>{t('terms.sec3_desc')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-white font-black uppercase tracking-widest">{t('terms.sec4_title')}</h2>
            <p>{t('terms.sec4_desc')}</p>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-[10px] font-mono text-gray-600">
          {t('terms.footer')}
        </div>
      </div>
    </div>
  );
}
