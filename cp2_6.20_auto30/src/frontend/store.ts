import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type Industry = 'farm' | 'factory' | 'tech';
export type ResourceType = 'money' | 'wood' | 'iron' | 'food' | 'product';
export type BuildingType = 'lumbermill' | 'mine' | 'factory' | 'farm' | 'techlab';

export interface Player {
  id: string;
  name: string;
  industry: Industry;
  color: string;
  resources: Record<ResourceType, number>;
}

export interface Building {
  id: string;
  type: BuildingType;
  level: number;
  buildProgress: number;
  lastProduction: number;
}

export interface HexTile {
  id: string;
  q: number;
  r: number;
  price: number;
  resourceType: Exclude<ResourceType, 'money' | 'product'> | 'empty';
  ownerId: string | null;
  building: Building | null;
}

export interface MarketOrder {
  id: string;
  sellerId: string;
  sellerName: string;
  itemType: ResourceType;
  quantity: number;
  pricePerUnit: number;
  isBuyOrder: boolean;
  createdAt: number;
  justFilled?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  createdAt: number;
}

interface GameState {
  currentPlayerId: string | null;
  players: Record<string, Player>;
  tiles: Record<string, HexTile>;
  marketOrders: MarketOrder[];
  selectedTileId: string | null;
  floatingTexts: FloatingText[];
  mapOffset: { x: number; y: number };
  mapZoom: number;
  setCurrentPlayer: (id: string | null) => void;
  setPlayerName: (name: string) => void;
  selectIndustry: (industry: Industry) => void;
  selectTile: (tileId: string | null) => void;
  buyTile: (tileId: string) => void;
  buildOnTile: (tileId: string, buildingType: BuildingType) => void;
  upgradeBuilding: (tileId: string) => void;
  createMarketOrder: (order: Omit<MarketOrder, 'id' | 'createdAt' | 'sellerId' | 'sellerName'>) => void;
  acceptMarketOrder: (orderId: string) => void;
  addFloatingText: (text: Omit<FloatingText, 'id' | 'createdAt'>) => void;
  removeFloatingText: (id: string) => void;
  setMapOffset: (x: number, y: number) => void;
  setMapZoom: (zoom: number) => void;
  tickProduction: () => void;
  tickBuildingProgress: () => void;
  getCurrentPlayer: () => Player | null;
}

const PLAYER_COLORS = ['#e94560', '#00d4ff', '#ffd700', '#32cd32'];

const INDUSTRY_STARTS: Record<Industry, Record<ResourceType, number>> = {
  farm: { money: 500, wood: 50, iron: 20, food: 100, product: 0 },
  factory: { money: 800, wood: 30, iron: 60, food: 30, product: 0 },
  tech: { money: 1200, wood: 20, iron: 40, food: 20, product: 0 },
};

const BUILDING_COSTS: Record<BuildingType, Partial<Record<ResourceType, number>>> = {
  lumbermill: { money: 200, wood: 50 },
  mine: { money: 300, wood: 30, iron: 20 },
  factory: { money: 500, wood: 100, iron: 80 },
  farm: { money: 150, wood: 40 },
  techlab: { money: 800, wood: 60, iron: 100, food: 50 },
};

const BUILDING_OUTPUTS: Record<BuildingType, { resource: Exclude<ResourceType, 'money'>; amount: number }> = {
  lumbermill: { resource: 'wood', amount: 5 },
  mine: { resource: 'iron', amount: 3 },
  factory: { resource: 'product', amount: 2 },
  farm: { resource: 'food', amount: 8 },
  techlab: { resource: 'product', amount: 5 },
};

const generateTiles = (): Record<string, HexTile> => {
  const tiles: Record<string, HexTile> = {};
  const radius = 4;
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (Math.abs(q + r) <= radius) {
        const id = `${q},${r}`;
        const types: HexTile['resourceType'][] = ['wood', 'iron', 'food', 'empty', 'empty'];
        const dist = Math.abs(q) + Math.abs(r) + Math.abs(q + r);
        tiles[id] = {
          id,
          q,
          r,
          price: 100 + dist * 30 + Math.floor(Math.random() * 50),
          resourceType: types[Math.floor(Math.random() * types.length)],
          ownerId: null,
          building: null,
        };
      }
    }
  }
  return tiles;
};

const createMockPlayers = (): Record<string, Player> => ({
  ai1: {
    id: 'ai1',
    name: '农场主AI',
    industry: 'farm',
    color: '#32cd32',
    resources: { money: 600, wood: 40, iron: 15, food: 150, product: 5 },
  },
  ai2: {
    id: 'ai2',
    name: '工厂主AI',
    industry: 'factory',
    color: '#00d4ff',
    resources: { money: 900, wood: 25, iron: 70, food: 25, product: 10 },
  },
});

