import { create } from 'zustand';
import {
  Equipment,
  Listing,
  TradeRecord,
  LogEntry,
  Notification,
  Rarity,
} from '../types';
import {
  generateDrawEquipment,
  generateSynthEquipment,
} from '../engine/EquipmentGenerator';
import {
  createListing,
  placeBid as marketPlaceBid,
  checkListingCompletion,
  createTradeRecord,
} from '../engine/EquipmentMarket';

const PLAYER_ID = 'player_1';
const DRAW_COST = 50;

interface GameState {
  playerId: string;
  playerName: string;
  currency: number;
  backpack: Equipment[];
  fragments: Record<string, number>;
  listings: Listing[];
  tradeRecords: TradeRecord[];
  logs: LogEntry[];
  notifications: Notification[];
  backpackOpen: boolean;
  selectedEquipment: Equipment | null;
  listModalOpen: boolean;
  bidModalListing: Listing | null;
  tradeHistoryOpen: boolean;
  backpackFilter: Rarity | 'all';
  backpackSearch: string;

  toggleBackpack: () => void;
  setBackpackFilter: (filter: Rarity | 'all') => void;
  setBackpackSearch: (search: string) => void;
  selectEquipment: (eq: Equipment | null) => void;
  setListModalOpen: (open: boolean) => void;
  setBidModalListing: (listing: Listing | null) => void;
  setTradeHistoryOpen: (open: boolean) => void;

  drawEquipment: () => void;
  synthEquipment: (fragmentIds: string[]) => void;
  listItem: (equipmentId: string, startPrice: number, duration: number) => void;
  placeBid: (listingId: string, amount: number) => void;
  decomposeItem: (equipmentId: string) => void;
  tickMarket: () => void;
  addNotification: (message: string, type?: 'success' | 'warning' | 'info') => void;
  removeNotification: (id: string) => void;
}

let notifIdCounter = 0;

