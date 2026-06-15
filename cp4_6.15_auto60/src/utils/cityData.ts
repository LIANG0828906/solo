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

      const baseX = gx * GRID_SIZE;
      const baseZ = gz * GRID_SIZE;
      const offsetX = (Math.random() - 0.5) * GRID_SIZE * 0.15;
      const offsetZ = (Math.random() - 0.5) * GRID_SIZE * 0.15;

      buildings.push({
        id: `bld_${gx}_${gz}`,
        position: new THREE.Vector3(baseX + offsetX, height / 2, baseZ + offsetZ),
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
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const tileCount = 20;
  const tileSize = canvas.width / tileCount;

  const streetInterval = 4;
  const parkLocations = [
    { gx: 5, gz: 5 }, { gx: -5, gz: 5 }, { gx: 5, gz: -5 }, { gx: -5, gz: -5 },
    { gx: 7, gz: 0 }, { gx: -7, gz: 0 }, { gx: 0, gz: 7 }, { gx: 0, gz: -7 },
  ];

  function isStreetTile(gx: number, gz: number): boolean {
    return (
      (gx % streetInterval === 0 && Math.abs(gz) > 0) ||
      (gz % streetInterval === 0 && Math.abs(gx) > 0)
    );
  }

  function isParkTile(gx: number, gz: number): boolean {
    return parkLocations.some((loc) => {
      return Math.abs(gx - loc.gx) < 2 && Math.abs(gz - loc.gz) < 2;
    });
  }

  for (let gx = 0; gx < tileCount; gx++) {
    for (let gz = 0; gz < tileCount; gz++) {
      const x = gx * tileSize;
      const y = gz * tileSize;
      const centeredGx = gx - tileCount / 2;
      const centeredGz = gz - tileCount / 2;

      let fillColor: string;

      if (isStreetTile(centeredGx, centeredGz)) {
        fillColor = '#1a1a24';
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, tileSize, tileSize);

        ctx.strokeStyle = '#252535';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, y + tileSize / 2);
        ctx.lineTo(x + tileSize, y + tileSize / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (isParkTile(centeredGx, centeredGz)) {
        fillColor = '#1e3a24';
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, tileSize, tileSize);

        ctx.fillStyle = '#2a5030';
        for (let i = 0; i < 5; i++) {
          const dotX = x + Math.random() * tileSize;
          const dotY = y + Math.random() * tileSize;
          const dotR = 2 + Math.random() * 4;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        fillColor = '#1e1e28';
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, tileSize, tileSize);

        ctx.fillStyle = '#242432';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }

      const uvX = (x + tileSize / 2) / canvas.width;
      const uvY = (y + tileSize / 2) / canvas.height;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  return texture;
}

export function computeGroundUV(
  position: THREE.Vector2,
  citySize: number
): THREE.Vector2 {
  const u = (position.x + citySize / 2) / citySize;
  const v = (position.y + citySize / 2) / citySize;
  return new THREE.Vector2(u, v);
}

export { FLOOR_HEIGHT, CITY_SIZE, GRID_SIZE };
