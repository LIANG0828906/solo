import { create } from 'zustand';
import type {
  Caravan,
  TripLog,
  Station,
  Camel,
  CargoType,
  MovingCaravan,
  Supplies,
  Route,
} from '@/types';

interface StoreState {
  caravans: Caravan[];
  tripLogs: TripLog[];
  stations: Station[];
  selectedStation: string | null;
  highlightedRoute: string[];
  showRouteDialog: boolean;
  routeStart: string | null;
  routeEnd: string | null;
  movingCaravan: MovingCaravan | null;

  setCaravans: (caravans: Caravan[]) => void;
  setTripLogs: (tripLogs: TripLog[]) => void;
  setStations: (stations: Station[]) => void;
  addTripLog: (log: TripLog) => void;

  addCaravan: (caravan: Omit<Caravan, 'id'>) => void;
  updateCaravan: (id: string, data: Partial<Caravan>) => void;
  deleteCaravan: (id: string) => void;

  addCamel: (caravanId: string, camel: Omit<Camel, 'id'>) => void;
  updateCamel: (
    caravanId: string,
    camelId: string,
    data: Partial<Camel>
  ) => void;
  deleteCamel: (caravanId: string, camelId: string) => void;
  updateCargo: (
    caravanId: string,
    camelId: string,
    cargoType: CargoType,
    weight: number
  ) => void;

  setSelectedStation: (id: string | null) => void;
  updateInventory: (
    stationId: string,
    cargoType: CargoType,
    amount: number
  ) => void;
  addInventory: (stationId: string, cargoType: CargoType, amount: number) => void;
  removeInventory: (
    stationId: string,
    cargoType: CargoType,
    amount: number
  ) => void;

  setShowRouteDialog: (show: boolean) => void;
  setRouteStart: (id: string | null) => void;
  setRouteEnd: (id: string | null) => void;
  setHighlightedRoute: (route: string[]) => void;

  calculateSuppliesNeeded: (route: Route) => Supplies;
  checkSuppliesSufficient: (
    stationId: string,
    needed: Supplies
  ) => { sufficient: boolean; missing: Partial<Supplies> };
  consumeSupplies: (stationId: string, supplies: Supplies) => void;

  startCaravan: (caravanId: string, path: string[]) => void;
  updateCaravanProgress: (caravanId: string, progress: number) => void;
  completeCaravanMove: (caravanId: string, destinationId: string) => void;

