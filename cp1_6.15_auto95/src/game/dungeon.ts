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

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateBrickTexture(seed: number = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(seed);

  const brickWidth = 64;
  const brickHeight = 32;
  const mortarSize = 4;

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 512, 512);

  let row = 0;
  for (let y = 0; y < 512; y += brickHeight + mortarSize) {
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;
    for (let x = -brickWidth + offset; x < 512 + brickWidth; x += brickWidth + mortarSize) {
      const baseGray = 100 + Math.floor(rand() * 60);
      const variation = Math.floor(rand() * 30) - 15;
      const gray = Math.max(40, Math.min(180, baseGray + variation));

      const r = gray + Math.floor(rand() * 10) - 5;
      const g = gray + Math.floor(rand() * 10) - 5;
      const b = gray + Math.floor(rand() * 15) - 7;

      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r))}, ${Math.min(255, Math.max(0, g))}, ${Math.min(255, Math.max(0, b))})`;
      ctx.fillRect(x, y, brickWidth, brickHeight);

      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + rand() * 0.2})`;
      ctx.fillRect(x, y + brickHeight - 3, brickWidth, 3);

      for (let i = 0; i < 5; i++) {
        const nx = x + rand() * brickWidth;
        const ny = y + rand() * brickHeight;
        const ns = 1 + rand() * 3;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + rand() * 0.1})`;
        ctx.fillRect(nx, ny, ns, ns);
      }
    }
    row++;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function generateStoneTexture(seed: number = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(seed);

  const baseR = 42;
  const baseG = 26;
  const baseB = 58;

  const imageData = ctx.createImageData(512, 512);
  const data = imageData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      const noise = (rand() - 0.5) * 40;
      data[idx] = Math.max(0, Math.min(255, baseR + noise));
      data[idx + 1] = Math.max(0, Math.min(255, baseG + noise));
      data[idx + 2] = Math.max(0, Math.min(255, baseB + noise));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const stoneBlocks: { x: number; y: number; w: number; h: number; points: { x: number; y: number }[] }[] = [];
  const blockWidth = 128;
  const blockHeight = 96;

  for (let row = 0; row < 6; row++) {
    const offsetY = row * blockHeight;
    const rowOffset = row % 2 === 0 ? 0 : blockWidth / 2;
    for (let col = -1; col < 5; col++) {
      const bx = col * blockWidth + rowOffset + (rand() - 0.5) * 20;
      const by = offsetY + (rand() - 0.5) * 15;
      const bw = blockWidth + (rand() - 0.5) * 30;
      const bh = blockHeight + (rand() - 0.5) * 20;

      const points: { x: number; y: number }[] = [];
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const radiusX = bw / 2 + (rand() - 0.5) * 15;
        const radiusY = bh / 2 + (rand() - 0.5) * 10;
        points.push({
          x: bx + bw / 2 + Math.cos(angle) * radiusX,
          y: by + bh / 2 + Math.sin(angle) * radiusY,
        });
      }
      stoneBlocks.push({ x: bx, y: by, w: bw, h: bh, points });
    }
  }

  for (const block of stoneBlocks) {
    const shade = 0.7 + rand() * 0.4;

    ctx.beginPath();
    ctx.moveTo(block.points[0].x, block.points[0].y);
    for (let i = 1; i < block.points.length; i++) {
      ctx.lineTo(block.points[i].x, block.points[i].y);
    }
    ctx.closePath();

    const r = Math.floor(baseR * shade + rand() * 20 - 10);
    const g = Math.floor(baseG * shade + rand() * 15 - 7);
    const b = Math.floor(baseB * shade + rand() * 25 - 12);
    ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
    ctx.fill();

    ctx.strokeStyle = `rgba(10, 5, 20, ${0.4 + rand() * 0.3})`;
    ctx.lineWidth = 2 + rand() * 2;
    ctx.stroke();

    if (rand() > 0.5) {
      const crackX = block.x + block.w * 0.3 + rand() * block.w * 0.4;
      const crackY = block.y + block.h * 0.2 + rand() * block.h * 0.6;
      ctx.strokeStyle = `rgba(5, 2, 10, ${0.3 + rand() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(crackX, crackY);
      let cx = crackX;
      let cy = crackY;
      for (let i = 0; i < 5; i++) {
        cx += (rand() - 0.5) * 15;
        cy += rand() * 10;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }

  for (let i = 0; i < 100; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const size = 1 + rand() * 4;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + rand() * 0.2})`;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function generateCeilingTexture(seed: number = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(seed);

  const baseR = 26;
  const baseG = 10;
  const baseB = 42;

  const imageData = ctx.createImageData(512, 512);
  const data = imageData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      const noise = (rand() - 0.5) * 30;
      data[idx] = Math.max(0, Math.min(255, baseR + noise));
      data[idx + 1] = Math.max(0, Math.min(255, baseG + noise));
      data[idx + 2] = Math.max(0, Math.min(255, baseB + noise));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const tileSize = 128;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const tx = col * tileSize + (rand() - 0.5) * 10;
      const ty = row * tileSize + (rand() - 0.5) * 10;
      const tw = tileSize - 4 + (rand() - 0.5) * 8;
      const th = tileSize - 4 + (rand() - 0.5) * 8;

      const shade = 0.85 + rand() * 0.25;
      const r = Math.floor(baseR * shade + rand() * 10 - 5);
      const g = Math.floor(baseG * shade + rand() * 8 - 4);
      const b = Math.floor(baseB * shade + rand() * 12 - 6);

      ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
      ctx.fillRect(tx, ty, tw, th);

      ctx.strokeStyle = `rgba(5, 2, 15, ${0.5 + rand() * 0.3})`;
      ctx.lineWidth = 2 + rand() * 2;
      ctx.strokeRect(tx, ty, tw, th);

      if (rand() > 0.6) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.15 + rand() * 0.2})`;
        ctx.beginPath();
        ctx.arc(tx + tw / 2, ty + th / 2, 10 + rand() * 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  for (let i = 0; i < 40; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const length = 20 + rand() * 60;
    const angle = rand() * Math.PI * 2;
    ctx.strokeStyle = `rgba(5, 2, 10, ${0.2 + rand() * 0.3})`;
    ctx.lineWidth = 1 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function createMaterial(color: number, roughness: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.1 });
}

function createTexturedMaterial(
  texture: THREE.Texture,
  roughness: number,
  repeatX: number,
  repeatY: number
): THREE.MeshStandardMaterial {
  const tex = texture.clone();
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness,
    metalness: 0.1,
  });
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function buildFloor(room: RoomData): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(room.width, FLOOR_THICKNESS, room.height);

  const seed = hashString(room.id + '_floor');
  const texture = generateBrickTexture(seed);

  const brickWorldSize = 1;
  const repeatX = room.width / brickWorldSize;
  const repeatY = room.height / brickWorldSize;

  const material = createTexturedMaterial(texture, 0.9, repeatX, repeatY);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(room.x + room.width / 2, -FLOOR_THICKNESS / 2, room.y + room.height / 2);
  mesh.receiveShadow = true;
  return mesh;
}

