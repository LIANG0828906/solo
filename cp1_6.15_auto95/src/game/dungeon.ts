import * as THREE from 'three';

export interface RoomData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasChest?: boolean;
  isEntrance?: boolean;
  isExit?: boolean;
  enemyCount?: number;
}

export interface CorridorData {
  fromRoom: string;
  toRoom: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface DungeonData {
  rooms: RoomData[];
  corridors: CorridorData[];
}

const WALL_HEIGHT = 4;
const FLOOR_THICKNESS = 0.2;
const CEILING_THICKNESS = 0.2;

const COLOR_FLOOR = 0x444444;
const COLOR_WALL = 0x2a1a3a;
const COLOR_CEILING = 0x1a0a2a;
const COLOR_CHEST = 0x8b7500;
const COLOR_CHEST_ACCENT = 0xffd700;
const COLOR_TORCH = 0xff8833;
const TORCH_INTENSITY = 0.8;
const TORCH_DISTANCE = 12;

const stairsAnimations: Map<string, { mesh: THREE.Group; speed: number }> = new Map();

function createMaterial(color: number, roughness: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.1 });
}

function buildFloor(room: RoomData): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(room.width, FLOOR_THICKNESS, room.height);
  const material = createMaterial(COLOR_FLOOR, 0.9);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(room.x + room.width / 2, -FLOOR_THICKNESS / 2, room.y + room.height / 2);
  mesh.receiveShadow = true;
  return mesh;
}

function buildCeiling(room: RoomData): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(room.width, CEILING_THICKNESS, room.height);
  const material = createMaterial(COLOR_CEILING, 0.95);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    room.x + room.width / 2,
    WALL_HEIGHT + CEILING_THICKNESS / 2,
    room.y + room.height / 2
  );
  return mesh;
}

function buildWalls(room: RoomData): THREE.Mesh[] {
  const material = createMaterial(COLOR_WALL, 0.85);
  const walls: THREE.Mesh[] = [];
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;
  const wy = WALL_HEIGHT / 2;

  const wallConfigs: [number, number, number, number, number][] = [
    [room.width, WALL_HEIGHT, 0.3, cx, room.y - 0.15],
    [room.width, WALL_HEIGHT, 0.3, cx, room.y + room.height + 0.15],
    [0.3, WALL_HEIGHT, room.height, room.x - 0.15, cz],
    [0.3, WALL_HEIGHT, room.height, room.x + room.width + 0.15, cz],
  ];

  for (const [w, h, d, x, z] of wallConfigs) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, wy, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    walls.push(mesh);
  }

  return walls;
}

function buildCorridor(corridor: CorridorData, rooms: RoomData[]): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  const floorMat = createMaterial(COLOR_FLOOR, 0.9);
  const wallMat = createMaterial(COLOR_WALL, 0.85);

  const dx = corridor.endX - corridor.startX;
  const dz = corridor.endY - corridor.startY;
  const length = Math.sqrt(dx * dx + dz * dz);
  const corridorWidth = 2;

  if (length === 0) return meshes;

  const angle = Math.atan2(dz, dx);
  const midX = (corridor.startX + corridor.endX) / 2;
  const midZ = (corridor.startY + corridor.endY) / 2;

  const floorGeo = new THREE.BoxGeometry(length, FLOOR_THICKNESS, corridorWidth);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(midX, -FLOOR_THICKNESS / 2, midZ);
  floor.rotation.y = -angle;
  floor.receiveShadow = true;
  meshes.push(floor);

  const ceilGeo = new THREE.BoxGeometry(length, CEILING_THICKNESS, corridorWidth);
  const ceilMat = createMaterial(COLOR_CEILING, 0.95);
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.set(midX, WALL_HEIGHT + CEILING_THICKNESS / 2, midZ);
  ceil.rotation.y = -angle;
  meshes.push(ceil);

  const halfW = corridorWidth / 2;
  const perpX = -Math.sin(angle);
  const perpZ = Math.cos(angle);

  for (const side of [-1, 1]) {
    const wallGeo = new THREE.BoxGeometry(length, WALL_HEIGHT, 0.3);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(
      midX + perpX * halfW * side,
      WALL_HEIGHT / 2,
      midZ + perpZ * halfW * side
    );
    wall.rotation.y = -angle;
    wall.castShadow = true;
    wall.receiveShadow = true;
    meshes.push(wall);
  }

  return meshes;
}

function buildStairs(room: RoomData): THREE.Group {
  const group = new THREE.Group();
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;

  const stairMat = createMaterial(0x555566, 0.7);
  const stepCount = 20;
  const stairRadius = 1.5;

  for (let i = 0; i < stepCount; i++) {
    const angleStep = (i / stepCount) * Math.PI * 2;
    const stepHeight = (i / stepCount) * WALL_HEIGHT * 0.8;
    const stepGeo = new THREE.BoxGeometry(
      (Math.PI * 2 * stairRadius) / stepCount * 0.9,
      0.15,
      stairRadius / stepCount * 2
    );
    const step = new THREE.Mesh(stepGeo, stairMat);
    step.position.set(
      cx + Math.cos(angleStep) * stairRadius * 0.5,
      stepHeight,
      cz + Math.sin(angleStep) * stairRadius * 0.5
    );
    step.rotation.y = -angleStep;
    step.castShadow = true;
    group.add(step);
  }

  const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, WALL_HEIGHT * 0.8, 8);
  const pillarMat = createMaterial(0x444455, 0.6);
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.set(cx, (WALL_HEIGHT * 0.8) / 2, cz);
  pillar.castShadow = true;
  group.add(pillar);

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x8866ff,
    emissive: 0x4422aa,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.5,
  });
  const glowGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(cx, WALL_HEIGHT * 0.8 + 0.5, cz);
  group.add(glow);

  stairsAnimations.set(room.id, { mesh: group, speed: 0.5 });

  return group;
}

