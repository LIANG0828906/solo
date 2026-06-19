export interface Item {
  id: string;
  name: string;
  icon: string;
  count: number;
  weight: number;
  slots: number;
  color?: string;
}

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  color: string;
  slots: number;
  ingredients: Record<string, number>;
  statEffects?: {
    health?: number;
    hunger?: number;
    thirst?: number;
  };
}

export interface CharacterStatus {
  health: number;
  hunger: number;
  thirst: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  itemName: string;
  itemCount: number;
  recipeName: string;
  recipeColor: string;
}

export interface DragItemData {
  itemId: string;
  source: 'backpack' | 'workbench';
}
