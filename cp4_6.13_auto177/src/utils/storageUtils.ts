import { Inventory, CraftedItem, ResourceType, RESOURCE_METAS, DepotResource } from '../types';

const STORAGE_KEY = 'craftplanner_state';

interface StoredState {
  inventory: Inventory;
  craftedItems: CraftedItem[];
  depotResources: Record<ResourceType, number>;
}

export function createEmptyInventory(): Inventory {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    resource: null,
    count: 0,
  }));
}

export function createInitialDepot(): Record<ResourceType, number> {
  const depot: Record<ResourceType, number> = {} as Record<ResourceType, number>;
  const keys = Object.keys(RESOURCE_METAS) as ResourceType[];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    depot[key] = RESOURCE_METAS[key].initialStock;
  }
  return depot;
}

export function loadState(): StoredState {
  if (typeof window === 'undefined') {
    return {
      inventory: createEmptyInventory(),
      craftedItems: [],
      depotResources: createInitialDepot(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        inventory: createEmptyInventory(),
        craftedItems: [],
        depotResources: createInitialDepot(),
      };
    }
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed.inventory || !Array.isArray(parsed.inventory) || parsed.inventory.length !== 12) {
      return {
        inventory: createEmptyInventory(),
        craftedItems: [],
        depotResources: createInitialDepot(),
      };
    }
    return parsed;
  } catch {
    return {
      inventory: createEmptyInventory(),
      craftedItems: [],
      depotResources: createInitialDepot(),
    };
  }
}

export function saveState(state: StoredState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
