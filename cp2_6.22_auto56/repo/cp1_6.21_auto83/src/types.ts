export type BaseType = 'A' | 'T' | 'G' | 'C';

export interface BasePair {
  id: number;
  typeA: BaseType;
  typeB: BaseType;
  index: number;
}

export interface NodePosition {
  x: number;
  y: number;
  z: number;
}

export interface HelixNode {
  id: number;
  strand: 0 | 1;
  position: NodePosition;
  baseType?: BaseType;
  index: number;
}

export enum AnimationState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  DISASSEMBLING = 'disassembling',
  REASSEMBLING = 'reassembling',
  DISASSEMBLED = 'disassembled'
}

export enum PlaybackSpeed {
  HALF = 0.5,
  NORMAL = 1,
  DOUBLE = 2
}

export interface HighlightInfo {
  baseType?: BaseType;
  baseName?: string;
  duration: number;
}

export interface SelectedBaseInfo {
  type: BaseType;
  pairType: BaseType;
  position: NodePosition;
  index: number;
}

export const BASE_COLORS: Record<BaseType, string> = {
  A: '#FF6B6B',
  T: '#4ECDC4',
  G: '#FFE66D',
  C: '#95E1D3'
};

export const BASE_NAMES: Record<BaseType, string> = {
  A: 'Adenine',
  T: 'Thymine',
  G: 'Guanine',
  C: 'Cytosine'
};

export const BASE_NAMES_CN: Record<BaseType, string> = {
  A: '腺嘌呤',
  T: '胸腺嘧啶',
  G: '鸟嘌呤',
  C: '胞嘧啶'
};

export const COMPLEMENTARY_BASES: Record<BaseType, BaseType> = {
  A: 'T',
  T: 'A',
  G: 'C',
  C: 'G'
};

export const HELIX_CONFIG = {
  radius: 50,
  pitch: 30,
  nodeCount: 40,
  nodeDiameter: 3,
  tubeRadius: 0.5,
  tubeOpacity: 0.6,
  baseRodRadius: 0.3,
  baseRodHighlightRadius: 0.8
};
