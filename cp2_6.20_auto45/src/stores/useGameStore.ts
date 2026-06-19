import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export type PlotStatus = 'empty' | 'seed' | 'sprout' | 'growing' | 'mature' | 'building';

export interface CropType {
  id: string;
  name: string;
  growTime: number;
  seedPrice: number;
  harvestReward: number;
  icon: string;
  matureIcon: string;
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
}

export interface Building {
  id: string;
  typeId: string;
  x: number;
  y: number;
}

export interface Animal {
  id: string;
  type: string;
  health: number;
  lastFed: number;
  productReadyAt: number;
  buildingId: string;
  icon: string;
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
}

export interface Contribution {
  id: string;
  username: string;
  count: number;
  points: number;
  lastPointsChange?: number;
}

export interface User {
  id: string;
  username: string;
  coins: number;
  inventory: Record<string, number>;
}

export const CROP_TYPES: CropType[] = [
  { id: 'wheat', name: '小麦', growTime: 30, seedPrice: 10, harvestReward: 25, icon: '🌱', matureIcon: '🌾' },
  { id: 'carrot', name: '胡萝卜', growTime: 45, seedPrice: 15, harvestReward: 40, icon: '🌱', matureIcon: '🥕' },
  { id: 'tomato', name: '番茄', growTime: 60, seedPrice: 20, harvestReward: 55, icon: '🌱', matureIcon: '🍅' },
  { id: 'corn', name: '玉米', growTime: 90, seedPrice: 25, harvestReward: 70, icon: '🌱', matureIcon: '🌽' },
];

export const BUILDING_TYPES: BuildingType[] = [
  { id: 'chicken', name: '鸡舍', size: { width: 2, height: 2 }, cost: 100, animalType: 'chicken', icon: '🏠', productIcon: '🥚', productName: '鸡蛋' },
  { id: 'cow', name: '牛棚', size: { width: 3, height: 2 }, cost: 200, animalType: 'cow', icon: '🏡', productIcon: '🥛', productName: '牛奶' },
  { id: 'sheep', name: '羊圈', size: { width: 2, height: 2 }, cost: 150, animalType: 'sheep', icon: '🛖', productIcon: '🧶', productName: '羊毛' },
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
    { id: 'b1', typeId: 'chicken', x: 6, y: 0 },
    { id: 'b2', typeId: 'cow', x: 0, y: 6 },
  ];
};

const generateInitialAnimals = (): Animal[] => {
  const now = Date.now();
  return [
    { id: 'a1', type: 'chicken', health: 80, lastFed: now, productReadyAt: now + 60000, buildingId: 'b1', icon: '🐔' },
    { id: 'a2', type: 'chicken', health: 65, lastFed: now - 30000, productReadyAt: now + 120000, buildingId: 'b1', icon: '🐔' },
    { id: 'a3', type: 'cow', health: 90, lastFed: now, productReadyAt: now + 180000, buildingId: 'b2', icon: '🐮' },
  ];
};

const generateInitialOrders = (): Order[] => {
  return [
    { id: 'o1', name: '收集鸡蛋', icon: '🥚', targetItem: 'egg', targetAmount: 50, currentAmount: 12, reward: 200, completed: false },
    { id: 'o2', name: '收获小麦', icon: '🌾', targetItem: 'wheat', targetAmount: 30, currentAmount: 8, reward: 150, completed: false },
    { id: 'o3', name: '收集牛奶', icon: '🥛', targetItem: 'milk', targetAmount: 20, currentAmount: 20, reward: 180, completed: true, completedAt: Date.now() - 300000 },
  ];
};

