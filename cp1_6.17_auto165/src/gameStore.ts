import { create } from 'zustand';
import type { GameState, GameEvent, Planet, Commodity, EventLog } from './types';
import { createEconomyEngine, adjustPriceAfterBuy, adjustPriceAfterSell } from './EconomyEngine';
import { createEventBus, createEventSystem } from './EventSystem';
import {
  createInitialShip, buyCommodity, sellCommodity, moveShip,
  upgradeCargo, upgradeFuelTank, processEventChoice,
  getCargoUsed, updatePlanetTradeRefusal,
} from './ShipState';
import { v4 as uuidv4 } from 'uuid';

const economyEngine = createEconomyEngine();
const eventBus = createEventBus();
const eventSystem = createEventSystem(eventBus);

interface GameActions {
  initGame: () => void;
  travelToPlanet: (planet: Planet) => void;
  selectCommodity: (commodity: Commodity | null) => void;
  setTradeQuantity: (qty: number) => void;
  executeBuy: () => void;
  executeSell: () => void;
  handleEventChoice: (optionIndex: number) => void;
  dismissEvent: () => void;
  doUpgradeCargo: () => void;
  doUpgradeFuelTank: () => void;
  saveGame: () => void;
  loadGame: () => void;
  nextDay: () => void;
  setMapZoom: (zoom: number) => void;
}

const initialState: GameState = {
  planets: [],
  ship: createInitialShip(''),
  currentPlanet: null,
  eventLogs: [],
  turn: 1,
  activeEvent: null,
  selectedCommodity: null,
  tradeQuantity: 1,
  lastSaveTime: null,
  isMoving: false,
  mapZoom: 1,
};

