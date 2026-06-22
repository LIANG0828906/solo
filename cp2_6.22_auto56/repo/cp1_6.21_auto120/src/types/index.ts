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

export interface ExhibitionContextType {
  selectedItems: CollectionItem[];
  placedItems: PlacedItem[];
  backgroundColor: string;
  lightingType: LightingType;
  exhibitionName: string;
  isPreviewMode: boolean;
  addSelectedItem: (item: CollectionItem) => void;
  removeSelectedItem: (itemId: string) => void;
  addPlacedItem: (item: PlacedItem) => void;
  updatePlacedItem: (itemId: string, updates: Partial<PlacedItem>) => void;
  removePlacedItem: (itemId: string) => void;
  setBackgroundColor: (color: string) => void;
  setLightingType: (type: LightingType) => void;
  setExhibitionName: (name: string) => void;
  togglePreviewMode: () => void;
  resetExhibition: () => void;
}
