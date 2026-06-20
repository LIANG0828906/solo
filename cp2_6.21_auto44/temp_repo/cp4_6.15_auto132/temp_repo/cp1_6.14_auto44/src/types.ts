export interface Family {
  id: string;
  name: string;
  location: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  color: string;
  familyId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  storageLocationId: string;
  familyId: string;
  minThreshold: number;
  processed: boolean;
}

export interface ConsumptionRecord {
  id: string;
  itemId: string;
  itemName: string;
  familyId: string;
  storageLocationId: string;
  type: 'added' | 'consumed';
  quantity: number;
  date: string;
}

export interface SupplySuggestion {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  suggestedQuantity: number;
  reason: string;
  storageLocationId: string;
  unit: string;
}
