import { DoorData, GameItem, HidingSpot, CreakyBoard, ItemType } from '../types/game';

export interface RoomDefinition {
  id: string;
  name: string;
  floor: number; // 0 = ground, -1 = basement, 1 = attic
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  floorColor: number;
  wallColor: number;
}

export interface WallSegment {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  materialType: 'wood_panel' | 'dirty_wallpaper' | 'stone_damp' | 'attic_wood';
}

export interface NavNode {
  id: string;
  x: number;
  y: number;
  z: number;
  room: string;
  neighbors: string[];
}

export const ROOMS: RoomDefinition[] = [
  // Ground Floor
  { id: 'entrance', name: 'Main Entrance', floor: 0, bounds: { minX: -4, maxX: 4, minZ: -4, maxZ: 4 }, floorColor: 0x221a14, wallColor: 0x2a2520 },
  { id: 'living_room', name: 'Living Room', floor: 0, bounds: { minX: -14, maxX: -4, minZ: -5, maxZ: 5 }, floorColor: 0x1f1712, wallColor: 0x332822 },
  { id: 'kitchen', name: 'Kitchen', floor: 0, bounds: { minX: 4, maxX: 14, minZ: -4, maxZ: 4 }, floorColor: 0x181a18, wallColor: 0x242824 },
  { id: 'bedroom', name: 'Master Bedroom', floor: 0, bounds: { minX: -14, maxX: -4, minZ: 5, maxZ: 14 }, floorColor: 0x2b1e19, wallColor: 0x282024 },
  { id: 'storage', name: 'Storage Room', floor: 0, bounds: { minX: 4, maxX: 14, minZ: 5, maxZ: 13 }, floorColor: 0x18181a, wallColor: 0x222226 },
  { id: 'garage', name: 'Garage', floor: 0, bounds: { minX: 14, maxX: 24, minZ: -6, maxZ: 6 }, floorColor: 0x151618, wallColor: 0x1d1f22 },
  { id: 'secret_room', name: 'Secret Study', floor: 0, bounds: { minX: -22, maxX: -14, minZ: -4, maxZ: 4 }, floorColor: 0x1b1310, wallColor: 0x201815 },

  // Basement (-1)
  { id: 'basement', name: 'Basement Generator', floor: -1, bounds: { minX: 4, maxX: 14, minZ: -14, maxZ: -4 }, floorColor: 0x111214, wallColor: 0x191a1d },
  { id: 'lab', name: 'Locked Laboratory', floor: -1, bounds: { minX: -8, maxX: 4, minZ: -14, maxZ: -6 }, floorColor: 0x121516, wallColor: 0x1c2124 },
  { id: 'secret_tunnel', name: 'Secret Drainage Tunnel', floor: -1, bounds: { minX: -20, maxX: -8, minZ: -16, maxZ: -8 }, floorColor: 0x0d1012, wallColor: 0x14181a },

  // Attic (+1)
  { id: 'attic', name: 'Dusty Attic', floor: 1, bounds: { minX: -10, maxX: 10, minZ: 0, maxZ: 14 }, floorColor: 0x231a12, wallColor: 0x261d15 },
];

