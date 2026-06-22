import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from 'date-fns';

export type ActivityType = 'sowing' | 'watering' | 'fertilizing' | 'weeding' | 'harvesting';
export type PlotStatus = 'unclaimed' | 'claimed' | 'planting';

export interface Plot {
  id: string;
  row: number;
  col: number;
  status: PlotStatus;
  ownerId: string | null;
  ownerName: string | null;
  color: string | null;
  currentCrop: string | null;
  totalYield: number;
}

export interface LogEntry {
  id: string;
  plotId: string;
  userId: string;
  date: string;
  activityType: ActivityType;
  note: string;
  cropName?: string;
  weight?: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  initials: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userColor: string;
  score: number;
  logCount: number;
  harvestWeight: number;
  plotCount: number;
  rank: number;
}

export interface CropStat {
  cropName: string;
  weight: number;
  color: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

export const PRESET_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
  '#ff6b6b', '#48dbfb', '#a29bfe', '#fd79a8',
];

export const CROP_COLORS: Record<string, string> = {
  '番茄': '#e74c3c',
  '黄瓜': '#2ecc71',
  '辣椒': '#e67e22',
  '茄子': '#9b59b6',
  '生菜': '#27ae60',
  '萝卜': '#e74c3c',
  '胡萝卜': '#e67e22',
  '白菜': '#2ecc71',
  '豆角': '#27ae60',
  '南瓜': '#f39c12',
  '草莓': '#e91e63',
  '向日葵': '#f1c40f',
  '玉米': '#f1c40f',
  '西瓜': '#27ae60',
  '土豆': '#d4a574',
  '洋葱': '#9b59b6',
  '菠菜': '#27ae60',
  '薄荷': '#1abc9c',
};

const GRID_SIZE = 6;
const STORAGE_KEY = 'grove-commons-data-v2';

const SAMPLE_OWNERS = [
  { name: '张小花', color: '#2ecc71', initials: '张' },
  { name: '李果园', color: '#e67e22', initials: '李' },
  { name: '王菜园', color: '#3498db', initials: '王' },
  { name: '赵农夫', color: '#9b59b6', initials: '赵' },
];

const SAMPLE_CROPS = ['番茄', '黄瓜', '生菜', '辣椒', '茄子', '萝卜', '胡萝卜', '白菜', '豆角', '草莓'];

interface PersistedState {
  plots: Plot[];
  logs: LogEntry[];
  users: User[];
  currentUserId: string | null;
}

interface GardenState extends PersistedState {
  selectedPlotId: string | null;
  isLogPanelOpen: boolean;
  initialized: boolean;
  leaderboardPeriod: 'month' | 'all';

  initStore: () => Promise<void>;
  claimPlot: (plotId: string, color: string) => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'userId'>) => void;
  selectPlot: (plotId: string | null) => void;
  toggleLogPanel: (open?: boolean) => void;
  setCurrentUser: (name: string, color: string) => void;
  setLeaderboardPeriod: (period: 'month' | 'all') => void;
  persistState: () => Promise<void>;
}

const createInitialPlots = (): Plot[] => {
  const plots: Plot[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      let status: PlotStatus = 'unclaimed';
      let ownerName: string | null = null;
      let color: string | null = null;
      let currentCrop: string | null = null;

      if (row < 2) {
        status = 'claimed';
        const ownerIdx = col % SAMPLE_OWNERS.length;
        ownerName = SAMPLE_OWNERS[ownerIdx].name;
        color = SAMPLE_OWNERS[ownerIdx].color;
        currentCrop = SAMPLE_CROPS[(row * GRID_SIZE + col) % SAMPLE_CROPS.length];
      } else if (row === 2) {
        status = 'planting';
        const ownerIdx = col % SAMPLE_OWNERS.length;
        ownerName = SAMPLE_OWNERS[ownerIdx].name;
        color = SAMPLE_OWNERS[ownerIdx].color;
        currentCrop = SAMPLE_CROPS[(row * GRID_SIZE + col) % SAMPLE_CROPS.length];
      }

      plots.push({
        id: `plot-${row}-${col}`,
        row,
        col,
        status,
        ownerId: ownerName ? `user-${ownerName}` : null,
        ownerName,
        color,
        currentCrop,
        totalYield: status === 'claimed' ? Math.floor(Math.random() * 2000) + 500 : 0,
      });
    }
  }
  return plots;
};

const createInitialUsers = (): User[] => {
  return SAMPLE_OWNERS.map((o, i) => ({
    id: `user-${o.name}`,
    name: o.name,
    color: o.color,
    initials: o.initials,
  }));
};

const getPersistedState = async (): Promise<PersistedState | null> => {
  try {
    const data = await idbGet<PersistedState>(STORAGE_KEY);
    return data || null;
  } catch {
    return null;
  }
};

