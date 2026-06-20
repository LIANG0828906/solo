import type { WildPet, GameState, Particle } from './types';
import { createWildPet } from './gameLogic';

const TILE_SIZE = 32;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const GRASS_TINT = '#6ab04c';
const GRASS_DARK = '#5a9c3e';
const TREE_COLOR = '#2d5016';
const TREE_TRUNK = '#5c3317';
const PATH_COLOR = '#d4a574';

export interface MapState {
  grassTufts: { x: number; y: number; width: number; height: number; hasPet: boolean; respawnTimer: number }[];
  wildPets: WildPet[];
  trees: { x: number; y: number; size: number }[];
  paths: { x: number; y: number; width: number; height: number }[];
  hoveredPet: WildPet | null;
  showTooltip: boolean;
  tooltipX: number;
  tooltipY: number;
  particles: Particle[];
}

export function createMapState(): MapState {
  const state: MapState = {
    grassTufts: [],
    wildPets: [],
    trees: [],
    paths: [],
    hoveredPet: null,
    showTooltip: false,
    tooltipX: 0,
    tooltipY: 0,
    particles: [],
  };
  
  for (let i = 0; i < 12; i++) {
    state.trees.push({
      x: Math.random() * (MAP_WIDTH - 100) + 50,
      y: Math.random() * (MAP_HEIGHT - 100) + 50,
      size: Math.random() * 20 + 30,
    });
  }
  
  state.paths.push({ x: 0, y: 280, width: MAP_WIDTH, height: 40 });
  state.paths.push({ x: 380, y: 0, width: 40, height: MAP_HEIGHT });
  
  for (let i = 0; i < 15; i++) {
    let x, y;
    let valid = false;
    let attempts = 0;
    
    while (!valid && attempts < 50) {
      x = Math.random() * (MAP_WIDTH - 100) + 50;
      y = Math.random() * (MAP_HEIGHT - 100) + 50;
      valid = true;
      
      for (const path of state.paths) {
        if (x > path.x - 30 && x < path.x + path.width + 30 &&
            y > path.y - 30 && y < path.y + path.height + 30) {
          valid = false;
          break;
        }
      }
      attempts++;
    }
    
    if (valid) {
      state.grassTufts.push({
        x: x!,
        y: y!,
        width: Math.random() * 30 + 25,
        height: Math.random() * 20 + 15,
        hasPet: false,
        respawnTimer: 0,
      });
    }
  }
  
  return state;
}

export function spawnWildPetInGrass(state: MapState): void {
  const emptyGrass = state.grassTufts.filter(g => !g.hasPet && g.respawnTimer <= 0);
  if (emptyGrass.length === 0 || state.wildPets.length >= 5) return;
  
  const grass = emptyGrass[Math.floor(Math.random() * emptyGrass.length)];
  const pet = createWildPet();
  pet.x = grass.x;
  pet.y = grass.y;
  pet.moveTargetX = grass.x;
  pet.moveTargetY = grass.y;
  grass.hasPet = true;
  
  state.wildPets.push(pet);
}

export function updateMap(state: MapState, deltaTime: number): void {
  for (const grass of state.grassTufts) {
    if (grass.respawnTimer > 0) {
      grass.respawnTimer -= deltaTime;
      if (grass.respawnTimer <= 0) {
        grass.respawnTimer = 0;
      }
    }
  }
  
  if (Math.random() < deltaTime * 0.1) {
    spawnWildPetInGrass(state);
  }
  
  for (const pet of state.wildPets) {
    pet.wanderTimer -= deltaTime;
    
    if (pet.wanderTimer <= 0) {
      pet.wanderTimer = Math.random() * 3 + 1;
      
      if (Math.random() < 0.6) {
        const nearbyGrass = state.grassTufts.find(g => 
          Math.abs(g.x - pet.x) < 100 && Math.abs(g.y - pet.y) < 100
        );
        
        if (nearbyGrass) {
          pet.moveTargetX = nearbyGrass.x + (Math.random() - 0.5) * 20;
          pet.moveTargetY = nearbyGrass.y + (Math.random() - 0.5) * 20;
        } else {
          pet.moveTargetX = pet.x + (Math.random() - 0.5) * 80;
          pet.moveTargetY = pet.y + (Math.random() - 0.5) * 80;
        }
        
        pet.moveTargetX = Math.max(30, Math.min(MAP_WIDTH - 30, pet.moveTargetX));
        pet.moveTargetY = Math.max(30, Math.min(MAP_HEIGHT - 30, pet.moveTargetY));
        pet.isMoving = true;
        
        if (pet.moveTargetX > pet.x) {
          pet.direction = 1;
        } else if (pet.moveTargetX < pet.x) {
          pet.direction = -1;
        }
      }
    }
    
    if (pet.isMoving) {
      const dx = pet.moveTargetX - pet.x;
      const dy = pet.moveTargetY - pet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 2) {
        pet.isMoving = false;
        pet.x = pet.moveTargetX;
        pet.y = pet.moveTargetY;
      } else {
        pet.x += (dx / dist) * pet.moveSpeed;
        pet.y += (dy / dist) * pet.moveSpeed;
        
        pet.walkTimer -= deltaTime * 1000;
        if (pet.walkTimer <= 0) {
          pet.walkTimer = 100;
          pet.walkFrame = (pet.walkFrame + 1) % 4;
        }
      }
    }
  }
  
  state.particles = state.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - 1,
    }))
    .filter(p => p.life > 0);
}

