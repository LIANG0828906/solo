import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { gameApi } from '../api/gameApi';

export type PlotStatus = 'empty' | 'seed' | 'sprout' | 'growing' | 'mature' | 'building';

export const PLOT_STATUS_ENUM: Record<PlotStatus, PlotStatus> = {
  empty: 'empty',
  seed: 'seed',
  sprout: 'sprout',
  growing: 'growing',
  mature: 'mature',
  building: 'building',
} as const;

export const ANIMAL_HEALTH_MIN = 0;
export const ANIMAL_HEALTH_MAX = 100;
export const ANIMAL_HEALTH_WARNING = 40;
export const ANIMAL_HEALTH_CRITICAL = 20;

export type AnimalHealthStatus = 'healthy' | 'warning' | 'critical';

export interface CropType {
  id: string;
  name: string;
  growTime: number;
  seedPrice: number;
  harvestReward: number;
  icon: string;
  matureIcon: string;
  sproutIcon: string;
  growingIcon: string;
}

export interface Plot {
  id: string;
  x: number;
  y: number;
  status: PlotStatus;
  cropId?: string;
  plantedAt?: number;
  buildingId?: string;
}

export interface BuildingType {
  id: string;
  name: string;
  size: { width: number; height: number };
  cost: number;
  animalType: string;
  icon: string;
  productIcon: string;
  productName: string;
  productTargetKey: string;
  productIntervalMs: number;
}

export interface Building {
  id: string;
  typeId: string;
  x: number;
  y: number;
  createdAt?: number;
}

export interface Animal {
  id: string;
  type: string;
  health: number;
  lastFed: number;
  productReadyAt: number;
  buildingId: string;
  icon: string;
  name?: string;
}

export interface Order {
  id: string;
  name: string;
  icon: string;
  targetItem: string;
  targetAmount: number;
  currentAmount: number;
  reward: number;
  completed: boolean;
  completedAt?: number;
  createdAt?: number;
}

export interface OrderProgress {
  orderId: string;
  percentage: number;
  isCompleted: boolean;
  remainingAmount: number;
}

export interface Contribution {
  id: string;
  username: string;
  count: number;
  points: number;
  lastPointsChange?: number;
  lastUpdate?: number;
}

export interface User {
  id: string;
  username: string;
  coins: number;
  inventory: Record<string, number>;
  createdAt?: number;
  lastLoginAt?: number;
}

export interface FeedParticle {
  id: string;
  buildingId: string;
  x: number;
  y: number;
  angle: number;
}

export interface FloatingPoint {
  id: string;
  contributionId: string;
  points: number;
  createdAt: number;
}

export interface ApiSyncState {
  isLoading: boolean;
  lastSyncAt: number | null;
  error: string | null;
}

export const CROP_TYPES: CropType[] = [
  {
    id: 'wheat',
    name: '小麦',
    growTime: 30,
    seedPrice: 10,
    harvestReward: 25,
    icon: '🌱',
    sproutIcon: '🌱',
    growingIcon: '🌾',
    matureIcon: '🌾',
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    growTime: 45,
    seedPrice: 15,
    harvestReward: 40,
    icon: '🌱',
    sproutIcon: '🌱',
    growingIcon: '🥬',
    matureIcon: '🥕',
  },
  {
    id: 'tomato',
    name: '番茄',
    growTime: 60,
    seedPrice: 20,
    harvestReward: 55,
    icon: '🌱',
    sproutIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '🍅',
  },
  {
    id: 'corn',
    name: '玉米',
    growTime: 90,
    seedPrice: 25,
    harvestReward: 70,
    icon: '🌱',
    sproutIcon: '🌱',
    growingIcon: '🌾',
    matureIcon: '🌽',
  },
];

export const BUILDING_TYPES: BuildingType[] = [
  {
    id: 'chicken',
    name: '鸡舍',
    size: { width: 2, height: 2 },
    cost: 100,
    animalType: 'chicken',
    icon: '🏠',
    productIcon: '🥚',
    productName: '鸡蛋',
    productTargetKey: 'egg',
    productIntervalMs: 120000,
  },
  {
    id: 'cow',
    name: '牛棚',
    size: { width: 3, height: 2 },
    cost: 200,
    animalType: 'cow',
    icon: '🏡',
    productIcon: '🥛',
    productName: '牛奶',
    productTargetKey: 'milk',
    productIntervalMs: 180000,
  },
  {
    id: 'sheep',
    name: '羊圈',
    size: { width: 2, height: 2 },
    cost: 150,
    animalType: 'sheep',
    icon: '🛖',
    productIcon: '🧶',
    productName: '羊毛',
    productTargetKey: 'wool',
    productIntervalMs: 150000,
  },
];

