import {
  Difficulty,
  EscapeRule,
  NetworkPacket,
  PlayerData,
  DoorData,
  GameItem,
  CaretakerState,
  EscapeProgress,
  TrapData,
  PingMarker
} from '../types/game';

export interface LobbyInfo {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  difficulty: Difficulty;
  escapeRule: EscapeRule;
  lastSeen: number;
}

export interface FullGameStatePayload {
  players: PlayerData[];
  caretaker: CaretakerState;
  doors: DoorData[];
  items: GameItem[];
  traps: TrapData[];
  escapeProgress: EscapeProgress;
  activePings: PingMarker[];
  gameTimeSeconds: number;
}

export class NetworkManager {
  public isHost: boolean = false;
  public localPlayerId: string = '';
  public localPlayerName: string = 'Survivor';
  public roomId: string = 'SILENT';

  // Broadcast channel for local network / tab simulation
  private channel: BroadcastChannel | null = null;
  private discoveryInterval: number | null = null;

  // Lobbies discovered on local network
  public discoveredLobbies: Map<string, LobbyInfo> = new Map();

  // Connected players in lobby/game
  public players: Map<string, PlayerData> = new Map();

  // Callbacks
  public onLobbyUpdate?: (players: PlayerData[]) => void;
  public onGameStart?: (initialState: FullGameStatePayload) => void;
  public onStateSync?: (state: FullGameStatePayload) => void;
  public onInteractRequest?: (playerId: string, targetId: string) => void;
  public onDropRequest?: (playerId: string, slotIndex: number) => void;
  public onPingReceived?: (ping: PingMarker) => void;
  public onPlayerDisconnected?: (playerId: string) => void;

  constructor() {
    this.localPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
  }

  // Start Hosting a Local Game
  public startHosting(
    playerName: string,
    roomId: string = 'SILENT',
    maxPlayers: number = 4,
    difficulty: Difficulty = 'normal',
    escapeRule: EscapeRule = 'all'
  ) {
    this.isHost = true;
    this.localPlayerName = playerName;
    this.roomId = roomId.toUpperCase();

    // Create Host Player
    this.players.clear();
    const hostPlayer: PlayerData = {
      id: this.localPlayerId,
      name: playerName,
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
      hasEscaped: false,
      isReady: true,
      isHost: true
    };
    this.players.set(this.localPlayerId, hostPlayer);

    // Initialize local communication channel
    this.initChannel(`silent_house_${this.roomId}`);

    // Broadcast Lobby Presence to Local Network
    const broadcastLobby = () => {
      const globalAnnounce = new BroadcastChannel('silent_house_discovery');
      globalAnnounce.postMessage({
        type: 'DISCOVERY_BEACON',
        roomId: this.roomId,
        hostName: this.localPlayerName,
        playerCount: this.players.size,
        maxPlayers,
        difficulty,
        escapeRule,
        timestamp: Date.now()
      });
      globalAnnounce.close();
    };

    broadcastLobby();
    this.discoveryInterval = window.setInterval(broadcastLobby, 1500);

    if (this.onLobbyUpdate) {
      this.onLobbyUpdate(Array.from(this.players.values()));
    }
  }

  // Join an existing Local Game
  public joinGame(playerName: string, roomId: string) {
    this.isHost = false;
    this.localPlayerName = playerName;
    this.roomId = roomId.toUpperCase();

    this.initChannel(`silent_house_${this.roomId}`);

    // Send Join Request to Host
    const clientPlayer: PlayerData = {
      id: this.localPlayerId,
      name: playerName,
      color: '#457b9d',
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
      hasEscaped: false,
      isReady: false,
      isHost: false
    };

    this.sendPacket({
      type: 'LOBBY_UPDATE',
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      payload: { action: 'JOIN', player: clientPlayer }
    });
  }

  // Start Discovery Scanner for Local Hosts
  public startDiscovery(onFound: (lobbies: LobbyInfo[]) => void) {
    const discoveryChannel = new BroadcastChannel('silent_house_discovery');
    discoveryChannel.onmessage = (ev) => {
      const data = ev.data;
      if (data && data.type === 'DISCOVERY_BEACON') {
        this.discoveredLobbies.set(data.roomId, {
          roomId: data.roomId,
          hostName: data.hostName,
          playerCount: data.playerCount,
          maxPlayers: data.maxPlayers,
          difficulty: data.difficulty,
          escapeRule: data.escapeRule,
          lastSeen: Date.now()
        });

        // Prune stale lobbies (> 5 seconds)
        const now = Date.now();
        for (const [id, info] of this.discoveredLobbies.entries()) {
          if (now - info.lastSeen > 5000) {
            this.discoveredLobbies.delete(id);
          }
        }
        onFound(Array.from(this.discoveredLobbies.values()));
      }
    };
  }

