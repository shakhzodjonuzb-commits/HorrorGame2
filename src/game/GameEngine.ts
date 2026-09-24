import {
  CaretakerState,
  Difficulty,
  DoorData,
  EscapeProgress,
  EscapeRule,
  GameItem,
  GameSettings,
  HidingSpot,
  ItemType,
  NoiseEvent,
  PingMarker,
  PlayerData,
  TrapData
} from '../types/game';
import { CaretakerAI } from './CaretakerAI';
import { GameRenderer } from './GameRenderer';
import { soundSystem } from '../audio/SoundSystem';
import { networkManager, FullGameStatePayload } from '../network/NetworkManager';
import { CREAKY_BOARDS, HIDING_SPOTS, INITIAL_DOORS, ROOMS, generateRandomizedItems } from './WorldData';

export class GameEngine {
  public renderer: GameRenderer | null = null;
  public caretakerAI: CaretakerAI | null = null;

  public isRunning: boolean = false;
  public isHost: boolean = false;
  public difficulty: Difficulty = 'normal';
  public escapeRule: EscapeRule = 'all';

  // State
  public localPlayer: PlayerData;
  public otherPlayers: Map<string, PlayerData> = new Map();
  public caretakerState: CaretakerState;
  public doors: DoorData[] = [];
  public items: GameItem[] = [];
  public hidingSpots: HidingSpot[] = [];
  public traps: TrapData[] = [];
  public escapeProgress: EscapeProgress;
  public activePings: PingMarker[] = [];
  public gameTimeSeconds: number = 0;

  // Fear & Sanity Pulse (0.0 to 1.0)
  public fearLevel: number = 0;

  // Interaction detection
  public currentInteractable: {
    id: string;
    type: 'door' | 'item' | 'hiding' | 'escape_action';
    promptKey: string;
    param?: string;
  } | null = null;

  // Player noise level (for HUD meter)
  public currentNoiseLevel: number = 0; // 0 to 1

  // Movement & physics input
  public moveVector: { x: number; y: number } = { x: 0, y: 0 };
  public lookDelta: { x: number; y: number } = { x: 0, y: 0 };

  private lastTime: number = 0;
  private animFrameId: number | null = null;
  private syncTimer: number = 0;
  private stepTimer: number = 0;
  private trapImmobilizeTimer: number = 0;

  // Settings
  public settings: GameSettings;

  // Callbacks to UI
  public onHudUpdate?: () => void;
  public onNotification?: (text: string) => void;
  public onGameOver?: (isVictory: boolean, reason: string) => void;

  constructor(settings: GameSettings) {
    this.settings = settings;

    this.localPlayer = {
      id: networkManager.localPlayerId,
      name: networkManager.localPlayerName,
      color: '#e63946',
      x: 0,
      y: 0,
      z: 0,
      rotationY: 0,
      pitch: 0,
      isCrouching: false,
      isSprinting: false,
      flashlightOn: true,
      hidingSpotId: null,
      inventory: ['flashlight', null, null, null, null],
      activeSlotIndex: 0,
      stamina: 100,
      battery: 100,
      isCaught: false,
      hasEscaped: false
    };

    this.caretakerState = {
      x: -12,
      y: 0,
      z: -2,
      rotationY: 0,
      state: 'PATROL',
      targetX: -12,
      targetZ: -2,
      chasingPlayerId: null,
      speed: 1.6,
      alertLevel: 0,
      lookAtPlayer: false
    };

    this.escapeProgress = {
      frontDoorChainsCut: false,
      basementFuseInserted: false,
      frontDoorUnlocked: false,
      carBatteryInstalled: false,
      sparkPlugInstalled: false,
      carKeyUsed: false,
      garageDoorOpen: false,
      labHatchCrowbarred: false,
      tunnelValveDrained: false,
      tunnelGateUnlocked: false,
      escapedRoute: null,
      isVictory: false,
      isDefeat: false,
      defeatReason: null
    };

    this.doors = JSON.parse(JSON.stringify(INITIAL_DOORS));
    this.hidingSpots = JSON.parse(JSON.stringify(HIDING_SPOTS));
    this.items = generateRandomizedItems();
  }

