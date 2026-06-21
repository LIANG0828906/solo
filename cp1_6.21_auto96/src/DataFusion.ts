export type SensorType = 'temperature' | 'vibration' | 'noise';

export interface SensorData {
  id: string;
  type: SensorType;
  value: number;
  timestamp: number;
}

export interface SensorSnapshot {
  temperature: SensorData;
  vibration: SensorData;
  noise: SensorData;
  timestamp: number;
}

export interface SensorConfig {
  id: string;
  min: number;
  max: number;
  threshold: number;
  unit: string;
  anomalyChance: number;
}

export interface SensorConfigs {
  temperature: SensorConfig;
  vibration: SensorConfig;
  noise: SensorConfig;
}

export type DataFusionCallback = (snapshot: SensorSnapshot) => void;
export type HistoryCallback = (history: SensorSnapshot[]) => void;

export class DataFusion {
  private ws: WebSocket | null = null;
  private latestSnapshot: SensorSnapshot | null = null;
  private history: SensorSnapshot[] = [];
  private sensorConfigs: SensorConfigs | null = null;
  private readonly MAX_HISTORY_SIZE = 600;
  private readonly API_BASE = 'http://localhost:3001/api';
  private readonly WS_URL = 'ws://localhost:3001/ws';
  
  private snapshotListeners: Set<DataFusionCallback> = new Set();
  private historyListeners: Set<HistoryCallback> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {}

  public async init(): Promise<void> {
    await this.fetchSensorConfigs();
    await this.fetchInitialHistory();
    this.connectWebSocket();
  }

  private async fetchSensorConfigs(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/sensors/config`);
      this.sensorConfigs = await response.json();
    } catch (error) {
      console.error('Failed to fetch sensor configs:', error);
    }
  }

  private async fetchInitialHistory(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/history?seconds=30`);
      this.history = await response.json();
      if (this.history.length > 0) {
        this.latestSnapshot = this.history[this.history.length - 1];
      }
      this.notifyHistoryListeners();
    } catch (error) {
      console.error('Failed to fetch initial history:', error);
    }
  }

  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(this.WS_URL);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            this.handleInit(data.snapshot, data.history);
          } else if (data.type === 'snapshot') {
            this.handleSnapshot(data.snapshot);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed, attempting reconnect...');
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, 3000);
  }

  private handleInit(snapshot: SensorSnapshot, history: SensorSnapshot[]): void {
    this.latestSnapshot = snapshot;
    this.history = history;
    this.notifySnapshotListeners();
    this.notifyHistoryListeners();
  }

  private handleSnapshot(snapshot: SensorSnapshot): void {
    this.latestSnapshot = snapshot;
    
    if (this.history.length >= this.MAX_HISTORY_SIZE) {
      this.history.shift();
    }
    this.history.push(snapshot);
    
    this.notifySnapshotListeners();
    this.notifyHistoryListeners();
  }

  public getLatestSnapshot(): SensorSnapshot | null {
    return this.latestSnapshot;
  }

  public getHistory(): SensorSnapshot[] {
    return [...this.history];
  }

  public getHistoryLastSeconds(seconds: number): SensorSnapshot[] {
    const endTime = Date.now();
    const startTime = endTime - seconds * 1000;
    return this.history.filter(s => s.timestamp >= startTime && s.timestamp <= endTime);
  }

  public getSnapshotAtTime(targetTime: number): SensorSnapshot | null {
    if (this.history.length === 0) return null;
    
    let closest: SensorSnapshot | null = null;
    let minDiff = Infinity;
    
    for (const snapshot of this.history) {
      const diff = Math.abs(snapshot.timestamp - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = snapshot;
      }
    }
    
    return closest;
  }

  public getSensorConfigs(): SensorConfigs | null {
    return this.sensorConfigs;
  }

  public getSensorConfig(type: SensorType): SensorConfig | null {
    return this.sensorConfigs ? this.sensorConfigs[type] : null;
  }

  public onSnapshot(callback: DataFusionCallback): () => void {
    this.snapshotListeners.add(callback);
    return () => this.snapshotListeners.delete(callback);
  }

  public onHistoryUpdate(callback: HistoryCallback): () => void {
    this.historyListeners.add(callback);
    return () => this.historyListeners.delete(callback);
  }

  private notifySnapshotListeners(): void {
    if (!this.latestSnapshot) return;
    for (const listener of this.snapshotListeners) {
      listener(this.latestSnapshot);
    }
  }

  private notifyHistoryListeners(): void {
    for (const listener of this.historyListeners) {
      listener([...this.history]);
    }
  }

  public isThresholdExceeded(type: SensorType, value: number): boolean {
    const config = this.getSensorConfig(type);
    return config ? value > config.threshold : false;
  }

  public destroy(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.snapshotListeners.clear();
    this.historyListeners.clear();
  }
}
