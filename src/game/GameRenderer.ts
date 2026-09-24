import * as THREE from 'three';
import {
  CaretakerState,
  DoorData,
  GameItem,
  HidingSpot,
  PlayerData,
  TrapData
} from '../types/game';
import { ROOMS } from './WorldData';

export class GameRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Shared optimized materials (Prevents duplicate shader compilation on low-end phones)
  private wallMatWood: THREE.MeshStandardMaterial;
  private wallMatWallpaper: THREE.MeshStandardMaterial;
  private wallMatStone: THREE.MeshStandardMaterial;
  private floorMatPlanks: THREE.MeshStandardMaterial;
  private ceilingMat: THREE.MeshStandardMaterial;
  private doorSlabMat: THREE.MeshStandardMaterial;
  private brassMat: THREE.MeshStandardMaterial;

  // Lighting
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private ambientLight: THREE.AmbientLight;
  private chandelierLight: THREE.PointLight | null = null;
  private labLight: THREE.PointLight | null = null;

  // Animated elements
  private pendulumMesh: THREE.Mesh | null = null;
  private dustParticles: THREE.Points | null = null;

  // Meshes mapped to entity IDs
  private doorMeshes: Map<string, THREE.Group> = new Map();
  private itemMeshes: Map<string, THREE.Group> = new Map();
  private hidingMeshes: Map<string, THREE.Group> = new Map();
  private trapMeshes: Map<string, THREE.Group> = new Map();
  private otherPlayerMeshes: Map<string, THREE.Group> = new Map();

  // Caretaker 3D mesh
  private caretakerGroup: THREE.Group;
  private caretakerCoat: THREE.Mesh;
  private caretakerHead: THREE.Mesh;
  private caretakerEyes: THREE.Mesh;
  private caretakerLeftArm: THREE.Mesh;
  private caretakerRightArm: THREE.Mesh;
  private caretakerLeftLeg: THREE.Mesh;
  private caretakerRightLeg: THREE.Mesh;

  // Car mesh
  private carHeadlights: THREE.SpotLight[] = [];

  // Fear tremor
  private terrorShake = { x: 0, y: 0 };

  constructor(container: HTMLElement, fov: number = 75, quality: 'low' | 'med' | 'high' = 'med') {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040406);
    this.scene.fog = new THREE.FogExp2(0x040406, 0.08);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 35);
    this.camera.position.set(0, 1.6, 0);

    // Optimized WebGLRenderer for Android
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality === 'high',
      powerPreference: 'high-performance',
      precision: quality === 'low' ? 'mediump' : 'highp',
      stencil: false,
      depth: true
    });

    const pixelRatioCap = quality === 'low' ? 0.9 : quality === 'med' ? 1.15 : Math.min(window.devicePixelRatio, 1.4);
    this.renderer.setPixelRatio(pixelRatioCap);
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Instantiate shared materials once
    this.wallMatWood = new THREE.MeshStandardMaterial({ color: 0x241d17, roughness: 0.9, metalness: 0.1 });
    this.wallMatWallpaper = new THREE.MeshStandardMaterial({ color: 0x2d2522, roughness: 0.95 });
    this.wallMatStone = new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.85 });
    this.floorMatPlanks = new THREE.MeshStandardMaterial({ color: 0x1d1611, roughness: 0.8 });
    this.ceilingMat = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.9 });
    this.doorSlabMat = new THREE.MeshStandardMaterial({ color: 0x2e1e14, roughness: 0.9 });
    this.brassMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.8, roughness: 0.3 });

    // Dark horror ambient
    this.ambientLight = new THREE.AmbientLight(0x0c0e12, 0.45);
    this.scene.add(this.ambientLight);

    // Player flashlight (high efficiency spot light)
    this.flashlight = new THREE.SpotLight(0xfff3d6, 12, 18, Math.PI / 5.8, 0.5, 1.6);
    this.flashlight.position.set(0, 1.5, 0);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 1.5, -5);
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // Build Caretaker
    this.caretakerGroup = new THREE.Group();
    const { coat, head, eyes, lArm, rArm, lLeg, rLeg } = this.createCaretakerModel();
    this.caretakerCoat = coat;
    this.caretakerHead = head;
    this.caretakerEyes = eyes;
    this.caretakerLeftArm = lArm;
    this.caretakerRightArm = rArm;
    this.caretakerLeftLeg = lLeg;
    this.caretakerRightLeg = rLeg;
    this.scene.add(this.caretakerGroup);

    // Build Static Architecture & Props
    this.buildHouseEnvironment();
    if (quality !== 'low') {
      this.buildAtmosphericParticles();
    }

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.renderer || !this.renderer.domElement.parentElement) return;
    const parent = this.renderer.domElement.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public setFov(fov: number) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  // --- ARCHITECTURE GENERATION WITH SHARED GEOMETRY ---
  private buildHouseEnvironment() {
    ROOMS.forEach(room => {
      const w = room.bounds.maxX - room.bounds.minX;
      const d = room.bounds.maxZ - room.bounds.minZ;
      const cx = (room.bounds.minX + room.bounds.maxX) / 2;
      const cz = (room.bounds.minZ + room.bounds.maxZ) / 2;
      const baseFloorY = room.floor === 0 ? 0 : room.floor === -1 ? -4 : 4;
      const ceilingY = baseFloorY + 3.0;

      // Floor plane
      const floorGeo = new THREE.PlaneGeometry(w, d);
      const fMat = room.floor === -1 ? this.wallMatStone : this.floorMatPlanks;
      const floorMesh = new THREE.Mesh(floorGeo, fMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(cx, baseFloorY, cz);
      this.scene.add(floorMesh);

      // Ceiling plane
      const ceilGeo = new THREE.PlaneGeometry(w, d);
      const ceilMesh = new THREE.Mesh(ceilGeo, this.ceilingMat);
      ceilMesh.rotation.x = Math.PI / 2;
      ceilMesh.position.set(cx, ceilingY, cz);
      this.scene.add(ceilMesh);

      // Walls perimeter
      const wallMat = room.floor === -1 ? this.wallMatStone : room.floor === 1 ? this.wallMatWood : this.wallMatWallpaper;
      this.buildRoomPerimeterWalls(room, baseFloorY, 3.0, wallMat);
    });

    // Special Props
    this.buildGrandfatherClock(-13, 0, 3.8);
    this.buildFireplace(-13.8, 0, -2);
    this.buildCar(19, 0, -1);
    this.buildSecretTunnelProps(-14, -4, -12);

    // Chandelier
    this.chandelierLight = new THREE.PointLight(0xffa24b, 1.2, 9);
    this.chandelierLight.position.set(-9, 2.5, 0);
    this.scene.add(this.chandelierLight);

    // Lab Glow
    this.labLight = new THREE.PointLight(0x55ffaa, 1.0, 7);
    this.labLight.position.set(-2, -1.8, -10);
    this.scene.add(this.labLight);
  }

  private buildRoomPerimeterWalls(room: typeof ROOMS[0], floorY: number, height: number, material: THREE.Material) {
    const minX = room.bounds.minX;
    const maxX = room.bounds.maxX;
    const minZ = room.bounds.minZ;
    const maxZ = room.bounds.maxZ;
    const wallThick = 0.25;

    const addWallBox = (x: number, z: number, w: number, d: number) => {
      const geo = new THREE.BoxGeometry(w, height, d);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(x, floorY + height / 2, z);
      this.scene.add(mesh);
    };

    addWallBox((minX + maxX) / 2, minZ, (maxX - minX), wallThick);
    addWallBox((minX + maxX) / 2, maxZ, (maxX - minX), wallThick);
    addWallBox(minX, (minZ + maxZ) / 2, wallThick, (maxZ - minZ));
    addWallBox(maxX, (minZ + maxZ) / 2, wallThick, (maxZ - minZ));
  }

  private buildGrandfatherClock(x: number, y: number, z: number) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.5), this.wallMatWood);
    body.position.y = 1.2;
    group.add(body);

    const face = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12), new THREE.MeshBasicMaterial({ color: 0xefebd8 }));
    face.position.set(0, 1.9, 0.26);
    group.add(face);

    const pendulum = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.08, 0.9), this.brassMat);
    pendulum.position.set(0, 1.0, 0.15);
    this.pendulumMesh = pendulum;
    group.add(pendulum);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  private buildFireplace(x: number, y: number, z: number) {
    const group = new THREE.Group();
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x2b1c1c, roughness: 0.95 });
    const mantel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.6), brickMat);
    mantel.position.y = 0.7;
    group.add(mantel);

    const hearthHole = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.4), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    hearthHole.position.set(0, 0.4, 0.15);
    group.add(hearthHole);

    const emberLight = new THREE.PointLight(0xcc4411, 0.6, 4);
    emberLight.position.set(0, 0.3, 0.2);
    group.add(emberLight);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  private buildCar(x: number, y: number, z: number) {
    const carGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d3a3a, roughness: 0.6, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.2 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 4.2), bodyMat);
    body.position.y = 0.55;
    carGroup.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.2), glassMat);
    cabin.position.set(0, 1.2, -0.3);
    carGroup.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.position.set(-1.05, 0.35, 1.3);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat);
    w2.position.set(1.05, 0.35, 1.3);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat);
    w3.position.set(-1.05, 0.35, -1.3);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat);
    w4.position.set(1.05, 0.35, -1.3);
    carGroup.add(w1, w2, w3, w4);

    const hl1 = new THREE.SpotLight(0xfffae6, 0, 14, Math.PI / 4, 0.3);
    hl1.position.set(-0.7, 0.6, 2.2);
    hl1.target.position.set(-0.7, 0.3, 7.0);
    const hl2 = new THREE.SpotLight(0xfffae6, 0, 14, Math.PI / 4, 0.3);
    hl2.position.set(0.7, 0.6, 2.2);
    hl2.target.position.set(0.7, 0.3, 7.0);

    carGroup.add(hl1, hl1.target, hl2, hl2.target);
    this.carHeadlights.push(hl1, hl2);

    carGroup.position.set(x, y, z);
    this.scene.add(carGroup);
  }

  private buildSecretTunnelProps(x: number, y: number, z: number) {
    const group = new THREE.Group();
    const waterGeo = new THREE.PlaneGeometry(8, 4);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x081820,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.25, 0);
    group.add(water);

    const valveGeo = new THREE.TorusGeometry(0.3, 0.05, 6, 12);
    const valveMat = new THREE.MeshStandardMaterial({ color: 0x992222, metalness: 0.7, roughness: 0.4 });
    const valve = new THREE.Mesh(valveGeo, valveMat);
    valve.position.set(2.5, 1.2, -1.8);
    group.add(valve);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  private buildAtmosphericParticles() {
    const particleCount = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 35;
      pos[i + 1] = Math.random() * 3;
      pos[i + 2] = (Math.random() - 0.5) * 35;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x9999aa,
      size: 0.04,
      transparent: true,
      opacity: 0.35
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  private createCaretakerModel() {
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x181515, roughness: 0.95 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb8, roughness: 0.7 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });

    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.4, 8), coatMat);
    coat.position.y = 1.3;
    this.caretakerGroup.add(coat);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), skinMat);
    head.position.y = 2.15;
    this.caretakerGroup.add(head);

    const eyeGeo = new THREE.BoxGeometry(0.08, 0.04, 0.05);
    const eyes = new THREE.Mesh(eyeGeo, eyeMat);
    eyes.position.set(0, 2.18, 0.17);
    this.caretakerGroup.add(eyes);

    const armGeo = new THREE.BoxGeometry(0.14, 0.85, 0.14);
    const lArm = new THREE.Mesh(armGeo, coatMat);
    lArm.position.set(-0.45, 1.35, 0);
    const rArm = new THREE.Mesh(armGeo, coatMat);
    rArm.position.set(0.45, 1.35, 0);
    this.caretakerGroup.add(lArm, rArm);

    const legGeo = new THREE.BoxGeometry(0.18, 0.75, 0.18);
    const lLeg = new THREE.Mesh(legGeo, coatMat);
    lLeg.position.set(-0.2, 0.38, 0);
    const rLeg = new THREE.Mesh(legGeo, coatMat);
    rLeg.position.set(0.2, 0.38, 0);
    this.caretakerGroup.add(lLeg, rLeg);

    return { coat, head, eyes, lArm, rArm, lLeg, rLeg };
  }

  // --- SYNC UPDATE LOOP WITH FEAR PULSE TREMOR ---
  public update(
    delta: number,
    localPlayer: PlayerData,
    otherPlayers: PlayerData[],
    caretaker: CaretakerState,
    doors: DoorData[],
    items: GameItem[],
    hidingSpots: HidingSpot[],
    traps: TrapData[],
    carFixed: boolean,
    fearLevel: number = 0
  ) {
    // 1. Calculate Fear Shaking & Camera Tremor
    if (fearLevel > 0.4) {
      const shakeIntensity = (fearLevel - 0.4) * 0.035;
      this.terrorShake.x = (Math.random() - 0.5) * shakeIntensity;
      this.terrorShake.y = (Math.random() - 0.5) * shakeIntensity;
    } else {
      this.terrorShake.x = 0;
      this.terrorShake.y = 0;
    }

    // 2. Update Camera to Local Player
    const eyeHeight = localPlayer.isCrouching ? 0.9 : 1.6;
    this.camera.position.set(
      localPlayer.x + this.terrorShake.x,
      localPlayer.y + eyeHeight + this.terrorShake.y,
      localPlayer.z
    );
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = localPlayer.rotationY;
    this.camera.rotation.x = localPlayer.pitch;

    // Flashlight follows camera look
    this.flashlight.position.copy(this.camera.position);
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    this.flashlightTarget.position.copy(this.camera.position).add(dir.multiplyScalar(6));
    this.flashlight.visible = localPlayer.flashlightOn;

    // 3. Animate Caretaker
    this.caretakerGroup.position.set(caretaker.x, caretaker.y, caretaker.z);
    this.caretakerGroup.rotation.y = caretaker.rotationY;

    const limbFreq = caretaker.state === 'CHASE' ? 12 : 6;
    const limbAmp = caretaker.state === 'CHASE' ? 0.45 : 0.25;
    const swing = Math.sin(Date.now() * 0.001 * limbFreq) * limbAmp;

    this.caretakerLeftLeg.rotation.x = swing;
    this.caretakerRightLeg.rotation.x = -swing;
    this.caretakerLeftArm.rotation.x = -swing * 1.2;
    this.caretakerRightArm.rotation.x = swing * 1.2;

    (this.caretakerEyes.material as THREE.MeshBasicMaterial).color.setHex(
      caretaker.state === 'CHASE' ? 0xff1111 : 0xcc4422
    );

    // 4. Doors (only animate when state changes)
    doors.forEach(d => {
      let group = this.doorMeshes.get(d.id);
      if (!group) {
        group = this.createDoorMesh(d);
        this.doorMeshes.set(d.id, group);
        this.scene.add(group);
      }
      const targetAngle = d.isOpen ? Math.PI / 2 : 0;
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, d.rotationY + targetAngle, delta * 6);
    });

    // 5. Items in 3D
    items.forEach(it => {
      let mesh = this.itemMeshes.get(it.id);
      if (!mesh) {
        mesh = this.createItemMesh(it);
        this.itemMeshes.set(it.id, mesh);
        this.scene.add(mesh);
      }
      mesh.visible = !it.isTaken;
      if (!it.isTaken) {
        mesh.position.set(it.x, it.y + Math.sin(Date.now() * 0.003 + it.x) * 0.05, it.z);
        mesh.rotation.y += delta * 1.2;
      }
    });

    // 6. Hiding Spots
    hidingSpots.forEach(h => {
      if (!this.hidingMeshes.has(h.id)) {
        const mesh = this.createHidingSpotMesh(h);
        this.hidingMeshes.set(h.id, mesh);
        this.scene.add(mesh);
      }
    });

    // 7. Traps
    traps.forEach(tr => {
      let mesh = this.trapMeshes.get(tr.id);
      if (!mesh) {
        mesh = this.createTrapMesh(tr);
        this.trapMeshes.set(tr.id, mesh);
        this.scene.add(mesh);
      }
      mesh.visible = !tr.isTriggered;
    });

    // 8. Other Survivors in LAN Co-op
    otherPlayers.forEach(p => {
      if (p.id === localPlayer.id) return;
      let pGroup = this.otherPlayerMeshes.get(p.id);
      if (!pGroup) {
        pGroup = this.createOtherPlayerMesh(p);
        this.otherPlayerMeshes.set(p.id, pGroup);
        this.scene.add(pGroup);
      }
      pGroup.visible = !p.isCaught && !p.hasEscaped && p.hidingSpotId === null;
      if (pGroup.visible) {
        pGroup.position.lerp(new THREE.Vector3(p.x, p.y + (p.isCrouching ? -0.4 : 0), p.z), delta * 14);
        pGroup.rotation.y = p.rotationY;
      }
    });

    if (carFixed) {
      this.carHeadlights.forEach(hl => { hl.intensity = 18; });
    }

    if (this.pendulumMesh) {
      this.pendulumMesh.rotation.z = Math.sin(Date.now() * 0.003) * 0.35;
    }

    // Render 3D Frame
    this.renderer.render(this.scene, this.camera);
  }

  private createDoorMesh(d: DoorData): THREE.Group {
    const group = new THREE.Group();
    group.position.set(d.x, d.y, d.z);
    group.rotation.y = d.rotationY;

    const doorGeo = new THREE.BoxGeometry(0.9, 2.1, 0.08);
    const slab = new THREE.Mesh(doorGeo, this.doorSlabMat);
    slab.position.set(0.45, 0, 0);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.15),
      this.brassMat
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.8, 0, 0.06);
    slab.add(handle);

    if (d.needsBoltCutters) {
      const chain = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.03, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
      );
      chain.position.set(0.7, 0.1, 0.08);
      slab.add(chain);
    }

    group.add(slab);
    return group;
  }

  private createItemMesh(it: GameItem): THREE.Group {
    const group = new THREE.Group();
    let mat = this.brassMat;

    switch (it.type) {
      case 'master_key':
      case 'basement_key':
      case 'garage_key': {
        const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), mat);
        const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25), mat);
        keyStem.position.y = -0.15;
        group.add(keyRing, keyStem);
        break;
      }
      case 'bolt_cutters': {
        mat = new THREE.MeshStandardMaterial({ color: 0xb22222, metalness: 0.6 });
        const cutter = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, 0.06), mat);
        group.add(cutter);
        break;
      }
      case 'fuse': {
        mat = new THREE.MeshStandardMaterial({ color: 0x00ccaa, metalness: 0.7 });
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18), mat);
        group.add(fuse);
        break;
      }
      case 'car_battery': {
        mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
        const bat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.25), mat);
        group.add(bat);
        break;
      }
      default: {
        const generic = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), mat);
        group.add(generic);
      }
    }

    group.position.set(it.x, it.y, it.z);
    return group;
  }

  private createHidingSpotMesh(h: HidingSpot): THREE.Group {
    const group = new THREE.Group();

    if (h.type === 'closet' || h.type === 'cupboard') {
      const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.7), this.wallMatWood);
      wardrobe.position.y = 1.1;
      group.add(wardrobe);
    } else if (h.type === 'bed') {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 2.4), this.wallMatWood);
      frame.position.y = 0.25;
      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.3, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x8a7e72, roughness: 0.9 })
      );
      mattress.position.y = 0.55;
      group.add(frame, mattress);
    }

    group.position.set(h.x, 0, h.z);
    return group;
  }

  private createTrapMesh(tr: TrapData): THREE.Group {
    const group = new THREE.Group();
    const trapMat = new THREE.MeshStandardMaterial({ color: 0x661111, metalness: 0.8 });
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.2, 8), trapMat);
    bell.position.y = 0.1;
    group.add(bell);
    group.position.set(tr.x, tr.y, tr.z);
    return group;
  }

  private createOtherPlayerMesh(p: PlayerData): THREE.Group {
    const group = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: p.color || 0x3b82f6, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0c0a0 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9), pMat);
    torso.position.y = 0.9;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), skinMat);
    head.position.y = 1.5;

    const pLight = new THREE.SpotLight(0xfffae6, 6, 12, Math.PI / 6, 0.4);
    pLight.position.set(0.25, 1.0, 0.2);
    pLight.target.position.set(0.25, 1.0, 6.0);
    group.add(torso, head, pLight, pLight.target);

    group.position.set(p.x, p.y, p.z);
    return group;
  }

  public destroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