  public init(container: HTMLElement, isHost: boolean, difficulty: Difficulty = 'normal', escapeRule: EscapeRule = 'all') {
    this.isHost = isHost;
    this.difficulty = difficulty;
    this.escapeRule = escapeRule;

    soundSystem.init();
    soundSystem.setVolumes(this.settings.sfxVolume, this.settings.ambientVolume);

    this.renderer = new GameRenderer(container, this.settings.fov, this.settings.graphicsQuality);

    if (this.isHost) {
      this.caretakerAI = new CaretakerAI(difficulty);
      this.caretakerAI.onStepSound = (x, y, z, isChase) => {
        soundSystem.playCaretakerStep(x, y, z, isChase);
      };
      this.caretakerAI.onStateChange = (state) => {
        if (state === 'CHASE') {
          soundSystem.playChaseStinger();
          this.fearLevel = Math.max(this.fearLevel, 0.8);
          if (this.onNotification) this.onNotification('The Caretaker spotted someone! RUN!');
        } else if (state === 'INVESTIGATE') {
          if (this.onNotification) this.onNotification('The Caretaker heard a noise...');
        }
      };
      this.caretakerAI.onPlaceTrap = (x, y, z) => {
        this.traps.push({
          id: `trap_${Date.now()}`,
          x,
          y,
          z,
          isTriggered: false,
          placedBy: 'caretaker'
        });
      };
    }

    this.setupNetworkCallbacks();

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private setupNetworkCallbacks() {
    networkManager.onStateSync = (state: FullGameStatePayload) => {
      if (!this.isHost) {
        this.caretakerState = state.caretaker;
        this.doors = state.doors;
        this.items = state.items;
        this.traps = state.traps;
        this.escapeProgress = state.escapeProgress;
        this.activePings = state.activePings;
        this.gameTimeSeconds = state.gameTimeSeconds;

        state.players.forEach(p => {
          if (p.id !== this.localPlayer.id) {
            this.otherPlayers.set(p.id, p);
          } else {
            this.localPlayer.isCaught = p.isCaught;
            this.localPlayer.hasEscaped = p.hasEscaped;
          }
        });

        if (state.escapeProgress.isVictory && !this.escapeProgress.isVictory) {
          if (this.onGameOver) this.onGameOver(true, 'Escape Successful');
        } else if (state.escapeProgress.isDefeat && !this.escapeProgress.isDefeat) {
          if (this.onGameOver) this.onGameOver(false, state.escapeProgress.defeatReason || 'Caught');
        }
      }
    };

    networkManager.onInteractRequest = (playerId: string, targetId: string) => {
      if (this.isHost) {
        this.handleAuthoritativeInteract(playerId, targetId);
      }
    };

    networkManager.onDropRequest = (playerId: string, slotIndex: number) => {
      if (this.isHost) {
        this.handleAuthoritativeDrop(playerId, slotIndex);
      }
    };

    networkManager.onPingReceived = (ping: PingMarker) => {
      this.activePings.push(ping);
      soundSystem.playPingChirp();
      if (this.onNotification) {
        this.onNotification(`${ping.senderName}: [${ping.type.toUpperCase()}]`);
      }
      setTimeout(() => {
        this.activePings = this.activePings.filter(p => p.id !== ping.id);
      }, 7000);
    };

    networkManager.onPlayerDisconnected = (pid: string) => {
      this.otherPlayers.delete(pid);
      if (this.onNotification) this.onNotification('A survivor lost connection');
    };
  }

  // --- MAIN LOOP ---
  private loop = (time: number) => {
    if (!this.isRunning) return;
    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(delta);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    this.gameTimeSeconds += delta;

    // 1. Process local player movement and look
    this.updateLocalPlayer(delta);

    // 2. Dynamic Fear Pulse calculation
    this.updateFearPulse(delta);

    // 3. Host Authoritative AI & Logic
    if (this.isHost) {
      this.updateHostAuthoritative(delta);
    }

    // 4. Audio & 3D Proximity
    this.updateAudio();

    // 5. Check Contextual Interaction Raycast
    this.checkInteractableRaycast();

    // 6. Render 3D Frame with Fear Tremor
    if (this.renderer) {
      this.renderer.update(
        delta,
        this.localPlayer,
        Array.from(this.otherPlayers.values()),
        this.caretakerState,
        this.doors,
        this.items,
        this.hidingSpots,
        this.traps,
        this.escapeProgress.carKeyUsed && this.escapeProgress.carBatteryInstalled,
        this.fearLevel
      );
    }

    // 7. Network Sync Broadcast (~25Hz)
    this.syncTimer += delta;
    if (this.syncTimer >= 0.04) {
      this.syncTimer = 0;
      if (this.isHost) {
        const allPlayers = [this.localPlayer, ...Array.from(this.otherPlayers.values())];
        networkManager.hostBroadcastState({
          players: allPlayers,
          caretaker: this.caretakerState,
          doors: this.doors,
          items: this.items,
          traps: this.traps,
          escapeProgress: this.escapeProgress,
          activePings: this.activePings,
          gameTimeSeconds: this.gameTimeSeconds
        });
      } else {
        networkManager.sendPlayerInput({
          x: this.localPlayer.x,
          y: this.localPlayer.y,
          z: this.localPlayer.z,
          rotationY: this.localPlayer.rotationY,
          pitch: this.localPlayer.pitch,
          isCrouching: this.localPlayer.isCrouching,
          isSprinting: this.localPlayer.isSprinting,
          flashlightOn: this.localPlayer.flashlightOn,
          hidingSpotId: this.localPlayer.hidingSpotId
        });
      }
    }

    if (this.onHudUpdate) this.onHudUpdate();
  }

  // --- DYNAMIC FEAR & SANITY PULSE ---
  private updateFearPulse(delta: number) {
    if (this.localPlayer.isCaught || this.localPlayer.hasEscaped) {
      this.fearLevel = 0;
      return;
    }

    const dist = Math.hypot(this.localPlayer.x - this.caretakerState.x, this.localPlayer.z - this.caretakerState.z);
    let targetFear = 0;

    if (this.localPlayer.hidingSpotId !== null) {
      // Hiding calms player
      targetFear = dist < 3.0 ? 0.4 : 0.05;
    } else {
      if (this.caretakerState.state === 'CHASE') {
        targetFear = Math.max(0.7, 1.0 - dist / 18);
      } else if (dist < 12.0) {
        targetFear = Math.max(0, (12.0 - dist) / 12.0) * 0.85;
      }
    }

    // Smooth fear ramp
    if (targetFear > this.fearLevel) {
      this.fearLevel = Math.min(1.0, this.fearLevel + delta * 0.9);
    } else {
      this.fearLevel = Math.max(0.0, this.fearLevel - delta * 0.35);
    }

    // Inform SoundSystem of fear pulse state
    soundSystem.updateFearPulse(this.fearLevel);
  }

  // --- LOCAL PLAYER UPDATE ---
  private updateLocalPlayer(delta: number) {
    if (this.localPlayer.isCaught || this.localPlayer.hasEscaped) return;

    // Apply look rotation from touch swipe
    const sens = this.settings.lookSensitivity * 0.003;
    this.localPlayer.rotationY -= this.lookDelta.x * sens;
    this.localPlayer.pitch -= this.lookDelta.y * sens;
    this.localPlayer.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.localPlayer.pitch));
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;

