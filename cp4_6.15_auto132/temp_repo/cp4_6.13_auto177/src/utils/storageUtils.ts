import { Inventory, CraftedItem, ResourceType, RESOURCE_METAS } from '../types';

const STORAGE_KEY = 'craftplanner_state';

export interface StoredState {
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
  const depot = {} as Record<ResourceType, number>;
  const keys = Object.keys(RESOURCE_METAS) as ResourceType[];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    depot[key] = RESOURCE_METAS[key].initialStock;
  }
  return depot;
}

function getDefaultState(): StoredState {
  return {
    inventory: createEmptyInventory(),
    craftedItems: [],
    depotResources: createInitialDepot(),
  };
}

export function loadState(): StoredState {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return getDefaultState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === 'null' || raw === 'undefined') {
      return getDefaultState();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return getDefaultState();
    }

    if (!parsed || typeof parsed !== 'object') {
      return getDefaultState();
    }

    const state = parsed as Partial<StoredState>;

    if (
      !state.inventory ||
      !Array.isArray(state.inventory) ||
      state.inventory.length !== 12
    ) {
      return getDefaultState();
    }

    if (!state.craftedItems || !Array.isArray(state.craftedItems)) {
      state.craftedItems = [];
    }

    if (!state.depotResources || typeof state.depotResources !== 'object') {
      state.depotResources = createInitialDepot();
    }

    return state as StoredState;
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: StoredState): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearState(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
