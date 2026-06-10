export interface Spice {
  id: string;
  name: string;
  nameCN: string;
  color: string;
  scentTags: string[];
  description: string;
  origin: string;
}

export interface MixedSpice {
  spiceId: string;
  amount: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
}

export interface SpiceState {
  spices: Spice[];
  mixture: MixedSpice[];
  scentDescription: string | null;
  scentReview: string | null;
  isDragging: boolean;
  draggedSpiceId: string | null;
  particles: Particle[];
  powderLayers: PowderLayer[];

  addSpice: (spiceId: string, amount?: number) => void;
  removeSpice: (spiceId: string) => void;
  clearMixture: () => void;
  generateScentReview: () => void;
  randomRecipe: () => void;
  startDrag: (spiceId: string) => void;
  endDrag: () => void;
  addParticle: (x: number, y: number, color: string) => void;
  removeParticle: (id: string) => void;
  addPowderLayer: (color: string, amount: number) => void;
}

export interface PowderLayer {
  id: string;
  color: string;
  amount: number;
  timestamp: number;
}
