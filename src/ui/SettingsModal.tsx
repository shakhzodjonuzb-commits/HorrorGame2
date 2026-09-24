import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { translations, Language } from '../localization/strings';
import { exportGameApk } from '../utils/apkExport';

interface SettingsModalProps {
  settings: GameSettings;
  lang: Language;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  lang,
  onUpdateSettings,
  onClose
}) => {
  const t = translations[lang];
  const [apkNotice, setApkNotice] = useState<string | null>(null);

  const handleExportApk = () => {
    const res = exportGameApk();
    setApkNotice(res.message);
    setTimeout(() => setApkNotice(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-bold tracking-wider text-red-500 uppercase font-serif">
            {t.settings}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* APK Exporter Section */}
        <div className="bg-black/50 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">OFFLINE APK EXPORT</span>
            <span className="text-[10px] text-zinc-500 font-mono">TARGET: /sdcard/games/TheSilentHouse/game.apk</span>
          </div>
          <button
            onClick={handleExportApk}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-850 hover:bg-zinc-750 border border-red-800/70 text-zinc-200 font-bold text-xs uppercase flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <span>📱</span>
            <span>CREATE / EXPORT APK TO SDCARD</span>
          </button>
          {apkNotice && (
            <span className="text-[11px] font-mono text-emerald-400 text-center font-semibold">
              {apkNotice}
            </span>
          )}
        </div>

        {/* Setting 1: Language */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase">{t.language}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English' },
              { id: 'uz', label: 'O\'zbekcha' },
              { id: 'ru', label: 'Русский' }
            ].map(l => (
              <button
                key={l.id}
                onClick={() => onUpdateSettings({ ...settings, language: l.id as Language })}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  settings.language === l.id
                    ? 'bg-red-950 border-red-500 text-white'
                    : 'bg-black/40 border-zinc-800 text-zinc-400'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Setting 2: Graphics Quality */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase">{t.graphicsQuality}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low', label: t.qualityLow },
              { id: 'med', label: t.qualityMed },
              { id: 'high', label: t.qualityHigh },
            ].map(q => (
              <button
                key={q.id}
                onClick={() => onUpdateSettings({ ...settings, graphicsQuality: q.id as 'low' | 'med' | 'high' })}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold border truncate transition-all ${
                  settings.graphicsQuality === q.id
                    ? 'bg-red-950 border-red-500 text-white'
                    : 'bg-black/40 border-zinc-800 text-zinc-400'
                }`}
              >
                {q.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Setting 3: FPS Target */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase">{t.fpsLimit}</label>
          <div className="grid grid-cols-2 gap-2">
            {[30, 60].map(fps => (
              <button
                key={fps}
                onClick={() => onUpdateSettings({ ...settings, fpsLimit: fps as 30 | 60 })}
                className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                  settings.fpsLimit === fps
                    ? 'bg-red-950 border-red-500 text-white'
                    : 'bg-black/40 border-zinc-800 text-zinc-400'
                }`}
              >
                {fps} FPS
              </button>
            ))}
          </div>
        </div>

        {/* Setting 4: Look Sensitivity Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-zinc-400">
            <span>{t.lookSensitivity}</span>
            <span className="text-red-400">{settings.lookSensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={settings.lookSensitivity}
            onChange={(e) => onUpdateSettings({ ...settings, lookSensitivity: parseFloat(e.target.value) })}
            className="w-full accent-red-600 bg-zinc-800 h-2 rounded-lg"
          />
        </div>

        {/* Setting 5: FOV Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-zinc-400">
            <span>{t.fieldOfView}</span>
            <span className="text-red-400">{settings.fov}°</span>
          </div>
          <input
            type="range"
            min="65"
            max="95"
            step="1"
            value={settings.fov}
            onChange={(e) => onUpdateSettings({ ...settings, fov: parseInt(e.target.value) })}
            className="w-full accent-red-600 bg-zinc-800 h-2 rounded-lg"
          />
        </div>

        {/* Setting 6: Sound Effects Volume */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-zinc-400">
            <span>{t.soundVolume}</span>
            <span className="text-red-400">{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.sfxVolume}
            onChange={(e) => onUpdateSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
            className="w-full accent-red-600 bg-zinc-800 h-2 rounded-lg"
          />
        </div>

        {/* Setting 7: Ambience Volume */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-zinc-400">
            <span>{t.ambientVolume}</span>
            <span className="text-red-400">{Math.round(settings.ambientVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.ambientVolume}
            onChange={(e) => onUpdateSettings({ ...settings, ambientVolume: parseFloat(e.target.value) })}
            className="w-full accent-red-600 bg-zinc-800 h-2 rounded-lg"
          />
        </div>

        {/* Save & Return */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-3 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase active:scale-95 transition-all shadow-lg"
        >
          {t.saveSettings}
        </button>
      </div>
    </div>
  );
};
