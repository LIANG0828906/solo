import * as THREE from 'three';

export type BuildingZoneType = 'residential' | 'commercial' | 'office' | 'park' | 'street';

export interface BuildingData {
  id: string;
  position: THREE.Vector3;
  size: THREE.Vector3;
  floors: number;
  zoneType: BuildingZoneType;
}

export interface GroundTile {
  position: THREE.Vector2;
  type: 'street' | 'park' | 'plaza';
}

const CITY_SIZE = 100;
const GRID_SIZE = 5;
const CELL_COUNT = CITY_SIZE / GRID_SIZE;
const FLOOR_HEIGHT = 3;

const STREET_PATTERN = [
  [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1],
  [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0],
  [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1],
];

function getZoneType(gridX: number, gridZ: number): BuildingZoneType {
  const distFromCenter = Math.sqrt(gridX * gridX + gridZ * gridZ);

  if (distFromCenter < 3) return 'office';
  if (distFromCenter < 5) {
    return Math.random() > 0.4 ? 'office' : 'commercial';
  }
  if (distFromCenter < 7) {
    const r = Math.random();
    if (r < 0.3) return 'commercial';
    if (r < 0.6) return 'residential';
    return 'office';
  }
  return 'residential';
}

function getFloors(zoneType: BuildingZoneType, distFromCenter: number): number {
  const baseFloors: Record<BuildingZoneType, number> = {
    residential: 5,
    commercial: 8,
    office: 20,
    park: 0,
    street: 0,
  };

  const base = baseFloors[zoneType];
  const centerBonus = Math.max(0, 10 - distFromCenter) * 0.8;
  const variation = Math.random() * base * 0.6;
  return Math.max(1, Math.floor(base + centerBonus + variation));
}

function isStreet(gridX: number, gridZ: number): boolean {
  const streetInterval = 4;
  return (
    (gridX % streetInterval === 0 && Math.abs(gridZ) > 0) ||
    (gridZ % streetInterval === 0 && Math.abs(gridX) > 0)
  );
}

function isPark(gridX: number, gridZ: number): boolean {
  const parkLocations = [
    [5, 5], [-5, 5], [5, -5], [-5, -5],
    [7, 0], [-7, 0], [0, 7], [0, -7],
  ];
  return parkLocations.some(([px, pz]) => {
    return Math.abs(gridX - px) < 2 && Math.abs(gridZ - pz) < 2;
  });
}

export function generateBuildings(): BuildingData[] {
  const buildings: BuildingData[] = [];
  const halfCells = Math.floor(CELL_COUNT / 2);

  for (let gx = -halfCells; gx <= halfCells; gx++) {
    for (let gz = -halfCells; gz <= halfCells; gz++) {
      if (isStreet(gx, gz)) continue;
      if (isPark(gx, gz)) continue;

      const distFromCenter = Math.sqrt(gx * gx + gz * gz);
      const zoneType = getZoneType(gx, gz);
      const floors = getFloors(zoneType, distFromCenter);

      if (floors < 1) continue;

      const height = floors * FLOOR_HEIGHT;
      const width = GRID_SIZE * (0.7 + Math.random() * 0.25);
      const depth = GRID_SIZE * (0.7 + Math.random() * 0.25);

      const x = gx * GRID_SIZE + (Math.random() - 0.5) * GRID_SIZE * 0.15;
      const z = gz * GRID_SIZE + (Math.random() - 0.5) * GRID_SIZE * 0.15;

      buildings.push({
        id: `bld_${gx}_${gz}`,
        position: new THREE.Vector3(x, height / 2, z),
        size: new THREE.Vector3(width, height, depth),
        floors,
        zoneType,
      });
    }
  }

  return buildings;
}

export function generateGroundTiles(): GroundTile[] {
  const tiles: GroundTile[] = [];
  const halfCells = Math.floor(CELL_COUNT / 2);

  for (let gx = -halfCells; gx <= halfCells; gx++) {
    for (let gz = -halfCells; gz <= halfCells; gz++) {
      let type: GroundTile['type'] = 'street';

      if (isPark(gx, gz)) {
        type = 'park';
      } else if (!isStreet(gx, gz)) {
        type = 'plaza';
      }

      tiles.push({
        position: new THREE.Vector2(gx * GRID_SIZE, gz * GRID_SIZE),
        type,
      });
    }
  }

  return tiles;
}

export function createGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1e28';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.fillStyle = '#233a28';
  for (let i = 0; i < 8; i++) {
    const x = 32 + Math.random() * 400;
    const y = 32 + Math.random() * 400;
    const w = 40 + Math.random() * 60;
    const h = 40 + Math.random() * 60;
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  return texture;
}

export { FLOOR_HEIGHT, CITY_SIZE, GRID_SIZE };
