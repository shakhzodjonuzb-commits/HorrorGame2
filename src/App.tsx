import React, { useState, useRef, useEffect } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameSettings, Difficulty, EscapeRule } from './types/game';
import { Language } from './localization/strings';
import { MainMenu } from './ui/MainMenu';
import { MultiplayerMenu } from './ui/MultiplayerMenu';
import { VirtualControls } from './ui/VirtualControls';
import { GameHUD } from './ui/GameHUD';
import { SettingsModal } from './ui/SettingsModal';
import { GuideModal } from './ui/GuideModal';
import { GameOverModal } from './ui/GameOverModal';

type AppState = 'MENU' | 'MULTIPLAYER' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

const DEFAULT_SETTINGS: GameSettings = {
  language: 'en',
  graphicsQuality: 'med',
  fpsLimit: 60,
  lookSensitivity: 1.2,
  fov: 75,
  sfxVolume: 0.8,
  ambientVolume: 0.6,
  headBob: true,
  shadows: true,
};

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('MENU');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // In-game dynamic state
  const [notifications, setNotifications] = useState<string[]>([]);
  const [gameOverData, setGameOverData] = useState<{ isVictory: boolean; reason: string }>({
    isVictory: false,
    reason: ''
  });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Push HUD notification
  const pushNotification = (text: string) => {
    setNotifications(prev => [...prev.slice(-4), text]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== text));
    }, 4500);
  };

  // Start Game Session (Singleplayer or Multiplayer)
  const startGame = (isHost: boolean, difficulty: Difficulty = 'normal', escapeRule: EscapeRule = 'all') => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    setAppState('PLAYING');

    setTimeout(() => {
      if (!canvasContainerRef.current) return;
      const engine = new GameEngine(settings);
      engine.onNotification = pushNotification;
      engine.onGameOver = (isVictory, reason) => {
        setGameOverData({ isVictory, reason });
        setAppState('GAME_OVER');
      };
      engine.init(canvasContainerRef.current, isHost, difficulty, escapeRule);
      engineRef.current = engine;
    }, 50);
  };

  // Keyboard controls for emulator or desktop preview
  useEffect(() => {
    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'PLAYING' || !engineRef.current) return;
      keysDown.add(e.code);

      const engine = engineRef.current;
      if (e.code === 'KeyE' || e.code === 'Space') {
        engine.interact();
      } else if (e.code === 'KeyC') {
        engine.localPlayer.isCrouching = !engine.localPlayer.isCrouching;
      } else if (e.code === 'KeyF') {
        engine.localPlayer.flashlightOn = !engine.localPlayer.flashlightOn;
      } else if (e.code === 'KeyQ') {
        engine.dropActiveItem();
      } else if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', '')) - 1;
        if (digit >= 0 && digit < 5) {
          engine.localPlayer.activeSlotIndex = digit;
        }
      }

      updateMoveFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      updateMoveFromKeys();
    };

    const updateMoveFromKeys = () => {
      if (!engineRef.current) return;
      let mx = 0;
      let my = 0;
      if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) my += 1;
      if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) my -= 1;
      if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) mx -= 1;
      if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) mx += 1;

      engineRef.current.moveVector.x = mx;
      engineRef.current.moveVector.y = my;
      engineRef.current.localPlayer.isSprinting = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [appState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D Canvas Rendering Layer */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 z-0 ${appState === 'PLAYING' || appState === 'PAUSED' ? 'block' : 'hidden'}`}
      />

      {/* VIEW: MAIN MENU */}
      {appState === 'MENU' && (
        <MainMenu
          lang={settings.language}
          onSetLang={(lang) => setSettings(s => ({ ...s, language: lang }))}
          onSingleplayer={() => startGame(true, 'normal', 'all')}
          onMultiplayer={() => setAppState('MULTIPLAYER')}
          onSettings={() => setShowSettings(true)}
          onGuide={() => setShowGuide(true)}
        />
      )}

      {/* VIEW: MULTIPLAYER LOBBY */}
      {appState === 'MULTIPLAYER' && (
        <MultiplayerMenu
          lang={settings.language}
          onBack={() => setAppState('MENU')}
          onStartMatch={(isHost, diff, rule) => startGame(isHost, diff, rule)}
        />
      )}

      {/* VIEW: IN-GAME HUD & MOBILE CONTROLS */}
      {(appState === 'PLAYING' || appState === 'PAUSED') && engineRef.current && (
        <>
          <GameHUD
            engine={engineRef.current}
            lang={settings.language}
            onPause={() => setAppState(appState === 'PAUSED' ? 'PLAYING' : 'PAUSED')}
            notifications={notifications}
          />

          {appState === 'PLAYING' && (
            <VirtualControls
              engine={engineRef.current}
              onInteract={() => engineRef.current?.interact()}
              onToggleCrouch={() => {
                if (engineRef.current) {
                  engineRef.current.localPlayer.isCrouching = !engineRef.current.localPlayer.isCrouching;
                }
              }}
              onToggleSprint={() => {
                if (engineRef.current) {
                  engineRef.current.localPlayer.isSprinting = !engineRef.current.localPlayer.isSprinting;
                }
              }}
              onToggleFlashlight={() => {
                if (engineRef.current) {
                  engineRef.current.localPlayer.flashlightOn = !engineRef.current.localPlayer.flashlightOn;
                }
              }}
              onDrop={() => engineRef.current?.dropActiveItem()}
              isCrouching={engineRef.current.localPlayer.isCrouching}
              isSprinting={engineRef.current.localPlayer.isSprinting}
              flashlightOn={engineRef.current.localPlayer.flashlightOn}
            />
          )}
        </>
      )}

      {/* PAUSE MENU OVERLAY */}
      {appState === 'PAUSED' && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-3 text-center shadow-2xl">
            <h2 className="text-2xl font-black font-serif text-white tracking-widest uppercase">PAUSED</h2>
            <button
              onClick={() => setAppState('PLAYING')}
              className="w-full py-3 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase shadow-md active:scale-95"
            >
              RESUME
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase active:scale-95"
            >
              SETTINGS
            </button>
            <button
              onClick={() => {
                engineRef.current?.destroy();
                engineRef.current = null;
                setAppState('MENU');
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-400 font-bold text-xs uppercase active:scale-95"
            >
              ABANDON & QUIT
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER (VICTORY / DEFEAT) MODAL */}
      {appState === 'GAME_OVER' && engineRef.current && (
        <GameOverModal
          isVictory={gameOverData.isVictory}
          reason={gameOverData.reason}
          routeUsed={engineRef.current.escapeProgress.escapedRoute}
          timeSurvivedSeconds={Math.round(engineRef.current.gameTimeSeconds)}
          lang={settings.language}
          onRestart={() => startGame(engineRef.current?.isHost ?? true, engineRef.current?.difficulty, engineRef.current?.escapeRule)}
          onMainMenu={() => {
            engineRef.current?.destroy();
            engineRef.current = null;
            setAppState('MENU');
          }}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          lang={settings.language}
          onUpdateSettings={(newS) => {
            setSettings(newS);
            if (engineRef.current) {
              engineRef.current.settings = newS;
              engineRef.current.renderer?.setFov(newS.fov);
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* HOW TO PLAY GUIDE MODAL */}
      {showGuide && (
        <GuideModal
          lang={settings.language}
          onClose={() => setShowGuide(false)}
        />
      )}
    </div>
  );
};
