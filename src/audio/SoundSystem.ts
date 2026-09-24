// Procedural 3D Spatial Audio & Fear Pulse Engine
// 100% synthesized using Web Audio API — Zero external audio files required!

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Fear Pulse & Proximity Nodes
  private heartbeatOsc: OscillatorNode | null = null;
  private heartbeatGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;
  private breathingInterval: number | null = null;
  private tinnitusOsc: OscillatorNode | null = null;
  private tinnitusGain: GainNode | null = null;

  // Listener orientation
  private listenerPos = { x: 0, y: 1.6, z: 0 };
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.6;
      this.ambientGain.connect(this.masterGain);

      // Tinnitus generator for extreme fear
      this.tinnitusGain = this.ctx.createGain();
      this.tinnitusGain.gain.value = 0;
      this.tinnitusGain.connect(this.masterGain);

      this.tinnitusOsc = this.ctx.createOscillator();
      this.tinnitusOsc.type = 'sine';
      this.tinnitusOsc.frequency.value = 4800; // High eerie ringing
      this.tinnitusOsc.connect(this.tinnitusGain);
      this.tinnitusOsc.start();

      this.startAmbientDrones();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization deferred or unavailable:', e);
    }
  }

  public setVolumes(sfx: number, ambient: number) {
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, sfx));
    if (this.ambientGain) this.ambientGain.gain.value = Math.max(0, Math.min(1, ambient));
  }

  public updateListener(x: number, y: number, z: number, forwardX: number, forwardY: number, forwardZ: number) {
    this.listenerPos = { x, y, z };
    if (!this.ctx) return;

    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.setValueAtTime(x, this.ctx.currentTime);
      listener.positionY.setValueAtTime(y, this.ctx.currentTime);
      listener.positionZ.setValueAtTime(z, this.ctx.currentTime);
      listener.forwardX.setValueAtTime(forwardX, this.ctx.currentTime);
      listener.forwardY.setValueAtTime(forwardY, this.ctx.currentTime);
      listener.forwardZ.setValueAtTime(forwardZ, this.ctx.currentTime);
      listener.upX.setValueAtTime(0, this.ctx.currentTime);
      listener.upY.setValueAtTime(1, this.ctx.currentTime);
      listener.upZ.setValueAtTime(0, this.ctx.currentTime);
    } else {
      // Legacy WebAudio fallback
      listener.setPosition(x, y, z);
      listener.setOrientation(forwardX, forwardY, forwardZ, 0, 1, 0);
    }
  }

  // --- DYNAMIC FEAR PULSE & TERROR SYSTEM ---
  public updateFearPulse(fearLevel: number) {
    // fearLevel: 0.0 (calm) to 1.0 (sheer terror)
    if (!this.ctx || !this.isInitialized) return;

    // Adjust tinnitus volume on high fear
    if (this.tinnitusGain) {
      const targetTinnitus = fearLevel > 0.75 ? (fearLevel - 0.75) * 0.25 : 0;
      this.tinnitusGain.gain.setTargetAtTime(targetTinnitus, this.ctx.currentTime, 0.2);
    }

    // Heavy breathing triggers when fear is elevated
    if (fearLevel > 0.6 && !this.breathingInterval) {
      this.startBreathingLoop();
    } else if (fearLevel <= 0.6 && this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
  }

  public updateHeartbeat(proximity: number) {
    if (!this.ctx) return;

    if (proximity <= 0.05) {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      return;
    }

    // Proximity 0..1 scales heartbeat interval (from 1100ms down to 380ms)
    const bpmInterval = 1100 - proximity * 720;

    if (!this.heartbeatInterval) {
      this.playHeartbeatThump(proximity);
      this.heartbeatInterval = window.setInterval(() => {
        this.playHeartbeatThump(proximity);
      }, bpmInterval);
    }
  }

  private playHeartbeatThump(intensity: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Double beat "lub-dub"
    this.createThump(now, 55, intensity * 0.75);
    this.createThump(now + 0.14, 48, intensity * 0.55);
  }

  private createThump(time: number, freq: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(25, time + 0.12);

    gain.gain.setValueAtTime(volume * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  private startBreathingLoop() {
    this.breathingInterval = window.setInterval(() => {
      this.playHeavyGasp();
    }, 2800);
  }

  private playHeavyGasp() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Filtered noise for breathless throat gasp
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(750, now + 0.3);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.65);
  }

  // --- AMBIENT DRONE & ATMOSPHERE ---
  private startAmbientDrones() {
    if (!this.ctx || !this.ambientGain) return;

    // Low sub rumble (horror drone)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 42;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110;

    gain.gain.value = 0.22;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    osc.start();

    // Occasional spooky creaks
    setInterval(() => {
      if (Math.random() < 0.35) {
        this.playWoodCreak(0.3);
      }
    }, 7000);
  }

  // --- SPATIAL SFX ---
  public playFootstep(isCrouching: boolean, isSprinting: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = isSprinting ? 95 : 75;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    const vol = isCrouching ? 0.05 : isSprinting ? 0.35 : 0.18;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCaretakerStep(x: number, y: number, z: number, isChase: boolean) {
    if (!this.ctx) return;
    const panner = this.createPanner(x, y, z);
    const now = this.ctx.currentTime;

    // Heavy menacing thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isChase ? 110 : 80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.15);

    gain.gain.setValueAtTime(isChase ? 0.75 : 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(panner);
    if (this.sfxGain) panner.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playChaseStinger() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Discordant violin-style screech stinger
    const freqs = [587.33, 622.25, 880.0, 932.33];
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f + 25, now + 0.8);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  public playJumpScare() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.4);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playDoor(x: number, y: number, z: number, isOpen: boolean) {
    if (!this.ctx) return;
    const panner = this.createPanner(x, y, z);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isOpen ? 130 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(isOpen ? 220 : 80, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(panner);
    if (this.sfxGain) panner.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playLockClick(x?: number, y?: number, z?: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(700, now + 0.04);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    if (x !== undefined && y !== undefined && z !== undefined) {
      const panner = this.createPanner(x, y, z);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      gain.connect(this.sfxGain);
    }

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playChainCut() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playTrapSnap(x: number, y: number, z: number) {
    if (!this.ctx || !this.sfxGain) return;
    const panner = this.createPanner(x, y, z);
    const now = this.ctx.currentTime;

    // Metallic snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playWoodCreak(volume: number = 0.4) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.18);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playPingChirp() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1800, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  private createPanner(x: number, y: number, z: number): PannerNode {
    const panner = this.ctx!.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 2;
    panner.maxDistance = 25;
    panner.rolloffFactor = 1.2;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(x, this.ctx!.currentTime);
      panner.positionY.setValueAtTime(y, this.ctx!.currentTime);
      panner.positionZ.setValueAtTime(z, this.ctx!.currentTime);
    } else {
      panner.setPosition(x, y, z);
    }
    return panner;
  }

  public destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.breathingInterval) clearInterval(this.breathingInterval);
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
    this.isInitialized = false;
  }
}

export const soundSystem = new SoundSystem();
