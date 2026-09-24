export type AIState = 'PATROL' | 'INVESTIGATE' | 'SEARCH' | 'CHASE' | 'LOST_TARGET' | 'RETURN_TO_PATROL';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

export type EscapeRule = 'all' | 'any' | 'majority';

export type ItemType =
  | 'master_key'
  | 'basement_key'
  | 'garage_key'
  | 'bolt_cutters'
  | 'fuse'
  | 'car_battery'
  | 'spark_plug'
  | 'crowbar'
  | 'valve_wheel'
  | 'flashlight'
  | 'note';

export interface GameItem {
  id: string;
  type: ItemType;
  nameKey: string;
  x: number;
  y: number;
  z: number;
  isTaken: boolean;
  heldByPlayerId: string | null;
  spawnRoom: string;
}

export interface DoorData {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number; // base rotation
  isOpen: boolean;
  isLocked: boolean;
  keyRequired: ItemType | null;
  needsBoltCutters?: boolean;
  needsPower?: boolean;
}

export interface HidingSpot {
  id: string;
  name: string;
  type: 'closet' | 'bed' | 'cupboard';
  x: number;
  y: number;
  z: number;
  lookDirY: number;
  occupiedByPlayerId: string | null;
}

export interface CreakyBoard {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface TrapData {
  id: string;
  x: number;
  y: number;
  z: number;
  isTriggered: boolean;
  placedBy: 'caretaker';
}

export interface PlayerData {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  pitch: number;
  isCrouching: boolean;
  isSprinting: boolean;
  flashlightOn: boolean;
  hidingSpotId: string | null;
  inventory: (ItemType | null)[];
  activeSlotIndex: number;
  stamina: number;
  battery: number;
  isCaught: boolean;
  hasEscaped: boolean;
  isReady?: boolean;
  isHost?: boolean;
  pingMs?: number;
}

export interface CaretakerState {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  state: AIState;
  targetX: number;
  targetZ: number;
  chasingPlayerId: string | null;
  speed: number;
  alertLevel: number; // 0 to 1
  lookAtPlayer: boolean;
}

export interface EscapeProgress {
  // Front door escape
  frontDoorChainsCut: boolean;
  basementFuseInserted: boolean;
  frontDoorUnlocked: boolean;

  // Garage car escape
  carBatteryInstalled: boolean;
  sparkPlugInstalled: boolean;
  carKeyUsed: boolean;
  garageDoorOpen: boolean;

  // Secret tunnel escape
  labHatchCrowbarred: boolean;
  tunnelValveDrained: boolean;
  tunnelGateUnlocked: boolean;

  // Win stats
  escapedRoute: 'front_door' | 'car' | 'tunnel' | null;
  isVictory: boolean;
  isDefeat: boolean;
  defeatReason: string | null;
}

export interface NoiseEvent {
  id: string;
  x: number;
  y: number;
  z: number;
  intensity: number; // 0.1 to 1.0 (determines hearing radius)
  createdAt: number;
}

export interface PingMarker {
  id: string;
  senderId: string;
  senderName: string;
  type: 'enemy' | 'key' | 'help' | 'door' | 'here';
  x: number;
  y: number;
  z: number;
  createdAt: number;
}

// Network Packets
export type PacketType =
  | 'LOBBY_UPDATE'
  | 'GAME_START'
  | 'PLAYER_INPUT'
  | 'GAME_STATE_SYNC'
  | 'INTERACT_REQUEST'
  | 'INTERACT_RESULT'
  | 'DROP_REQUEST'
  | 'NOISE_EVENT'
  | 'PING_EVENT'
  | 'PLAYER_LEAVE';

export interface NetworkPacket {
  type: PacketType;
  senderId: string;
  timestamp: number;
  payload: unknown;
}

export interface GameSettings {
  language: 'en' | 'uz' | 'ru';
  graphicsQuality: 'low' | 'med' | 'high';
  fpsLimit: 30 | 60;
  lookSensitivity: number; // 0.5 to 2.5
  fov: number; // 65 to 95
  sfxVolume: number;
  ambientVolume: number;
  headBob: boolean;
  shadows: boolean;
}
