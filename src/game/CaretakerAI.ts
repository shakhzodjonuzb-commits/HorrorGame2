import { AIState, CaretakerState, Difficulty, NoiseEvent, PlayerData, TrapData } from '../types/game';
import { NAV_NODES, NavNode } from './WorldData';

export class CaretakerAI {
  public state: CaretakerState;
  public difficulty: Difficulty = 'normal';

  // Navigation & patrol
  private patrolNodes: string[] = [
    'n_entrance_center',
    'n_living_center',
    'n_bedroom_center',
    'n_living_center',
    'n_entrance_center',
    'n_kitchen_center',
    'n_garage_center',
    'n_kitchen_center',
    'n_basement_center',
    'n_lab_center',
    'n_basement_center',
    'n_kitchen_center',
    'n_attic_center',
    'n_attic_west',
    'n_attic_center',
    'n_entrance_center'
  ];
  private currentPatrolIndex: number = 0;
  private currentPath: NavNode[] = [];
  private currentPathIndex: number = 0;

  // AI Timers & memory
  private stateTimer: number = 0;
  private searchTimer: number = 0;
  private lastKnownPlayerPos: { x: number; y: number; z: number } | null = null;
  private trapPlacementCooldown: number = 40; // seconds between placing traps

  // Step audio timing
  private stepDistanceAccumulator: number = 0;
  public onStepSound?: (x: number, y: number, z: number, isChasing: boolean) => void;
  public onStateChange?: (newState: AIState) => void;
  public onPlaceTrap?: (x: number, y: number, z: number) => void;

  constructor(diff: Difficulty = 'normal') {
    this.difficulty = diff;
    const startNode = NAV_NODES['n_living_fireplace'] || Object.values(NAV_NODES)[0];
    this.state = {
      x: startNode.x,
      y: startNode.y,
      z: startNode.z,
      rotationY: 0,
      state: 'PATROL',
      targetX: startNode.x,
      targetZ: startNode.z,
      chasingPlayerId: null,
      speed: 1.6,
      alertLevel: 0,
      lookAtPlayer: false
    };
    this.recalculatePathTo(this.patrolNodes[0]);
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
  }

  // Get difficulty parameters
  private getHearingMultiplier(): number {
    switch (this.difficulty) {
      case 'easy': return 0.6;
      case 'normal': return 1.0;
      case 'hard': return 1.4;
      case 'nightmare': return 1.9;
    }
  }

  private getPatrolSpeed(): number {
    switch (this.difficulty) {
      case 'easy': return 1.3;
      case 'normal': return 1.6;
      case 'hard': return 1.9;
      case 'nightmare': return 2.1;
    }
  }

  private getChaseSpeed(): number {
    switch (this.difficulty) {
      case 'easy': return 3.2;
      case 'normal': return 3.8;
      case 'hard': return 4.3;
      case 'nightmare': return 4.9;
    }
  }

  // Hearing noise events
  public onNoiseEvent(noise: NoiseEvent) {
    const dx = noise.x - this.state.x;
    const dy = noise.y - this.state.y;
    const dz = noise.z - this.state.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const hearingRadius = 18 * noise.intensity * this.getHearingMultiplier();

    if (dist <= hearingRadius) {
      // If currently chasing, don't drop chase unless noise is very close and target is lost
      if (this.state.state === 'CHASE' && dist > 5) {
        return;
      }

      this.setState('INVESTIGATE');
      this.state.targetX = noise.x;
      this.state.targetZ = noise.z;
      this.lastKnownPlayerPos = { x: noise.x, y: noise.y, z: noise.z };
      this.recalculatePathToCoords(noise.x, noise.z);
    }
  }

