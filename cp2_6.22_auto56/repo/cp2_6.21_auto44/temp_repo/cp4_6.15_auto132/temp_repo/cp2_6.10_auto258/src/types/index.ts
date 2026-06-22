export interface LightPoint {
  id: string;
  position: [number, number, number];
  color: string;
}

export interface LightThread {
  id: string;
  startPointId: string;
  endPointId: string;
  startColor: string;
  endColor: string;
  length: number;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  type: 'create_point' | 'connect_thread' | 'play_sound';
  message: string;
  threadId?: string;
  timestamp: number;
}

export interface LoomState {
  points: LightPoint[];
  threads: LightThread[];
  selectedPointId: string | null;
  highlightedThreadId: string | null;
  logs: LogEntry[];

  threadWidth: number;
  pulseSpeed: number;
  defaultColor: string;

  addPoint: (position: [number, number, number]) => void;
  connectPoints: (startId: string, endId: string) => void;
  selectPoint: (id: string | null) => void;
  highlightThread: (id: string | null) => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setThreadWidth: (width: number) => void;
  setPulseSpeed: (speed: number) => void;
  setDefaultColor: (color: string) => void;
  clearAll: () => void;
}