export const INITIAL_DOORS: DoorData[] = [
  // Front Door (heavy exit door with chains and electric lock)
  { id: 'door_front', name: 'Front Entrance Door', x: 0, y: 1.5, z: -4, rotationY: 0, isOpen: false, isLocked: true, keyRequired: 'master_key', needsBoltCutters: true, needsPower: true },

  // Living Room Doors
  { id: 'door_living', name: 'Living Room Door', x: -4, y: 1.5, z: 0, rotationY: Math.PI / 2, isOpen: false, isLocked: false, keyRequired: null },
  { id: 'door_bookshelf', name: 'Secret Bookshelf Door', x: -14, y: 1.5, z: 0, rotationY: Math.PI / 2, isOpen: false, isLocked: true, keyRequired: 'crowbar' },

  // Kitchen & Garage Doors
  { id: 'door_kitchen', name: 'Kitchen Door', x: 4, y: 1.5, z: 0, rotationY: Math.PI / 2, isOpen: false, isLocked: false, keyRequired: null },
  { id: 'door_garage', name: 'Garage Heavy Door', x: 14, y: 1.5, z: 0, rotationY: Math.PI / 2, isOpen: false, isLocked: true, keyRequired: 'garage_key' },

  // Bedroom & Storage
  { id: 'door_bedroom', name: 'Master Bedroom Door', x: -9, y: 1.5, z: 5, rotationY: 0, isOpen: false, isLocked: false, keyRequired: null },
  { id: 'door_storage', name: 'Storage Room Door', x: 9, y: 1.5, z: 5, rotationY: 0, isOpen: false, isLocked: false, keyRequired: null },

  // Basement Hatch
  { id: 'door_basement_hatch', name: 'Basement Wooden Hatch', x: 9, y: 0.1, z: -2, rotationY: 0, isOpen: false, isLocked: true, keyRequired: 'basement_key' },

  // Lab Door in Basement
  { id: 'door_lab', name: 'Reinforced Lab Door', x: 4, y: -2.5, z: -10, rotationY: Math.PI / 2, isOpen: false, isLocked: true, keyRequired: 'master_key' },

  // Attic Stair Door
  { id: 'door_attic', name: 'Attic Stair Door', x: 0, y: 1.5, z: 4, rotationY: 0, isOpen: false, isLocked: false, keyRequired: null },
];

export const HIDING_SPOTS: HidingSpot[] = [
  { id: 'hide_living_closet', name: 'Living Room Wardrobe', type: 'closet', x: -12, y: 1.2, z: -3.5, lookDirY: 0, occupiedByPlayerId: null },
  { id: 'hide_bedroom_closet', name: 'Master Bedroom Closet', type: 'closet', x: -12.5, y: 1.2, z: 12, lookDirY: -Math.PI / 2, occupiedByPlayerId: null },
  { id: 'hide_bedroom_bed', name: 'Under Master Bed', type: 'bed', x: -6.5, y: 0.4, z: 9.5, lookDirY: Math.PI, occupiedByPlayerId: null },
  { id: 'hide_storage_cupboard', name: 'Storage Metal Cupboard', type: 'cupboard', x: 12.5, y: 1.2, z: 11.5, lookDirY: -Math.PI / 2, occupiedByPlayerId: null },
];

export const CREAKY_BOARDS: CreakyBoard[] = [
  { id: 'creak_entrance_hall', x: 0, z: 2, radius: 1.2 },
  { id: 'creak_living_entry', x: -6, z: 0, radius: 1.4 },
  { id: 'creak_kitchen_fridge', x: 10, z: 2, radius: 1.3 },
  { id: 'creak_bedroom_door', x: -9, z: 6, radius: 1.2 },
  { id: 'creak_attic_center_1', x: 0, z: 8, radius: 1.8 },
  { id: 'creak_attic_center_2', x: -4, z: 10, radius: 1.6 },
  { id: 'creak_garage_oil', x: 17, z: -2, radius: 1.5 },
  { id: 'creak_basement_step', x: 9, z: -6, radius: 1.3 },
];