  // Vision Cone & Line of Sight check
  private canSeePlayer(player: PlayerData): boolean {
    if (player.isCaught || player.hasEscaped) return false;

    // If player is inside a hiding spot (closet / bed)
    if (player.hidingSpotId !== null) {
      // On nightmare or hard, if Caretaker is literally right next to closet while searching
      const d = Math.hypot(player.x - this.state.x, player.z - this.state.z);
      if (this.state.state === 'SEARCH' && d < 1.2 && Math.random() < (this.difficulty === 'nightmare' ? 0.4 : 0.15)) {
        return true;
      }
      return false;
    }

    const dx = player.x - this.state.x;
    const dy = (player.y || 0) - this.state.y;
    const dz = player.z - this.state.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Vision distance
    let maxSightDist = 12.0;
    if (player.flashlightOn) {
      maxSightDist = 24.0; // Flashlight gives player away from far away!
    } else if (player.isCrouching) {
      maxSightDist = 7.0; // Crouching behind furniture reduces silhouette
    }

    if (this.difficulty === 'nightmare') maxSightDist *= 1.3;
    if (this.difficulty === 'easy') maxSightDist *= 0.8;

    if (dist > maxSightDist) return false;

    // Angle check (Field of View ~ 85 degrees)
    const angleToPlayer = Math.atan2(dx, dz);
    let angleDiff = angleToPlayer - this.state.rotationY;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const fov = player.flashlightOn ? Math.PI * 0.75 : Math.PI * 0.48; // Wider awareness if light shining
    if (Math.abs(angleDiff) > fov && dist > 2.0) {
      return false;
    }

    // Floor height check (don't spot through floors)
    if (Math.abs(dy) > 2.5) return false;

    return true;
  }

  // Main AI Tick (called by host authoritative loop)
  public update(delta: number, players: PlayerData[], traps: TrapData[]) {
    this.stateTimer += delta;
    this.trapPlacementCooldown -= delta;

    // Check vision for all active players
    let spottedPlayer: PlayerData | null = null;
    let closestDist = Infinity;

    for (const p of players) {
      if (this.canSeePlayer(p)) {
        const dist = Math.hypot(p.x - this.state.x, p.z - this.state.z);
        if (dist < closestDist) {
          closestDist = dist;
          spottedPlayer = p;
        }
      }
    }

    // AI State Machine Transitions
    if (spottedPlayer) {
      if (this.state.state !== 'CHASE') {
        this.setState('CHASE');
      }
      this.state.chasingPlayerId = spottedPlayer.id;
      this.state.targetX = spottedPlayer.x;
      this.state.targetZ = spottedPlayer.z;
      this.lastKnownPlayerPos = { x: spottedPlayer.x, y: spottedPlayer.y, z: spottedPlayer.z };
    } else if (this.state.state === 'CHASE') {
      // Lost sight
      if (this.stateTimer > 4.5) {
        this.setState('LOST_TARGET');
      }
    }

    // Process State Actions
    switch (this.state.state) {
      case 'PATROL':
        this.state.speed = this.getPatrolSpeed();
        this.state.alertLevel = 0;
        this.advancePath(delta);

        // Maybe place a trap in doorways while patrolling
        if (this.trapPlacementCooldown <= 0 && Math.random() < 0.05 && traps.length < 5) {
          this.placeTrapNearDoorway();
          this.trapPlacementCooldown = this.difficulty === 'nightmare' ? 25 : 45;
        }
        break;

      case 'INVESTIGATE':
        this.state.speed = this.getPatrolSpeed() * 1.25;
        this.state.alertLevel = 0.6;
        this.advancePath(delta);

        // Reached investigation point
        const distToNoise = Math.hypot(this.state.x - this.state.targetX, this.state.z - this.state.targetZ);
        if (distToNoise < 1.5 || this.stateTimer > 12) {
          this.setState('SEARCH');
        }
        break;

      case 'SEARCH':
        this.state.speed = this.getPatrolSpeed() * 0.7;
        this.state.alertLevel = 0.8;
        this.searchTimer += delta;

        // Turn around looking in different directions
        this.state.rotationY += Math.sin(this.searchTimer * 1.5) * delta * 2.0;

        if (this.searchTimer > (this.difficulty === 'nightmare' ? 8.0 : 5.0)) {
          this.setState('RETURN_TO_PATROL');
        }
        break;

      case 'CHASE':
        this.state.speed = this.getChaseSpeed();
        this.state.alertLevel = 1.0;
        // Direct pursuit towards last known target
        if (this.lastKnownPlayerPos) {
          this.moveDirectTowards(this.lastKnownPlayerPos.x, this.lastKnownPlayerPos.z, delta);
        }
        break;

      case 'LOST_TARGET':
        this.state.alertLevel = 0.7;
        this.setState('SEARCH');
        break;

      case 'RETURN_TO_PATROL':
        this.state.speed = this.getPatrolSpeed();
        this.state.alertLevel = 0.2;
        this.recalculatePathTo(this.patrolNodes[this.currentPatrolIndex]);
        this.setState('PATROL');
        break;
    }
  }

