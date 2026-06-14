export interface LocationNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  x: number;
  y: number;
  estimatedDuration: number;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number;
  isHighlighted: boolean;
  highlightColor: string;
}

export interface DayItinerary {
  dayNumber: number;
  nodeIds: string[];
  gradientStart: string;
  gradientEnd: string;
}

export interface RouteState {
  nodes: LocationNode[];
  connections: Connection[];
  itineraries: DayItinerary[];
  scale: number;
  panX: number;
  panY: number;
  selectedNodeId: string | null;
}

export interface CanvasViewport {
  scale: number;
  panX: number;
  panY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface NodeDragState {
  isDragging: boolean;
  nodeId: string | null;
  offsetX: number;
  offsetY: number;
}

export interface ConnectionDragState {
  isDragging: boolean;
  fromNodeId: string | null;
  currentX: number;
  currentY: number;
}

export interface ReportDayData {
  dayNumber: number;
  gradientStart: string;
  gradientEnd: string;
  nodes: LocationNode[];
  totalDistance: number;
  totalDuration: number;
}
