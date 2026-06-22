import { create } from 'zustand';
import type { TimeLog } from '../types';
import api from '../utils/api';

interface TimeLogState {
  timeLogs: Record<string, TimeLog[]>;
  activeTimers: Record<string, string>;
  fetchTimeLogs: (taskId?: string) => Promise<void>;
  startTimer: (taskId: string, userId: string) => Promise<void>;
  stopTimer: (taskId: string, userId: string) => Promise<void>;
  addTimeLog: (timeLog: Omit<TimeLog, 'id'>) => Promise<void>;
}

export const useTimeLogStore = create<TimeLogState>((set, get) => ({
  timeLogs: {},
  activeTimers: {},
  fetchTimeLogs: async (taskId) => {
    const url = taskId ? `/time-logs?taskId=${taskId}` : '/time-logs';
    const response = await api.get<TimeLog[]>(url);
    const grouped: Record<string, TimeLog[]> = {};
    for (const log of response.data) {
      if (!grouped[log.taskId]) {
        grouped[log.taskId] = [];
      }
      grouped[log.taskId].push(log);
    }
    set({ timeLogs: grouped });
  },
  startTimer: async (taskId, userId) => {
    const startTime = new Date().toISOString();
    set((state) => ({
      activeTimers: {
        ...state.activeTimers,
        [taskId]: startTime,
      },
    }));
  },
  stopTimer: async (taskId, userId) => {
    const startTime = get().activeTimers[taskId];
    if (!startTime) return;

    const endTime = new Date().toISOString();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = Math.round((end - start) / 60000);

    const timeLog: Omit<TimeLog, 'id'> = {
      taskId,
      userId,
      startTime,
      endTime,
      duration,
    };

    const response = await api.post<TimeLog>('/time-logs', timeLog);

    set((state) => {
      const newActiveTimers = { ...state.activeTimers };
      delete newActiveTimers[taskId];

      const currentLogs = state.timeLogs[taskId] || [];
      return {
        activeTimers: newActiveTimers,
        timeLogs: {
          ...state.timeLogs,
          [taskId]: [...currentLogs, response.data],
        },
      };
    });
  },
  addTimeLog: async (timeLog) => {
    const response = await api.post<TimeLog>('/time-logs', timeLog);
    const { taskId } = response.data;
    set((state) => {
      const currentLogs = state.timeLogs[taskId] || [];
      return {
        timeLogs: {
          ...state.timeLogs,
          [taskId]: [...currentLogs, response.data],
        },
      };
    });
  },
}));