  private setState(newState: AIState) {
    if (this.state.state !== newState) {
      this.state.state = newState;
      this.stateTimer = 0;
      this.searchTimer = 0;
      if (this.onStateChange) this.onStateChange(newState);
    }
  }

  // Direct move towards coordinate with collision/rotation
  private moveDirectTowards(tx: number, tz: number, delta: number) {
    const dx = tx - this.state.x;
    const dz = tz - this.state.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.1) {
      const targetAngle = Math.atan2(dx, dz);
      // Smooth rotation
      let diff = targetAngle - this.state.rotationY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.state.rotationY += diff * Math.min(1, delta * 6);

      const moveStep = Math.min(dist, this.state.speed * delta);
      this.state.x += Math.sin(this.state.rotationY) * moveStep;
      this.state.z += Math.cos(this.state.rotationY) * moveStep;

      this.stepDistanceAccumulator += moveStep;
      if (this.stepDistanceAccumulator > (this.state.state === 'CHASE' ? 1.0 : 1.5)) {
        this.stepDistanceAccumulator = 0;
        if (this.onStepSound) {
          this.onStepSound(this.state.x, this.state.y, this.state.z, this.state.state === 'CHASE');
        }
      }
    }
  }

  // Follow waypoint path
  private advancePath(delta: number) {
    if (this.currentPath.length === 0 || this.currentPathIndex >= this.currentPath.length) {
      // Pick next patrol waypoint
      if (this.state.state === 'PATROL') {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolNodes.length;
        this.recalculatePathTo(this.patrolNodes[this.currentPatrolIndex]);
      }
      return;
    }

    const nextNode = this.currentPath[this.currentPathIndex];
    const dx = nextNode.x - this.state.x;
    const dz = nextNode.z - this.state.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.6) {
      this.currentPathIndex++;
      if (this.currentPathIndex >= this.currentPath.length && this.state.state === 'PATROL') {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolNodes.length;
        this.recalculatePathTo(this.patrolNodes[this.currentPatrolIndex]);
      }
    } else {
      this.moveDirectTowards(nextNode.x, nextNode.z, delta);
    }
  }

  // Pathfinding via BFS graph search
  private recalculatePathTo(targetNodeId: string) {
    const closestStart = this.findClosestNavNode(this.state.x, this.state.z);
    if (!closestStart || !NAV_NODES[targetNodeId]) return;

    const queue: string[][] = [[closestStart.id]];
    const visited = new Set<string>([closestStart.id]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const currentId = path[path.length - 1];

      if (currentId === targetNodeId) {
        this.currentPath = path.map(id => NAV_NODES[id]);
        this.currentPathIndex = 0;
        return;
      }

      const node = NAV_NODES[currentId];
      if (node) {
        for (const neighborId of node.neighbors) {
          if (!visited.has(neighborId) && NAV_NODES[neighborId]) {
            visited.add(neighborId);
            queue.push([...path, neighborId]);
          }
        }
      }
    }
  }

  private recalculatePathToCoords(x: number, z: number) {
    const targetNode = this.findClosestNavNode(x, z);
    if (targetNode) {
      this.recalculatePathTo(targetNode.id);
    }
  }

  private findClosestNavNode(x: number, z: number): NavNode | null {
    let closest: NavNode | null = null;
    let minDist = Infinity;

    for (const node of Object.values(NAV_NODES)) {
      const d = Math.hypot(node.x - x, node.z - z);
      if (d < minDist) {
        minDist = d;
        closest = node;
      }
    }
    return closest;
  }

  private placeTrapNearDoorway() {
    if (this.onPlaceTrap) {
      this.onPlaceTrap(this.state.x, this.state.y, this.state.z);
    }
  }
}