    if (this.trapImmobilizeTimer > 0) {
      this.trapImmobilizeTimer -= delta;
      return;
    }

    if (this.localPlayer.hidingSpotId !== null) {
      return;
    }

    // Sprint & Stamina
    if (this.localPlayer.isSprinting && (this.moveVector.x !== 0 || this.moveVector.y !== 0)) {
      this.localPlayer.stamina = Math.max(0, this.localPlayer.stamina - delta * 22);
      if (this.localPlayer.stamina <= 0) {
        this.localPlayer.isSprinting = false;
      }
    } else {
      this.localPlayer.stamina = Math.min(100, this.localPlayer.stamina + delta * 14);
    }

    // Movement speed
    let speed = 2.4;
    if (this.localPlayer.isCrouching) speed = 1.2;
    else if (this.localPlayer.isSprinting) speed = 4.2;

    const moveX = this.moveVector.x;
    const moveZ = this.moveVector.y;
    const hasMove = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

    let noise = 0;

    if (hasMove) {
      const angle = this.localPlayer.rotationY;
      const forwardX = -Math.sin(angle);
      const forwardZ = -Math.cos(angle);
      const rightX = Math.cos(angle);
      const rightZ = -Math.sin(angle);

      const vx = (forwardX * moveZ + rightX * moveX) * speed * delta;
      const vz = (forwardZ * moveZ + rightX * moveX) * speed * delta;

      this.moveWithCollision(vx, vz);

      // Footstep timing & sound
      this.stepTimer += delta;
      const stepInterval = this.localPlayer.isSprinting ? 0.3 : this.localPlayer.isCrouching ? 0.6 : 0.45;
      if (this.stepTimer >= stepInterval) {
        this.stepTimer = 0;
        soundSystem.playFootstep(this.localPlayer.isCrouching, this.localPlayer.isSprinting);

        noise = this.localPlayer.isSprinting ? 0.85 : this.localPlayer.isCrouching ? 0.05 : 0.35;
      }

      // Check Creaky Floorboards
      for (const creak of CREAKY_BOARDS) {
        const d = Math.hypot(this.localPlayer.x - creak.x, this.localPlayer.z - creak.z);
        if (d < creak.radius) {
          soundSystem.playWoodCreak(0.65);
          noise = Math.max(noise, 0.9);
          if (this.onNotification) this.onNotification('Creaky floorboard!');
          break;
        }
      }

      // Check Bell / Spring Traps
      for (const trap of this.traps) {
        if (!trap.isTriggered) {
          const td = Math.hypot(this.localPlayer.x - trap.x, this.localPlayer.z - trap.z);
          if (td < 0.7) {
            trap.isTriggered = true;
            this.trapImmobilizeTimer = 2.5;
            this.fearLevel = 1.0; // instant terror!
            soundSystem.playTrapSnap(trap.x, trap.y, trap.z);
            noise = 1.0;
            if (this.onNotification) this.onNotification('Stepped into an alarm trap!');
            break;
          }
        }
      }
    }

