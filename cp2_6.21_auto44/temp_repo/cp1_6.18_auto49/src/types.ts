export interface TimelineNode {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
  isBranch: boolean;
  parentId?: string;
  branchIndex?: number;
  edited: boolean;
  order: number;
}

export interface Branch {
  parentId: string;
  nodeIds: string[];
  mergeTargetId: string;
}

export interface TimelineState {
  nodes: TimelineNode[];
  branches: Branch[];
  selectedNodeId: string | null;
  isPlaying: boolean;
  currentProgress: number;
  history: TimelineNode[][];
  historyIndex: number;
  activeBranchId: string | null;
  isExporting: boolean;
}