export const useGameStore = create<GameState & GameActions>((set, get) => {
  eventBus.subscribe((event: GameEvent) => {
    const state = get();
    if (!state.activeEvent) {
      set({ activeEvent: event });
    }
  });

  return {
    ...initialState,

    initGame: () => {
      const planets = economyEngine.getPlanets();
      const startPlanet = planets[Math.floor(Math.random() * planets.length)];
      const ship = createInitialShip(startPlanet.id);
      ship.x = startPlanet.x;
      ship.y = startPlanet.y;
      set({
        planets,
        ship,
        currentPlanet: startPlanet,
        eventLogs: [],
        turn: 1,
        activeEvent: null,
        selectedCommodity: null,
        tradeQuantity: 1,
        isMoving: false,
        mapZoom: 1,
      });
    },

    travelToPlanet: (planet: Planet) => {
      const state = get();
      if (state.ship.fuel < 1) return;
      if (state.ship.currentPlanetId === planet.id) return;
      if (state.isMoving) return;
      if (state.activeEvent) return;

      set({ isMoving: true });

      setTimeout(() => {
        const currentState = get();
        const newShip = moveShip(currentState.ship, planet);
        const maybeEvent = eventSystem.triggerRandomEvent();

        const newPlanets = updatePlanetTradeRefusal(
          economyEngine.dailyFluctuation(),
          newShip.reputation
        );

        if (!maybeEvent) {
          set({
            ship: newShip,
            currentPlanet: newPlanets.find(p => p.id === planet.id) ?? planet,
            planets: newPlanets,
            turn: currentState.turn + 1,
            isMoving: false,
            selectedCommodity: null,
            tradeQuantity: 1,
          });
        } else {
          set({
            ship: newShip,
            currentPlanet: newPlanets.find(p => p.id === planet.id) ?? planet,
            planets: newPlanets,
            activeEvent: maybeEvent,
            turn: currentState.turn + 1,
            isMoving: false,
            selectedCommodity: null,
            tradeQuantity: 1,
          });
        }
      }, 300);
    },

    selectCommodity: (commodity: Commodity | null) => {
      set({ selectedCommodity: commodity, tradeQuantity: 1 });
    },

    setTradeQuantity: (qty: number) => {
      set({ tradeQuantity: Math.max(1, qty) });
    },

    executeBuy: () => {
      const state = get();
      if (!state.selectedCommodity || !state.currentPlanet) return;
      if (state.currentPlanet.refusesTrade) return;

      const commodity = state.currentPlanet.commodities.find(
        c => c.id === state.selectedCommodity!.id
      );
      if (!commodity) return;

      const qty = state.tradeQuantity;
      const newShip = buyCommodity(
        state.ship,
        commodity.id,
        commodity.name,
        commodity.currentPrice,
        qty
      );

      if (newShip === state.ship) return;

      const updatedCommodity = adjustPriceAfterBuy(commodity);
      const updatedPlanet: Planet = {
        ...state.currentPlanet,
        commodities: state.currentPlanet.commodities.map(c =>
          c.id === commodity.id ? updatedCommodity : c
        ),
      };
      economyEngine.updatePlanet(updatedPlanet);

      const newPlanets = state.planets.map(p =>
        p.id === updatedPlanet.id ? updatedPlanet : p
      );

      const log: EventLog = {
        id: uuidv4(),
        message: `购买了 ${qty} 单位 ${commodity.name}，单价 ${commodity.currentPrice}`,
        isPositive: true,
        timestamp: Date.now(),
      };

      set({
        ship: { ...newShip, reputation: Math.min(100, newShip.reputation + 1) },
        planets: newPlanets,
        currentPlanet: updatedPlanet,
        selectedCommodity: updatedCommodity,
        eventLogs: [...state.eventLogs.slice(-4), log],
      });
    },

    executeSell: () => {
      const state = get();
      if (!state.selectedCommodity || !state.currentPlanet) return;
      if (state.currentPlanet.refusesTrade) return;

      const commodity = state.currentPlanet.commodities.find(
        c => c.id === state.selectedCommodity!.id
      );
      if (!commodity) return;

      const qty = state.tradeQuantity;
      const newShip = sellCommodity(
        state.ship,
        commodity.id,
        qty,
        commodity.currentPrice
      );

      if (newShip === state.ship) return;

      const updatedCommodity = adjustPriceAfterSell(commodity);
      const updatedPlanet: Planet = {
        ...state.currentPlanet,
        commodities: state.currentPlanet.commodities.map(c =>
          c.id === commodity.id ? updatedCommodity : c
        ),
      };
      economyEngine.updatePlanet(updatedPlanet);

      const newPlanets = state.planets.map(p =>
        p.id === updatedPlanet.id ? updatedPlanet : p
      );

      const log: EventLog = {
        id: uuidv4(),
        message: `出售了 ${qty} 单位 ${commodity.name}，单价 ${commodity.currentPrice}`,
        isPositive: true,
        timestamp: Date.now(),
      };

      set({
        ship: { ...newShip, reputation: Math.min(100, newShip.reputation + 1) },
        planets: newPlanets,
        currentPlanet: updatedPlanet,
        selectedCommodity: updatedCommodity,
        eventLogs: [...state.eventLogs.slice(-4), log],
      });
    },

    handleEventChoice: (optionIndex: number) => {
      const state = get();
      if (!state.activeEvent) return;

      const { ship: newShip, log } = processEventChoice(
        state.ship,
        state.activeEvent,
        optionIndex
      );

      const newPlanets = updatePlanetTradeRefusal(state.planets, newShip.reputation);

      set({
        ship: newShip,
        activeEvent: null,
        planets: newPlanets,
        eventLogs: [...state.eventLogs.slice(-4), log],
      });
    },

    dismissEvent: () => {
      set({ activeEvent: null });
    },

    doUpgradeCargo: () => {
      const state = get();
      const newShip = upgradeCargo(state.ship);
      if (!newShip) return;
      set({ ship: newShip });
    },

    doUpgradeFuelTank: () => {
      const state = get();
      const newShip = upgradeFuelTank(state.ship);
      if (!newShip) return;
      set({ ship: newShip });
    },

    saveGame: () => {
      const state = get();
      const saveData = {
        planets: state.planets,
        ship: state.ship,
        turn: state.turn,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('pixel-star-trade-save', JSON.stringify(saveData));
      set({ lastSaveTime: saveData.savedAt });
    },

    loadGame: () => {
      const raw = localStorage.getItem('pixel-star-trade-save');
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        const planets = economyEngine.loadPlanets(data.planets);
        const currentPlanet = planets.find((p: Planet) => p.id === data.ship.currentPlanetId) ?? null;
        set({
          planets,
          ship: data.ship,
          currentPlanet,
          turn: data.turn,
          lastSaveTime: data.savedAt,
          activeEvent: null,
          selectedCommodity: null,
          tradeQuantity: 1,
          isMoving: false,
        });
      } catch {
        // invalid save
      }
    },

    nextDay: () => {
      const state = get();
      const newPlanets = updatePlanetTradeRefusal(
        economyEngine.dailyFluctuation(),
        state.ship.reputation
      );
      const currentPlanet = newPlanets.find(p => p.id === state.ship.currentPlanetId) ?? state.currentPlanet;
      set({ planets: newPlanets, currentPlanet, turn: state.turn + 1 });
    },

    setMapZoom: (zoom: number) => {
      set({ mapZoom: Math.max(0.5, Math.min(2, zoom)) });
    },
  };
});
