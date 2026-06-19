import {
  TILE_SIZE,
  GRID_SIZE,
  TORCH_RADIUS,
  LANTERN_RADIUS,
  type Position,
  type Torch,
  type LightingData,
  type LightZoneType
} from '../types';

const TEXTURE_SIZE = 2048;

let cachedLightTexture: HTMLCanvasElement | null = null;

function generateLightTexture(): HTMLCanvasElement {
  if (cachedLightTexture) return cachedLightTexture;
  
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  const centerX = TEXTURE_SIZE / 2;
  const centerY = TEXTURE_SIZE / 2;
  const radius = TEXTURE_SIZE / 2;
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  
  cachedLightTexture = canvas;
  return canvas;
}

export function precomputeLightTexture(): void {
  if (typeof window !== 'undefined') {
    generateLightTexture();
  }
}

export function getLightTexture(): HTMLCanvasElement {
  return generateLightTexture();
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function tileCenter(x: number, y: number): Position {
  return {
    x: x * TILE_SIZE + TILE_SIZE / 2,
    y: y * TILE_SIZE + TILE_SIZE / 2
  };
}

export function calculateLighting(
  torches: Torch[],
  playerPosition: Position,
  hasLantern: boolean
): LightingData {
  const gridLight: number[][] = [];
  const lightZones: LightZoneType[][] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    gridLight[y] = [];
    lightZones[y] = [];
    
    for (let x = 0; x < GRID_SIZE; x++) {
      const center = tileCenter(x, y);
      let totalIntensity = 0;
      
      for (const torch of torches) {
        const dist = distance(center.x, center.y, torch.position.x, torch.position.y);
        if (dist < torch.radius) {
          const normalized = 1 - dist / torch.radius;
          const intensity = normalized * normalized * (3 - 2 * normalized);
          totalIntensity = Math.max(totalIntensity, intensity);
        }
      }
      
      if (hasLantern) {
        const playerCenter = tileCenter(playerPosition.x, playerPosition.y);
        const dist = distance(center.x, center.y, playerCenter.x, playerCenter.y);
        if (dist < LANTERN_RADIUS) {
          const normalized = 1 - dist / LANTERN_RADIUS;
          const intensity = normalized * normalized * (3 - 2 * normalized);
          totalIntensity = Math.max(totalIntensity, intensity * 0.9);
        }
      }
      
      totalIntensity = Math.min(1, totalIntensity);
      gridLight[y][x] = totalIntensity;
      
      if (totalIntensity > 0.6) {
        lightZones[y][x] = 'bright';
      } else if (totalIntensity > 0.3) {
        lightZones[y][x] = 'dim';
      } else {
        lightZones[y][x] = 'dark';
      }
    }
  }
  
  return { gridLight, lightZones };
}

export function getLightIntensityAt(
  lighting: LightingData,
  position: Position
): number {
  if (position.x < 0 || position.x >= GRID_SIZE || position.y < 0 || position.y >= GRID_SIZE) {
    return 0;
  }
  return lighting.gridLight[position.y][position.x];
}

export function getLightZoneAt(
  lighting: LightingData,
  position: Position
): LightZoneType {
  if (position.x < 0 || position.x >= GRID_SIZE || position.y < 0 || position.y >= GRID_SIZE) {
    return 'dark';
  }
  return lighting.lightZones[position.y][position.x];
}