function buildCeiling(room: RoomData): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(room.width, CEILING_THICKNESS, room.height);

  const seed = hashString(room.id + '_ceiling');
  const texture = generateCeilingTexture(seed);

  const tileWorldSize = 2;
  const repeatX = room.width / tileWorldSize;
  const repeatY = room.height / tileWorldSize;

  const material = createTexturedMaterial(texture, 0.95, repeatX, repeatY);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    room.x + room.width / 2,
    WALL_HEIGHT + CEILING_THICKNESS / 2,
    room.y + room.height / 2
  );
  return mesh;
}

function buildWalls(room: RoomData): THREE.Mesh[] {
  const seed = hashString(room.id + '_wall');
  const texture = generateStoneTexture(seed);

  const stoneWorldSize = 2;
  const walls: THREE.Mesh[] = [];
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;
  const wy = WALL_HEIGHT / 2;

  const wallConfigs: [number, number, number, number, number, number, number][] = [
    [room.width, WALL_HEIGHT, 0.3, cx, room.y - 0.15, room.width / stoneWorldSize, WALL_HEIGHT / stoneWorldSize],
    [room.width, WALL_HEIGHT, 0.3, cx, room.y + room.height + 0.15, room.width / stoneWorldSize, WALL_HEIGHT / stoneWorldSize],
    [0.3, WALL_HEIGHT, room.height, room.x - 0.15, cz, room.height / stoneWorldSize, WALL_HEIGHT / stoneWorldSize],
    [0.3, WALL_HEIGHT, room.height, room.x + room.width + 0.15, cz, room.height / stoneWorldSize, WALL_HEIGHT / stoneWorldSize],
  ];

  for (const [w, h, d, x, z, repX, repY] of wallConfigs) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const wallTexture = texture.clone();
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(repX, repY);
    wallTexture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
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

  const dx = corridor.endX - corridor.startX;
  const dz = corridor.endY - corridor.startY;
  const length = Math.sqrt(dx * dx + dz * dz);
  const corridorWidth = 2;

  if (length === 0) return meshes;

  const angle = Math.atan2(dz, dx);
  const midX = (corridor.startX + corridor.endX) / 2;
  const midZ = (corridor.startY + corridor.endY) / 2;

  const seed = hashString(corridor.fromRoom + '_' + corridor.toRoom);

  const floorTexture = generateBrickTexture(seed + 1);
  const floorTex = floorTexture.clone();
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  const brickWorldSize = 1;
  floorTex.repeat.set(length / brickWorldSize, corridorWidth / brickWorldSize);
  floorTex.needsUpdate = true;
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.9,
    metalness: 0.1,
  });

  const floorGeo = new THREE.BoxGeometry(length, FLOOR_THICKNESS, corridorWidth);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(midX, -FLOOR_THICKNESS / 2, midZ);
  floor.rotation.y = -angle;
  floor.receiveShadow = true;
  meshes.push(floor);

  const ceilTexture = generateCeilingTexture(seed + 2);
  const ceilTex = ceilTexture.clone();
  ceilTex.wrapS = THREE.RepeatWrapping;
  ceilTex.wrapT = THREE.RepeatWrapping;
  const ceilTileSize = 2;
  ceilTex.repeat.set(length / ceilTileSize, corridorWidth / ceilTileSize);
  ceilTex.needsUpdate = true;
  const ceilMat = new THREE.MeshStandardMaterial({
    map: ceilTex,
    roughness: 0.95,
    metalness: 0.1,
  });

  const ceilGeo = new THREE.BoxGeometry(length, CEILING_THICKNESS, corridorWidth);
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.set(midX, WALL_HEIGHT + CEILING_THICKNESS / 2, midZ);
  ceil.rotation.y = -angle;
  meshes.push(ceil);

  const wallTexture = generateStoneTexture(seed + 3);
  const stoneWorldSize = 2;
  const halfW = corridorWidth / 2;
  const perpX = -Math.sin(angle);
  const perpZ = Math.cos(angle);

  for (const side of [-1, 1]) {
    const wallTex = wallTexture.clone();
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(length / stoneWorldSize, WALL_HEIGHT / stoneWorldSize);
    wallTex.needsUpdate = true;
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.1,
    });

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
