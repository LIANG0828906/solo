import {
  subscribe as subscribeDesign,
  getDesignState,
  type PlacedFurniture,
} from '../moduleA/designEngine';
import { getFurniturePrices, getFurnitureList, type Furniture } from '../moduleD/apiService';
import { notifyBudgetUpdate } from '../moduleB/uiComponents';

export interface BudgetItem {
  id: string;
  furnitureId: string;
  name: string;
  price: number;
  category: string;
}

export interface BudgetGroup {
  category: 'furniture' | 'lighting' | 'decoration';
  label: string;
  subtotal: number;
  items: BudgetItem[];
}

export interface BudgetState {
  groups: BudgetGroup[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

type BudgetSubscriber = (state: BudgetState) => void;

const categoryMapping: Record<string, { group: BudgetGroup['category']; label: string }> = {
  '沙发': { group: 'furniture', label: '家具' },
  '桌子': { group: 'furniture', label: '家具' },
  '椅子': { group: 'furniture', label: '家具' },
  '灯具': { group: 'lighting', label: '灯具' },
  '地毯': { group: 'decoration', label: '装饰' },
  '装饰画': { group: 'decoration', label: '装饰' },
};

const groupOrder: Array<{ category: BudgetGroup['category']; label: string }> = [
  { category: 'furniture', label: '家具' },
  { category: 'lighting', label: '灯具' },
  { category: 'decoration', label: '装饰' },
];

let budgetState: BudgetState = {
  groups: [],
  total: 0,
  isLoading: false,
  error: null,
};

let previousState: BudgetState = { ...budgetState };
const priceCache: Map<string, number> = new Map();
const furnitureInfoCache: Map<string, Furniture> = new Map();
const subscribers: Set<BudgetSubscriber> = new Set();
let pendingFurnitureIds: Set<string> = new Set();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_DELAY = 50;
let animationFrameId: number | null = null;
const ANIMATION_DURATION = 500;

let designUnsubscribe: (() => void) | null = null;

export const getBudgetState = (): Readonly<BudgetState> => budgetState;

export const subscribe = (callback: BudgetSubscriber): (() => void) => {
  subscribers.add(callback);
  callback(budgetState);
  return () => subscribers.delete(callback);
};

export const unsubscribe = (callback: BudgetSubscriber): void => {
  subscribers.delete(callback);
};

const notifySubscribers = (state: BudgetState): void => {
  subscribers.forEach((cb) => cb(state));
  notifyBudgetUpdate(state);
};

const ensureFurnitureInfo = async (ids: string[]): Promise<void> => {
  const uncachedIds = ids.filter((id) => !furnitureInfoCache.has(id));
  if (uncachedIds.length === 0) return;

  try {
    const furnitureList = await getFurnitureList();
    furnitureList.forEach((f) => {
      furnitureInfoCache.set(f.id, f);
      priceCache.set(f.id, f.price);
    });
  } catch {
    // 忽略错误，使用已有缓存
  }
};

const debounceFetchPrices = (furnitureIds: string[]): void => {
  furnitureIds.forEach((id) => pendingFurnitureIds.add(id));

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    const idsToFetch = Array.from(pendingFurnitureIds).filter(
      (id) => !priceCache.has(id),
    );
    pendingFurnitureIds.clear();

    if (idsToFetch.length === 0) {
      calculateBudget();
      return;
    }

    budgetState = { ...budgetState, isLoading: true, error: null };
    notifySubscribers(budgetState);

    try {
      await ensureFurnitureInfo(idsToFetch);

      const prices = await getFurniturePrices(idsToFetch);
      Object.entries(prices).forEach(([id, price]) => {
        priceCache.set(id, price);
      });

      calculateBudget();
    } catch (error) {
      budgetState = {
        ...budgetState,
        isLoading: false,
        error: error instanceof Error ? error.message : '获取价格失败',
      };
      notifySubscribers(budgetState);
    }
  }, DEBOUNCE_DELAY);
};

