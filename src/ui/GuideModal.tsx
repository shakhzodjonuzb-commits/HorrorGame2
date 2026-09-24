import React from 'react';
import { translations, Language } from '../localization/strings';

interface GuideModalProps {
  lang: Language;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ lang, onClose }) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-bold tracking-wider text-red-500 uppercase font-serif">
            {t.howToPlay}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Lore */}
        <div className="flex flex-col gap-1 bg-black/40 p-3.5 rounded-xl border border-zinc-800/80">
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.guideLoreTitle}</span>
          <p className="text-xs text-zinc-300 leading-relaxed">{t.guideLore}</p>
        </div>

        {/* Section 2: Survival Rules */}
        <div className="flex flex-col gap-1 bg-black/40 p-3.5 rounded-xl border border-zinc-800/80">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{t.guideRulesTitle}</span>
          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{t.guideRules}</p>
        </div>

        {/* Section 3: The Caretaker AI */}
        <div className="flex flex-col gap-1 bg-black/40 p-3.5 rounded-xl border border-zinc-800/80">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">{t.guideEnemyTitle}</span>
          <p className="text-xs text-zinc-300 leading-relaxed">{t.guideEnemy}</p>
        </div>

        {/* Section 4: Three Escape Routes */}
        <div className="flex flex-col gap-1 bg-black/40 p-3.5 rounded-xl border border-zinc-800/80">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t.guideEscapesTitle}</span>
          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{t.guideEscapes}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-1 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs tracking-wider uppercase active:scale-95 transition-all"
        >
          {t.saveSettings}
        </button>
      </div>
    </div>
  );
};