export function drawMap(ctx: CanvasRenderingContext2D, state: MapState, scale: number = 1): void {
  ctx.save();
  ctx.scale(scale, scale);
  
  ctx.fillStyle = GRASS_TINT;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  
  ctx.fillStyle = GRASS_DARK;
  for (let y = 0; y < MAP_HEIGHT; y += 16) {
    for (let x = 0; x < MAP_WIDTH; x += 16) {
      if ((x / 16 + y / 16) % 2 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }
  
  ctx.fillStyle = PATH_COLOR;
  for (const path of state.paths) {
    ctx.fillRect(path.x, path.y, path.width, path.height);
    
    ctx.fillStyle = '#c49a6c';
    for (let i = 0; i < path.width; i += 8) {
      ctx.fillRect(path.x + i, path.y + path.height - 2, 4, 2);
    }
    ctx.fillStyle = PATH_COLOR;
  }
  
  for (const grass of state.grassTufts) {
    drawGrassTuft(ctx, grass.x, grass.y, grass.width, grass.height);
  }
  
  for (const tree of state.trees) {
    drawTree(ctx, tree.x, tree.y, tree.size);
  }
  
  for (const pet of state.wildPets) {
    drawPet(ctx, pet);
  }
  
  for (const p of state.particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  
  ctx.restore();
}

function drawGrassTuft(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#4a8c34';
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#5a9c3e';
  for (let i = 0; i < 8; i++) {
    const gx = x + (Math.random() - 0.5) * w * 0.8;
    const gy = y + (Math.random() - 0.5) * h * 0.8;
    ctx.fillRect(gx, gy - 6, 2, 6);
    ctx.fillRect(gx + 2, gy - 4, 2, 4);
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillStyle = TREE_TRUNK;
  ctx.fillRect(x - 6, y, 12, size * 0.6);
  
  ctx.fillStyle = TREE_COLOR;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#3d6b1f';
  ctx.beginPath();
  ctx.arc(x - size * 0.2, y - size * 0.3, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(x + size * 0.15, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPet(ctx: CanvasRenderingContext2D, pet: WildPet): void {
  const pixelSize = 2;
  const bobOffset = pet.isMoving ? Math.sin(pet.walkFrame * Math.PI / 2) * 2 : 0;
  
  ctx.save();
  ctx.translate(pet.x, pet.y - 16 + bobOffset);
  
  if (pet.direction === -1) {
    ctx.scale(-1, 1);
  }
  
  const sprite = pet.spriteData;
  const offsetX = -16;
  const offsetY = -16;
  
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = sprite[y][x];
      if (color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(
          offsetX + x * pixelSize,
          offsetY + y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
  
  ctx.restore();
}

export function getPetAtPosition(state: MapState, x: number, y: number): WildPet | null {
  for (let i = state.wildPets.length - 1; i >= 0; i--) {
    const pet = state.wildPets[i];
    const dx = x - pet.x;
    const dy = y - pet.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      return pet;
    }
  }
  return null;
}

export function getGrassAtPosition(state: MapState, x: number, y: number): typeof state.grassTufts[0] | null {
  for (const grass of state.grassTufts) {
    const dx = x - grass.x;
    const dy = y - grass.y;
    if (Math.abs(dx) < grass.width / 2 && Math.abs(dy) < grass.height / 2) {
      return grass;
    }
  }
  return null;
}

export function removeWildPet(state: MapState, pet: WildPet): void {
  const index = state.wildPets.findIndex(p => p.id === pet.id);
  if (index !== -1) {
    state.wildPets.splice(index, 1);
  }
  
  for (const grass of state.grassTufts) {
    if (Math.abs(grass.x - pet.x) < 30 && Math.abs(grass.y - pet.y) < 30) {
      grass.hasPet = false;
      grass.respawnTimer = 10;
      break;
    }
  }
}

export function drawTooltip(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, scale: number = 1): void {
  ctx.save();
  ctx.scale(scale, scale);
  
  ctx.font = '12px "Courier New", monospace';
  const metrics = ctx.measureText(text);
  const width = metrics.width + 12;
  const height = 20;
  
  let tooltipX = x + 10;
  let tooltipY = y - 30;
  
  if (tooltipX + width > MAP_WIDTH) {
    tooltipX = x - width - 10;
  }
  if (tooltipY < 0) {
    tooltipY = y + 10;
  }
  
  ctx.fillStyle = 'white';
  ctx.fillRect(tooltipX, tooltipY, width, height);
  
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.strokeRect(tooltipX, tooltipY, width, height);
  
  ctx.fillStyle = 'black';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, tooltipX + 6, tooltipY + height / 2);
  
  ctx.restore();
}