  private initChannel(channelName: string) {
    if (this.channel) {
      this.channel.close();
    }
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event) => {
      const packet = event.data as NetworkPacket;
      if (!packet || packet.senderId === this.localPlayerId) return;
      this.handleIncomingPacket(packet);
    };
  }

  public sendPacket(packet: NetworkPacket) {
    if (this.channel) {
      this.channel.postMessage(packet);
    }
  }

  private handleIncomingPacket(packet: NetworkPacket) {
    switch (packet.type) {
      case 'LOBBY_UPDATE': {
        const payload = packet.payload as { action: string; player?: PlayerData; players?: PlayerData[] };
        if (this.isHost) {
          if (payload.action === 'JOIN' && payload.player) {
            this.players.set(payload.player.id, payload.player);
            // Host responds with full lobby list
            this.broadcastLobbySync();
          } else if (payload.action === 'TOGGLE_READY' && payload.player) {
            const p = this.players.get(payload.player.id);
            if (p) {
              p.isReady = payload.player.isReady;
              this.broadcastLobbySync();
            }
          }
        } else {
          // Client updates from Host
          if (payload.action === 'SYNC' && payload.players) {
            this.players.clear();
            payload.players.forEach(p => this.players.set(p.id, p));
            if (this.onLobbyUpdate) {
              this.onLobbyUpdate(Array.from(this.players.values()));
            }
          }
        }
        break;
      }

      case 'GAME_START': {
        if (!this.isHost && this.onGameStart) {
          this.onGameStart(packet.payload as FullGameStatePayload);
        }
        break;
      }

      case 'PLAYER_INPUT': {
        if (this.isHost) {
          const input = packet.payload as Partial<PlayerData>;
          const player = this.players.get(packet.senderId);
          if (player) {
            if (input.x !== undefined) player.x = input.x;
            if (input.y !== undefined) player.y = input.y;
            if (input.z !== undefined) player.z = input.z;
            if (input.rotationY !== undefined) player.rotationY = input.rotationY;
            if (input.pitch !== undefined) player.pitch = input.pitch;
            if (input.isCrouching !== undefined) player.isCrouching = input.isCrouching;
            if (input.isSprinting !== undefined) player.isSprinting = input.isSprinting;
            if (input.flashlightOn !== undefined) player.flashlightOn = input.flashlightOn;
            if (input.hidingSpotId !== undefined) player.hidingSpotId = input.hidingSpotId;
          }
        }
        break;
      }

      case 'GAME_STATE_SYNC': {
        if (!this.isHost && this.onStateSync) {
          this.onStateSync(packet.payload as FullGameStatePayload);
        }
        break;
      }

      case 'INTERACT_REQUEST': {
        if (this.isHost && this.onInteractRequest) {
          const payload = packet.payload as { targetId: string };
          this.onInteractRequest(packet.senderId, payload.targetId);
        }
        break;
      }

      case 'DROP_REQUEST': {
        if (this.isHost && this.onDropRequest) {
          const payload = packet.payload as { slotIndex: number };
          this.onDropRequest(packet.senderId, payload.slotIndex);
        }
        break;
      }

      case 'PING_EVENT': {
        if (this.onPingReceived) {
          this.onPingReceived(packet.payload as PingMarker);
        }
        break;
      }

      case 'PLAYER_LEAVE': {
        this.players.delete(packet.senderId);
        if (this.onPlayerDisconnected) {
          this.onPlayerDisconnected(packet.senderId);
        }
        if (this.isHost) {
          this.broadcastLobbySync();
        }
        break;
      }
    }
  }

  // Host broadcasts lobby players list
  private broadcastLobbySync() {
    const list = Array.from(this.players.values());
    this.sendPacket({
      type: 'LOBBY_UPDATE',
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      payload: { action: 'SYNC', players: list }
    });
    if (this.onLobbyUpdate) {
      this.onLobbyUpdate(list);
    }
  }

  // Host triggers game start
  public hostStartGame(initialState: FullGameStatePayload) {
    if (!this.isHost) return;
    this.sendPacket({
      type: 'GAME_START',
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      payload: initialState
    });
    if (this.onGameStart) {
      this.onGameStart(initialState);
    }
  }

  // Host sends 20-30Hz Authoritative World Sync
  public hostBroadcastState(state: FullGameStatePayload) {
    if (!this.isHost) return;
    this.sendPacket({
      type: 'GAME_STATE_SYNC',
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      payload: state
    });
  }

  // Client sends local movement input
  public sendPlayerInput(input: Partial<PlayerData>) {
    this.sendPacket({
      type: 'PLAYER_INPUT',
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      payload: input
    });
  }

  // Client requests interaction
  public requestInteraction(targetId: string) {
    if (this.isHost && this.onInteractRequest) {
      this.onInteractRequest(this.localPlayerId, targetId);
    } else {
      this.sendPacket({
        type: 'INTERACT_REQUEST',
        senderId: this.localPlayerId,
        timestamp: Date.now(),
        payload: { targetId }
      });
    }
  }

  // Client requests dropping active item
  public requestDropItem(slotIndex: number) {
    if (this.isHost && this.onDropRequest) {
      this.onDropRequest(this.localPlayerId, slotIndex);
    } else {
      this.sendPacket({
        type: 'DROP_REQUEST',
        senderId: this.localPlayerId,
        timestamp: Date.now(),
        payload: { slotIndex }
      });
    }
  }

  // Broadcast Quick Ping
  public sendPing(type: PingMarker['type'], x: number, y: number, z: number) {
    const ping: PingMarker = {
      id: `ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.localPlayerId,
      senderName: this.localPlayerName,
      type,
      x,
      y,
      z,
      createdAt: Date.now()
    };
    this.sendPacket({
      type: 'PING_EVENT',
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      payload: ping
    });
    if (this.onPingReceived) {
      this.onPingReceived(ping);
    }
  }

  // Clean shutdown
  public leave() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    this.sendPacket({
      type: 'PLAYER_LEAVE',
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      payload: {}
    });
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const networkManager = new NetworkManager();
