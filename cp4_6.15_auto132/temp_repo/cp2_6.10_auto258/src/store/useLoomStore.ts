import { create } from 'zustand';
import type { LoomState, LightPoint, LightThread, LogEntry } from '../types';
import { getDistance, getGradientColor } from '../utils/colorUtils';

let pointCounter = 0;

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const useLoomStore = create<LoomState>((set, get) => ({
  points: [],
  threads: [],
  selectedPointId: null,
  highlightedThreadId: null,
  logs: [],

  threadWidth: 2,
  pulseSpeed: 1,
  defaultColor: '#e94560',

  addPoint: (position: [number, number, number]) => {
    const { addLog } = get();
    pointCounter++;
    const pointId = generateId();
    const pointName = `光点${pointCounter}`;
    const color = getGradientColor(position);

    const newPoint: LightPoint = {
      id: pointId,
      position,
      color,
    };

    set((state) => ({
      points: [...state.points, newPoint],
    }));

    addLog({
      type: 'create_point',
      message: `创建${pointName}`,
    });
  },

  connectPoints: (startId: string, endId: string) => {
    const { points, addLog } = get();

    const startPoint = points.find((p) => p.id === startId);
    const endPoint = points.find((p) => p.id === endId);

    if (!startPoint || !endPoint || startId === endId) return;

    const length = getDistance(startPoint.position, endPoint.position);

    const existingThread = get().threads.find(
      (t) =>
        (t.startPointId === startId && t.endPointId === endId) ||
        (t.startPointId === endId && t.endPointId === startId)
    );

    if (existingThread) return;

    const newThread: LightThread = {
      id: generateId(),
      startPointId: startId,
      endPointId: endId,
      startColor: startPoint.color,
      endColor: endPoint.color,
      length,
      createdAt: Date.now(),
    };

    const startIndex = points.findIndex((p) => p.id === startId);
    const endIndex = points.findIndex((p) => p.id === endId);

    set((state) => ({
      threads: [...state.threads, newThread],
      selectedPointId: null,
    }));

    addLog({
      type: 'connect_thread',
      message: `连接光点${startIndex + 1}到光点${endIndex + 1}`,
      threadId: newThread.id,
    });
  },

  selectPoint: (id: string | null) => {
    set({ selectedPointId: id });
  },

  highlightThread: (id: string | null) => {
    set({ highlightedThreadId: id });
  },

  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };

    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 10),
    }));
  },

  setThreadWidth: (width: number) => {
    set({ threadWidth: width });
  },

  setPulseSpeed: (speed: number) => {
    set({ pulseSpeed: speed });
  },

  setDefaultColor: (color: string) => {
    set({ defaultColor: color });
  },

  clearAll: () => {
    pointCounter = 0;
    set({
      points: [],
      threads: [],
      selectedPointId: null,
      highlightedThreadId: null,
      logs: [],
    });
  },
}));