const generateInitialContributions = (): Contribution[] => {
  return [
    { id: 'c1', username: '农场主小明', count: 15, points: 450 },
    { id: 'c2', username: '勤劳的小红', count: 12, points: 380 },
    { id: 'c3', username: '快乐农夫', count: 8, points: 240 },
    { id: 'c4', username: '新手小白', count: 3, points: 90 },
  ];
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
  feedParticles: { id: string; buildingId: string; x: number; y: number }[];
  floatingPoints: { id: string; contributionId: string; points: number }[];
  currentTime: number;

  getCropType: (id: string) => CropType | undefined;
  getBuildingType: (id: string) => BuildingType | undefined;
  getPlotStatus: (plot: Plot) => PlotStatus;
  getPlotGrowthProgress: (plot: Plot) => number;
  getAnimalsInBuilding: (buildingId: string) => Animal[];
  formatCountdown: (timestamp: number) => string;

  selectPlot: (plotId: string | null) => void;
  plantCrop: (plotId: string, cropId: string) => void;
  harvestCrop: (plotId: string) => void;
  openBuildingDetail: (building: Building | null) => void;
  feedAnimals: (buildingId: string) => void;
  collectProduct: (buildingId: string) => void;
  submitOrderItem: (orderId: string, amount: number) => void;
  addContributionPoints: (contributionId: string, points: number) => void;
  updateTime: () => void;
  tickGrowth: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: {
    id: 'user-1',
    username: '农场主小明',
    coins: 500,
    inventory: { wheat: 8, egg: 12, milk: 5 },
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

  getCropType: (id: string) => CROP_TYPES.find(c => c.id === id),
  getBuildingType: (id: string) => BUILDING_TYPES.find(b => b.id === id),

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

  selectPlot: (plotId: string | null) => {
    if (plotId === null) {
      set({ selectedPlotId: null, showPlantMenu: false });
      return;
    }
    const plot = get().plots.find(p => p.id === plotId);
    if (plot?.status === 'empty') {
      set({ selectedPlotId: plotId, showPlantMenu: true });
    } else if (plot?.status === 'mature') {
      get().harvestCrop(plotId);
    }
  },

  plantCrop: (plotId: string, cropId: string) => {
    const cropType = get().getCropType(cropId);
    if (!cropType) return;
    if (get().user.coins < cropType.seedPrice) return;

    set(state => ({
      plots: state.plots.map(p => 
        p.id === plotId 
          ? { ...p, status: 'seed', cropId, plantedAt: Date.now() }
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

  harvestCrop: (plotId: string) => {
    const plot = get().plots.find(p => p.id === plotId);
    if (!plot || !plot.cropId) return;
    
    const cropType = get().getCropType(plot.cropId);
    if (!cropType) return;

    set(state => ({
      plots: state.plots.map(p =>
        p.id === plotId
          ? { ...p, status: 'empty', cropId: undefined, plantedAt: undefined }
          : p
      ),
      user: {
        ...state.user,
        coins: state.user.coins + cropType.harvestReward,
        inventory: {
          ...state.user.inventory,
          [cropType.id]: (state.user.inventory[cropType.id] || 0) + 1,
        },
      },
    }));

    const cropOrder = get().orders.find(o => o.targetItem === cropType.id && !o.completed);
    if (cropOrder) {
      get().submitOrderItem(cropOrder.id, 1);
    }
  },

  openBuildingDetail: (building: Building | null) => {
    set({ showBuildingDetail: building });
  },

  feedAnimals: (buildingId: string) => {
    const now = Date.now();
    const particles = Array.from({ length: 8 }, (_, i) => ({
      id: uuidv4(),
      buildingId,
      x: 50 + Math.cos(i * Math.PI / 4) * 30,
      y: 50 + Math.sin(i * Math.PI / 4) * 30,
    }));

    set(state => ({
      animals: state.animals.map(a =>
        a.buildingId === buildingId
          ? { ...a, health: Math.min(100, a.health + 20), lastFed: now }
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

  collectProduct: (buildingId: string) => {
    const building = get().buildings.find(b => b.id === buildingId);
    if (!building) return;
    
    const buildingType = get().getBuildingType(building.typeId);
    if (!buildingType) return;

    const now = Date.now();
    const readyAnimals = get().animals.filter(
      a => a.buildingId === buildingId && a.productReadyAt <= now
    );

    if (readyAnimals.length === 0) return;

    set(state => ({
      animals: state.animals.map(a =>
        readyAnimals.find(ra => ra.id === a.id)
          ? { ...a, productReadyAt: now + 120000 }
          : a
      ),
      user: {
        ...state.user,
        inventory: {
          ...state.user.inventory,
          [buildingType.productName]: (state.user.inventory[buildingType.productName] || 0) + readyAnimals.length,
        },
      },
    }));

    const order = get().orders.find(o => 
      o.targetItem === buildingType.productName.toLowerCase().replace(/\s/g, '') && !o.completed
    );
    if (order) {
      get().submitOrderItem(order.id, readyAnimals.length);
    }
  },

  submitOrderItem: (orderId: string, amount: number) => {
    set(state => {
      const order = state.orders.find(o => o.id === orderId);
      if (!order || order.completed) return state;

      const newAmount = Math.min(order.targetAmount, order.currentAmount + amount);
      const completed = newAmount >= order.targetAmount;

      if (completed) {
        const myContribution = state.contributions.find(c => c.username === state.user.username);
        if (myContribution) {
          setTimeout(() => {
            get().addContributionPoints(myContribution.id, 50);
          }, 500);
        }
      }

      return {
        orders: state.orders.map(o =>
          o.id === orderId
            ? { ...o, currentAmount: newAmount, completed, completedAt: completed ? Date.now() : undefined }
            : o
        ),
        user: completed 
          ? { ...state.user, coins: state.user.coins + order.reward }
          : state.user,
      };
    });
  },

  addContributionPoints: (contributionId: string, points: number) => {
    const floatId = uuidv4();
    set(state => ({
      contributions: state.contributions.map(c =>
        c.id === contributionId
          ? { ...c, points: c.points + points, count: c.count + 1, lastPointsChange: Date.now() }
          : c
      ),
      floatingPoints: [...state.floatingPoints, { id: floatId, contributionId, points }],
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
}));
