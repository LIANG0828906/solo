export type FragmentType = 'inspiration' | 'emotion' | 'theme';

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  coverColor: string;
  sketchElements: {
    theme: string[];
    colors: string[];
    emotions: string[];
    inspiration: string[];
  };
}

export interface InspirationFragment {
  id: string;
  type: FragmentType;
  content: string;
  color: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: FragmentType;
  relevance: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isNew: boolean;
  isDragging: boolean;
  createdAt: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  similarity: number;
}

export interface HistoryRecord {
  id: string;
  artworkId: string;
  artworkTitle: string;
  thumbnail: string;
  timestamp: number;
  fragments: InspirationFragment[];
}

export interface AppState {
  isCardFlipped: boolean;
  currentArtwork: Artwork | null;
  currentFragments: InspirationFragment[];
  showStoryCard: boolean;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  history: HistoryRecord[];
  showHistory: boolean;
  showResetDialog: boolean;
  isTransitioning: boolean;
  particlePosition: { x: number; y: number } | null;
}

export const FRAGMENT_COLORS: Record<FragmentType, string> = {
  inspiration: '#00B894',
  emotion: '#6C5CE7',
  theme: '#FDCB6E',
};

export const NODE_COLORS = [
  '#6C5CE7',
  '#FD79A8',
  '#00B894',
  '#FDCB6E',
  '#E17055',
  '#74B9FF',
];

export const EASE_ELASTIC = [0.68, -0.55, 0.27, 1.55] as [number, number, number, number];
