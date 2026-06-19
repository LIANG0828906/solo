import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export type Industry = 'farm' | 'factory' | 'tech';
export type ResourceType = 'money' | 'wood' | 'iron' | 'food' | 'product';
export type TerrainType = 'forest' | 'mountain' | 'plain' | 'water' | 'empty';
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
  resourceType: TerrainType;
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
  isConnected: boolean;
  isPaused: boolean;
  socket: WebSocket | null;
  productionTimer: number | null;
  buildingTimer: number | null;
  initSocket: (playerId: string) => void;
  disconnectSocket: () => void;
  startGameLoop: () => void;
  stopGameLoop: () => void;
  setPaused: (paused: boolean) => void;
  setCurrentPlayer: (id: string | null) => void;
  setPlayerName: (name: string) => void;
  selectIndustry: (industry: Industry) => void;
  selectTile: (tileId: string | null) => void;
  buyTile: (tileId: string) => Promise<boolean>;
  buildOnTile: (tileId: string, buildingType: BuildingType) => Promise<boolean>;
  upgradeBuilding: (tileId: string) => Promise<boolean>;
  createMarketOrder: (order: Omit<MarketOrder, 'id' | 'createdAt' | 'sellerId' | 'sellerName'>) => Promise<boolean>;
  acceptMarketOrder: (orderId: string) => Promise<boolean>;
  addFloatingText: (text: Omit<FloatingText, 'id' | 'createdAt'>) => void;
  removeFloatingText: (id: string) => void;
  setMapOffset: (x: number, y: number) => void;
  setMapZoom: (zoom: number) => void;
  updateTile: (tile: HexTile) => void;
  updatePlayer: (player: Player) => void;
  updateMarketOrder: (order: MarketOrder) => void;
  removeMarketOrder: (orderId: string) => void;
  addMarketOrder: (order: MarketOrder) => void;
  fetchInitialState: () => Promise<void>;
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
  const terrainTypes: TerrainType[] = ['empty', 'forest', 'plain', 'mountain', 'water'];
  const weights = [35, 25, 20, 15, 5];

  const weightedRandom = (): TerrainType => {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < terrainTypes.length; i++) {
      random -= weights[i];
      if (random <= 0) return terrainTypes[i];
    }
    return terrainTypes[0];
  };

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (Math.abs(q + r) <= radius) {
        const id = `${q},${r}`;
        const dist = Math.abs(q) + Math.abs(r) + Math.abs(q + r);
        const basePrice = 500 - dist * 40;
        const price = Math.max(100, Math.min(500, basePrice + Math.floor(Math.random() * 61) - 30));
        tiles[id] = {
          id,
          q,
          r,
          price,
          resourceType: weightedRandom(),
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
  players: {},
  tiles: {},
  marketOrders: [],
  selectedTileId: null,
  floatingTexts: [],
  mapOffset: { x: 0, y: 0 },
  mapZoom: 1,
  isConnected: false,
  isPaused: false,
  socket: null,
  productionTimer: null,
  buildingTimer: null,

  initSocket: (playerId: string) => {
    if (get().socket) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${playerId}`;
    const socket = new WebSocket(wsUrl);

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        const { event: evt, data } = msg;

        switch (evt) {
          case 'tile_updated':
            get().updateTile(data as HexTile);
            break;
          case 'player_updated':
            get().updatePlayer(data as Player);
            break;
          case 'resources_updated': {
            const { playerId: pid, resources } = data as { playerId: string; resources: Record<ResourceType, number> };
            set((state) => ({
              players: {
                ...state.players,
                [pid]: { ...state.players[pid], resources },
              },
            }));
            break;
          }
          case 'building_progress': {
            const { tileId, progress } = data as { tileId: string; progress: number };
            set((state) => {
              const tile = state.tiles[tileId];
              if (!tile || !tile.building) return state;
              return {
                tiles: {
                  ...state.tiles,
                  [tileId]: {
                    ...tile,
                    building: { ...tile.building, buildProgress: progress },
                  },
                },
              };
            });
            break;
          }
          case 'production': {
            const { playerId: pid, resource, amount } = data as { playerId: string; resource: ResourceType; amount: number };
            if (pid === get().currentPlayerId) {
              get().addFloatingText({
                text: `+${amount} ${getResourceName(resource)}`,
                color: '#ffd700',
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0,
              });
            }
            break;
          }
          case 'market_order_created':
            get().addMarketOrder(data as MarketOrder);
            break;
          case 'market_order_updated':
            get().updateMarketOrder(data as MarketOrder);
            break;
          case 'market_order_removed':
            get().removeMarketOrder(data as string);
            break;
          case 'market_order_filled': {
            const orderId = data as string;
            const order = get().marketOrders.find((o) => o.id === orderId);
            if (order) {
              get().updateMarketOrder({ ...order, justFilled: true });
              setTimeout(() => get().removeMarketOrder(orderId), 1500);
            }
            break;
          }
          case 'player_joined':
            set((state) => ({
              players: { ...state.players, [(data as Player).id]: data as Player },
            }));
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    const connect = () => {
      socket.onopen = () => {
        console.log('WebSocket connected');
        set({ isConnected: true });
        reconnectAttempts = 0;
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        set({ isConnected: false });
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(() => {
            const newSocket = new WebSocket(wsUrl);
            set({ socket: newSocket });
            newSocket.onopen = socket.onopen;
            newSocket.onclose = socket.onclose;
            newSocket.onmessage = handleMessage;
          }, 1000 * reconnectAttempts);
        }
      };

      socket.onmessage = handleMessage;
    };

    connect();
    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, isConnected: false });
    }
  },

  startGameLoop: () => {
    const { productionTimer, buildingTimer, isPaused } = get();
    if (productionTimer || buildingTimer || isPaused) return;

    const handleVisibility = () => {
      set({ isPaused: document.hidden });
    };

    document.addEventListener('visibilitychange', handleVisibility);
  },

  stopGameLoop: () => {
    const { productionTimer, buildingTimer } = get();
    if (productionTimer) {
      clearInterval(productionTimer);
    }
    if (buildingTimer) {
      clearInterval(buildingTimer);
    }
    set({ productionTimer: null, buildingTimer: null });
    document.removeEventListener('visibilitychange', () => {});
  },

  setPaused: (paused) => set({ isPaused: paused }),

  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  setPlayerName: async (name) => {
    try {
      const res = await axios.post('/api/players', { name });
      const player = res.data as Player;
      set((state) => ({
        currentPlayerId: player.id,
        players: { ...state.players, [player.id]: player },
      }));
      get().initSocket(player.id);
    } catch (e) {
      console.error('Failed to create player:', e);
    }
  },

  selectIndustry: async (industry) => {
    const { currentPlayerId } = get();
    if (!currentPlayerId) return;
    try {
      const res = await axios.post(`/api/players/${currentPlayerId}/industry`, { industry });
      get().updatePlayer(res.data);
    } catch (e) {
      console.error('Failed to select industry:', e);
    }
  },

  selectTile: (tileId) => set({ selectedTileId: tileId }),

  buyTile: async (tileId) => {
    const { currentPlayerId } = get();
    if (!currentPlayerId) return false;
    try {
      await axios.post(`/api/tiles/${tileId}/buy`, { playerId: currentPlayerId });
      return true;
    } catch (e) {
      console.error('Failed to buy tile:', e);
      return false;
    }
  },

  buildOnTile: async (tileId, buildingType) => {
    const { currentPlayerId } = get();
    if (!currentPlayerId) return false;
    try {
      await axios.post(`/api/tiles/${tileId}/build`, { playerId: currentPlayerId, buildingType });
      return true;
    } catch (e) {
      console.error('Failed to build:', e);
      return false;
    }
  },

  upgradeBuilding: async (tileId) => {
    const { currentPlayerId } = get();
    if (!currentPlayerId) return false;
    try {
      await axios.post(`/api/tiles/${tileId}/upgrade`, { playerId: currentPlayerId });
      return true;
    } catch (e) {
      console.error('Failed to upgrade:', e);
      return false;
    }
  },

  createMarketOrder: async (order) => {
    const { currentPlayerId } = get();
    if (!currentPlayerId) return false;
    try {
      await axios.post('/api/market', { ...order, playerId: currentPlayerId });
      return true;
    } catch (e) {
      console.error('Failed to create order:', e);
      return false;
    }
  },

  acceptMarketOrder: async (orderId) => {
    const { currentPlayerId } = get();
    if (!currentPlayerId) return false;
    try {
      await axios.post(`/api/market/${orderId}/accept`, { playerId: currentPlayerId });
      return true;
    } catch (e) {
      console.error('Failed to accept order:', e);
      return false;
    }
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

  updateTile: (tile) => set((state) => ({
    tiles: { ...state.tiles, [tile.id]: tile },
  })),

  updatePlayer: (player) => set((state) => ({
    players: { ...state.players, [player.id]: player },
  })),

  updateMarketOrder: (order) => set((state) => ({
    marketOrders: state.marketOrders.map((o) => (o.id === order.id ? order : o)),
  })),

  addMarketOrder: (order) => set((state) => ({
    marketOrders: [...state.marketOrders, order],
  })),

  removeMarketOrder: (orderId) => set((state) => ({
    marketOrders: state.marketOrders.filter((o) => o.id !== orderId),
  })),

  fetchInitialState: async () => {
    try {
      const [tilesRes, marketRes, playersRes] = await Promise.all([
        axios.get('/api/tiles'),
        axios.get('/api/market'),
        axios.get('/api/players'),
      ]);

      const tilesMap: Record<string, HexTile> = {};
      tilesRes.data.forEach((t: HexTile) => { tilesMap[t.id] = t; });

      const playersMap: Record<string, Player> = {};
      playersRes.data.forEach((p: Player) => { playersMap[p.id] = p; });

      set({
        tiles: tilesMap,
        players: playersMap,
        marketOrders: marketRes.data,
      });
    } catch (e) {
      console.error('Failed to fetch initial state:', e);
    }
  },

  tickProduction: () => {},

  tickBuildingProgress: () => {},

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

export function getTerrainName(type: TerrainType): string {
  const names: Record<TerrainType, string> = {
    forest: '森林',
    mountain: '矿山',
    plain: '平原',
    water: '水域',
    empty: '空地',
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
