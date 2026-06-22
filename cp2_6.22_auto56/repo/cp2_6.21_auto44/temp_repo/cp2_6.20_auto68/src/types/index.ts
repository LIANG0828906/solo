export type ThemeType = 'classic' | 'cyberpunk' | 'minimal';
export type ConnectionType = 'causal' | 'parallel';

export interface TimelineNode {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  x: number;
  y: number;
  expanded: boolean;
  isNew?: boolean;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  type: ConnectionType;
}

export interface HistorySnapshot {
  nodes: TimelineNode[];
  connections: Connection[];
}

export interface TimelineState {
  nodes: TimelineNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  currentTheme: ThemeType;
  history: HistorySnapshot[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  addNode: (node?: Partial<TimelineNode>) => void;
  updateNode: (id: string, updates: Partial<TimelineNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  addConnection: (fromId: string, toId: string, type: ConnectionType) => void;
  deleteConnection: (id: string) => void;
  setTheme: (theme: ThemeType) => void;
  clearNewFlag: (id: string) => void;
  undo: () => void;
  redo: () => void;
}
