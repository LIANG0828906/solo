export interface QuantumNodeData {
  id: string;
  position: [number, number, number];
  connections: string[];
  energy: number;
  spinSpeed: number;
  color: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'create' | 'connect' | 'collapse' | 'reset';
  message: string;
  nodeId?: string;
  connectionCount?: number;
  energy?: number;
}

export interface Connection {
  from: string;
  to: string;
  strength: number;
}

export const CYBER_COLORS = {
  neonPurple: '#b300ff',
  neonCyan: '#00e5ff',
  darkBg: '#0a0a0f',
  panelBg: 'rgba(15, 15, 25, 0.85)',
  borderColor: 'rgba(179, 0, 255, 0.4)',
} as const;
