export type ElementType = 'wood' | 'metal' | 'fire' | 'water' | 'earth';

export interface CalculusAttributes {
  hardness: number;
  sharpness: number;
  resonance: number;
  durability: number;
  flexibility: number;
}

export interface Calculus {
  id: string;
  element: ElementType;
  name: string;
  rotation: number;
  flipped: boolean;
  position?: { x: number; y: number; z: number };
  gridPosition?: { gridX: number; gridZ: number };
  attributes: CalculusAttributes;
}

export interface ArtifactAttributes {
  solidity: number;
  sharpness: number;
  temperament: number;
  durability: number;
  balance: number;
}

export interface ElementRelation {
  type: 'generates' | 'overcomes';
  from: ElementType;
  to: ElementType;
  effect: number;
}

export interface CombineRequest {
  calculi: Calculus[];
  gridPositions: Array<{ calculusId: string; gridX: number; gridZ: number }>;
}

export interface CombineResponse {
  artifactType: string;
  artifactName: string;
  attributes: ArtifactAttributes;
  relations: ElementRelation[];
  bonusEffects: string[];
}

export interface RatingRequest {
  artifact: CombineResponse;
  calculiCount: number;
  buildTime: number;
}

export interface RatingResponse {
  totalScore: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    attributeScore: number;
    harmonyScore: number;
    creativityScore: number;
    efficiencyScore: number;
  };
  record: {
    id: string;
    timestamp: number;
    artifactName: string;
    artifactType: string;
    attributes: ArtifactAttributes;
    totalScore: number;
    rank: string;
  };
}

export interface BuildLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'relation' | 'warning';
}

export interface ParticleEffect {
  id: string;
  type: 'generate' | 'overcome' | 'place';
  position: { x: number; y: number; z: number };
  color: string;
  createdAt: number;
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  wood: '#4a7c59',
  metal: '#c0c5ce',
  fire: '#c0392b',
  water: '#2c3e50',
  earth: '#d4a574',
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  wood: '木',
  metal: '金',
  fire: '火',
  water: '水',
  earth: '土',
};

export const GRID_SIZE = 5;
export const CELL_SIZE = 1.2;
