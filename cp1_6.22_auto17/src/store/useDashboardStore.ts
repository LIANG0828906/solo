import { create } from 'zustand';
import { CardConfig, ConnectionStatus, ServerMetrics, DEFAULT_CARDS } from '@/types';

const MAX_HISTORY = 60;

interface DashboardState {
  connectionStatus: ConnectionStatus;
  wsUrl: string;
  latency: number;
  lastTimestamp: number | null;
  cardOrder: string[];
  collapsedCards: Set<string>;
  metrics: ServerMetrics | null;
  cpuHistory: number[];
  memoryHistory: number[];
  networkInHistory: number[];
  networkOutHistory: number[];
  diskReadHistory: number[];
  diskWriteHistory: number[];
  pulseEffect: boolean;
  errorMessage: string | null;
  showDownloadToast: boolean;
  scanEffect: boolean;
  explosionEffect: boolean;
  bounceEffect: boolean;
  previousValues: Record<string, number>;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setWsUrl: (url: string) => void;
  setLatency: (latency: number) => void;
  setLastTimestamp: (ts: number) => void;
  setMetrics: (metrics: ServerMetrics) => void;
  swapCards: (from: number, to: number) => void;
  toggleCollapse: (id: string) => void;
  clearData: () => void;
  resetLayout: () => void;
  triggerPulse: () => void;
  triggerExplosion: () => void;
  triggerBounce: () => void;
  triggerScan: () => void;
  setErrorMessage: (msg: string | null) => void;
  setShowDownloadToast: (show: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  connectionStatus: 'disconnected',
  wsUrl: 'ws://localhost:3001/ws',
  latency: 0,
  lastTimestamp: null,
  cardOrder: DEFAULT_CARDS.map(c => c.id),
  collapsedCards: new Set<string>(),
  metrics: null,
  cpuHistory: [],
  memoryHistory: [],
  networkInHistory: [],
  networkOutHistory: [],
  diskReadHistory: [],
  diskWriteHistory: [],
  pulseEffect: false,
  errorMessage: null,
  showDownloadToast: false,
  scanEffect: false,
  explosionEffect: false,
  bounceEffect: false,
  previousValues: {},

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setWsUrl: (url) => set({ wsUrl: url }),
  setLatency: (latency) => set({ latency }),
  setLastTimestamp: (ts) => set({ lastTimestamp: ts }),

  setMetrics: (metrics) =>
    set((state) => {
      const prev = state.previousValues;
      const changed: Record<string, number> = {};
      const fields = ['cpu', 'memory', 'networkIn', 'networkOut', 'diskRead', 'diskWrite'] as const;
      for (const f of fields) {
        if (prev[f] !== undefined && prev[f] !== metrics[f]) {
          changed[f] = metrics[f];
        }
      }
      return {
        metrics,
        previousValues: { ...prev, ...changed },
        cpuHistory: [...state.cpuHistory.slice(-(MAX_HISTORY - 1)), metrics.cpu],
        memoryHistory: [...state.memoryHistory.slice(-(MAX_HISTORY - 1)), metrics.memory],
        networkInHistory: [...state.networkInHistory.slice(-(MAX_HISTORY - 1)), metrics.networkIn],
        networkOutHistory: [...state.networkOutHistory.slice(-(MAX_HISTORY - 1)), metrics.networkOut],
        diskReadHistory: [...state.diskReadHistory.slice(-(MAX_HISTORY - 1)), metrics.diskRead],
        diskWriteHistory: [...state.diskWriteHistory.slice(-(MAX_HISTORY - 1)), metrics.diskWrite],
      };
    }),

  swapCards: (from, to) =>
    set((state) => {
      const order = [...state.cardOrder];
      const temp = order[from];
      order[from] = order[to];
      order[to] = temp;
      return { cardOrder: order };
    }),

  toggleCollapse: (id) =>
    set((state) => {
      const next = new Set(state.collapsedCards);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { collapsedCards: next };
    }),

  clearData: () =>
    set({
      cpuHistory: [],
      memoryHistory: [],
      networkInHistory: [],
      networkOutHistory: [],
      diskReadHistory: [],
      diskWriteHistory: [],
      metrics: null,
      previousValues: {},
    }),

  resetLayout: () =>
    set({
      cardOrder: DEFAULT_CARDS.map(c => c.id),
      collapsedCards: new Set<string>(),
    }),

  triggerPulse: () => set({ pulseEffect: true }),
  triggerExplosion: () => set({ explosionEffect: true }),
  triggerBounce: () => set({ bounceEffect: true }),
  triggerScan: () => set({ scanEffect: true }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  setShowDownloadToast: (show) => set({ showDownloadToast: show }),
}));