export const useGameStore = create<GameState>((set, get) => ({
  playerId: PLAYER_ID,
  playerName: '赛博行者',
  currency: 5000,
  backpack: [],
  fragments: {
    quantum: 10,
    nano: 10,
    plasma: 10,
    bio: 10,
    dark: 10,
  },
  listings: [],
  tradeRecords: [],
  logs: [],
  notifications: [],
  backpackOpen: false,
  selectedEquipment: null,
  listModalOpen: false,
  bidModalListing: null,
  tradeHistoryOpen: false,
  backpackFilter: 'all',
  backpackSearch: '',

  toggleBackpack: () => set(s => ({ backpackOpen: !s.backpackOpen })),
  setBackpackFilter: (filter) => set({ backpackFilter: filter }),
  setBackpackSearch: (search) => set({ backpackSearch: search }),
  selectEquipment: (eq) => set({ selectedEquipment: eq }),
  setListModalOpen: (open) => set({ listModalOpen: open }),
  setBidModalListing: (listing) => set({ bidModalListing: listing }),
  setTradeHistoryOpen: (open) => set({ tradeHistoryOpen: open }),

  drawEquipment: () => {
    const { currency } = get();
    if (currency < DRAW_COST) {
      get().addNotification('信用点不足，无法抽取', 'warning');
      return;
    }
    const equipment = generateDrawEquipment();
    set(s => ({
      currency: s.currency - DRAW_COST,
      backpack: [...s.backpack, equipment],
      logs: [
        { id: equipment.id, equipment, mode: 'draw', timestamp: Date.now() },
        ...s.logs.slice(0, 4),
      ],
    }));
    get().addNotification(`获得 ${equipment.itemName}`, 'success');
  },

  synthEquipment: (fragmentIds) => {
    if (fragmentIds.length !== 3) {
      get().addNotification('合成需要3个碎片', 'warning');
      return;
    }
    const { fragments } = get();
    const needed: Record<string, number> = {};
    for (const f of fragmentIds) {
      needed[f] = (needed[f] || 0) + 1;
    }
    for (const [f, count] of Object.entries(needed)) {
      if ((fragments[f] || 0) < count) {
        get().addNotification('碎片不足', 'warning');
        return;
      }
    }
    const equipment = generateSynthEquipment(fragmentIds);
    const newFragments = { ...fragments };
    for (const f of fragmentIds) {
      newFragments[f] -= 1;
    }
    set(s => ({
      fragments: newFragments,
      backpack: [...s.backpack, equipment],
      logs: [
        { id: equipment.id, equipment, mode: 'synth', timestamp: Date.now() },
        ...s.logs.slice(0, 4),
      ],
    }));
    get().addNotification(`合成 ${equipment.itemName}`, 'success');
  },

  listItem: (equipmentId, startPrice, duration) => {
    const { backpack, playerId } = get();
    const eq = backpack.find(e => e.id === equipmentId);
    if (!eq) return;
    const listing = createListing({
      equipment: eq,
      sellerId: playerId,
      startPrice,
      duration,
    });
    set(s => ({
      backpack: s.backpack.filter(e => e.id !== equipmentId),
      listings: [...s.listings, listing],
      selectedEquipment: null,
      listModalOpen: false,
    }));
    get().addNotification(`${eq.itemName} 已上架`, 'info');
  },

  placeBid: (listingId, amount) => {
    const { listings, playerId, currency } = get();
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    if (currency < amount) {
      get().addNotification('信用点不足', 'warning');
      return;
    }
    const result = marketPlaceBid(listing, playerId, amount, listings);
    if (!result.success) {
      get().addNotification(result.message, 'warning');
      return;
    }
    let refund = 0;
    const prevHighest = listing.highestBidderId;
    if (prevHighest && prevHighest !== playerId) {
      refund = listing.currentPrice;
    }
    set(s => ({
      currency: s.currency - amount + refund,
      listings: s.listings.map(l =>
        l.id === listingId
          ? { ...l, currentPrice: result.newPrice, highestBidderId: playerId }
          : l
      ),
    }));
    get().addNotification('出价成功', 'success');
  },

  decomposeItem: (equipmentId) => {
    const { backpack, fragments } = get();
    const eq = backpack.find(e => e.id === equipmentId);
    if (!eq) return;
    const fragKeys = Object.keys(fragments);
    const randomFrag = fragKeys[Math.floor(Math.random() * fragKeys.length)];
    const bonus = eq.rarity === 'legendary' ? 3 : eq.rarity === 'epic' ? 2 : 1;
    const currencyReturn = eq.rarity === 'legendary' ? 200 : eq.rarity === 'epic' ? 100 : eq.rarity === 'rare' ? 50 : 20;
    set(s => ({
      backpack: s.backpack.filter(e => e.id !== equipmentId),
      fragments: { ...s.fragments, [randomFrag]: s.fragments[randomFrag] + bonus },
      currency: s.currency + currencyReturn,
      selectedEquipment: null,
    }));
    get().addNotification(`分解 ${eq.itemName}，获得${bonus}个碎片和${currencyReturn}信用点`, 'info');
  },

  tickMarket: () => {
    const { listings, playerId } = get();
    const updated: Listing[] = [];
    const newTradeRecords: TradeRecord[] = [];
    const newNotifications: { message: string; type: 'success' | 'warning' | 'info' }[] = [];

    for (const listing of listings) {
      const completed = checkListingCompletion(listing);
      if (completed.status === 'completed' && listing.status === 'active') {
        const record = createTradeRecord(completed);
        if (record) {
          newTradeRecords.push(record);
          if (completed.highestBidderId === playerId) {
            newNotifications.push({
              message: `恭喜！你以 ${completed.currentPrice} 信用点竞得 ${completed.equipment.itemName}`,
              type: 'success',
            });
          } else if (completed.sellerId === playerId) {
            newNotifications.push({
              message: `${completed.equipment.itemName} 已以 ${completed.currentPrice} 信用点售出`,
              type: 'success',
            });
          }
        }
      }
      updated.push(completed);
    }

    const wonEquipments = updated
      .filter(l => l.status === 'completed' && l.highestBidderId === playerId && listings.find(ol => ol.id === l.id)?.status === 'active')
      .map(l => l.equipment);

    set(s => ({
      listings: updated,
      tradeRecords: [...newTradeRecords, ...s.tradeRecords].slice(0, 50),
      backpack: [...s.backpack, ...wonEquipments],
    }));

    for (const n of newNotifications) {
      get().addNotification(n.message, n.type);
    }
  },

  addNotification: (message, type = 'info') => {
    const id = `notif_${Date.now()}_${++notifIdCounter}`;
    set(s => ({
      notifications: [...s.notifications, { id, message, type, timestamp: Date.now() }],
    }));
    setTimeout(() => {
      get().removeNotification(id);
    }, 3500);
  },

  removeNotification: (id) => {
    set(s => ({
      notifications: s.notifications.filter(n => n.id !== id),
    }));
  },
}));
