/**
 * 传感器数据模拟器模块
 * 职责：生成四个房间（客厅、厨房、卧室、书房）的模拟温湿度/光照/空气质量数据
 * 每2秒更新一次，通过回调函数通知server模块
 * 数据流向：sensorSimulator → 回调 → server.ts → WebSocket/REST → 前端
 */

export type SensorType = 'temperature' | 'humidity' | 'light' | 'airQuality';

export interface SensorData {
  roomId: number;
  roomName: string;
  type: SensorType;
  value: number;
  timestamp: number;
}

export interface RoomSnapshot {
  roomId: number;
  roomName: string;
  temperature: number;
  humidity: number;
  light: number;
  airQuality: number;
  timestamp: number;
}

export interface FullSnapshot {
  rooms: RoomSnapshot[];
  timestamp: number;
}

export const ROOMS: { id: number; name: string }[] = [
  { id: 1, name: '客厅' },
  { id: 2, name: '厨房' },
  { id: 3, name: '卧室' },
  { id: 4, name: '书房' }
];

const SENSOR_RANGES: Record<SensorType, { min: number; max: number; drift: number }> = {
  temperature: { min: 18, max: 32, drift: 1.2 },
  humidity: { min: 30, max: 85, drift: 4 },
  light: { min: 50, max: 900, drift: 60 },
  airQuality: { min: 20, max: 180, drift: 12 }
};

const ROOM_BIAS: Record<number, Partial<Record<SensorType, number>>> = {
  1: { temperature: 2, humidity: -3, light: 100, airQuality: 10 },
  2: { temperature: 6, humidity: 12, light: 40, airQuality: 35 },
  3: { temperature: -1, humidity: 5, light: -80, airQuality: -5 },
  4: { temperature: 1, humidity: -2, light: 50, airQuality: -8 }
};

class SensorSimulator {
  private currentValues: Map<number, Record<SensorType, number>> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(data: SensorData[]) => void> = new Set();
  private snapshotListeners: Set<(snapshot: FullSnapshot) => void> = new Set();

  constructor() {
    this.initializeValues();
  }

  private initializeValues(): void {
    for (const room of ROOMS) {
      const values: Record<SensorType, number> = {
        temperature: this.randomInRange(SENSOR_RANGES.temperature),
        humidity: this.randomInRange(SENSOR_RANGES.humidity),
        light: this.randomInRange(SENSOR_RANGES.light),
        airQuality: this.randomInRange(SENSOR_RANGES.airQuality)
      };
      this.currentValues.set(room.id, values);
    }
  }

  private randomInRange(range: { min: number; max: number }): number {
    return Math.random() * (range.max - range.min) + range.min;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private driftValue(current: number, type: SensorType, roomId: number): number {
    const range = SENSOR_RANGES[type];
    const bias = ROOM_BIAS[roomId]?.[type] ?? 0;
    const targetCenter = (range.min + range.max) / 2 + bias;

    const randomDrift = (Math.random() - 0.5) * 2 * range.drift;
    const pullToCenter = (targetCenter - current) * 0.05;

    return this.clamp(current + randomDrift + pullToCenter, range.min, range.max);
  }

  private updateStep(): void {
    const timestamp = Date.now();
    const allUpdates: SensorData[] = [];

    for (const room of ROOMS) {
      const values = this.currentValues.get(room.id)!;
      const types: SensorType[] = ['temperature', 'humidity', 'light', 'airQuality'];

      for (const type of types) {
        values[type] = this.driftValue(values[type], type, room.id);
        allUpdates.push({
          roomId: room.id,
          roomName: room.name,
          type,
          value: Math.round(values[type] * 10) / 10,
          timestamp
        });
      }
    }

    this.notifyListeners(allUpdates);
    this.notifySnapshotListeners();
  }

  private notifyListeners(data: SensorData[]): void {
    this.listeners.forEach(fn => {
      try { fn(data); } catch (e) { console.error('Listener error:', e); }
    });
  }

  private notifySnapshotListeners(): void {
    const snapshot = this.getFullSnapshot();
    this.snapshotListeners.forEach(fn => {
      try { fn(snapshot); } catch (e) { console.error('Snapshot listener error:', e); }
    });
  }

  public onUpdate(listener: (data: SensorData[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onSnapshot(listener: (snapshot: FullSnapshot) => void): () => void {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  }

  public getRoomValues(roomId: number): Record<SensorType, number> | undefined {
    return this.currentValues.get(roomId);
  }

  public getFullSnapshot(): FullSnapshot {
    const timestamp = Date.now();
    const rooms: RoomSnapshot[] = ROOMS.map(room => {
      const v = this.currentValues.get(room.id)!;
      return {
        roomId: room.id,
        roomName: room.name,
        temperature: Math.round(v.temperature * 10) / 10,
        humidity: Math.round(v.humidity * 10) / 10,
        light: Math.round(v.light * 10) / 10,
        airQuality: Math.round(v.airQuality * 10) / 10,
        timestamp
      };
    });
    return { rooms, timestamp };
  }

  public start(intervalMs: number = 2000): void {
    if (this.updateInterval) return;
    this.notifySnapshotListeners();
    this.updateInterval = setInterval(() => this.updateStep(), intervalMs);
    console.log(`[SensorSimulator] 启动，更新间隔 ${intervalMs}ms`);
  }

  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('[SensorSimulator] 已停止');
    }
  }
}

export const sensorSimulator = new SensorSimulator();
export default sensorSimulator;