export const useGardenStore = create<GardenState>((set, get) => ({
  plots: createInitialPlots(),
  logs: [],
  users: createInitialUsers(),
  currentUserId: null,
  selectedPlotId: null,
  isLogPanelOpen: false,
  initialized: true,
  leaderboardPeriod: 'all',

  initStore: async () => {
    try {
      const persisted = await getPersistedState();
      if (persisted && persisted.plots && persisted.plots.length > 0 && 'status' in persisted.plots[0]) {
        set({
          plots: persisted.plots,
          logs: persisted.logs || [],
          users: persisted.users || [],
          currentUserId: persisted.currentUserId,
          initialized: true,
        });
      } else {
        set({ initialized: true });
      }
    } catch (e) {
      console.error('initStore error:', e);
      set({ initialized: true });
    }
  },

  claimPlot: (plotId, color) => {
    const state = get();
    const user = state.users.find((u) => u.id === state.currentUserId);
    if (!user) return;

    set({
      plots: state.plots.map((p) =>
        p.id === plotId && p.status === 'unclaimed'
          ? { ...p, status: 'claimed' as PlotStatus, ownerId: user.id, ownerName: user.name, color }
          : p
      ),
    });
    get().persistState();
  },

  addLog: (entry) => {
    const state = get();
    const user = state.users.find((u) => u.id === state.currentUserId);
    if (!user) return;

    const newLog: LogEntry = {
      ...entry,
      id: uuidv4(),
      userId: user.id,
    };

    const newLogs = [...state.logs, newLog];

    let newPlots = state.plots;
    if (entry.activityType === 'harvesting' && entry.weight) {
      newPlots = state.plots.map((p) =>
        p.id === entry.plotId
          ? { ...p, totalYield: p.totalYield + (entry.weight || 0) }
          : p
      );
    }

    set({ logs: newLogs, plots: newPlots });
    get().persistState();
  },

  selectPlot: (plotId) => {
    set({ selectedPlotId: plotId });
  },

  toggleLogPanel: (open) => {
    set({ isLogPanelOpen: open !== undefined ? open : !get().isLogPanelOpen });
  },

  setCurrentUser: (name, color) => {
    const state = get();
    const initials = name.slice(0, 2).toUpperCase();
    const existingUser = state.users.find((u) => u.name === name);

    if (existingUser) {
      set({ currentUserId: existingUser.id });
    } else {
      const newUser: User = {
        id: uuidv4(),
        name,
        color,
        initials,
      };
      set({
        users: [...state.users, newUser],
        currentUserId: newUser.id,
      });
    }
    get().persistState();
  },

  setLeaderboardPeriod: (period) => {
    set({ leaderboardPeriod: period });
  },

  persistState: async () => {
    const state = get();
    try {
      await idbSet(STORAGE_KEY, {
        plots: state.plots,
        logs: state.logs,
        users: state.users,
        currentUserId: state.currentUserId,
      });
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  },
}));

export function computeLeaderboard(
  plots: Plot[],
  logs: LogEntry[],
  users: User[],
  period: 'month' | 'all'
): LeaderboardEntry[] {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const filteredLogs =
    period === 'month'
      ? logs.filter((l) => {
          try {
            const d = parseISO(l.date);
            return isWithinInterval(d, { start: monthStart, end: monthEnd });
          } catch {
            return false;
          }
        })
      : logs;

  const entries: LeaderboardEntry[] = users.map((user) => {
    const userLogs = filteredLogs.filter((l) => l.userId === user.id);
    const logCount = userLogs.length;
    const harvestWeight = userLogs
      .filter((l) => l.activityType === 'harvesting' && l.weight)
      .reduce((sum, l) => sum + (l.weight || 0), 0);
    const plotCount = plots.filter((p) => p.ownerId === user.id).length;
    const score = logCount * 2 + harvestWeight / 100 + plotCount * 5;

    return {
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      score: Math.round(score * 100) / 100,
      logCount,
      harvestWeight,
      plotCount,
      rank: 0,
    };
  });

  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  return entries;
}

export function computeStats(
  plots: Plot[],
  logs: LogEntry[]
): {
  totalPlots: number;
  claimedPlots: number;
  totalLogs: number;
  totalHarvest: number;
  cropDistribution: CropStat[];
  activityHeatmap: HeatmapDay[];
} {
  const totalPlots = plots.length;
  const claimedPlots = plots.filter((p) => p.ownerId).length;
  const totalLogs = logs.length;
  const totalHarvest = logs
    .filter((l) => l.activityType === 'harvesting' && l.weight)
    .reduce((sum, l) => sum + (l.weight || 0), 0);

  const cropMap = new Map<string, number>();
  logs
    .filter((l) => l.activityType === 'harvesting' && l.cropName && l.weight)
    .forEach((l) => {
      const current = cropMap.get(l.cropName!) || 0;
      cropMap.set(l.cropName!, current + (l.weight || 0));
    });

  const cropDistribution: CropStat[] = Array.from(cropMap.entries()).map(
    ([cropName, weight]) => ({
      cropName,
      weight,
      color: CROP_COLORS[cropName] || '#95a5a6',
    })
  );

  const heatmapDays: HeatmapDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const count = logs.filter((l) => l.date === date).length;
    let level = 0;
    if (count > 0) level = 1;
    if (count >= 3) level = 2;
    if (count >= 6) level = 3;
    if (count >= 10) level = 4;
    heatmapDays.push({ date, count, level });
  }

  return {
    totalPlots,
    claimedPlots,
    totalLogs,
    totalHarvest,
    cropDistribution,
    activityHeatmap: heatmapDays,
  };
}
