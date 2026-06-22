export type Era = 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'future';

export type ClothStatus = 'inventory' | 'sewn' | 'selected';

export type PuzzleType = 'symbol-match' | 'sequence-click';

export interface ClothPiece {
  id: string;
  title: string;
  story: string;
  era: Era;
  eraLabel: string;
  correctOrder: number;
  status: ClothStatus;
  color: string;
  pattern: string;
  createdAt: number;
}

export interface PuzzleState {
  isActive: boolean;
  type: PuzzleType;
  clothId: string | null;
  attempts: number;
}

export interface GameState {
  clothPieces: ClothPiece[];
  sewnOrder: string[];
  currentEra: Era;
  puzzle: PuzzleState;
  collection: Record<Era, string[]>;
  isComplete: boolean;
  showCollection: boolean;
  selectedCloth: ClothPiece | null;
  particles: ParticleData[];
  feedback: FeedbackState;
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  color: string;
  type: 'petal' | 'star';
  createdAt: number;
}

export interface FeedbackState {
  type: 'success' | 'error' | null;
  clothId: string | null;
  timestamp: number;
}

export interface GameActions {
  generateClothPiece: () => void;
  selectCloth: (cloth: ClothPiece | null) => void;
  attemptSew: (clothId: string, targetOrder: number) => boolean;
  triggerPuzzle: (clothId: string) => void;
  solvePuzzle: (success: boolean) => void;
  toggleCollection: () => void;
  exportImage: () => Promise<void>;
  resetGame: () => void;
  addParticles: (x: number, y: number) => void;
  clearParticles: () => void;
  setFeedback: (type: 'success' | 'error' | null, clothId: string | null) => void;
}

export const ERA_LABELS: Record<Era, string> = {
  ancient: '远古时代',
  medieval: '中世纪',
  renaissance: '文艺复兴',
  industrial: '工业时代',
  modern: '现代',
  future: '未来'
};

export const ERA_COLORS: Record<Era, string> = {
  ancient: '#8B4513',
  medieval: '#4a3b2c',
  renaissance: '#b87333',
  industrial: '#696969',
  modern: '#2a6f97',
  future: '#9370DB'
};

export const PATTERNS = ['条纹', '波点', '花纹', '几何', '刺绣', '渐变'];