export const useGameStore = create<GameState>((set, get) => ({
  currentPlayerId: null,
  players: createMockPlayers(),
  tiles: generateTiles(),
  marketOrders: [
    {
      id: 'mock1',
      sellerId: 'ai1',
      sellerName: '农场主AI',
      itemType: 'food',
      quantity: 50,
      pricePerUnit: 8,
      isBuyOrder: false,
      createdAt: Date.now() - 10000,
    },
    {
      id: 'mock2',
      sellerId: 'ai2',
      sellerName: '工厂主AI',
      itemType: 'iron',
      quantity: 30,
      pricePerUnit: 15,
      isBuyOrder: false,
      createdAt: Date.now() - 5000,
    },
    {
      id: 'mock3',
      sellerId: 'ai1',
      sellerName: '农场主AI',
      itemType: 'wood',
      quantity: 20,
      pricePerUnit: 12,
      isBuyOrder: true,
      createdAt: Date.now() - 3000,
    },
  ],
  selectedTileId: null,
  floatingTexts: [],
  mapOffset: { x: 0, y: 0 },
  mapZoom: 1,

  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  setPlayerName: (name) => {
    const id = uuidv4();
    set((state) => ({
      currentPlayerId: id,
      players: {
        ...state.players,
        [id]: {
          id,
          name,
          industry: 'farm',
          color: PLAYER_COLORS[0],
          resources: { money: 500, wood: 0, iron: 0, food: 0, product: 0 },
        },
      },
    }));
  },

  selectIndustry: (industry) => {
    const { currentPlayerId, players } = get();
    if (!currentPlayerId) return;
    const player = players[currentPlayerId];
    set({
      players: {
        ...players,
        [currentPlayerId]: {
          ...player,
          industry,
          resources: { ...INDUSTRY_STARTS[industry] },
        },
      },
    });
  },

  selectTile: (tileId) => set({ selectedTileId: tileId }),

  buyTile: (tileId) => {
    const { currentPlayerId, tiles, players } = get();
    if (!currentPlayerId) return;
    const tile = tiles[tileId];
    const player = players[currentPlayerId];
    if (!tile || tile.ownerId || player.resources.money < tile.price) return;

    set({
      players: {
        ...players,
        [currentPlayerId]: {
          ...player,
          resources: { ...player.resources, money: player.resources.money - tile.price },
        },
      },
      tiles: {
        ...tiles,
        [tileId]: { ...tile, ownerId: currentPlayerId },
      },
    });
  },

  buildOnTile: (tileId, buildingType) => {
    const { currentPlayerId, tiles, players } = get();
    if (!currentPlayerId) return;
    const tile = tiles[tileId];
    const player = players[currentPlayerId];
    if (!tile || tile.ownerId !== currentPlayerId || tile.building) return;

    const cost = BUILDING_COSTS[buildingType];
    for (const [res, amt] of Object.entries(cost)) {
      if ((player.resources as any)[res] < (amt as number)) return;
    }

    const newResources = { ...player.resources };
    for (const [res, amt] of Object.entries(cost)) {
      (newResources as any)[res] -= amt as number;
    }

    set({
      players: { ...players, [currentPlayerId]: { ...player, resources: newResources } },
      tiles: {
        ...tiles,
        [tileId]: {
          ...tile,
          building: {
            id: uuidv4(),
            type: buildingType,
            level: 1,
            buildProgress: 0,
            lastProduction: Date.now(),
          },
        },
      },
    });
  },

  upgradeBuilding: (tileId) => {
    const { currentPlayerId, tiles, players } = get();
    if (!currentPlayerId) return;
    const tile = tiles[tileId];
    if (!tile || tile.ownerId !== currentPlayerId || !tile.building) return;
    const building = tile.building;
    const player = players[currentPlayerId];
    const upgradeCost = building.level * 300;
    if (player.resources.money < upgradeCost) return;

    set({
      players: {
        ...players,
        [currentPlayerId]: {
          ...player,
          resources: { ...player.resources, money: player.resources.money - upgradeCost },
        },
      },
      tiles: {
        ...tiles,
        [tileId]: {
          ...tile,
          building: { ...building, level: building.level + 1 },
        },
      },
    });
  },

  createMarketOrder: (order) => {
    const { currentPlayerId, players, marketOrders } = get();
    if (!currentPlayerId) return;
    const player = players[currentPlayerId];

    if (order.isBuyOrder) {
      const totalCost = order.quantity * order.pricePerUnit;
      if (player.resources.money < totalCost) return;
      set({
        players: {
          ...players,
          [currentPlayerId]: {
            ...player,
            resources: { ...player.resources, money: player.resources.money - totalCost },
          },
        },
        marketOrders: [
          ...marketOrders,
          { ...order, id: uuidv4(), sellerId: currentPlayerId, sellerName: player.name, createdAt: Date.now() },
        ],
      });
    } else {
      if ((player.resources as any)[order.itemType] < order.quantity) return;
      const newResources = { ...player.resources };
      (newResources as any)[order.itemType] -= order.quantity;
      set({
        players: { ...players, [currentPlayerId]: { ...player, resources: newResources } },
        marketOrders: [
          ...marketOrders,
          { ...order, id: uuidv4(), sellerId: currentPlayerId, sellerName: player.name, createdAt: Date.now() },
        ],
      });
    }
  },

  acceptMarketOrder: (orderId) => {
    const { currentPlayerId, players, marketOrders } = get();
    if (!currentPlayerId) return;
    const order = marketOrders.find((o) => o.id === orderId);
    if (!order || order.sellerId === currentPlayerId) return;
    const buyer = players[currentPlayerId];
    const seller = players[order.sellerId];
    if (!buyer || !seller) return;

    if (order.isBuyOrder) {
      if ((buyer.resources as any)[order.itemType] < order.quantity) return;
      const buyerRes = { ...buyer.resources };
      const sellerRes = { ...seller.resources };
      (buyerRes as any)[order.itemType] -= order.quantity;
      buyerRes.money += order.quantity * order.pricePerUnit;
      (sellerRes as any)[order.itemType] += order.quantity;
      set({
        players: {
          ...players,
          [currentPlayerId]: { ...buyer, resources: buyerRes },
          [order.sellerId]: { ...seller, resources: sellerRes },
        },
        marketOrders: marketOrders.map((o) => (o.id === orderId ? { ...o, justFilled: true } : o)),
      });
    } else {
      const totalCost = order.quantity * order.pricePerUnit;
      if (buyer.resources.money < totalCost) return;
      const buyerRes = { ...buyer.resources };
      const sellerRes = { ...seller.resources };
      buyerRes.money -= totalCost;
      (buyerRes as any)[order.itemType] += order.quantity;
      sellerRes.money += totalCost;
      set({
        players: {
          ...players,
          [currentPlayerId]: { ...buyer, resources: buyerRes },
          [order.sellerId]: { ...seller, resources: sellerRes },
        },
        marketOrders: marketOrders.map((o) => (o.id === orderId ? { ...o, justFilled: true } : o)),
      });
    }

    setTimeout(() => {
      set((s) => ({ marketOrders: s.marketOrders.filter((o) => o.id !== orderId) }));
    }, 1500);
  },

  addFloatingText: (ft) => {
    const id = uuidv4();
    set((s) => ({
      floatingTexts: [...s.floatingTexts, { ...ft, id, createdAt: Date.now() }],
    }));
    setTimeout(() => {
      set((s) => ({ floatingTexts: s.floatingTexts.filter((f) => f.id !== id) }));
    }, 1200);
  },

  removeFloatingText: (id) => {
    set((s) => ({ floatingTexts: s.floatingTexts.filter((f) => f.id !== id) }));
  },

  setMapOffset: (x, y) => set({ mapOffset: { x, y } }),
  setMapZoom: (zoom) => set({ mapZoom: Math.max(0.5, Math.min(2, zoom)) }),

  tickProduction: () => {
    const { tiles, players, currentPlayerId } = get();
    const now = Date.now();
    const newTiles = { ...tiles };
    const newPlayers = { ...players };
    let changed = false;

    for (const tile of Object.values(tiles)) {
      if (tile.building && tile.building.buildProgress >= 100 && tile.ownerId) {
        const building = tile.building;
        if (now - building.lastProduction >= 5000) {
          const output = BUILDING_OUTPUTS[building.type];
          const owner = newPlayers[tile.ownerId];
          if (owner) {
            const amt = output.amount * building.level;
            newPlayers[tile.ownerId] = {
              ...owner,
              resources: {
                ...owner.resources,
                [output.resource]: (owner.resources as any)[output.resource] + amt,
              },
            };
            newTiles[tile.id] = {
              ...tile,
              building: { ...building, lastProduction: now },
            };
            changed = true;
            if (tile.ownerId === currentPlayerId) {
              get().addFloatingText({
                text: `+${amt} ${getResourceName(output.resource)}`,
                color: '#ffd700',
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0,
              });
            }
          }
        }
      }
    }

    if (changed) {
      set({ tiles: newTiles, players: newPlayers });
    }
  },

  tickBuildingProgress: () => {
    const { tiles } = get();
    let changed = false;
    const newTiles = { ...tiles };
    for (const tile of Object.values(tiles)) {
      if (tile.building && tile.building.buildProgress < 100) {
        newTiles[tile.id] = {
          ...tile,
          building: { ...tile.building, buildProgress: Math.min(100, tile.building.buildProgress + 5) },
        };
        changed = true;
      }
    }
    if (changed) set({ tiles: newTiles });
  },

  getCurrentPlayer: () => {
    const { currentPlayerId, players } = get();
    return currentPlayerId ? players[currentPlayerId] : null;
  },
}));

export function getResourceName(type: ResourceType): string {
  const names: Record<ResourceType, string> = {
    money: '金币',
    wood: '木材',
    iron: '铁矿',
    food: '食物',
    product: '产品',
  };
  return names[type];
}

export function getBuildingName(type: BuildingType): string {
  const names: Record<BuildingType, string> = {
    lumbermill: '伐木场',
    mine: '矿场',
    factory: '加工厂',
    farm: '农场',
    techlab: '科技实验室',
  };
  return names[type];
}

export { BUILDING_COSTS, BUILDING_OUTPUTS, INDUSTRY_STARTS };
