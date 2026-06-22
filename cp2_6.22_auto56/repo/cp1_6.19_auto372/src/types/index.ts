export interface GradientNode {
  id: string;
  startColor: string;
  endColor: string;
  blendRatio: number;
  position: number;
}

export type GradientDirection =
  | { type: 'linear'; angle: number }
  | { type: 'radial'; position: 'center' | 'left top' }
  | { type: 'conic' };

export interface GradientPreset {
  name: string;
  nodes: Omit<GradientNode, 'id'>[];
}

export interface GradientState {
  nodes: GradientNode[];
  direction: GradientDirection;
  scrollProgress: number;
  currentCSS: string;
  activeRegion: number;
  isPanelOpen: boolean;
  setNodes: (nodes: GradientNode[]) => void;
  updateNode: (id: string, patch: Partial<GradientNode>) => void;
  setDirection: (dir: GradientDirection) => void;
  setScrollProgress: (p: number) => void;
  setCurrentCSS: (css: string) => void;
  setActiveRegion: (r: number) => void;
  loadPreset: (preset: GradientPreset) => void;
  randomize: () => void;
  togglePanel: () => void;
}
