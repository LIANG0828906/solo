export type ModuleType = 'util' | 'business' | 'ui';
export type NodeType = 'function' | 'class' | 'module';

export interface CodeNode {
  id: string;
  name: string;
  type: NodeType;
  moduleType: ModuleType;
  code: string;
  position: { x: number; y: number; z: number };
  callCount: number;
}

export interface CodeEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface AppState {
  nodes: CodeNode[];
  edges: CodeEdge[];
  selectedNode: CodeNode | null;
  isPlaying: boolean;
  speed: number;
  isLoading: boolean;
}

export interface AppActions {
  setNodes: (nodes: CodeNode[]) => void;
  setEdges: (edges: CodeEdge[]) => void;
  setSelectedNode: (node: CodeNode | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSpeed: (speed: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  resetAnimation: () => void;
  togglePlay: () => void;
}

export type AppStore = AppState & AppActions;