    this.currentNoiseLevel = Math.max(0, this.currentNoiseLevel - delta * 1.5);
    if (noise > this.currentNoiseLevel) {
      this.currentNoiseLevel = noise;
      this.broadcastNoise(this.localPlayer.x, this.localPlayer.y, this.localPlayer.z, noise);
    }
  }

  // Wall & Closed Door Collision
  private moveWithCollision(vx: number, vz: number) {
    const newX = this.localPlayer.x + vx;
    const newZ = this.localPlayer.z + vz;

    let blocked = false;
    for (const d of this.doors) {
      if (!d.isOpen) {
        const dist = Math.hypot(newX - d.x, newZ - d.z);
        if (dist < 0.75) {
          blocked = true;
          break;
        }
      }
    }

    if (!blocked) {
      this.localPlayer.x = Math.max(-23, Math.min(23, newX));
      this.localPlayer.z = Math.max(-16, Math.min(14, newZ));
    }
  }

  // --- HOST AUTHORITATIVE TICK ---
  private updateHostAuthoritative(delta: number) {
    if (!this.caretakerAI) return;

    const allSurvivors = [this.localPlayer, ...Array.from(this.otherPlayers.values())];

    this.caretakerAI.update(delta, allSurvivors, this.traps);
    this.caretakerState = this.caretakerAI.state;

    // Capture Check
    for (const p of allSurvivors) {
      if (!p.isCaught && !p.hasEscaped && p.hidingSpotId === null) {
        const dist = Math.hypot(p.x - this.caretakerState.x, p.z - this.caretakerState.z);
        if (dist < 1.2) {
          p.isCaught = true;
          soundSystem.playJumpScare();
          if (this.onNotification) {
            this.onNotification(`${p.name} was caught by The Caretaker!`);
          }

          const allCaught = allSurvivors.every(surv => surv.isCaught || surv.hasEscaped);
          if (allCaught) {
            this.escapeProgress.isDefeat = true;
            this.escapeProgress.defeatReason = 'All survivors were caught by The Caretaker.';
            if (this.onGameOver) this.onGameOver(false, this.escapeProgress.defeatReason);
          }
        }
      }
    }
  }

  // --- CONTEXTUAL INTERACTION RAYCAST ---
  private checkInteractableRaycast() {
    this.currentInteractable = null;
    if (this.localPlayer.isCaught || this.localPlayer.hasEscaped) return;

    if (this.localPlayer.hidingSpotId !== null) {
      this.currentInteractable = {
        id: this.localPlayer.hidingSpotId,
        type: 'hiding',
        promptKey: 'exitHiding'
      };
      return;
    }

    const px = this.localPlayer.x;
    const pz = this.localPlayer.z;

    // Doors
    for (const d of this.doors) {
      const dist = Math.hypot(px - d.x, pz - d.z);
      if (dist < 2.0) {
        if (d.isOpen) {
          this.currentInteractable = { id: d.id, type: 'door', promptKey: 'closeDoor' };
          return;
        } else if (d.isLocked) {
          this.currentInteractable = { id: d.id, type: 'door', promptKey: 'doorLocked' };
          return;
        } else {
          this.currentInteractable = { id: d.id, type: 'door', promptKey: 'openDoor' };
          return;
        }
      }
    }

    // Items
    for (const it of this.items) {
      if (!it.isTaken) {
        const dist = Math.hypot(px - it.x, pz - it.z);
        if (dist < 1.8) {
          this.currentInteractable = { id: it.id, type: 'item', promptKey: 'pickUp', param: it.nameKey };
          return;
        }
      }
    }

    // Hiding Spots
    for (const h of this.hidingSpots) {
      const dist = Math.hypot(px - h.x, pz - h.z);
      if (dist < 1.8) {
        this.currentInteractable = {
          id: h.id,
          type: 'hiding',
          promptKey: h.type === 'bed' ? 'hideUnderBed' : 'hideInCloset'
        };
        return;
      }
    }

    // Escape Mechanics
    const frontDoorDist = Math.hypot(px - 0, pz - (-4));
    if (frontDoorDist < 2.2) {
      if (!this.escapeProgress.frontDoorChainsCut) {
        this.currentInteractable = { id: 'front_chains', type: 'escape_action', promptKey: 'cutChains' };
        return;
      } else if (!this.escapeProgress.basementFuseInserted) {
        this.currentInteractable = { id: 'front_fuse_need', type: 'escape_action', promptKey: 'insertFuse' };
        return;
      } else {
        this.currentInteractable = { id: 'escape_front', type: 'escape_action', promptKey: 'escapeFrontDoor' };
        return;
      }
    }

    const fuseBoxDist = Math.hypot(px - 12, pz - (-11));
    if (fuseBoxDist < 2.0 && !this.escapeProgress.basementFuseInserted) {
      this.currentInteractable = { id: 'fuse_breaker', type: 'escape_action', promptKey: 'insertFuse' };
      return;
    }

    const carDist = Math.hypot(px - 19, pz - (-1));
    if (carDist < 2.5) {
      if (!this.escapeProgress.carBatteryInstalled) {
        this.currentInteractable = { id: 'car_battery_slot', type: 'escape_action', promptKey: 'installBattery' };
        return;
      } else if (!this.escapeProgress.sparkPlugInstalled) {
        this.currentInteractable = { id: 'car_spark_slot', type: 'escape_action', promptKey: 'installSparkPlug' };
        return;
      } else {
        this.currentInteractable = { id: 'escape_car', type: 'escape_action', promptKey: 'escapeCar' };
        return;
      }
    }

    const valveDist = Math.hypot(px - (-14), pz - (-11));
    if (valveDist < 2.2 && !this.escapeProgress.tunnelValveDrained) {
      this.currentInteractable = { id: 'tunnel_valve', type: 'escape_action', promptKey: 'turnValve' };
      return;
    }

    const tunnelExitDist = Math.hypot(px - (-18), pz - (-12));
    if (tunnelExitDist < 2.2 && this.escapeProgress.tunnelValveDrained) {
      this.currentInteractable = { id: 'escape_tunnel', type: 'escape_action', promptKey: 'escapeTunnel' };
      return;
    }
  }

  // --- INTERACTION EXECUTION ---
  public interact() {
    if (!this.currentInteractable) return;
    networkManager.requestInteraction(this.currentInteractable.id);
  }

  private handleAuthoritativeInteract(playerId: string, targetId: string) {
    const player = playerId === this.localPlayer.id ? this.localPlayer : this.otherPlayers.get(playerId);
    if (!player || player.isCaught || player.hasEscaped) return;

    const activeItem = player.inventory[player.activeSlotIndex];

    if (player.hidingSpotId !== null) {
      player.hidingSpotId = null;
      soundSystem.playWoodCreak(0.2);
      return;
    }

    const hiding = this.hidingSpots.find(h => h.id === targetId);
    if (hiding && hiding.occupiedByPlayerId === null) {
      player.hidingSpotId = hiding.id;
      player.x = hiding.x;
      player.z = hiding.z;
      soundSystem.playWoodCreak(0.25);
      return;
    }

    const door = this.doors.find(d => d.id === targetId);
    if (door) {
      if (door.isOpen) {
        door.isOpen = false;
        soundSystem.playDoor(door.x, door.y, door.z, false);
      } else if (door.isLocked) {
        if (door.keyRequired && activeItem === door.keyRequired) {
          door.isLocked = false;
          door.isOpen = true;
          soundSystem.playLockClick(door.x, door.y, door.z);
          soundSystem.playDoor(door.x, door.y, door.z, true);
          if (this.onNotification) this.onNotification('Door Unlocked!');
        } else {
          soundSystem.playLockClick(door.x, door.y, door.z);
          if (this.onNotification) this.onNotification('Door is locked! Key required.');
        }
      } else {
        door.isOpen = true;
        soundSystem.playDoor(door.x, door.y, door.z, true);
      }
      return;
    }

    const item = this.items.find(it => it.id === targetId && !it.isTaken);
    if (item) {
      const emptySlot = player.inventory.findIndex(s => s === null);
      if (emptySlot !== -1) {
        item.isTaken = true;
        item.heldByPlayerId = player.id;
        player.inventory[emptySlot] = item.type;
        player.activeSlotIndex = emptySlot;
        soundSystem.playPickup();
        if (this.onNotification) this.onNotification(`Picked up: ${item.type}`);
      } else {
        if (this.onNotification) this.onNotification('Inventory Full! Drop something first.');
      }
      return;
    }

    if (targetId === 'front_chains' && activeItem === 'bolt_cutters') {
      this.escapeProgress.frontDoorChainsCut = true;
      soundSystem.playChainCut();
      if (this.onNotification) this.onNotification('Chains cut from Front Door!');
      return;
    }

    if (targetId === 'fuse_breaker' && activeItem === 'fuse') {
      this.escapeProgress.basementFuseInserted = true;
      player.inventory[player.activeSlotIndex] = null;
      soundSystem.playPickup();
      if (this.onNotification) this.onNotification('Fuse inserted! Power restored!');
      return;
    }

    if (targetId === 'car_battery_slot' && activeItem === 'car_battery') {
      this.escapeProgress.carBatteryInstalled = true;
      player.inventory[player.activeSlotIndex] = null;
      soundSystem.playLockClick();
      if (this.onNotification) this.onNotification('Car Battery installed!');
      return;
    }

    if (targetId === 'car_spark_slot' && activeItem === 'spark_plug') {
      this.escapeProgress.sparkPlugInstalled = true;
      player.inventory[player.activeSlotIndex] = null;
      soundSystem.playLockClick();
      if (this.onNotification) this.onNotification('Spark plug installed!');
      return;
    }

    if (targetId === 'tunnel_valve' && activeItem === 'valve_wheel') {
      this.escapeProgress.tunnelValveDrained = true;
      player.inventory[player.activeSlotIndex] = null;
      soundSystem.playPickup();
      if (this.onNotification) this.onNotification('Drainage valve turned! Water draining!');
      return;
    }

    if (targetId === 'escape_front' && this.escapeProgress.frontDoorChainsCut && this.escapeProgress.basementFuseInserted) {
      this.handlePlayerEscape(player, 'front_door');
      return;
    }

    if (targetId === 'escape_car' && this.escapeProgress.carBatteryInstalled && this.escapeProgress.sparkPlugInstalled) {
      this.escapeProgress.carKeyUsed = true;
      this.escapeProgress.garageDoorOpen = true;
      this.handlePlayerEscape(player, 'car');
      return;
    }

    if (targetId === 'escape_tunnel' && this.escapeProgress.tunnelValveDrained) {
      this.handlePlayerEscape(player, 'tunnel');
      return;
    }
  }

  // Drop Active Item
  public dropActiveItem() {
    networkManager.requestDropItem(this.localPlayer.activeSlotIndex);
  }

  public sendPing(type: PingMarker['type']) {
    const ping: PingMarker = {
      id: `ping_${Date.now()}`,
      senderId: this.localPlayer.id,
      senderName: this.localPlayer.name,
      x: this.localPlayer.x,
      y: this.localPlayer.y,
      z: this.localPlayer.z,
      type,
      createdAt: Date.now()
    };
    networkManager.broadcastPing(ping);
  }

  private handleAuthoritativeDrop(playerId: string, slotIndex: number) {
    const player = playerId === this.localPlayer.id ? this.localPlayer : this.otherPlayers.get(playerId);
    if (!player) return;

    const itemType = player.inventory[slotIndex];
    if (!itemType || itemType === 'flashlight') return;

    player.inventory[slotIndex] = null;

    const droppedItem: GameItem = {
      id: `dropped_${itemType}_${Date.now()}`,
      type: itemType,
      nameKey: `item${itemType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`,
      x: player.x,
      y: player.y + 0.2,
      z: player.z,
      isTaken: false,
      heldByPlayerId: null,
      spawnRoom: 'current'
    };
    this.items.push(droppedItem);
    soundSystem.playWoodCreak(0.3);

    this.broadcastNoise(player.x, player.y, player.z, 0.7);
  }

  private handlePlayerEscape(player: PlayerData, route: 'front_door' | 'car' | 'tunnel') {
    player.hasEscaped = true;
    if (this.onNotification) this.onNotification(`${player.name} ESCAPED THE HOUSE!`);

    const allSurvivors = [this.localPlayer, ...Array.from(this.otherPlayers.values())];
    const escapedCount = allSurvivors.filter(s => s.hasEscaped).length;

    let win = false;
    if (this.escapeRule === 'any' && escapedCount >= 1) win = true;
    else if (this.escapeRule === 'majority' && escapedCount > allSurvivors.length / 2) win = true;
    else if (this.escapeRule === 'all' && escapedCount === allSurvivors.length) win = true;

    if (win) {
      this.escapeProgress.isVictory = true;
      this.escapeProgress.escapedRoute = route;
      if (this.onGameOver) this.onGameOver(true, `Escaped via ${route}`);
    }
  }

  private broadcastNoise(x: number, y: number, z: number, intensity: number) {
    const event: NoiseEvent = {
      id: `noise_${Date.now()}`,
      x,
      y,
      z,
      intensity,
      createdAt: Date.now()
    };
    if (this.caretakerAI) {
      this.caretakerAI.onNoiseEvent(event);
    }
  }

  private updateAudio() {
    const rad = this.localPlayer.rotationY;
    const fx = -Math.sin(rad);
    const fz = -Math.cos(rad);
    soundSystem.updateListener(this.localPlayer.x, this.localPlayer.y + 1.6, this.localPlayer.z, fx, 0, fz);

    const distToCaretaker = Math.hypot(
      this.localPlayer.x - this.caretakerState.x,
      this.localPlayer.z - this.caretakerState.z
    );
    const proximity = Math.max(0, Math.min(1, 1 - distToCaretaker / 14));
    soundSystem.updateHeartbeat(proximity);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.renderer) this.renderer.destroy();
    soundSystem.destroy();
    networkManager.leave();
  }
}
