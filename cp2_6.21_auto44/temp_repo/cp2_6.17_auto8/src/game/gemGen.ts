import { v4 as uuidv4 } from 'uuid';

export type GemColor = 'red' | 'blue' | 'green' | 'purple';
export type GemShape = 'diamond' | 'hexagon' | 'octagon' | 'triangle';

export interface Gem {
  id: string;
  color: GemColor;
  shape: GemShape;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  gridX?: number;
  gridY?: number;
  scale: number;
  targetScale: number;
  rotation: number;
  opacity: number;
  isDragging: boolean;
  isFlashing: boolean;
  flashPhase: number;
  isFading: boolean;
  isBouncing: boolean;
  bounceOriginX: number;
  bounceOriginY: number;
  bounceProgress: number;
  animationProgress: number;
  falling: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
}

export const GEM_COLORS: Record<GemColor, string> = {
  red: '#FF4444',
  blue: '#4488FF',
  green: '#44CC44',
  purple: '#AA44FF'
};

export const GEM_COLORS_GLOW: Record<GemColor, string> = {
  red: 'rgba(255, 68, 68, 0.4)',
  blue: 'rgba(68, 136, 255, 0.4)',
  green: 'rgba(68, 204, 68, 0.4)',
  purple: 'rgba(170, 68, 255, 0.4)'
};

const COLORS: GemColor[] = ['red', 'blue', 'green', 'purple'];
const SHAPES: GemShape[] = ['diamond', 'hexagon', 'octagon', 'triangle'];

export function createGem(x: number, y: number): Gem {
  return {
    id: uuidv4(),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    x,
    y,
    targetX: x,
    targetY: y,
    scale: 1,
    targetScale: 1,
    rotation: 0,
    opacity: 1,
    isDragging: false,
    isFlashing: false,
    flashPhase: 0,
    isFading: false,
    isBouncing: false,
    bounceOriginX: x,
    bounceOriginY: y,
    bounceProgress: 0,
    animationProgress: 0,
    falling: false
  };
}

export function createParticles(x: number, y: number, color: string, count: number = 8): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 100 + Math.random() * 150;
    particles.push({
      id: uuidv4(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 50,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 10,
      size: 4 + Math.random() * 6,
      opacity: 1
    });
  }
  return particles;
}

export function getGemShapePath(shape: GemShape, size: number): Path2D {
  const path = new Path2D();
  const half = size / 2;
  
  switch (shape) {
    case 'diamond':
      path.moveTo(0, -half);
      path.lineTo(half, 0);
      path.lineTo(0, half);
      path.lineTo(-half, 0);
      path.closePath();
      break;
      
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * half;
        const py = Math.sin(angle) * half;
        if (i === 0) path.moveTo(px, py);
        else path.lineTo(px, py);
      }
      path.closePath();
      break;
      
    case 'octagon':
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
        const px = Math.cos(angle) * half;
        const py = Math.sin(angle) * half;
        if (i === 0) path.moveTo(px, py);
        else path.lineTo(px, py);
      }
      path.closePath();
      break;
      
    case 'triangle':
      path.moveTo(0, -half);
      path.lineTo(half * 0.866, half * 0.5);
      path.lineTo(-half * 0.866, half * 0.5);
      path.closePath();
      break;
  }
  
  return path;
}

export interface DragState {
  isDragging: boolean;
  draggedGem: Gem | null;
  offsetX: number;
  offsetY: number;
  mouseX: number;
  mouseY: number;
}

export function createDragState(): DragState {
  return {
    isDragging: false,
    draggedGem: null,
    offsetX: 0,
    offsetY: 0,
    mouseX: 0,
    mouseY: 0
  };
}

export function handleGemPickup(
  gem: Gem,
  dragState: DragState,
  mouseX: number,
  mouseY: number,
  gemSize: number
): boolean {
  const dx = gem.x - mouseX;
  const dy = gem.y - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < gemSize / 2 + 10) {
    dragState.isDragging = true;
    dragState.draggedGem = gem;
    dragState.offsetX = dx;
    dragState.offsetY = dy;
    dragState.mouseX = mouseX;
    dragState.mouseY = mouseY;
    gem.isDragging = true;
    gem.targetScale = 1.1;
    return true;
  }
  return false;
}

export function handleGemDrag(dragState: DragState, mouseX: number, mouseY: number): void {
  if (dragState.isDragging && dragState.draggedGem) {
    dragState.mouseX = mouseX;
    dragState.mouseY = mouseY;
    dragState.draggedGem.x = mouseX + dragState.offsetX;
    dragState.draggedGem.y = mouseY + dragState.offsetY;
  }
}

export function handleGemRelease(
  dragState: DragState,
  gridX: number,
  gridY: number,
  cellSize: number,
  gridOffsetX: number,
  gridOffsetY: number
): { success: boolean; gridCol: number; gridRow: number } {
  if (!dragState.isDragging || !dragState.draggedGem) {
    return { success: false, gridCol: -1, gridRow: -1 };
  }
  
  const gem = dragState.draggedGem;
  const mouseX = dragState.mouseX;
  const mouseY = dragState.mouseY;
  
  const col = Math.floor((mouseX - gridOffsetX) / cellSize);
  const row = Math.floor((mouseY - gridOffsetY) / cellSize);
  
  const inGrid = col >= 0 && col < gridX && row >= 0 && row < gridY;
  
  gem.isDragging = false;
  gem.targetScale = 1;
  
  dragState.isDragging = false;
  dragState.draggedGem = null;
  
  return { success: inGrid, gridCol: col, gridRow: row };
}

export function startBounceAnimation(gem: Gem, originX: number, originY: number): void {
  gem.isBouncing = true;
  gem.bounceOriginX = originX;
  gem.bounceOriginY = originY;
  gem.bounceProgress = 0;
}

export function updateGemAnimation(gem: Gem, dt: number): void {
  const lerpFactor = 1 - Math.exp(-dt * 10);
  
  gem.x += (gem.targetX - gem.x) * lerpFactor;
  gem.y += (gem.targetY - gem.y) * lerpFactor;
  gem.scale += (gem.targetScale - gem.scale) * lerpFactor;
  
  if (gem.isBouncing) {
    gem.bounceProgress += dt * 5;
    const bounce = Math.sin(gem.bounceProgress * Math.PI) * 0.3;
    const shake = Math.sin(gem.bounceProgress * 20) * 3;
    
    gem.x = gem.bounceOriginX + shake;
    gem.y = gem.bounceOriginY - bounce * 30;
    
    if (gem.bounceProgress >= 1) {
      gem.isBouncing = false;
      gem.x = gem.bounceOriginX;
      gem.y = gem.bounceOriginY;
    }
  }
  
  if (gem.isFlashing) {
    gem.flashPhase += dt * 10;
    if (gem.flashPhase >= 3) {
      gem.isFlashing = false;
      gem.flashPhase = 0;
    }
  }
  
  if (gem.isFading) {
    gem.animationProgress += dt * 2.5;
    gem.opacity = Math.max(0, 1 - gem.animationProgress);
    gem.scale = Math.max(0, 1 - gem.animationProgress * 0.5);
  }
}

export function updateParticle(particle: Particle, dt: number): void {
  particle.vy += 300 * dt;
  particle.x += particle.vx * dt;
  particle.y += particle.vy * dt;
  particle.rotation += particle.rotationSpeed * dt;
  particle.opacity = Math.max(0, particle.opacity - dt * 2);
}

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
