import { create } from 'zustand';
import { HealthRecord, WeeklyStats, RangeOption } from '../modules/data/types';
import {
  getAllRecords,
  saveRecord as persistSave,
  deleteRecord as persistDelete,
  computeWeeklyStats,
  prepareLineChartData,
  prepareBarChartData,
  formatDate
} from '../modules/data';
import { eventBus } from '../eventBus';
import { LineChartPoint, BarChartItem } from '../modules/data/types';

interface HealthState {
  records: HealthRecord[];
  loading: boolean;
  range: RangeOption;
  weeklyStats: WeeklyStats;
  lineData: LineChartPoint[];
  barData: BarChartItem[];
  load: () => void;
  setRange: (r: RangeOption) => void;
  addRecord: (r: HealthRecord) => void;
  updateRecord: (r: HealthRecord) => void;
  removeRecord: (id: string) => void;
  refreshDerived: () => void;
}

const emptyStats: WeeklyStats = {
  avgBloodPressure: { systolic: 0, diastolic: 0 },
  adherenceRate: 0,
  abnormalDays: 0,
  totalDoses: 0
};

export const useHealthStore = create<HealthState>((set, get) => ({
  records: [],
  loading: true,
  range: 7,
  weeklyStats: emptyStats,
  lineData: [],
  barData: [],

  load: () => {
    set({ loading: true });
    setTimeout(() => {
      const records = getAllRecords();
      const weeklyStats = computeWeeklyStats(records);
      const { range } = get();
      const lineData = prepareLineChartData(records, range);
      const barData = prepareBarChartData(records, range);
      set({ records, weeklyStats, lineData, barData, loading: false });
    }, 400);
  },

  setRange: (range: RangeOption) => {
    const { records } = get();
    const lineData = prepareLineChartData(records, range);
    const barData = prepareBarChartData(records, range);
    set({ range, lineData, barData });
    eventBus.emit('range:changed', range);
  },

  refreshDerived: () => {
    const { records, range } = get();
    const weeklyStats = computeWeeklyStats(records);
    const lineData = prepareLineChartData(records, range);
    const barData = prepareBarChartData(records, range);
    set({ weeklyStats, lineData, barData });
  },

  addRecord: (record: HealthRecord) => {
    const all = persistSave(record);
    set({ records: all });
    get().refreshDerived();
    eventBus.emit('record:added', record);
  },

  updateRecord: (record: HealthRecord) => {
    const all = persistSave(record);
    set({ records: all });
    get().refreshDerived();
    eventBus.emit('record:updated', record);
  },

  removeRecord: (id: string) => {
    const all = persistDelete(id);
    set({ records: all });
    get().refreshDerived();
    eventBus.emit('record:deleted', id);
  }
}));

export const formatDay = formatDate;