const ANIMAL_ICONS: Record<string, string> = {
  chicken: '🐔',
  cow: '🐮',
  sheep: '🐑',
};

const GRID_SIZE = 8;

const generateInitialPlots = (): Plot[] => {
  const plots: Plot[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      plots.push({
        id: `plot-${x}-${y}`,
        x,
        y,
        status: 'empty',
      });
    }
  }
  return plots;
};

const generateInitialBuildings = (): Building[] => {
  return [
    { id: 'b1', typeId: 'chicken', x: 6, y: 0, createdAt: Date.now() },
    { id: 'b2', typeId: 'cow', x: 0, y: 6, createdAt: Date.now() },
  ];
};

const generateInitialAnimals = (): Animal[] => {
  const now = Date.now();
  return [
    { id: 'a1', type: 'chicken', health: 80, lastFed: now, productReadyAt: now + 60000, buildingId: 'b1', icon: '🐔', name: '小芦花' },
    { id: 'a2', type: 'chicken', health: 65, lastFed: now - 30000, productReadyAt: now + 120000, buildingId: 'b1', icon: '🐔', name: '大母鸡' },
    { id: 'a3', type: 'cow', health: 90, lastFed: now, productReadyAt: now + 180000, buildingId: 'b2', icon: '🐮', name: '奶牛花花' },
  ];
};

const generateInitialOrders = (): Order[] => {
  return [
    { id: 'o1', name: '收集鸡蛋', icon: '🥚', targetItem: 'egg', targetAmount: 50, currentAmount: 12, reward: 200, completed: false, createdAt: Date.now() },
    { id: 'o2', name: '收获小麦', icon: '🌾', targetItem: 'wheat', targetAmount: 30, currentAmount: 8, reward: 150, completed: false, createdAt: Date.now() },
    { id: 'o3', name: '收集牛奶', icon: '🥛', targetItem: 'milk', targetAmount: 20, currentAmount: 20, reward: 180, completed: true, completedAt: Date.now() - 300000, createdAt: Date.now() - 3600000 },
  ];
};

const generateInitialContributions = (): Contribution[] => {
  return [
    { id: 'c1', username: '农场主小明', count: 15, points: 450, lastUpdate: Date.now() },
    { id: 'c2', username: '勤劳的小红', count: 12, points: 380, lastUpdate: Date.now() - 60000 },
    { id: 'c3', username: '快乐农夫', count: 8, points: 240, lastUpdate: Date.now() - 120000 },
    { id: 'c4', username: '新手小白', count: 3, points: 90, lastUpdate: Date.now() - 180000 },
  ];
};

export const getCropTypeById = (id: string): CropType | undefined => CROP_TYPES.find(c => c.id === id);
export const getBuildingTypeById = (id: string): BuildingType | undefined => BUILDING_TYPES.find(b => b.id === id);

export const getAnimalHealthStatus = (health: number): AnimalHealthStatus => {
  if (health <= ANIMAL_HEALTH_CRITICAL) return 'critical';
  if (health <= ANIMAL_HEALTH_WARNING) return 'warning';
  return 'healthy';
};

export const getOrderProgress = (order: Order): OrderProgress => {
  const percentage = Math.min(100, (order.currentAmount / order.targetAmount) * 100);
  return {
    orderId: order.id,
    percentage,
    isCompleted: order.completed || percentage >= 100,
    remainingAmount: Math.max(0, order.targetAmount - order.currentAmount),
  };
};

export const getHealthGradientStyle = (health: number): string => {
  const status = getAnimalHealthStatus(health);
  switch (status) {
    case 'healthy':
      return 'linear-gradient(to right, #10b981, #34d399, #6ee7b7)';
    case 'warning':
      return 'linear-gradient(to right, #f59e0b, #fbbf24, #fcd34d)';
    case 'critical':
      return 'linear-gradient(to right, #ef4444, #f87171, #fca5a5)';
  }
};

interface GameState {
  user: User;
  plots: Plot[];
  buildings: Building[];
  animals: Animal[];
  orders: Order[];
  contributions: Contribution[];
  selectedPlotId: string | null;
  showPlantMenu: boolean;
  showBuildingDetail: Building | null;
  feedParticles: FeedParticle[];
  floatingPoints: FloatingPoint[];
  currentTime: number;
  syncState: ApiSyncState;
  useApi: boolean;

