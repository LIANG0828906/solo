import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { LogEntry, EventType, LoggerState } from '../../types';

const MAX_LOGS = 500;
const TRIM_BATCH = 50;

interface LoggerStore extends LoggerState {
  addLog: (type: EventType, payload: Record<string, any>) => void;
  setExpandedLogId: (id: string | null) => void;
  toggleExpandLog: (id: string) => void;
  clearLogs: () => void;
  setState: (state: LoggerState) => void;
}

export const useLoggerStore = create<LoggerStore>((set) => ({
  logs: [],
  expandedLogId: null,

  addLog: (type, payload) => {
    setTimeout(() => {
      set(
        produce((state: LoggerState) => {
          const newLog: LogEntry = {
            id: uuidv4(),
            type,
            timestamp: Date.now(),
            payload,
          };
          state.logs.unshift(newLog);
          if (state.logs.length > MAX_LOGS) {
            state.logs = state.logs.slice(0, MAX_LOGS - TRIM_BATCH);
          }
        })
      );
    }, 0);
  },

  setExpandedLogId: (id) => {
    set(
      produce((state: LoggerState) => {
        state.expandedLogId = id;
      })
    );
  },

  toggleExpandLog: (id) => {
    set(
      produce((state: LoggerState) => {
        state.expandedLogId = state.expandedLogId === id ? null : id;
      })
    );
  },

  clearLogs: () => {
    set(
      produce((state: LoggerState) => {
        state.logs = [];
        state.expandedLogId = null;
      })
    );
  },

  setState: (newState) => {
    set(newState);
  },
}));
