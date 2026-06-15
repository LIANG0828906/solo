export interface Artwork {
  id: string;
  name: string;
  author: string;
  description: string;
  colorPalette: string[];
  particleSpeed: number;
  initialColorPalette: string[];
  initialParticleSpeed: number;
}

export interface ColorPreset {
  id: string;
  name: string;
  colors: string[];
}

export interface GalleryState {
  selectedArtworkId: string | null;
  hoveredArtworkId: string | null;
  isNavigationOpen: boolean;
  isDetailPanelOpen: boolean;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}
