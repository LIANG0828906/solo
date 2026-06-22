export interface CollectionItem {
  id: string;
  name: string;
  era: string;
  material: string;
  thumbnail: string;
  modelPath: string;
  category: string;
  description: string;
}

export interface PlacedItem {
  collectionId: string;
  gridX: number;
  gridY: number;
  rotation: number;
}

export type LightingType = 'warm' | 'cool' | 'mixed';

export interface Exhibition {
  id: string;
  name: string;
  backgroundColor: string;
  lightingType: LightingType;
  standStyle: string;
  items: PlacedItem[];
  shareUrl: string;
  createdAt: Date;
}
