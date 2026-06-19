import { Particle, TerrainMap, TerrainType, TERRAIN_CONFIG, PARTICLE_CONFIG } from '../types';

const GRAVITY = 0.15;
const SURFACE_TENSION = 0.98;
const GRID_SIZE = 10;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return rgbToHex(r, g, b);
}

export function calculateSlope(
  terrain: TerrainMap,
  x: number,
  y: number,
  width: number,
  height: number
): { dx: number; dy: number; magnitude: number } {
  const gridX = Math.floor(x / GRID_SIZE);
  const gridY = Math.floor(y / GRID_SIZE);
  
  const clampedX = Math.max(0, Math.min(gridX, width / GRID_SIZE - 1));
  const clampedY = Math.max(0, Math.min(gridY, height / GRID_SIZE - 1));
  
  const getHeight = (gx: number, gy: number): number => {
    const cx = Math.max(0, Math.min(gx, terrain[0]?.length - 1 || 0));
    const cy = Math.max(0, Math.min(gy, terrain.length - 1));
    return terrain[cy]?.[cx]?.height ?? 0.5;
  };
  
  const hL = getHeight(clampedX - 1, clampedY);
  const hR = getHeight(clampedX + 1, clampedY);
  const hU = getHeight(clampedX, clampedY - 1);
  const hD = getHeight(clampedX, clampedY + 1);
  
  const dx = (hR - hL) / 2;
  const dy = (hD - hU) / 2;
  
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  
  return { dx, dy, magnitude };
}

export function getTerrainAt(
  terrain: TerrainMap,
  x: number,
  y: number,
  width: number,
  height: number
): { type: TerrainType; permeability: number; height: number } | null {
  const gridX = Math.floor(x / GRID_SIZE);
  const gridY = Math.floor(y / GRID_SIZE);
  
  const clampedX = Math.max(0, Math.min(gridX, Math.floor(width / GRID_SIZE) - 1));
  const clampedY = Math.max(0, Math.min(gridY, Math.floor(height / GRID_SIZE) - 1));
  
  const cell = terrain[clampedY]?.[clampedX];
  if (!cell) return null;
  
  return {
    type: cell.type,
    permeability: cell.permeability,
    height: cell.height,
  };
}

export function checkInfiltration(
  particle: Particle,
  terrainPermeability: number,
  globalPermeability: number
): boolean {
  if (particle.isInfiltrated || particle.isEvaporating) return false;
  
  const effectivePermeability = terrainPermeability * globalPermeability;
  return Math.random() < effectivePermeability * 0.3;
}

export function checkEvaporation(
  particle: Particle,
  currentTime: number,
  evaporationRate: number
): boolean {
  if (particle.isEvaporating || particle.isInfiltrated) return false;
  if (currentTime - particle.lastEvaporationCheck < PARTICLE_CONFIG.evaporationInterval) return false;
  
  const probability = PARTICLE_CONFIG.evaporationBaseProbability * evaporationRate * 10;
  return Math.random() < probability;
}

export function applyGravity(particle: Particle): void {
  particle.vy += GRAVITY;
}

export function applySlopeForce(
  particle: Particle,
  slope: { dx: number; dy: number; magnitude: number }
): void {
  const slopeForce = 0.5;
  particle.vx += slope.dx * slopeForce;
  particle.vy += slope.dy * slopeForce;
}

export function applySurfaceTension(particle: Particle): void {
  particle.vx *= SURFACE_TENSION;
  particle.vy *= SURFACE_TENSION;
}

export function clampSpeed(particle: Particle): void {
  const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
  const minSpeed = PARTICLE_CONFIG.minSpeed;
  const maxSpeed = PARTICLE_CONFIG.maxSpeed;
  
  if (speed > maxSpeed) {
    const ratio = maxSpeed / speed;
    particle.vx *= ratio;
    particle.vy *= ratio;
  } else if (speed < minSpeed && speed > 0) {
    const ratio = minSpeed / speed;
    particle.vx *= ratio;
    particle.vy *= ratio;
  }
}

export function updateParticlePosition(
  particle: Particle,
  canvasWidth: number,
  canvasHeight: number
): void {
  particle.x += particle.vx;
  particle.y += particle.vy;
  
  if (particle.x < 0) {
    particle.x = 0;
    particle.vx *= -0.5;
  }
  if (particle.x > canvasWidth) {
    particle.x = canvasWidth;
    particle.vx *= -0.5;
  }
  if (particle.y < 0) {
    particle.y = 0;
    particle.vy *= -0.5;
  }
  if (particle.y > canvasHeight) {
    particle.y = canvasHeight;
    particle.vy *= -0.5;
  }
}