const calculateBudget = (): void => {
  const designState = getDesignState();
  const placedFurniture = designState.placedFurniture;

  const items: BudgetItem[] = placedFurniture
    .map((furniture) => {
      const price = priceCache.get(furniture.furnitureId);
      if (price === undefined) return null;

      const furnitureInfo = furnitureInfoCache.get(furniture.furnitureId);
      const category = furnitureInfo?.category || furniture.category;

      return {
        id: furniture.id,
        furnitureId: furniture.furnitureId,
        name: furnitureInfo?.name || furniture.name,
        price,
        category,
      };
    })
    .filter((item): item is BudgetItem => item !== null);

  const groups: BudgetGroup[] = groupOrder.map(({ category, label }) => {
    const groupItems = items.filter((item) => {
      const mapping = categoryMapping[item.category];
      return mapping && mapping.group === category;
    });
    const subtotal = groupItems.reduce((sum, item) => sum + item.price, 0);
    return { category, label, subtotal, items: groupItems };
  }).filter((group) => group.items.length > 0);

  const total = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const newState: BudgetState = {
    groups,
    total,
    isLoading: false,
    error: null,
  };

  const hasPriceChanges = items.some((item) => {
    const prevItems = previousState.groups.flatMap((g) => g.items);
    const prevItem = prevItems.find((pi) => pi.id === item.id);
    return prevItem && prevItem.price !== item.price;
  });

  const hasItemChanges =
    items.length !== previousState.groups.flatMap((g) => g.items).length;

  if (hasPriceChanges || hasItemChanges || total !== previousState.total) {
    animateToState(newState);
  } else {
    budgetState = newState;
    previousState = { ...newState };
    notifySubscribers(budgetState);
  }
};

const animateToState = (targetState: BudgetState): void => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  const startTime = performance.now();
  const startTotal = previousState.total;
  const startGroups = previousState.groups.map((g) => ({
    ...g,
    subtotal: g.subtotal,
  }));

  const animate = (currentTime: number): void => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
    const easeProgress = easeOutCubic(progress);

    const animatedGroups = targetState.groups.map((targetGroup) => {
      const startGroup = startGroups.find(
        (sg) => sg.category === targetGroup.category,
      );
      const startSubtotal = startGroup ? startGroup.subtotal : 0;
      const currentSubtotal =
        startSubtotal + (targetGroup.subtotal - startSubtotal) * easeProgress;

      return {
        ...targetGroup,
        subtotal: Math.round(currentSubtotal),
      };
    });

    const animatedTotal = Math.round(
      startTotal + (targetState.total - startTotal) * easeProgress,
    );

    budgetState = {
      groups: animatedGroups,
      total: animatedTotal,
      isLoading: targetState.isLoading,
      error: targetState.error,
    };

    notifySubscribers(budgetState);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      budgetState = { ...targetState };
      previousState = { ...targetState };
      notifySubscribers(budgetState);
      animationFrameId = null;
    }
  };

  animationFrameId = requestAnimationFrame(animate);
};

const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

const handleDesignStateChange = (designState: {
  placedFurniture: PlacedFurniture[];
}): void => {
  const furnitureIds = designState.placedFurniture.map((f) => f.furnitureId);
  const uncachedIds = furnitureIds.filter((id) => !priceCache.has(id));

  if (uncachedIds.length > 0) {
    debounceFetchPrices(uncachedIds);
  } else {
    calculateBudget();
  }
};

export const initialize = (): void => {
  if (designUnsubscribe) return;
  designUnsubscribe = subscribeDesign(handleDesignStateChange);
};

export const destroy = (): void => {
  if (designUnsubscribe) {
    designUnsubscribe();
    designUnsubscribe = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  subscribers.clear();
  priceCache.clear();
  furnitureInfoCache.clear();
  pendingFurnitureIds.clear();
};

export const refreshPrices = (furnitureIds?: string[]): void => {
  if (furnitureIds) {
    furnitureIds.forEach((id) => {
      priceCache.delete(id);
      furnitureInfoCache.delete(id);
    });
  } else {
    priceCache.clear();
    furnitureInfoCache.clear();
  }
  const designState = getDesignState();
  handleDesignStateChange(designState);
};

initialize();
