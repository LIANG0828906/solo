export type CollectionTheme = 'spring' | 'urban' | 'coastal';

export type FabricType = 'organicCotton' | 'recycledPolyester' | 'tencel' | 'hemp';

export interface Collection {
  id: string;
  name: string;
  description: string;
  theme: CollectionTheme;
  themeColors: [string, string];
  thumbnailUrl: string;
}

export interface ClothingPart {
  id: string;
  name: string;
  meshName: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  designer: string;
  designerAvatar: string;
  collectionId: string;
  baseCarbonScore: number;
  modelUrl: string;
  parts: ClothingPart[];
  defaultFabric: FabricType;
  defaultColors: Record<string, string>;
  complexity: number;
}

export interface Fabric {
  type: FabricType;
  name: string;
  carbonFactor: number;
  colorPalette: string[];
  roughness: number;
  metalness: number;
  description: string;
}

export interface Customization {
  fabric: FabricType;
  colors: Record<string, string>;
}

export interface SavedCustomization {
  id: string;
  clothingId: string;
  customization: Customization;
  carbonScore: number;
  savedAt: number;
  thumbnail: string;
  clothingName?: string;
}

export interface CarbonHistoryEntry {
  step: number;
  score: number;
  timestamp: number;
}

export interface Order {
  id?: string;
  customerName: string;
  email: string;
  deliveryDate: string;
  customizationId: string;
  clothingId: string;
  totalCarbonSaved: number;
}

export interface CarbonStats {
  totalCarbonSaved: number;
  ecoClothingCount: number;
  fabricUsage: Record<FabricType, number>;
}

export type ModelPartType = 'top' | 'skirt' | 'sleeve' | 'bodice';