export function updateParticlePhysics(
  particle: Particle,
  terrain: TerrainMap,
  globalPermeability: number,
  evaporationRate: number,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): { infiltrated: boolean; evaporated: boolean } {
  let infiltrated = false;
  let evaporated = false;
  
  if (particle.isEvaporating) {
    particle.vy = -1;
    particle.vx += (Math.random() - 0.5) * 0.5;
    particle.opacity -= 0.02;
    particle.color = lerpColor(particle.color, PARTICLE_CONFIG.evaporatedColor, 0.1);
    
    if (particle.opacity <= 0) {
      evaporated = true;
    }
    
    updateParticlePosition(particle, canvasWidth, canvasHeight);
    return { infiltrated, evaporated };
  }
  
  if (particle.isInfiltrated) {
    particle.opacity -= 0.01;
    if (particle.opacity <= 0) {
      infiltrated = true;
    }
    return { infiltrated, evaporated };
  }
  
  const terrainInfo = getTerrainAt(terrain, particle.x, particle.y, canvasWidth, canvasHeight);
  if (terrainInfo) {
    particle.terrainType = terrainInfo.type;
    
    if (checkInfiltration(particle, terrainInfo.permeability, globalPermeability)) {
      particle.isInfiltrated = true;
      particle.diameter = PARTICLE_CONFIG.infiltratedDiameter;
      particle.color = PARTICLE_CONFIG.infiltratedColor;
      particle.vx = 0;
      particle.vy = 0;
      return { infiltrated: false, evaporated: false };
    }
    
    if (checkEvaporation(particle, currentTime, evaporationRate)) {
      particle.isEvaporating = true;
      particle.lastEvaporationCheck = currentTime;
      return { infiltrated: false, evaporated: false };
    }
    
    const slope = calculateSlope(terrain, particle.x, particle.y, canvasWidth, canvasHeight);
    applySlopeForce(particle, slope);
  }
  
  applyGravity(particle);
  applySurfaceTension(particle);
  clampSpeed(particle);
  updateParticlePosition(particle, canvasWidth, canvasHeight);
  
  particle.trail.push({
    x: particle.x,
    y: particle.y,
    width: PARTICLE_CONFIG.trailWidth * (particle.diameter / PARTICLE_CONFIG.initialDiameter),
  });
  
  if (particle.trail.length > PARTICLE_CONFIG.maxTrailLength) {
    particle.trail.shift();
  }
  
  particle.lastEvaporationCheck = currentTime;
  
  return { infiltrated, evaporated };
}

export function createParticle(
  id: number,
  x: number,
  y: number,
  currentTime: number
): Particle {
  return {
    id,
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: Math.random() * 2 + 1,
    diameter: PARTICLE_CONFIG.initialDiameter,
    color: PARTICLE_CONFIG.initialColor,
    opacity: PARTICLE_CONFIG.initialOpacity,
    isEvaporating: false,
    isInfiltrated: false,
    terrainType: null,
    trail: [],
    createdAt: currentTime,
    lastEvaporationCheck: currentTime,
  };
}

export function generateRainParticles(
  startId: number,
  count: number,
  canvasWidth: number,
  currentTime: number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvasWidth;
    const y = -10 - Math.random() * 50;
    particles.push(createParticle(startId + i, x, y, currentTime));
  }
  return particles;
}

export function initializeTerrain(width: number, height: number): TerrainMap {
  const cols = Math.ceil(width / GRID_SIZE);
  const rows = Math.ceil(height / GRID_SIZE);
  
  const terrain: TerrainMap = [];
  
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      row.push({
        type: 'plain' as TerrainType,
        height: TERRAIN_CONFIG.plain.height,
        permeability: TERRAIN_CONFIG.plain.permeability,
      });
    }
    terrain.push(row);
  }
  
  return terrain;
}

export function drawTerrain(
  terrain: TerrainMap,
  x: number,
  y: number,
  type: TerrainType,
  brushSize: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  const config = TERRAIN_CONFIG[type];
  const radius = brushSize / GRID_SIZE;
  
  const centerGridX = Math.floor(x / GRID_SIZE);
  const centerGridY = Math.floor(y / GRID_SIZE);
  
  const cols = Math.ceil(canvasWidth / GRID_SIZE);
  const rows = Math.ceil(canvasHeight / GRID_SIZE);
  
  for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy++) {
    for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const gx = centerGridX + dx;
        const gy = centerGridY + dy;
        
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
          const fadeFactor = 1 - dist / radius;
          terrain[gy][gx] = {
            type,
            height: config.height * fadeFactor + terrain[gy][gx].height * (1 - fadeFactor),
            permeability: config.permeability * fadeFactor + terrain[gy][gx].permeability * (1 - fadeFactor),
          };
        }
      }
    }
  }
}
