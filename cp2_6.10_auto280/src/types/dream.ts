export interface DreamNode {
  id: string;
  position: [number, number, number];
  basePosition: [number, number, number];
  color: string;
  glowColor: string;
  createdAt: number;
}

export interface DreamConnection {
  id: string;
  from: string;
  to: string;
}

export interface LogEntry {
  id: string;
  type: 'create' | 'drag' | 'click';
  message: string;
  timestamp: Date;
  nodeId?: string;
}

export interface RippleData {
  id: string;
  position: [number, number, number];
  color: string;
  startTime: number;
}

export type LogType = 'create' | 'drag' | 'click';