  getCropType: (id: string) => CropType | undefined;
  getBuildingType: (id: string) => BuildingType | undefined;
  getPlotStatus: (plot: Plot) => PlotStatus;
  getPlotGrowthProgress: (plot: Plot) => number;
  getAnimalsInBuilding: (buildingId: string) => Animal[];
  formatCountdown: (timestamp: number) => string;
  getOrderProgress: (order: Order) => OrderProgress;
  getAnimalHealthStatus: (health: number) => AnimalHealthStatus;

  selectPlot: (plotId: string | null) => void;
  plantCrop: (plotId: string, cropId: string) => Promise<void>;
  harvestCrop: (plotId: string) => Promise<void>;
  openBuildingDetail: (building: Building | null) => void;
  feedAnimals: (buildingId: string) => Promise<void>;
  collectProduct: (buildingId: string) => Promise<void>;
  submitOrderItem: (orderId: string, amount: number) => Promise<void>;
  addContributionPoints: (contributionId: string, points: number) => void;
  updateTime: () => void;
  tickGrowth: () => void;
  syncWithApi: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  setUseApi: (use: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: {
    id: 'user-1',
    username: '农场主小明',
    coins: 500,
    inventory: { wheat: 8, egg: 12, milk: 5 },
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  },
  plots: generateInitialPlots(),
  buildings: generateInitialBuildings(),
  animals: generateInitialAnimals(),
  orders: generateInitialOrders(),
  contributions: generateInitialContributions(),
  selectedPlotId: null,
  showPlantMenu: false,
  showBuildingDetail: null,
  feedParticles: [],
  floatingPoints: [],
  currentTime: Date.now(),
  syncState: {
    isLoading: false,
    lastSyncAt: null,
    error: null,
  },
  useApi: false,

  getCropType: getCropTypeById,
  getBuildingType: getBuildingTypeById,

  getPlotStatus: (plot: Plot): PlotStatus => {
    if (plot.status === 'empty' || plot.status === 'building') return plot.status;
    if (!plot.cropId || !plot.plantedAt) return 'empty';

    const cropType = get().getCropType(plot.cropId);
    if (!cropType) return 'empty';

    const elapsed = (Date.now() - plot.plantedAt) / 1000;
    const progress = elapsed / cropType.growTime;

    if (progress >= 1) return 'mature';
    if (progress >= 0.66) return 'growing';
    if (progress >= 0.33) return 'sprout';
    return 'seed';
  },

  getPlotGrowthProgress: (plot: Plot): number => {
    if (!plot.cropId || !plot.plantedAt) return 0;
    const cropType = get().getCropType(plot.cropId);
    if (!cropType) return 0;
    const elapsed = (Date.now() - plot.plantedAt) / 1000;
    return Math.min(1, elapsed / cropType.growTime);
  },

  getAnimalsInBuilding: (buildingId: string) => {
    return get().animals.filter(a => a.buildingId === buildingId);
  },

  formatCountdown: (timestamp: number): string => {
    const diff = Math.max(0, timestamp - Date.now());
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  getOrderProgress,
  getAnimalHealthStatus,

  selectPlot: (plotId: string | null) => {
    if (plotId === null) {
      set({ selectedPlotId: null, showPlantMenu: false });
      return;
    }
    const plot = get().plots.find(p => p.id === plotId);
    if (plot?.status === 'empty') {
      set({ selectedPlotId: plotId, showPlantMenu: true });
    } else if (get().getPlotStatus(plot!) === 'mature') {
      get().harvestCrop(plotId);
    }
  },

  plantCrop: async (plotId: string, cropId: string) => {
    const cropType = get().getCropType(cropId);
    if (!cropType) return;
    if (get().user.coins < cropType.seedPrice) return;

    const now = Date.now();

    if (get().useApi) {
      try {
        set(s => ({ syncState: { ...s.syncState, isLoading: true, error: null } }));
        await gameApi.plantCrop(plotId, cropId);
        set(s => ({ syncState: { ...s.syncState, lastSyncAt: Date.now() } }));
      } catch (error) {
        set(s => ({ syncState: { ...s.syncState, error: '种植失败，使用本地模式' } }));
      } finally {
        set(s => ({ syncState: { ...s.syncState, isLoading: false } }));
      }
    }

    set(state => ({
      plots: state.plots.map(p =>
        p.id === plotId
          ? { ...p, status: 'seed', cropId, plantedAt: now }
          : p
      ),
      user: {
        ...state.user,
        coins: state.user.coins - cropType.seedPrice,
      },
      showPlantMenu: false,
      selectedPlotId: null,
    }));
  },

  harvestCrop: async (plotId: string) => {
    const plot = get().plots.find(p => p.id === plotId);
    if (!plot || !plot.cropId) return;

    const cropType = get().getCropType(plot.cropId);
    if (!cropType) return;

    if (get().useApi) {
      try {
        set(s => ({ syncState: { ...s.syncState, isLoading: true, error: null } }));
        await gameApi.harvestCrop(plotId);
        set(s => ({ syncState: { ...s.syncState, lastSyncAt: Date.now() } }));
      } catch (error) {
        set(s => ({ syncState: { ...s.syncState, error: '收获失败，使用本地模式' } }));
      } finally {
        set(s => ({ syncState: { ...s.syncState, isLoading: false } }));
      }
    }

    const harvestedCropId = cropType.id;
    const reward = cropType.harvestReward;

    set(state => ({
      plots: state.plots.map(p =>
        p.id === plotId
          ? { ...p, status: 'empty', cropId: undefined, plantedAt: undefined }
          : p
      ),
      user: {
        ...state.user,
        coins: state.user.coins + reward,
        inventory: {
          ...state.user.inventory,
          [harvestedCropId]: (state.user.inventory[harvestedCropId] || 0) + 1,
        },
      },
    }));

    const cropOrder = get().orders.find(o => o.targetItem === harvestedCropId && !o.completed);
    if (cropOrder) {
      await get().submitOrderItem(cropOrder.id, 1);
    }
  },

  openBuildingDetail: (building: Building | null) => {
    set({ showBuildingDetail: building });
  },

  feedAnimals: async (buildingId: string) => {
    const now = Date.now();
    const particles: FeedParticle[] = Array.from({ length: 12 }, (_, i) => ({
      id: uuidv4(),
      buildingId,
      x: 50,
      y: 50,
      angle: (i * 2 * Math.PI) / 12,
    })).map(p => ({
      ...p,
      x: 50 + Math.cos(p.angle) * (20 + Math.random() * 20),
      y: 50 + Math.sin(p.angle) * (20 + Math.random() * 20),
    }));

    if (get().useApi) {
      try {
        set(s => ({ syncState: { ...s.syncState, isLoading: true, error: null } }));
        await gameApi.feedAnimals(buildingId);
        set(s => ({ syncState: { ...s.syncState, lastSyncAt: Date.now() } }));
      } catch (error) {
        set(s => ({ syncState: { ...s.syncState, error: '喂食失败，使用本地模式' } }));
      } finally {
        set(s => ({ syncState: { ...s.syncState, isLoading: false } }));
      }
    }

    set(state => ({
      animals: state.animals.map(a =>
        a.buildingId === buildingId
          ? { ...a, health: Math.min(ANIMAL_HEALTH_MAX, a.health + 25), lastFed: now }
          : a
      ),
      feedParticles: [...state.feedParticles, ...particles],
    }));

    setTimeout(() => {
      set(state => ({
        feedParticles: state.feedParticles.filter(p => p.buildingId !== buildingId),
      }));
    }, 1000);
  },

  collectProduct: async (buildingId: string) => {
    const building = get().buildings.find(b => b.id === buildingId);
    if (!building) return;

    const buildingType = get().getBuildingType(building.typeId);
    if (!buildingType) return;

    const now = Date.now();
    const readyAnimals = get().animals.filter(
      a => a.buildingId === buildingId && a.productReadyAt <= now
    );

    if (readyAnimals.length === 0) return;

    if (get().useApi) {
      try {
        set(s => ({ syncState: { ...s.syncState, isLoading: true, error: null } }));
        await gameApi.collectProduct(buildingId);
        set(s => ({ syncState: { ...s.syncState, lastSyncAt: Date.now() } }));
      } catch (error) {
        set(s => ({ syncState: { ...s.syncState, error: '收集失败，使用本地模式' } }));
      } finally {
        set(s => ({ syncState: { ...s.syncState, isLoading: false } }));
      }
    }

    const collectedAmount = readyAnimals.length;
    const productName = buildingType.productName;
    const productKey = buildingType.productTargetKey;
    const interval = buildingType.productIntervalMs;

    set(state => ({
      animals: state.animals.map(a =>
        readyAnimals.find(ra => ra.id === a.id)
          ? { ...a, productReadyAt: now + interval }
          : a
      ),
      user: {
        ...state.user,
        inventory: {
          ...state.user.inventory,
          [productName]: (state.user.inventory[productName] || 0) + collectedAmount,
          [productKey]: (state.user.inventory[productKey] || 0) + collectedAmount,
        },
      },
    }));

    const order = get().orders.find(o =>
      (o.targetItem === productKey || o.targetItem === productName.toLowerCase()) && !o.completed
    );
    if (order) {
      await get().submitOrderItem(order.id, collectedAmount);
    }
  },

  submitOrderItem: async (orderId: string, amount: number) => {
    const currentUsername = get().user.username;

    if (get().useApi) {
      try {
        set(s => ({ syncState: { ...s.syncState, isLoading: true, error: null } }));
        await gameApi.submitOrder(orderId, amount);
        set(s => ({ syncState: { ...s.syncState, lastSyncAt: Date.now() } }));
      } catch (error) {
        set(s => ({ syncState: { ...s.syncState, error: '提交订单失败，使用本地模式' } }));
      } finally {
        set(s => ({ syncState: { ...s.syncState, isLoading: false } }));
      }
    }

    set(state => {
      const order = state.orders.find(o => o.id === orderId);
      if (!order || order.completed) return state;

      const newAmount = Math.min(order.targetAmount, order.currentAmount + amount);
      const justCompleted = newAmount >= order.targetAmount && !order.completed;

      let newContributions = state.contributions;
      let newUser = state.user;

      if (justCompleted) {
        const myContribution = state.contributions.find(c => c.username === currentUsername);
        if (myContribution) {
          setTimeout(() => {
            get().addContributionPoints(myContribution.id, 50);
          }, 500);
        }
        newUser = {
          ...state.user,
          coins: state.user.coins + order.reward,
        };
      }

      return {
        orders: state.orders.map(o =>
          o.id === orderId
            ? {
                ...o,
                currentAmount: newAmount,
                completed: justCompleted || o.completed,
                completedAt: justCompleted ? Date.now() : o.completedAt,
              }
            : o
        ),
        user: newUser,
      };
    });
  },

  addContributionPoints: (contributionId: string, points: number) => {
    const floatId = uuidv4();
    const now = Date.now();

    set(state => ({
      contributions: state.contributions.map(c =>
        c.id === contributionId
          ? {
              ...c,
              points: c.points + points,
              count: c.count + 1,
              lastPointsChange: now,
              lastUpdate: now,
            }
          : c
      ),
      floatingPoints: [
        ...state.floatingPoints,
        {
          id: floatId,
          contributionId,
          points,
          createdAt: now,
        },
      ],
    }));

    setTimeout(() => {
      set(state => ({
        floatingPoints: state.floatingPoints.filter(f => f.id !== floatId),
      }));
    }, 1500);
  },

  updateTime: () => {
    set({ currentTime: Date.now() });
  },

  tickGrowth: () => {
    set(state => ({
      plots: state.plots.map(p => {
        if (p.status === 'empty' || p.status === 'building' || !p.cropId || !p.plantedAt) return p;
        return { ...p, status: get().getPlotStatus(p) };
      }),
    }));
  },

  syncWithApi: async () => {
    if (!get().useApi) return;

    try {
      set(s => ({ syncState: { ...s.syncState, isLoading: true, error: null } }));

      const [plots, buildings, animals, orders, contributions] = await Promise.all([
        gameApi.getPlots(),
        Promise.resolve(get().buildings),
        gameApi.getAnimals(),
        gameApi.getOrders(),
        gameApi.getContributions(),
      ]);

      if (plots && plots.length > 0) set(s => ({ plots }));
      if (animals && animals.length > 0) set(s => ({ animals }));
      if (orders && orders.length > 0) set(s => ({ orders }));
      if (contributions && contributions.length > 0) set(s => ({ contributions }));

      set(s => ({
        syncState: {
          ...s.syncState,
          isLoading: false,
          lastSyncAt: Date.now(),
          error: null,
        },
      }));
    } catch (error) {
      set(s => ({
        syncState: {
          ...s.syncState,
          isLoading: false,
          error: 'API同步失败，使用本地数据',
        },
      }));
    }
  },

  fetchAllData: async () => {
    if (!get().useApi) return;

    try {
      set(s => ({ syncState: { ...s.syncState, isLoading: true, error: null } }));

      await Promise.all([
        gameApi.login(get().user.username),
        get().syncWithApi(),
      ]);
    } catch (error) {
      set(s => ({
        syncState: {
          ...s.syncState,
          isLoading: false,
          error: '加载数据失败',
        },
      }));
    }
  },

  setUseApi: (use: boolean) => {
    set({ useApi: use });
    if (use) {
      get().fetchAllData();
    }
  },
}));