function buildChest(room: RoomData): THREE.Group {
  const group = new THREE.Group();
  const cx = room.x + room.width * 0.7;
  const cz = room.y + room.height * 0.3;

  const bodyMat = createMaterial(COLOR_CHEST, 0.6);
  const bodyGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(cx, 0.25, cz);
  body.castShadow = true;
  group.add(body);

  const lidMat = createMaterial(COLOR_CHEST, 0.5);
  const lidGeo = new THREE.BoxGeometry(0.82, 0.12, 0.52);
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.set(cx, 0.56, cz);
  group.add(lid);

  const accentMat = createMaterial(COLOR_CHEST_ACCENT, 0.3);
  const accentMatHigh = new THREE.MeshStandardMaterial({
    color: COLOR_CHEST_ACCENT,
    roughness: 0.2,
    metalness: 0.8,
  });

  const lockGeo = new THREE.BoxGeometry(0.15, 0.15, 0.06);
  const lock = new THREE.Mesh(lockGeo, accentMatHigh);
  lock.position.set(cx, 0.45, cz + 0.27);
  group.add(lock);

  for (const yOff of [0.15, 0.35]) {
    const bandGeo = new THREE.BoxGeometry(0.84, 0.04, 0.54);
    const band = new THREE.Mesh(bandGeo, accentMat);
    band.position.set(cx, yOff, cz);
    group.add(band);
  }

  return group;
}

function buildEntranceMarker(room: RoomData): THREE.Group {
  const group = new THREE.Group();
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x33ff66,
    emissive: 0x11aa33,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  const arrowGeo = new THREE.ConeGeometry(0.4, 0.8, 4);
  const arrow = new THREE.Mesh(arrowGeo, mat);
  arrow.position.set(cx, 2.5, cz);
  arrow.rotation.y = Math.PI / 4;
  group.add(arrow);

  const ringGeo = new THREE.TorusGeometry(0.6, 0.08, 8, 24);
  const ring = new THREE.Mesh(ringGeo, mat);
  ring.position.set(cx, 0.1, cz);
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  return group;
}

function buildExitMarker(room: RoomData): THREE.Group {
  const group = new THREE.Group();
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xff3366,
    emissive: 0xaa1133,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  const diamondGeo = new THREE.OctahedronGeometry(0.5);
  const diamond = new THREE.Mesh(diamondGeo, mat);
  diamond.position.set(cx, 2.5, cz);
  group.add(diamond);

  const ringGeo = new THREE.TorusGeometry(0.6, 0.08, 8, 24);
  const ring = new THREE.Mesh(ringGeo, mat);
  ring.position.set(cx, 0.1, cz);
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  return group;
}

function addTorchLight(room: RoomData, scene: THREE.Scene): void {
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;
  const light = new THREE.PointLight(COLOR_TORCH, TORCH_INTENSITY, TORCH_DISTANCE);
  light.position.set(cx, WALL_HEIGHT - 0.5, cz);
  light.castShadow = true;
  scene.add(light);

  const torchMat = new THREE.MeshStandardMaterial({
    color: COLOR_TORCH,
    emissive: COLOR_TORCH,
    emissiveIntensity: 0.5,
  });
  const flameGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const flame = new THREE.Mesh(flameGeo, torchMat);
  flame.position.copy(light.position);
  scene.add(flame);
}

export function buildDungeonScene(dungeonData: DungeonData, scene: THREE.Scene): void {
  stairsAnimations.clear();

  const { rooms, corridors } = dungeonData;

  for (const room of rooms) {
    scene.add(buildFloor(room));
    scene.add(buildCeiling(room));

    const walls = buildWalls(room);
    for (const wall of walls) {
      scene.add(wall);
    }

    addTorchLight(room, scene);

    if (room.hasChest) {
      scene.add(buildChest(room));
    }

    if (room.isExit) {
      scene.add(buildStairs(room));
      scene.add(buildExitMarker(room));
    }

    if (room.isEntrance) {
      scene.add(buildEntranceMarker(room));
    }
  }

  for (const corridor of corridors) {
    const corridorMeshes = buildCorridor(corridor, rooms);
    for (const mesh of corridorMeshes) {
      scene.add(mesh);
    }
  }
}

export function getSpawnPosition(rooms: RoomData[], roomId: string): { x: number; y: number; z: number } {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return { x: 0, y: 0, z: 0 };
  }
  return {
    x: room.x + room.width / 2,
    y: 0,
    z: room.y + room.height / 2,
  };
}

export function getEnemySpawnPositions(
  rooms: RoomData[]
): Map<string, { x: number; y: number; z: number }[]> {
  const result = new Map<string, { x: number; y: number; z: number }[]>();

  for (const room of rooms) {
    if (room.isEntrance) {
      result.set(room.id, []);
      continue;
    }

    const count = room.enemyCount ?? 0;
    const positions: { x: number; y: number; z: number }[] = [];
    const cx = room.x + room.width / 2;
    const cz = room.y + room.height / 2;
    const margin = 1.5;
    const safeW = Math.max(room.width - margin * 2, 1);
    const safeH = Math.max(room.height - margin * 2, 1);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = Math.min(safeW, safeH) * 0.35;
      positions.push({
        x: cx + Math.cos(angle) * radius,
        y: 0,
        z: cz + Math.sin(angle) * radius,
      });
    }

    result.set(room.id, positions);
  }

  return result;
}

export function updateStairsAnimations(delta: number): void {
  for (const [, anim] of stairsAnimations) {
    anim.mesh.rotation.y += anim.speed * delta;
  }
}
