export interface PoseState {
  id: string;
  name: string;
  description: string;
  baseHeight: number;
  headRatio: number;
  shoulderRatio: number;
  waistCurve: number;
}

export interface ColorLayer {
  id: string;
  name: string;
  type: 'base' | 'pattern';
  color: string;
  opacity: number;
  patternType?: 'scroll' | 'cloud' | 'flame';
  position?: { x: number; y: number };
  scale?: number;
}

export interface GoldLeaf {
  id: string;
  area: number;
  positions: ('halo' | 'edge' | 'ribbon')[];
}

export interface FigureData {
  pose: PoseState;
  baseColor: string;
  colorLayers: ColorLayer[];
  goldLeaf: GoldLeaf;
  currentStep: number;
  isGilded: boolean;
}

export type StepName = 
  | 'selectClay'
  | 'kneadClay'
  | 'shapeFigure'
  | 'polish'
  | 'baseColor'
  | 'paintPattern'
  | 'applyGold';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
}

export interface ColorSwatch {
  name: string;
  value: string;
  category: string;
}

export interface PoseOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}
