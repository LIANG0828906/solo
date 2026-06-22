export interface Artwork {
  id: string;
  title: string;
  artistName: string;
  year: number;
  price: number;
  width: number;
  height: number;
  imageUrl: string;
  status: 'pending' | 'approved';
  hueShift: number;
  createdAt?: string;
}

export interface Placement {
  id: string;
  artworkId: string;
  wallIndex: number;
  posX: number;
  posY: number;
  rotation: number;
}

export interface PlacementWithArtwork extends Placement {
  title: string;
  artistName: string;
  year: number;
  price: number;
  width: number;
  height: number;
  imageUrl: string;
  hueShift: number;
}

export interface Order {
  id: string;
  artworkId: string;
  buyerName?: string;
  buyerEmail?: string;
  status: 'pending' | 'paid' | 'completed';
  createdAt?: string;
  title?: string;
  price?: number;
  imageUrl?: string;
}

export type WallSide = 'front' | 'right' | 'back' | 'left';

export interface GalleryState {
  artworks: Artwork[];
  placements: PlacementWithArtwork[];
  selectedArtwork: Artwork | null;
  selectedPlacementId: string | null;
  cameraPosition: { x: number; y: number; z: number };
  cameraRotation: { x: number; y: number };
  isDetailVisible: boolean;
  detailArtwork: Artwork | null;
}