// Waypoint Graph for Caretaker AI
export const NAV_NODES: Record<string, NavNode> = {
  // Entrance
  'n_entrance_center': { id: 'n_entrance_center', x: 0, y: 0, z: 0, room: 'entrance', neighbors: ['n_entrance_door', 'n_living_hall', 'n_kitchen_hall', 'n_attic_stairs'] },
  'n_entrance_door': { id: 'n_entrance_door', x: 0, y: 0, z: -3, room: 'entrance', neighbors: ['n_entrance_center'] },
  'n_attic_stairs': { id: 'n_attic_stairs', x: 0, y: 0, z: 3.5, room: 'entrance', neighbors: ['n_entrance_center', 'n_attic_top'] },

  // Living Room
  'n_living_hall': { id: 'n_living_hall', x: -4, y: 0, z: 0, room: 'entrance', neighbors: ['n_entrance_center', 'n_living_center'] },
  'n_living_center': { id: 'n_living_center', x: -9, y: 0, z: 0, room: 'living_room', neighbors: ['n_living_hall', 'n_living_fireplace', 'n_living_bookshelf', 'n_bedroom_hall'] },
  'n_living_fireplace': { id: 'n_living_fireplace', x: -12, y: 0, z: -3, room: 'living_room', neighbors: ['n_living_center'] },
  'n_living_bookshelf': { id: 'n_living_bookshelf', x: -13.5, y: 0, z: 0, room: 'living_room', neighbors: ['n_living_center', 'n_secret_room'] },
  'n_secret_room': { id: 'n_secret_room', x: -18, y: 0, z: 0, room: 'secret_room', neighbors: ['n_living_bookshelf'] },

  // Bedroom
  'n_bedroom_hall': { id: 'n_bedroom_hall', x: -9, y: 0, z: 5, room: 'bedroom', neighbors: ['n_living_center', 'n_bedroom_center'] },
  'n_bedroom_center': { id: 'n_bedroom_center', x: -9, y: 0, z: 9, room: 'bedroom', neighbors: ['n_bedroom_hall', 'n_bedroom_closet', 'n_bedroom_bed'] },
  'n_bedroom_closet': { id: 'n_bedroom_closet', x: -12, y: 0, z: 12, room: 'bedroom', neighbors: ['n_bedroom_center'] },
  'n_bedroom_bed': { id: 'n_bedroom_bed', x: -6, y: 0, z: 9.5, room: 'bedroom', neighbors: ['n_bedroom_center'] },

  // Kitchen & Garage
  'n_kitchen_hall': { id: 'n_kitchen_hall', x: 4, y: 0, z: 0, room: 'entrance', neighbors: ['n_entrance_center', 'n_kitchen_center'] },
  'n_kitchen_center': { id: 'n_kitchen_center', x: 9, y: 0, z: 0, room: 'kitchen', neighbors: ['n_kitchen_hall', 'n_kitchen_hatch', 'n_storage_hall', 'n_garage_door'] },
  'n_kitchen_hatch': { id: 'n_kitchen_hatch', x: 9, y: 0, z: -2, room: 'kitchen', neighbors: ['n_kitchen_center', 'n_basement_top'] },
  'n_storage_hall': { id: 'n_storage_hall', x: 9, y: 0, z: 5, room: 'storage', neighbors: ['n_kitchen_center', 'n_storage_center'] },
  'n_storage_center': { id: 'n_storage_center', x: 9, y: 0, z: 9, room: 'storage', neighbors: ['n_storage_hall'] },

  'n_garage_door': { id: 'n_garage_door', x: 14, y: 0, z: 0, room: 'kitchen', neighbors: ['n_kitchen_center', 'n_garage_center'] },
  'n_garage_center': { id: 'n_garage_center', x: 19, y: 0, z: 0, room: 'garage', neighbors: ['n_garage_door', 'n_garage_car'] },
  'n_garage_car': { id: 'n_garage_car', x: 20, y: 0, z: -2, room: 'garage', neighbors: ['n_garage_center'] },

  // Basement & Lab
  'n_basement_top': { id: 'n_basement_top', x: 9, y: -4, z: -5, room: 'basement', neighbors: ['n_kitchen_hatch', 'n_basement_center'] },
  'n_basement_center': { id: 'n_basement_center', x: 9, y: -4, z: -9, room: 'basement', neighbors: ['n_basement_top', 'n_basement_fuse', 'n_lab_door'] },
  'n_basement_fuse': { id: 'n_basement_fuse', x: 12, y: -4, z: -11, room: 'basement', neighbors: ['n_basement_center'] },
  'n_lab_door': { id: 'n_lab_door', x: 4, y: -4, z: -10, room: 'basement', neighbors: ['n_basement_center', 'n_lab_center'] },
  'n_lab_center': { id: 'n_lab_center', x: -2, y: -4, z: -10, room: 'lab', neighbors: ['n_lab_door', 'n_tunnel_entrance'] },
  'n_tunnel_entrance': { id: 'n_tunnel_entrance', x: -8, y: -4, z: -11, room: 'secret_tunnel', neighbors: ['n_lab_center', 'n_tunnel_valve', 'n_tunnel_exit'] },
  'n_tunnel_valve': { id: 'n_tunnel_valve', x: -14, y: -4, z: -11, room: 'secret_tunnel', neighbors: ['n_tunnel_entrance'] },
  'n_tunnel_exit': { id: 'n_tunnel_exit', x: -18, y: -4, z: -12, room: 'secret_tunnel', neighbors: ['n_tunnel_entrance'] },

  // Attic
  'n_attic_top': { id: 'n_attic_top', x: 0, y: 4, z: 5, room: 'attic', neighbors: ['n_attic_stairs', 'n_attic_center'] },
  'n_attic_center': { id: 'n_attic_center', x: 0, y: 4, z: 8, room: 'attic', neighbors: ['n_attic_top', 'n_attic_west', 'n_attic_east'] },
  'n_attic_west': { id: 'n_attic_west', x: -6, y: 4, z: 10, room: 'attic', neighbors: ['n_attic_center'] },
  'n_attic_east': { id: 'n_attic_east', x: 6, y: 4, z: 10, room: 'attic', neighbors: ['n_attic_center'] },
};

