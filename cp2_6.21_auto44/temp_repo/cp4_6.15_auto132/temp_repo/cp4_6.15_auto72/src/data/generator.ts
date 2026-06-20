import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  AttackEvent,
  AttackType,
  AttackStore,
  CountryData,
  GeoCoordinate,
  TopCountryEntry,
} from './types';

const sourceCountries: CountryData[] = [
  { name: 'China', lat: 35.8617, lng: 104.1954 },
  { name: 'United States', lat: 37.0902, lng: -95.7129 },
  { name: 'Russia', lat: 61.524, lng: 105.3188 },
  { name: 'Brazil', lat: -14.235, lng: -51.9253 },
  { name: 'India', lat: 20.5937, lng: 78.9629 },
  { name: 'Vietnam', lat: 14.0583, lng: 108.2772 },
  { name: 'Iran', lat: 32.4279, lng: 53.688 },
  { name: 'North Korea', lat: 40.3399, lng: 127.5101 },
  { name: 'Turkey', lat: 38.9637, lng: 35.2433 },
  { name: 'Ukraine', lat: 48.3794, lng: 31.1656 },
  { name: 'Thailand', lat: 15.87, lng: 100.9925 },
  { name: 'Indonesia', lat: -0.7893, lng: 113.9213 },
  { name: 'Mexico', lat: 23.6345, lng: -102.5528 },
  { name: 'Poland', lat: 51.9194, lng: 19.1451 },
  { name: 'South Korea', lat: 35.9078, lng: 127.7669 },
  { name: 'Japan', lat: 36.2048, lng: 138.2529 },
  { name: 'Germany', lat: 51.1657, lng: 10.4515 },
  { name: 'France', lat: 46.2276, lng: 2.2137 },
  { name: 'United Kingdom', lat: 55.3781, lng: -3.436 },
  { name: 'Canada', lat: 56.1304, lng: -106.3468 },
];

const targetCountries: CountryData[] = [
  { name: 'United States', lat: 37.0902, lng: -95.7129 },
  { name: 'United Kingdom', lat: 55.3781, lng: -3.436 },
  { name: 'Germany', lat: 51.1657, lng: 10.4515 },
  { name: 'Japan', lat: 36.2048, lng: 138.2529 },
  { name: 'South Korea', lat: 35.9078, lng: 127.7669 },
  { name: 'Australia', lat: -25.2744, lng: 133.7751 },
  { name: 'France', lat: 46.2276, lng: 2.2137 },
  { name: 'Canada', lat: 56.1304, lng: -106.3468 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Netherlands', lat: 52.1326, lng: 5.2913 },
];

const attackTypeWeights: { type: AttackType; weight: number }[] = [
  { type: 'DDoS', weight: 60 },
  { type: 'DoS', weight: 25 },
  { type: 'Scan', weight: 15 },
];

function pickWeightedType(): AttackType {
  const total = attackTypeWeights.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  for (const item of attackTypeWeights) {
    random -= item.weight;
    if (random <= 0) return item.type;
  }
  return 'DDoS';
}

function jitterCoord(coord: GeoCoordinate, range = 5): GeoCoordinate {
  return {
    lat: coord.lat + (Math.random() - 0.5) * range * 2,
    lng: coord.lng + (Math.random() - 0.5) * range * 2,
  };
}

function randomBandwidth(type: AttackType): number {
  switch (type) {
    case 'DDoS':
      return 50 + Math.random() * 450;
    case 'DoS':
      return 5 + Math.random() * 50;
    case 'Scan':
      return 0.5 + Math.random() * 5;
    default:
      return 10;
  }
}

function generateEvent(): AttackEvent {
  const sourceCountry = sourceCountries[Math.floor(Math.random() * sourceCountries.length)];
  const targetCountry = targetCountries[Math.floor(Math.random() * targetCountries.length)];
  const type = pickWeightedType();

  return {
    id: uuidv4(),
    source: jitterCoord(sourceCountry),
    target: jitterCoord(targetCountry),
    sourceCountry: sourceCountry.name,
    targetCountry: targetCountry.name,
    bandwidth: randomBandwidth(type),
    type,
    timestamp: Date.now(),
  };
}

function computeTopTargetCountries(events: AttackEvent[]): TopCountryEntry[] {
  const map = new Map<string, number>();
  for (const e of events) {
    map.set(e.targetCountry, (map.get(e.targetCountry) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

const MAX_HISTORY = 100;

export const useAttackStore = create<AttackStore>((set, get) => ({
  isRunning: false,
  filterType: 'ALL',
  events: [],
  stats: {
    totalAttacks: 0,
    topTargetCountries: [],
    peakBandwidth: 0,
  },

  start: () => {
    if (get().isRunning) return;
    set({ isRunning: true });
  },

  stop: () => {
    set({ isRunning: false });
  },

  setFilter: (type) => {
    set({ filterType: type });
  },

  addEvents: (newEvents) => {
    set((state) => {
      const events = [...newEvents, ...state.events].slice(0, MAX_HISTORY);
      const filtered =
        state.filterType === 'ALL'
          ? events
          : events.filter((e) => e.type === state.filterType);

      const peakBandwidth = Math.max(
        state.stats.peakBandwidth,
        ...filtered.map((e) => e.bandwidth),
      );

      const stats = {
        totalAttacks: state.stats.totalAttacks + newEvents.length,
        topTargetCountries: computeTopTargetCountries(events),
        peakBandwidth,
      };

      return { events, stats };
    });
  },
}));

let timerId: number | null = null;

export function startSimulation(): void {
  if (timerId !== null) return;
  useAttackStore.getState().start();

  const tick = () => {
    const state = useAttackStore.getState();
    if (!state.isRunning) return;

    const count = 1 + Math.floor(Math.random() * 4);
    const events: AttackEvent[] = [];
    for (let i = 0; i < count; i++) {
      events.push(generateEvent());
    }
    useAttackStore.getState().addEvents(events);
  };

  timerId = window.setInterval(tick, 500);
  tick();
}

export function stopSimulation(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  useAttackStore.getState().stop();
}

export function toggleSimulation(): void {
  if (useAttackStore.getState().isRunning) {
    stopSimulation();
  } else {
    startSimulation();
  }
}
