import React, { useRef, useState, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';

interface VirtualControlsProps {
  engine: GameEngine;
  onInteract: () => void;
  onToggleCrouch: () => void;
  onToggleSprint: () => void;
  onToggleFlashlight: () => void;
  onDrop: () => void;
  isCrouching: boolean;
  isSprinting: boolean;
  flashlightOn: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  engine,
  onInteract,
  onToggleCrouch,
  onToggleSprint,
  onToggleFlashlight,
  onDrop,
  isCrouching,
  isSprinting,
  flashlightOn
}) => {
  // Joystick Touch State
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera Look Touch State (right half)
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Left 45% of screen is joystick zone
        if (touch.clientX < window.innerWidth * 0.45 && joystickTouchId.current === null) {
          joystickTouchId.current = touch.identifier;
          setIsJoystickActive(true);
          joystickCenter.current = { x: touch.clientX, y: touch.clientY };
          setJoystickPos({ x: 0, y: 0 });
        }
        // Right 55% of screen is camera swipe zone (unless hitting an action button)
        else if (touch.clientX >= window.innerWidth * 0.45 && lookTouchId.current === null) {
          const target = e.target as HTMLElement;
          if (target && target.closest('.no-swipe')) {
            continue;
          }
          lookTouchId.current = touch.identifier;
          lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Update Joystick
        if (touch.identifier === joystickTouchId.current) {
          const dx = touch.clientX - joystickCenter.current.x;
          const dy = touch.clientY - joystickCenter.current.y;
          const maxRadius = 45;
          const dist = Math.hypot(dx, dy);

          const clampedX = dist > maxRadius ? (dx / dist) * maxRadius : dx;
          const clampedY = dist > maxRadius ? (dy / dist) * maxRadius : dy;

          setJoystickPos({ x: clampedX, y: clampedY });

          // Send normalized vector to game engine
          engine.moveVector.x = clampedX / maxRadius;
          engine.moveVector.y = -clampedY / maxRadius; // forward is negative Y in screen coords
        }

        // Update Camera Look
        if (touch.identifier === lookTouchId.current) {
          const deltaX = touch.clientX - lastLookPos.current.x;
          const deltaY = touch.clientY - lastLookPos.current.y;
          lastLookPos.current = { x: touch.clientX, y: touch.clientY };

          engine.lookDelta.x += deltaX;
          engine.lookDelta.y += deltaY;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId.current) {
          joystickTouchId.current = null;
          setIsJoystickActive(false);
          setJoystickPos({ x: 0, y: 0 });
          engine.moveVector.x = 0;
          engine.moveVector.y = 0;
        }
        if (touch.identifier === lookTouchId.current) {
          lookTouchId.current = null;
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [engine]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* Dynamic Floating Virtual Joystick on Left */}
      <div
        ref={joystickContainerRef}
        className="absolute left-10 bottom-10 w-32 h-32 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm pointer-events-auto flex items-center justify-center shadow-lg"
        style={{ touchAction: 'none' }}
      >
        {/* Outer Ring */}
        <div className="w-20 h-20 rounded-full border border-red-900/30 flex items-center justify-center">
          {/* Thumb Knob */}
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-red-800 to-zinc-900 border border-red-500/50 shadow-md shadow-red-950/50 transition-transform duration-75"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
            }}
          />
        </div>
      </div>

      {/* Action Buttons on Right Side */}
      <div className="absolute right-6 bottom-8 flex flex-col items-end gap-3 no-swipe pointer-events-auto">
        {/* Secondary Row: Flashlight, Drop, Crouch, Sprint */}
        <div className="flex items-center gap-3">
          {/* Flashlight Button */}
          <button
            onClick={onToggleFlashlight}
            className={`w-13 h-13 rounded-full flex flex-col items-center justify-center border font-bold text-xs shadow-lg transition-all active:scale-95 ${
              flashlightOn
                ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-amber-900/40'
                : 'bg-zinc-900/70 border-zinc-700 text-zinc-400'
            }`}
            style={{ width: '52px', height: '52px' }}
          >
            <span className="text-base">🔦</span>
            <span className="text-[10px] tracking-tighter">LIGHT</span>
          </button>

          {/* Drop Item Button */}
          <button
            onClick={onDrop}
            className="w-13 h-13 rounded-full bg-zinc-900/70 border border-zinc-700 text-zinc-300 flex flex-col items-center justify-center font-bold text-xs shadow-lg active:scale-95"
            style={{ width: '52px', height: '52px' }}
          >
            <span className="text-sm">⤵</span>
            <span className="text-[10px] tracking-tighter">DROP</span>
          </button>

          {/* Crouch Button */}
          <button
            onClick={onToggleCrouch}
            className={`w-13 h-13 rounded-full flex flex-col items-center justify-center border font-bold text-xs shadow-lg transition-all active:scale-95 ${
              isCrouching
                ? 'bg-red-900/50 border-red-500 text-white shadow-red-950/50'
                : 'bg-zinc-900/70 border-zinc-700 text-zinc-300'
            }`}
            style={{ width: '52px', height: '52px' }}
          >
            <span className="text-sm">🧎</span>
            <span className="text-[10px] tracking-tighter">CROUCH</span>
          </button>

          {/* Sprint Button */}
          <button
            onClick={onToggleSprint}
            className={`w-13 h-13 rounded-full flex flex-col items-center justify-center border font-bold text-xs shadow-lg transition-all active:scale-95 ${
              isSprinting
                ? 'bg-amber-600/50 border-amber-400 text-white shadow-amber-950/50'
                : 'bg-zinc-900/70 border-zinc-700 text-zinc-300'
            }`}
            style={{ width: '52px', height: '52px' }}
          >
            <span className="text-sm">⚡</span>
            <span className="text-[10px] tracking-tighter">SPRINT</span>
          </button>
        </div>

        {/* Primary Large INTERACT Button */}
        <button
          onClick={onInteract}
          className="w-22 h-22 rounded-2xl bg-gradient-to-br from-red-950 via-zinc-900 to-black border-2 border-red-600 text-red-200 flex flex-col items-center justify-center shadow-xl shadow-red-950/60 active:scale-90 transition-transform cursor-pointer"
          style={{ width: '84px', height: '84px' }}
        >
          <span className="text-2xl mb-1">✋</span>
          <span className="font-bold text-xs tracking-wider text-white">INTERACT</span>
        </button>
      </div>
    </div>
  );
};
