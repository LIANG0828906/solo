export interface TimelineNode {
  id: string;
  content: string;
  timestamp: number;
  marked: boolean;
  htmlContent: string;
}

export interface MarkedNode extends TimelineNode {
  markedAt: number;
  markColor: string;
}

export interface AppState {
  nodes: TimelineNode[];
  searchKeyword: string;
  activeNodeId: string | null;
  timelineOpen: boolean;
  addNode: (content: string, htmlContent: string) => void;
  toggleMark: (id: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setActiveNodeId: (id: string | null) => void;
  setTimelineOpen: (open: boolean) => void;
}
