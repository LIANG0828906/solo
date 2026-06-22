export interface ServerMetrics {
  cpu: number;
  memory: number;
  networkIn: number;
  networkOut: number;
  diskRead: number;
  diskWrite: number;
  timestamp: number;
}

export interface WsMessage {
  type: 'metrics' | 'ping' | 'pong';
  data?: ServerMetrics;
  timestamp?: number;
}

export interface CardConfig {
  id: string;
  type: 'cpu' | 'memory' | 'network' | 'disk';
  title: string;
  icon: string;
  unit: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const DEFAULT_CARDS: CardConfig[] = [
  { id: 'cpu', type: 'cpu', title: 'CPU 使用率', icon: 'cpu', unit: '%' },
  { id: 'memory', type: 'memory', title: '内存使用率', icon: 'memory', unit: '%' },
  { id: 'network', type: 'network', title: '网络流量', icon: 'network', unit: 'KB/s' },
  { id: 'disk', type: 'disk', title: '磁盘读写', icon: 'disk', unit: 'MB/s' },
];
