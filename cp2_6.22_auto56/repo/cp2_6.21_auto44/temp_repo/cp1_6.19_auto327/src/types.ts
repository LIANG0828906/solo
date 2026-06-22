export interface Artwork {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 15 | 30;
  color: string;
}

export interface LayoutParams {
  canvasWidth: number;
  canvasHeight: number;
  minSpacing: number;
  maxSpacing: number;
}

export interface HistoryState {
  artworks: Artwork[];
  timestamp: number;
}

export interface GalleryState {
  artworks: Artwork[];
  selectedId: string | null;
  layout: LayoutParams;
  history: HistoryState[];
  historyIndex: number;
  mouseCoords: { x: number; y: number };
  initArtworks: () => void;
  selectArtwork: (id: string | null) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateSelected: (updates: Partial<Omit<Artwork, 'id'>>) => void;
  alignHorizontal: () => void;
  alignVerticalCenter: () => void;
  distributeEvenly: () => void;
  shuffle: () => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  setMouseCoords: (x: number, y: number) => void;
}

export type PartialArtworkUpdate = Partial<Omit<Artwork, 'id'>>;
