export interface Bubble {
  id: string;
  x: number;
  y: number;
  diameter: number;
  name: string;
  color: string;
  opacity: number;
  rotation: number;
  createdAt: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  style: 'straight' | 'bezier';
  controlPointOffset?: { x1: number; y1: number; x2: number; y2: number };
  color: string;
  width: number;
}

export interface ReportContent {
  zoning: string;
  circulation: string;
  ecology: string;
}

export interface Report {
  id: string;
  content: ReportContent;
  generatedAt: number;
  manuallyEdited: boolean;
}

export type ToolMode = 'select' | 'create' | 'connect';

export interface InteractionState {
  toolMode: ToolMode;
  selectedBubbleId: string | null;
  selectedConnectionId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  connectingFromId: string | null;
}
