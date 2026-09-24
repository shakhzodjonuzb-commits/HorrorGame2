import React, { useState, useEffect } from 'react';
import { translations, Language } from '../localization/strings';
import { exportGameApk } from '../utils/apkExport';

interface MainMenuProps {
  lang: Language;
  onSetLang: (lang: Language) => void;
  onSingleplayer: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
  onGuide: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  lang,
  onSetLang,
  onSingleplayer,
  onMultiplayer,
  onSettings,
  onGuide
}) => {
  const t = translations[lang];
  const [apkNotice, setApkNotice] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed & running standalone
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isRunningStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setApkNotice('Installing The Silent House to your phone...');
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleExportApk = () => {
    const res = exportGameApk();
    setApkNotice(res.message);
    setTimeout(() => setApkNotice(null), 5000);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 md:p-8 bg-zinc-950 text-white select-none overflow-hidden font-sans">
      {/* Dark atmospheric horror background */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 mix-blend-luminosity"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #2b0b0b 0%, #08080a 75%, #020203 100%)'
        }}
      />
      {/* Fog vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.95)]" />

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs text-red-500 font-mono tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span>OFFLINE LOCAL LAN READY</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Install to Phone Button */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-gradient-to-r from-red-900 to-red-950 border border-red-500 rounded-lg text-[11px] font-mono text-white font-bold flex items-center gap-1.5 active:scale-95 shadow-lg shadow-red-950/70 animate-pulse"
              title="Install game directly to phone"
            >
              <span>📲</span>
              <span>INSTALL TO PHONE</span>
            </button>
          )}

          {/* Export APK Button */}
          <button
            onClick={handleExportApk}
            className="px-3 py-1.5 bg-zinc-900/90 border border-zinc-700 hover:border-red-500 rounded-lg text-[11px] font-mono text-zinc-300 font-bold flex items-center gap-1.5 active:scale-95 shadow-md"
            title="Export APK to /sdcard/games/TheSilentHouse/game.apk"
          >
            <span>📱</span>
            <span>GET APK</span>
          </button>

          {/* Language Switch */}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => onSetLang('en')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                lang === 'en' ? 'bg-red-900/80 text-white border border-red-600' : 'text-zinc-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onSetLang('uz')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                lang === 'uz' ? 'bg-red-900/80 text-white border border-red-600' : 'text-zinc-400 hover:text-white'
              }`}
            >
              UZ
            </button>
            <button
              onClick={() => onSetLang('ru')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                lang === 'ru' ? 'bg-red-900/80 text-white border border-red-600' : 'text-zinc-400 hover:text-white'
              }`}
            >
              RU
            </button>
          </div>
        </div>
      </div>

      {/* APK Notice Toast */}
      {apkNotice && (
        <div className="z-30 bg-emerald-950/95 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-2xl animate-fade-in text-center max-w-md">
          {apkNotice}
        </div>
      )}

      {/* Center: Title & Subtitle */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        <h1
          className="text-4xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-300 to-red-900 font-serif drop-shadow-[0_10px_20px_rgba(180,0,0,0.6)]"
          style={{ letterSpacing: '0.2em' }}
        >
          {t.gameTitle}
        </h1>
        <p className="text-zinc-400 text-xs md:text-sm tracking-widest uppercase mt-2 font-medium">
          {t.gameSubtitle}
        </p>

        {/* Action Buttons Menu */}
        <div className="flex flex-col gap-2.5 mt-6 w-72 md:w-80">
          <button
            onClick={onSingleplayer}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-950/90 via-red-900/70 to-zinc-950 border border-red-600/80 hover:border-red-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl shadow-red-950/50 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {t.singleplayer}
          </button>

          <button
            onClick={onMultiplayer}
            className="w-full py-3.5 px-6 rounded-xl bg-zinc-900/80 border border-zinc-700/80 hover:border-red-600/70 text-zinc-200 font-bold text-sm tracking-wider uppercase shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>📡</span>
            <span>{t.localMultiplayer}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onSettings}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-semibold text-xs tracking-wider uppercase active:scale-95 transition-all"
            >
              ⚙️ {t.settings}
            </button>
            <button
              onClick={onGuide}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-semibold text-xs tracking-wider uppercase active:scale-95 transition-all"
            >
              📖 {t.howToPlay}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full flex items-center justify-between text-[10px] md:text-[11px] text-zinc-500 font-mono z-10">
        <span>THE SILENT HOUSE v1.0 • APK: /sdcard/games/TheSilentHouse/game.apk</span>
        <span>NO CLOUD OR INTERNET REQUIRED</span>
      </div>

      {/* Phone Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-red-800/80 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-base font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <span>📲</span> How to Install on Phone
              </h3>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-3 font-sans">
              <p>
                You can install <strong>The Silent House</strong> as a fullscreen, offline native-speed app directly on your phone:
              </p>
              <div className="bg-black/60 rounded-xl p-3 border border-zinc-800 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-red-400">1.</span>
                  <span>Tap the <strong>three dots (⋮)</strong> menu in the top corner of your mobile browser (Chrome/Brave/Edge).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-red-400">2.</span>
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-red-400">3.</span>
                  <span>The Silent House icon will appear on your phone's home screen and app launcher!</span>
                </div>
              </div>

              <div className="bg-red-950/40 rounded-xl p-3 border border-red-900/60">
                <span className="text-[11px] font-bold text-red-300 block mb-1">Or Download the APK directly:</span>
                <button
                  onClick={() => {
                    setShowInstallGuide(false);
                    handleExportApk();
                  }}
                  className="w-full py-2 bg-red-900 hover:bg-red-800 rounded-lg text-white font-bold text-xs uppercase"
                >
                  Download / Export APK Package
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-xs uppercase"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
