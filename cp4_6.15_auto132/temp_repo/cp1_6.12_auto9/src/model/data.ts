import * as d3 from 'd3';

export type EnergyType = 'electricity' | 'water' | 'gas';

export interface EnergyDataPoint {
  timestamp: number;
  value: number;
}

export type RoomEnergyMap = Map<string, Record<EnergyType, number>>;

export interface RoomInfoLite {
  id: string;
  floor: number;
  name: string;
}

type Subscriber = (data: RoomEnergyMap) => void;

export class EnergyDataModule {
  private rooms: RoomInfoLite[] = [];
  private history: Map<string, Record<EnergyType, EnergyDataPoint[]>> = new Map();
  private current: RoomEnergyMap = new Map();
  private subscribers: Set<Subscriber> = new Set();
  private timer: number | null = null;

  private selectedFloor: number | 'all' = 'all';
  private selectedType: EnergyType = 'electricity';
  private timeRangeHours = 24;

  private readonly BASE_VALUES: Record<EnergyType, number> = {
    electricity: 50,
    water: 20,
    gas: 15
  };

  private readonly SCALE_RANGES: Record<EnergyType, [number, number]> = {
    electricity: [10, 150],
    water: [2, 60],
    gas: [1, 45]
  };

  init(rooms: RoomInfoLite[]): void {
    this.rooms = rooms;
    const now = Date.now();
    for (const room of rooms) {
      const types: Record<EnergyType, EnergyDataPoint[]> = {
        electricity: [],
        water: [],
        gas: []
      };
      for (let h = 24; h >= 0; h--) {
        const ts = now - h * 3600 * 1000;
        (['electricity', 'water', 'gas'] as EnergyType[]).forEach(type => {
          const base = this.BASE_VALUES[type] + Math.random() * 30;
          const variation = Math.sin(h / 4 + room.id.charCodeAt(0)) * 15;
          types[type].push({ timestamp: ts, value: Math.max(0, base + variation) });
        });
      }
      this.history.set(room.id, types);
      const cur: Record<EnergyType, number> = {
        electricity: types.electricity[types.electricity.length - 1].value,
        water: types.water[types.water.length - 1].value,
        gas: types.gas[types.gas.length - 1].value
      };
      this.current.set(room.id, cur);
    }
    this.startSimulation();
  }

  private startSimulation(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      const now = Date.now();
      for (const room of this.rooms) {
        const cur = this.current.get(room.id)!;
        const hist = this.history.get(room.id)!;
        (['electricity', 'water', 'gas'] as EnergyType[]).forEach(type => {
          const delta = (Math.random() - 0.5) * 12;
          let next = cur[type] + delta;
          const [min, max] = this.SCALE_RANGES[type];
          if (Math.random() < 0.02) next = max * (0.9 + Math.random() * 0.3);
          next = Math.max(min * 0.5, Math.min(max * 1.3, next));
          cur[type] = next;
          hist[type].push({ timestamp: now, value: next });
          if (hist[type].length > 200) hist[type].shift();
        });
      }
      this.emit();
    }, 2000);
  }

  private emit(): void {
    this.subscribers.forEach(cb => cb(this.current));
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    callback(this.current);
    return () => this.subscribers.delete(callback);
  }

  setFloor(floor: number | 'all'): void {
    this.selectedFloor = floor;
  }

  setType(type: EnergyType): void {
    this.selectedType = type;
  }

  setTimeRange(hours: number): void {
    this.timeRangeHours = hours;
  }

  getFloor(): number | 'all' {
    return this.selectedFloor;
  }

  getType(): EnergyType {
    return this.selectedType;
  }

  getTimeRange(): number {
    return this.timeRangeHours;
  }

  getRoomCurrent(roomId: string, type: EnergyType): number {
    return this.current.get(roomId)?.[type] ?? 0;
  }

  getRoomHistory(roomId: string, type: EnergyType, hours: number): EnergyDataPoint[] {
    const hist = this.history.get(roomId)?.[type] ?? [];
    if (hist.length === 0) return [];
    const cutoff = Date.now() - hours * 3600 * 1000;
    return hist.filter(p => p.timestamp >= cutoff);
  }

  hasAnomaly(roomId: string, type: EnergyType): boolean {
    const hist = this.getRoomHistory(roomId, type, 24);
    if (hist.length < 10) return false;
    const values = hist.map(p => p.value);
    const mean = d3.mean(values) ?? 0;
    const std = d3.deviation(values) ?? 1;
    const current = this.getRoomCurrent(roomId, type);
    return current > mean + 2.5 * std;
  }

  getNormalizedValue(roomId: string, type: EnergyType): number {
    const [min, max] = this.SCALE_RANGES[type];
    const v = this.getRoomCurrent(roomId, type);
    return d3.scaleLinear().domain([min, max]).range([0, 1]).clamp(true)(v);
  }

  getTotalEnergyMultiplier(): number {
    let total = 0;
    let count = 0;
    for (const room of this.rooms) {
      if (this.selectedFloor !== 'all' && room.floor !== this.selectedFloor) continue;
      total += this.getNormalizedValue(room.id, this.selectedType);
      count++;
    }
    if (count === 0) return 0.5;
    return 0.3 + (total / count) * 1.5;
  }

  getScaleRange(type: EnergyType): [number, number] {
    return this.SCALE_RANGES[type];
  }

  destroy(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
