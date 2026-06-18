export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'shadow';

export interface Particle {
  id: number;
  type: ElementType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  birthTime: number;
  isSleeping: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export interface ElementCache {
  fire: number;
  water: number;
  wind: number;
  earth: number;
}

export interface LevelRequirement {
  fire: number;
  water: number;
  wind: number;
  earth: number;
}

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean;
}

export interface PortalState {
  isActive: boolean;
  activationProgress: number;
  currentLayer: number;
  totalLayers: number;
  layerAnimProgress: number;
  isFlashing: boolean;
}

export interface GameState {
  score: number;
  level: number;
  combo: number;
  comboMultiplier: number;
  isFailed: boolean;
  failFlashTime: number;
}

export interface CollectedElements {
  fire: number;
  water: number;
  wind: number;
  earth: number;
  shadow: number;
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#FF6B35',
  water: '#4ECDC4',
  wind: '#95E1D3',
  earth: '#F5A623',
  shadow: '#2C3E50'
};

export const MAX_PARTICLES = 40;
export const MAX_CACHE_PER_ELEMENT = 5;
export const TRAIL_LENGTH = 15;
export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 960;
export const HUD_HEIGHT = 60;
export const PORTAL_RADIUS = 80;
export const LAYER_ANIM_DURATION = 600;
