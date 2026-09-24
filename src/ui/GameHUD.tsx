import React, { useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { translations, Language } from '../localization/strings';
import { ItemType } from '../types/game';

interface GameHUDProps {
  engine: GameEngine;
  lang: Language;
  onPause: () => void;
  notifications: string[];
}

export const GameHUD: React.FC<GameHUDProps> = ({ engine, lang, onPause, notifications }) => {
  const t = translations[lang];
  const [showPingMenu, setShowPingMenu] = useState<boolean>(false);

  const localPlayer = engine.localPlayer;
  const interactable = engine.currentInteractable;
  const fearLevel = engine.fearLevel; // 0.0 to 1.0

  // Heartbeat BPM derived from fear pulse (65 BPM to 160 BPM)
  const pulseBpm = Math.round(65 + fearLevel * 95);
  const pulseDuration = (60 / pulseBpm).toFixed(2);

  const isChasing = engine.caretakerState.state === 'CHASE';

  // Item icon resolver
  const getItemIcon = (type: ItemType | null) => {
    switch (type) {
      case 'master_key': return '🗝️';
      case 'basement_key': return '🔑';
      case 'garage_key': return '🗝️';
      case 'bolt_cutters': return '✂️';
      case 'fuse': return '⚡';
      case 'car_battery': return '🔋';
      case 'spark_plug': return '🔌';
      case 'crowbar': return '⛏️';
      case 'valve_wheel': return '☸️';
      case 'flashlight': return '🔦';
      case 'note': return '📜';
      default: return '';
    }
  };

  const getItemName = (type: ItemType | null) => {
    if (!type) return '';
    const key = `item${type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as keyof typeof t;
    return (t[key] as string) || type;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans">
      {/* 1. DYNAMIC FEAR PULSE VIGNETTE */}
      <div
        className="absolute inset-0 pointer-events-none transition-all"
        style={{
          boxShadow: isChasing
            ? 'inset 0 0 140px rgba(220, 0, 0, 0.9), inset 0 0 50px rgba(255, 30, 30, 0.7)'
            : fearLevel > 0.05
            ? `inset 0 0 ${Math.round(40 + fearLevel * 100)}px rgba(180, 10, 10, ${Math.min(0.9, 0.2 + fearLevel * 0.75)})`
            : 'inset 0 0 60px rgba(0, 0, 0, 0.75)',
          animation: fearLevel > 0.3 ? `fearThrob ${pulseDuration}s infinite ease-in-out` : undefined,
          opacity: isChasing ? 1 : Math.max(0.3, fearLevel)
        }}
      />

      {/* Inline styles for the Fear Pulse animation */}
      <style>{`
        @keyframes fearThrob {
          0%, 100% { filter: brightness(1) contrast(1); }
          50% { filter: brightness(0.85) contrast(1.2) drop-shadow(0 0 10px rgba(255,0,0,0.5)); }
        }
      `}</style>

      {/* 2. Top Header Bar: Status, Objectives, Fear Pulse Meter, Ping & Pause */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-auto">
        {/* Left: Objective & Noise Meter */}
        <div className="flex flex-col gap-1 max-w-xs md:max-w-sm">
          {/* Objective Box */}
          <div className="bg-black/65 backdrop-blur-md border border-red-950/70 rounded-lg px-3 py-1 shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{t.objective}</span>
              <span className="text-xs text-zinc-200 font-medium truncate max-w-[210px] md:max-w-xs">
                {engine.escapeProgress.frontDoorChainsCut
                  ? 'Front chains cut! Insert basement fuse.'
                  : engine.escapeProgress.carBatteryInstalled
                  ? 'Battery installed! Find spark plug.'
                  : t.objectiveText}
              </span>
            </div>
          </div>

          {/* Noise & Fear Pulse Combined Row */}
          <div className="flex items-center gap-2">
            {/* Noise Meter */}
            <div className="bg-black/55 backdrop-blur-sm border border-zinc-800 rounded-md px-2 py-0.5 flex items-center gap-1.5 w-32">
              <span className="text-[9px] text-zinc-400 font-bold">🔊</span>
              <div className="flex-1 h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    engine.currentNoiseLevel > 0.7
                      ? 'bg-red-500'
                      : engine.currentNoiseLevel > 0.3
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, engine.currentNoiseLevel * 100)}%` }}
                />
              </div>
            </div>

            {/* Fear Pulse Heartbeat Indicator */}
            <div className={`backdrop-blur-sm border rounded-md px-2 py-0.5 flex items-center gap-1.5 transition-all ${
              fearLevel > 0.6
                ? 'bg-red-950/80 border-red-500 shadow-md shadow-red-950/80'
                : fearLevel > 0.3
                ? 'bg-amber-950/60 border-amber-500/70'
                : 'bg-black/55 border-zinc-800'
            }`}>
              <span className={`text-[10px] ${fearLevel > 0.6 ? 'text-red-400 animate-bounce' : 'text-zinc-400'}`}>
                ❤️
              </span>
              <span className="text-[10px] font-mono font-bold text-zinc-200">
                {pulseBpm} <span className="text-[8px] text-zinc-400">BPM</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Hiding Status or Chase Alert */}
        {localPlayer.hidingSpotId !== null && (
          <div className="bg-blue-950/85 border border-blue-500/70 rounded-full px-4 py-1 shadow-lg text-blue-200 font-bold text-xs tracking-wider flex items-center gap-1.5 animate-pulse">
            <span>👁️</span>
            <span>{t.hiding}</span>
          </div>
        )}

        {isChasing && (
          <div className="bg-red-950/95 border-2 border-red-600 rounded-full px-4 py-1 shadow-xl text-red-200 font-black text-xs tracking-widest flex items-center gap-1.5 animate-bounce">
            <span>⚠️</span>
            <span>{t.caretakerChasing}</span>
          </div>
        )}

        {/* Right: Quick Ping, Stamina & Pause */}
        <div className="flex items-center gap-2">
          {/* Stamina Meter */}
          <div className="bg-black/55 backdrop-blur-sm border border-zinc-800 rounded-md px-2 py-0.5 flex items-center gap-1.5 w-24">
            <span className="text-[9px] text-amber-400 font-bold">⚡</span>
            <div className="flex-1 h-1.5 bg-zinc-850 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${localPlayer.stamina}%` }}
              />
            </div>
          </div>

          {/* Quick Ping Button (Co-op) */}
          <div className="relative">
            <button
              onClick={() => setShowPingMenu(!showPingMenu)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1 active:scale-95 shadow-md"
            >
              <span>📡</span>
              <span className="hidden sm:inline">PING</span>
            </button>

            {showPingMenu && (
              <div className="absolute right-0 top-9 bg-zinc-950/95 border border-zinc-700 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 w-40 z-30">
                <button
                  onClick={() => {
                    engine.sendPing('enemy');
                    setShowPingMenu(false);
                  }}
                  className="px-2 py-1 text-left text-xs text-red-400 hover:bg-red-950/40 rounded flex items-center gap-2"
                >
                  <span>⚠️</span>
                  <span>{t.pingEnemy}</span>
                </button>
                <button
                  onClick={() => {
                    engine.sendPing('key');
                    setShowPingMenu(false);
                  }}
                  className="px-2 py-1 text-left text-xs text-amber-300 hover:bg-amber-950/40 rounded flex items-center gap-2"
                >
                  <span>🔑</span>
                  <span>{t.pingKey}</span>
                </button>
                <button
                  onClick={() => {
                    engine.sendPing('help');
                    setShowPingMenu(false);
                  }}
                  className="px-2 py-1 text-left text-blue-300 hover:bg-blue-950/40 rounded flex items-center gap-2"
                >
                  <span>🆘</span>
                  <span>{t.pingHelp}</span>
                </button>
                <button
                  onClick={() => {
                    engine.sendPing('door');
                    setShowPingMenu(false);
                  }}
                  className="px-2 py-1 text-left text-xs text-emerald-300 hover:bg-emerald-950/40 rounded flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span>{t.pingDoor}</span>
                </button>
              </div>
            )}
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold active:scale-95 shadow-md"
          >
            ⏸
          </button>
        </div>
      </div>

      {/* 3. INVENTORY HOTKEYS ON PAST/SIDE OF PHONE (Left Side Vertical Thumb Strip) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 bg-black/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-1.5 shadow-2xl pointer-events-auto z-25">
        <span className="text-[8px] text-zinc-400 font-mono text-center font-bold">HOTKEYS</span>
        {localPlayer.inventory.map((item, idx) => {
          const isActive = idx === localPlayer.activeSlotIndex;
          return (
            <button
              key={idx}
              onClick={() => {
                localPlayer.activeSlotIndex = idx;
                engine.onHudUpdate?.();
              }}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 ${
                isActive
                  ? 'bg-red-950 border-2 border-red-500 shadow-md shadow-red-950/80 scale-105'
                  : 'bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {/* Hotkey Number badge */}
              <span className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-zinc-400">
                {idx + 1}
              </span>
              {item ? (
                <span className="text-base mt-1">{getItemIcon(item)}</span>
              ) : (
                <span className="text-[10px] text-zinc-600">—</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Center Screen Reticle & Contextual Interaction Prompt */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 ring-2 ring-black/40" />

        {interactable && (
          <div className="absolute top-[56%] bg-black/80 backdrop-blur-md border border-red-500/60 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-2.5 animate-pulse">
            <span className="text-lg">✋</span>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                {t.interact}
              </span>
              <span className="text-xs md:text-sm font-bold text-white">
                {(t[interactable.promptKey as keyof typeof t] as string) || interactable.promptKey}
                {interactable.param ? ` (${getItemName(interactable.param.replace('item', '').toLowerCase() as ItemType)})` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Center Active Item Display */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-1 shadow-xl pointer-events-auto">
        <span className="text-[10px] text-zinc-400 font-bold uppercase">EQUIPPED:</span>
        <span className="text-xs font-bold text-red-300">
          {localPlayer.inventory[localPlayer.activeSlotIndex]
            ? `${getItemIcon(localPlayer.inventory[localPlayer.activeSlotIndex])} ${getItemName(localPlayer.inventory[localPlayer.activeSlotIndex])}`
            : 'Empty Hand'}
        </span>
      </div>

      {/* 6. Notification Toast Popups */}
      <div className="absolute left-16 bottom-20 flex flex-col gap-1.5 pointer-events-none max-w-sm">
        {notifications.slice(-3).map((note, idx) => (
          <div
            key={idx}
            className="bg-black/90 backdrop-blur-md border border-red-900/70 text-zinc-200 px-3 py-1 rounded-lg text-xs font-semibold shadow-lg shadow-black/80 animate-fade-in"
          >
            {note}
          </div>
        ))}
      </div>
    </div>
  );
};