// Randomized Item Spawning Helper (synchronized by host seed)
export function generateRandomizedItems(seed: number = Date.now()): GameItem[] {
  // Simple deterministic pseudorandom number generator using seed
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const possibleLocations: Record<ItemType, { room: string; x: number; y: number; z: number }[]> = {
    master_key: [
      { room: 'secret_room', x: -18, y: 0.8, z: 1 },
      { room: 'attic', x: -7, y: 4.8, z: 11 },
      { room: 'lab', x: -4, y: -3.2, z: -11 },
    ],
    basement_key: [
      { room: 'bedroom', x: -11, y: 0.8, z: 7 },
      { room: 'living_room', x: -10, y: 0.8, z: -3 },
      { room: 'storage', x: 7, y: 0.8, z: 11 },
    ],
    garage_key: [
      { room: 'kitchen', x: 12, y: 0.8, z: 2 },
      { room: 'basement', x: 6, y: -3.2, z: -11 },
      { room: 'attic', x: 5, y: 4.8, z: 9 },
    ],
    bolt_cutters: [
      { room: 'storage', x: 11, y: 0.4, z: 7 },
      { room: 'garage', x: 22, y: 0.4, z: 2 },
      { room: 'attic', x: 2, y: 4.4, z: 11 },
    ],
    fuse: [
      { room: 'bedroom', x: -5, y: 0.8, z: 12 },
      { room: 'living_room', x: -7, y: 0.8, z: 3 },
      { room: 'storage', x: 10, y: 0.8, z: 8 },
    ],
    car_battery: [
      { room: 'basement', x: 11, y: -3.6, z: -7 },
      { room: 'attic', x: -4, y: 4.4, z: 7 },
      { room: 'storage', x: 6, y: 0.4, z: 9 },
    ],
    spark_plug: [
      { room: 'lab', x: 1, y: -3.2, z: -8 },
      { room: 'kitchen', x: 7, y: 0.8, z: -2 },
      { room: 'bedroom', x: -8, y: 0.8, z: 13 },
    ],
    crowbar: [
      { room: 'garage', x: 16, y: 0.4, z: 4 },
      { room: 'basement', x: 8, y: -3.6, z: -12 },
      { room: 'storage', x: 12, y: 0.4, z: 6 },
    ],
    valve_wheel: [
      { room: 'secret_room', x: -16, y: 0.8, z: -2 },
      { room: 'attic', x: 7, y: 4.4, z: 11 },
      { room: 'garage', x: 18, y: 0.8, z: 4 },
    ],
    flashlight: [
      { room: 'entrance', x: 2, y: 0.8, z: 1 },
    ],
    note: [
      { room: 'living_room', x: -9, y: 0.8, z: -1 },
    ]
  };

  const items: GameItem[] = [];
  const keys: ItemType[] = [
    'master_key',
    'basement_key',
    'garage_key',
    'bolt_cutters',
    'fuse',
    'car_battery',
    'spark_plug',
    'crowbar',
    'valve_wheel',
    'flashlight',
    'note'
  ];

  keys.forEach((type, idx) => {
    const locs = possibleLocations[type];
    const pickedLoc = locs[Math.floor(rand() * locs.length)];
    items.push({
      id: `item_${type}_${idx}`,
      type,
      nameKey: `item${type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`,
      x: pickedLoc.x,
      y: pickedLoc.y,
      z: pickedLoc.z,
      isTaken: false,
      heldByPlayerId: null,
      spawnRoom: pickedLoc.room
    });
  });

  return items;
}
