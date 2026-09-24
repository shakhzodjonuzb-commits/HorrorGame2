import React from 'react';
import { translations, Language } from '../localization/strings';

interface GameOverModalProps {
  isVictory: boolean;
  reason?: string;
  routeUsed?: string | null;
  timeSurvivedSeconds: number;
  lang: Language;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  reason,
  routeUsed,
  timeSurvivedSeconds,
  lang,
  onRestart,
  onMainMenu
}) => {
  const t = translations[lang];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg select-none">
      <div
        className={`w-full max-w-md bg-zinc-950 border-2 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 animate-scale-up ${
          isVictory ? 'border-emerald-600 shadow-emerald-950/60' : 'border-red-700 shadow-red-950/80'
        }`}
      >
        <div className="text-4xl">
          {isVictory ? '🏆' : '💀'}
        </div>

        <h2
          className={`text-2xl md:text-3xl font-black font-serif tracking-wider uppercase ${
            isVictory ? 'text-emerald-400' : 'text-red-500'
          }`}
        >
          {isVictory ? t.escapedTitle : t.caughtTitle}
        </h2>

        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
          {isVictory ? t.escapedSubtitle : reason || t.caughtSubtitle}
        </p>

        {/* Stats card */}
        <div className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 my-2 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>{t.timeSurvived}:</span>
            <span className="font-mono font-bold text-white">{formatTime(timeSurvivedSeconds)}</span>
          </div>
          {isVictory && routeUsed && (
            <div className="flex justify-between text-zinc-400">
              <span>{t.escapeRouteUsed}:</span>
              <span className="font-bold text-emerald-400 uppercase">{routeUsed.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          <button
            onClick={onRestart}
            className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase shadow-lg active:scale-95 transition-all text-white ${
              isVictory ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-red-800 hover:bg-red-700'
            }`}
          >
            {t.playAgain}
          </button>
          <button
            onClick={onMainMenu}
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs tracking-wider uppercase active:scale-95 transition-all"
          >
            {t.backToMenu}
          </button>
        </div>
      </div>
    </div>
  );
};
