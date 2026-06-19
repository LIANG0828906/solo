export type ArtworkType = 'painting' | 'sculpture';
export type SculptureType = 'sphere' | 'spiral' | 'cube' | 'cone';
export type WallType = 'north' | 'south' | 'east' | 'west';
export type LightType = 'point' | 'spot';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Artwork {
  id: string;
  type: ArtworkType;
  position: Position;
  rotation: Rotation;
  imageUrl?: string;
  wall?: WallType;
  sculptureType?: SculptureType;
  color?: string;
  polygonDetail: 64 | 128;
}

export interface Light {
  id: string;
  type: LightType;
  position: Position;
  target?: Position;
  color: string;
  intensity: number;
  angle?: number;
  penumbra: number;
}

export interface GalleryStore {
  artworks: Artwork[];
  lights: Light[];
  lastOperationTime: string;
  shadowQuality: 'low' | 'high';
  addArtwork: (artwork: Omit<Artwork, 'id' | 'polygonDetail'>) => void;
  removeArtwork: (id: string) => void;
  updateArtwork: (id: string, updates: Partial<Artwork>) => void;
  addLight: (light: Omit<Light, 'id'>) => void;
  removeLight: (id: string) => void;
  updateLight: (id: string, updates: Partial<Light>) => void;
  getTotalObjects: () => number;
}
