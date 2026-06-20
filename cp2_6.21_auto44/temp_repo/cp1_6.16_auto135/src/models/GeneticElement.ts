export type ElementType = 'promoter' | 'operator' | 'structural-gene' | 'repressor' | 'inducer';
export type ShapeType = 'rectangle' | 'diamond' | 'triangle' | 'circle' | 'hexagon';

export interface Position {
  x: number;
  y: number;
}

export interface GeneticElement {
  id: string;
  type: ElementType;
  position: Position;
  color: string;
  shape: ShapeType;
  label: string;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  color: string;
}

export type SimulationStatus = 'idle' | 'running' | 'blocked' | 'complete';

export interface SimulationState {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  status: SimulationStatus;
  polymerasePosition: Position | null;
  mrnaGenerated: boolean;
  blockedByRepressor: boolean;
  pairedResult: string | null;
}

export interface SimulationResult {
  success: boolean;
  message: string;
  proteinProduced: boolean;
  blockedAt?: string;
}

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  elements: GeneticElement[];
  connections: Connection[];
  result?: SimulationResult;
}

export interface RemoteCursor {
  userId: string;
  position: Position;
  color: string;
  userName: string;
}

export const ELEMENT_PRESETS: Record<ElementType, Omit<GeneticElement, 'id' | 'position'>> = {
  'promoter': {
    type: 'promoter',
    color: '#1565C0',
    shape: 'rectangle',
    label: '启动子'
  },
  'operator': {
    type: 'operator',
    color: '#7B1FA2',
    shape: 'diamond',
    label: '操纵基因'
  },
  'structural-gene': {
    type: 'structural-gene',
    color: '#2E7D32',
    shape: 'triangle',
    label: '结构基因'
  },
  'repressor': {
    type: 'repressor',
    color: '#C62828',
    shape: 'circle',
    label: '阻遏物'
  },
  'inducer': {
    type: 'inducer',
    color: '#EF6C00',
    shape: 'hexagon',
    label: '诱导物'
  }
};

export const ELEMENT_SIZE = {
  width: 60,
  height: 40
};

export const CURSOR_COLORS = [
  '#E53935',
  '#1E88E5',
  '#43A047',
  '#FB8C00'
];
