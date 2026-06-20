import { create } from 'zustand';
import type { LogEntry, LogType } from '../core/types';

const MAX_LOGS = 200;

let logIdCounter = 0;
function newLogId(): string {
  logIdCounter += 1;
  return `L${logIdCounter}`;
}

export interface LogStoreState {
  entries: LogEntry[];
  globalTime: number;
  setGlobalTime: (t: number) => void;
  addLog: (type: LogType, message: string, detail?: Record<string, unknown>) => void;
  clearLogs: () => void;
  exportJSON: () => string;
  exportCSV: () => string;
}

export const useLogStore = create<LogStoreState>((set, get) => ({
  entries: [],
  globalTime: 0,
  setGlobalTime: (t) => set({ globalTime: t }),
  addLog: (type, message, detail) =>
    set((s) => {
      const entry: LogEntry = {
        id: newLogId(),
        time: Math.round(s.globalTime * 10) / 10,
        type,
        message,
        detail,
      };
      const next = [entry, ...s.entries].slice(0, MAX_LOGS);
      return { entries: next };
    }),
  clearLogs: () => set({ entries: [] }),
  exportJSON: () => {
    return JSON.stringify(get().entries, null, 2);
  },
  exportCSV: () => {
    const header = ['id', 'time', 'type', 'message'];
    const rows = get().entries.map((e) => [
      e.id,
      String(e.time),
      e.type,
      `"${e.message.replace(/"/g, '""')}"`,
    ]);
    return [header, ...rows].map((r) => r.join(',')).join('\n');
  },
}));

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