  playBellSound: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const mockTripLogs: TripLog[] = [
  {
    id: '1',
    caravanId: 'c1',
    caravanName: '丝路商队',
    origin: '长安',
    destination: '敦煌',
    departTime: Date.now() - 86400000 * 7,
    arriveTime: Date.now() - 86400000 * 5,
    duration: 86400000 * 2,
    totalWeight: 2500,
    suppliesConsumed: { water: 120, forage: 80, horseshoes: 4 },
    remainingCargo: { silk: 50, tea: 30, porcelain: 20, spice: 15, gem: 5 },
  },
  {
    id: '2',
    caravanId: 'c2',
    caravanName: '大漠行者',
    origin: '敦煌',
    destination: '撒马尔罕',
    departTime: Date.now() - 86400000 * 14,
    arriveTime: Date.now() - 86400000 * 8,
    duration: 86400000 * 6,
    totalWeight: 3200,
    suppliesConsumed: { water: 280, forage: 180, horseshoes: 12 },
    remainingCargo: { silk: 80, tea: 45, porcelain: 35, spice: 25, gem: 10 },
  },
  {
    id: '3',
    caravanId: 'c1',
    caravanName: '丝路商队',
    origin: '洛阳',
    destination: '长安',
    departTime: Date.now() - 86400000 * 20,
    arriveTime: Date.now() - 86400000 * 18,
    duration: 86400000 * 2,
    totalWeight: 1800,
    suppliesConsumed: { water: 90, forage: 60, horseshoes: 2 },
    remainingCargo: { silk: 40, tea: 25, porcelain: 15, spice: 10, gem: 3 },
  },
];

const mockStations: Station[] = [
  {
    id: 's1',
    name: '长安',
    x: 100,
    y: 300,
    distanceFromPrev: 0,
    inventory: { silk: 100, tea: 80, porcelain: 60, spice: 40, gem: 20 },
    supplies: { water: 500, forage: 300, horseshoes: 50 },
  },
  {
    id: 's2',
    name: '敦煌',
    x: 300,
    y: 200,
    distanceFromPrev: 1000,
    inventory: { silk: 60, tea: 50, porcelain: 40, spice: 30, gem: 15 },
    supplies: { water: 300, forage: 200, horseshoes: 30 },
  },
  {
    id: 's3',
    name: '撒马尔罕',
    x: 500,
    y: 150,
    distanceFromPrev: 1500,
    inventory: { silk: 40, tea: 30, porcelain: 25, spice: 50, gem: 30 },
    supplies: { water: 200, forage: 150, horseshoes: 20 },
  },
];

const mockCaravans: Caravan[] = [
  {
    id: 'c1',
    name: '丝路商队',
    camels: [
      {
        id: 'cam1',
        type: 'bactrian',
        cargo: [
          { type: 'silk', weight: 100 },
          { type: 'tea', weight: 50 },
        ],
        maxLoad: 200,
      },
    ],
    origin: '长安',
    currentStation: 's1',
    isMoving: false,
  },
];

export const useStore = create<StoreState>((set, get) => ({
  caravans: mockCaravans,
  tripLogs: mockTripLogs,
  stations: mockStations,
  selectedStation: null,
  highlightedRoute: [],
  showRouteDialog: false,
  routeStart: null,
  routeEnd: null,
  movingCaravan: null,

  setCaravans: (caravans) => set({ caravans }),
  setTripLogs: (tripLogs) => set({ tripLogs }),
  setStations: (stations) => set({ stations }),
  addTripLog: (log) =>
    set((state) => ({ tripLogs: [...state.tripLogs, log] })),

  addCaravan: (caravan) =>
    set((state) => ({
      caravans: [...state.caravans, { ...caravan, id: generateId() }],
    })),
  updateCaravan: (id, data) =>
    set((state) => ({
      caravans: state.caravans.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
  deleteCaravan: (id) =>
    set((state) => ({
      caravans: state.caravans.filter((c) => c.id !== id),
    })),

  addCamel: (caravanId, camel) =>
    set((state) => ({
      caravans: state.caravans.map((c) =>
        c.id === caravanId
          ? { ...c, camels: [...c.camels, { ...camel, id: generateId() }] }
          : c
      ),
    })),
  updateCamel: (caravanId, camelId, data) =>
    set((state) => ({
      caravans: state.caravans.map((c) =>
        c.id === caravanId
          ? {
              ...c,
              camels: c.camels.map((cam) =>
                cam.id === camelId ? { ...cam, ...data } : cam
              ),
            }
          : c
      ),
    })),
  deleteCamel: (caravanId, camelId) =>
    set((state) => ({
      caravans: state.caravans.map((c) =>
        c.id === caravanId
          ? { ...c, camels: c.camels.filter((cam) => cam.id !== camelId) }
          : c
      ),
    })),
  updateCargo: (caravanId, camelId, cargoType, weight) =>
    set((state) => ({
      caravans: state.caravans.map((c) =>
        c.id === caravanId
          ? {
              ...c,
              camels: c.camels.map((cam) => {
                if (cam.id !== camelId) return cam;
                const existingCargo = cam.cargo.find(
                  (cg) => cg.type === cargoType
                );
                let newCargo;
                if (existingCargo) {
                  if (weight <= 0) {
                    newCargo = cam.cargo.filter((cg) => cg.type !== cargoType);
                  } else {
                    newCargo = cam.cargo.map((cg) =>
                      cg.type === cargoType ? { ...cg, weight } : cg
                    );
                  }
                } else if (weight > 0) {
                  newCargo = [...cam.cargo, { type: cargoType, weight }];
                } else {
                  newCargo = cam.cargo;
                }
                return { ...cam, cargo: newCargo };
              }),
            }
          : c
      ),
    })),

  setSelectedStation: (id) => set({ selectedStation: id }),
  updateInventory: (stationId, cargoType, amount) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              inventory: { ...s.inventory, [cargoType]: amount },
            }
          : s
      ),
    })),
  addInventory: (stationId, cargoType, amount) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              inventory: {
                ...s.inventory,
                [cargoType]: s.inventory[cargoType] + amount,
              },
            }
          : s
      ),
    })),
  removeInventory: (stationId, cargoType, amount) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              inventory: {
                ...s.inventory,
                [cargoType]: Math.max(0, s.inventory[cargoType] - amount),
              },
            }
          : s
      ),
    })),

  setShowRouteDialog: (show) => set({ showRouteDialog: show }),
  setRouteStart: (id) => set({ routeStart: id }),
  setRouteEnd: (id) => set({ routeEnd: id }),
  setHighlightedRoute: (route) => set({ highlightedRoute: route }),

  calculateSuppliesNeeded: (route) => {
    const state = get();
    const caravan = state.caravans.find((c) => c.currentStation === route.stations[0]);
    const camelCount = caravan?.camels.length || 1;
    const days = Math.ceil(route.totalDistance / 200);
    return {
      water: days * camelCount * 10,
      forage: days * camelCount * 5,
      horseshoes: Math.ceil(days / 3) * camelCount,
    };
  },
  checkSuppliesSufficient: (stationId, needed) => {
    const station = get().stations.find((s) => s.id === stationId);
    if (!station) return { sufficient: false, missing: needed };

    const missing: Partial<Supplies> = {};
    let sufficient = true;

    if (station.supplies.water < needed.water) {
      missing.water = needed.water - station.supplies.water;
      sufficient = false;
    }
    if (station.supplies.forage < needed.forage) {
      missing.forage = needed.forage - station.supplies.forage;
      sufficient = false;
    }
    if (station.supplies.horseshoes < needed.horseshoes) {
      missing.horseshoes = needed.horseshoes - station.supplies.horseshoes;
      sufficient = false;
    }

    return { sufficient, missing };
  },
  consumeSupplies: (stationId, supplies) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              supplies: {
                water: Math.max(0, s.supplies.water - supplies.water),
                forage: Math.max(0, s.supplies.forage - supplies.forage),
                horseshoes: Math.max(
                  0,
                  s.supplies.horseshoes - supplies.horseshoes
                ),
              },
            }
          : s
      ),
    })),

  startCaravan: (caravanId, path) => {
    const caravan = get().caravans.find((c) => c.id === caravanId);
    if (!caravan) return;

    set({
      movingCaravan: {
        caravanId,
        path,
        currentIndex: 0,
        progress: 0,
      },
      caravans: get().caravans.map((c) =>
        c.id === caravanId ? { ...c, isMoving: true } : c
      ),
    });
  },
  updateCaravanProgress: (caravanId, progress) =>
    set((state) => ({
      movingCaravan: state.movingCaravan?.caravanId === caravanId
        ? { ...state.movingCaravan, progress }
        : state.movingCaravan,
    })),
  completeCaravanMove: (caravanId, destinationId) => {
    const state = get();
    const caravan = state.caravans.find((c) => c.id === caravanId);
    if (!caravan || !state.movingCaravan) return;

    const startStation = state.stations.find(
      (s) => s.id === state.movingCaravan!.path[0]
    );
    const endStation = state.stations.find((s) => s.id === destinationId);

    const totalWeight = caravan.camels.reduce(
      (sum, c) => sum + c.cargo.reduce((s, cg) => s + cg.weight, 0),
      0
    );

    const remainingCargo = caravan.camels.reduce(
      (acc, c) => {
        c.cargo.forEach((cg) => {
          acc[cg.type] = (acc[cg.type] || 0) + cg.weight;
        });
        return acc;
      },
      {} as Record<CargoType, number>
    );

    const tripLog: TripLog = {
      id: generateId(),
      caravanId,
      caravanName: caravan.name,
      origin: startStation?.name || '未知',
      destination: endStation?.name || '未知',
      departTime: Date.now() - 86400000 * 2,
      arriveTime: Date.now(),
      duration: 86400000 * 2,
      totalWeight,
      suppliesConsumed: { water: 100, forage: 60, horseshoes: 3 },
      remainingCargo: {
        silk: remainingCargo.silk || 0,
        tea: remainingCargo.tea || 0,
        porcelain: remainingCargo.porcelain || 0,
        spice: remainingCargo.spice || 0,
        gem: remainingCargo.gem || 0,
      },
    };

    set({
      movingCaravan: null,
      caravans: state.caravans.map((c) =>
        c.id === caravanId
          ? { ...c, isMoving: false, currentStation: destinationId }
          : c
      ),
      tripLogs: [...state.tripLogs, tripLog],
    });
  },

  playBellSound: () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  },
}));
