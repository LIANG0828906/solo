export type ResourceType = 'stone' | 'wood' | 'iron' | 'leather' | 'string';

export interface ResourceMeta {
  id: ResourceType;
  name: string;
  color: string;
  initialStock: number;
}

export interface InventorySlotData {
  id: number;
  resource: ResourceType | null;
  count: number;
}

export type Inventory = InventorySlotData[];

export interface Recipe {
  id: string;
  name: string;
  iconColor: string;
  requirements: Partial<Record<ResourceType, number>>;
}

export interface CraftableResult {
  recipeId: string;
  name: string;
  iconColor: string;
  requirements: Partial<Record<ResourceType, number>>;
}

export interface CraftedItem {
  id: string;
  recipeId: string;
  name: string;
  iconColor: string;
  timestamp: number;
}

export type DragItemType =
  | {
      type: 'depot';
      resource: ResourceType;
    }
  | {
      type: 'inventory';
      slotId: number;
    };

export interface ParticleEvent {
  id: string;
  x: number;
  y: number;
  createdAt: number;
}

export interface DepotResource {
  type: ResourceType;
  remaining: number;
}

export const RESOURCE_METAS: Record<ResourceType, ResourceMeta> = {
  stone: { id: 'stone', name: '石头', color: '#7f8c8d', initialStock: 5 },
  wood: { id: 'wood', name: '木头', color: '#8b4513', initialStock: 5 },
  iron: { id: 'iron', name: '铁锭', color: '#bdc3c7', initialStock: 3 },
  leather: { id: 'leather', name: '皮革', color: '#d35400', initialStock: 3 },
  string: { id: 'string', name: '线', color: '#ecf0f1', initialStock: 3 },
};
