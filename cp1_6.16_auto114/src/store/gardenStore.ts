import { create } from 'zustand';
import type { Plot, JournalEntry, Notification, GardenStats } from '../types';
import {
  createInitialPlots,
  generateRandomUserName,
  formatDate,
  uid
} from '../utils';

interface GardenState {
  plots: Plot[];
  selectedPlotId: string | null;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  notifications: Notification[];
  exchangeTargetId: string | null;

  getPlot: (id: string) => Plot | undefined;
  getStats: () => GardenStats;
  getClaimedPlots: () => Plot[];
  getExchangeablePlots: () => Plot[];

  claimPlot: (plotId: string) => void;
  selectPlot: (plotId: string) => void;
  addJournal: (plotId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  markHarvestable: (plotId: string) => void;
  toggleExchangeable: (plotId: string) => void;
  openExchangeModal: (targetPlotId: string) => void;
  closeExchangeModal: () => void;
  exchangePlots: (plotIdA: string, plotIdB: string) => void;
  addNotification: (message: string, type?: Notification['type']) => void;
  dismissNotification: (id: string) => void;
  clearAnimFlag: (plotId: string, flag: 'highlight' | 'waterDrop') => void;
}

export const useGardenStore = create<GardenState>((set, get) => {
  const me = generateRandomUserName();
  return {
    plots: createInitialPlots(6, 6),
    selectedPlotId: null,
    currentUserId: 'me',
    currentUserName: me.name,
    currentUserAvatar: me.avatar,
    notifications: [],
    exchangeTargetId: null,

    getPlot: (id) => get().plots.find(p => p.id === id),
    getStats: () => {
      const plots = get().plots;
      return {
        idle: plots.filter(p => p.status === 'idle').length,
        planted: plots.filter(p => p.status === 'planted').length,
        harvestable: plots.filter(p => p.status === 'harvestable').length
      };
    },
    getClaimedPlots: () => get().plots.filter(p => p.status !== 'idle'),
    getExchangeablePlots: () => get().plots.filter(p => p.exchangeable),

    claimPlot: (plotId) => {
      const state = get();
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== 'idle') return;
      const user = generateRandomUserName();
      set({
        plots: state.plots.map(p =>
          p.id === plotId
            ? {
                ...p,
                status: 'planted',
                ownerName: user.name,
                ownerAvatar: user.avatar,
                plantDate: formatDate(new Date()),
                daysToHarvest: 7 + Math.floor(Math.random() * 14),
                highlight: true
              }
            : p
        ),
        selectedPlotId: plotId
      });
      get().addNotification(`🎉 ${user.name} 认领了地块 (${plot.row + 1},${plot.col + 1})！`, 'success');
      setTimeout(() => get().clearAnimFlag(plotId, 'highlight'), 300);
    },

    selectPlot: (plotId) => {
      set({ selectedPlotId: plotId });
      set(state => ({
        plots: state.plots.map(p =>
          p.id === plotId ? { ...p, highlight: true } : p
        )
      }));
      setTimeout(() => get().clearAnimFlag(plotId, 'highlight'), 300);
    },

    addJournal: (plotId, entry) => {
      const state = get();
      const newEntry: JournalEntry = {
        ...entry,
        id: uid(),
        timestamp: Date.now()
      };
      set({
        plots: state.plots.map(p =>
          p.id === plotId
            ? {
                ...p,
                journal: [newEntry, ...p.journal],
                waterRecords: [...p.waterRecords, formatDate(new Date())],
                waterDrop: true
              }
            : p
        )
      });
      setTimeout(() => get().clearAnimFlag(plotId, 'waterDrop'), 500);
    },

    markHarvestable: (plotId) => {
      const state = get();
      set({
        plots: state.plots.map(p =>
          p.id === plotId
            ? { ...p, status: 'harvestable' as const, daysToHarvest: 0 }
            : p
        )
      });
      const plot = get().getPlot(plotId);
      if (plot) {
        get().addNotification(`🌾 ${plot.ownerName} 的 ${plot.cropName || '作物'} 已成熟待收获！`, 'info');
      }
    },

    toggleExchangeable: (plotId) => {
      const state = get();
      set({
        plots: state.plots.map(p =>
          p.id === plotId ? { ...p, exchangeable: !p.exchangeable } : p
        )
      });
      const plot = get().getPlot(plotId);
      if (plot) {
        if (plot.exchangeable) {
          get().addNotification(`🔄 ${plot.ownerName} 将 ${plot.cropName || '作物'} 标记为可交换`, 'info');
        }
      }
    },

    openExchangeModal: (targetPlotId) => {
      set({ exchangeTargetId: targetPlotId });
    },

    closeExchangeModal: () => {
      set({ exchangeTargetId: null });
    },

    exchangePlots: (plotIdA, plotIdB) => {
      const state = get();
      const pA = state.plots.find(p => p.id === plotIdA);
      const pB = state.plots.find(p => p.id === plotIdB);
      if (!pA || !pB) return;

      set({
        plots: state.plots.map(p => {
          if (p.id === plotIdA) {
            return {
              ...p,
              status: pB.status,
              ownerName: pB.ownerName,
              ownerAvatar: pB.ownerAvatar,
              cropName: pB.cropName,
              plantDate: pB.plantDate,
              daysToHarvest: pB.daysToHarvest,
              waterRecords: pB.waterRecords,
              journal: pB.journal,
              exchangeable: false
            };
          }
          if (p.id === plotIdB) {
            return {
              ...p,
              status: pA.status,
              ownerName: pA.ownerName,
              ownerAvatar: pA.ownerAvatar,
              cropName: pA.cropName,
              plantDate: pA.plantDate,
              daysToHarvest: pA.daysToHarvest,
              waterRecords: pA.waterRecords,
              journal: pA.journal,
              exchangeable: false
            };
          }
          return p;
        }),
        exchangeTargetId: null
      });
      get().addNotification(`🤝 交换成功！${pA.ownerName} ↔ ${pB.ownerName} 的地块已互换`, 'success');
    },

    addNotification: (message, type = 'info') => {
      const n: Notification = {
        id: uid(),
        message,
        type,
        timestamp: Date.now()
      };
      set(state => ({ notifications: [n, ...state.notifications].slice(0, 5) }));
      setTimeout(() => get().dismissNotification(n.id), 5000);
    },

    dismissNotification: (id) => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    },

    clearAnimFlag: (plotId, flag) => {
      set(state => ({
        plots: state.plots.map(p =>
          p.id === plotId ? { ...p, [flag]: false } : p
        )
      }));
    }
  };
});
