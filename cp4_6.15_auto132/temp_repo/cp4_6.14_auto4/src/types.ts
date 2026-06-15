export interface Artwork {
  id: string;
  title: string;
  width: number;
  height: number;
  rotation: 0 | 45 | 90;
  thumbnail: string;
  color: string;
}

export interface Booth {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

export interface PlacedArtwork extends Artwork {
  boothId: string;
  x: number;
  y: number;
}

export type ViewMode = '2d' | '3d';

export interface DragState {
  isDragging: boolean;
  artwork: Artwork | null;
  mouseX: number;
  mouseY: number;
  targetBoothId: string | null;
}

export interface LayoutState {
  booths: Booth[];
  placedArtworks: PlacedArtwork[];
  selectedBoothId: string | null;
  selectedArtworkId: string | null;
  viewMode: ViewMode;
  scale: number;
  offset: { x: number; y: number };
}
