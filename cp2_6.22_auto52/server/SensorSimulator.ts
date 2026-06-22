export interface SensorData {
  temperature: number;
  humidity: number;
  light: number;
}

export interface SensorUpdate {
  roomId: string;
  sensors: SensorData;
  timestamp: number;
}

interface SensorHistory {
  temperature: number[];
  humidity: number[];
  light: number[];
  timestamps: number[];
}

const ROOMS = ['living', 'bedroom', 'kitchen', 'bathroom'] as const;
const HISTORY_MAX = 100;

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export class SensorSimulator {
  private currentData: Map<string, SensorData> = new Map();
  private history: Map<string, SensorHistory> = new Map();
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private historyInterval: ReturnType<typeof setInterval> | null = null;
  private callback: ((update: SensorUpdate) => void) | null = null;

  constructor() {
    for (const room of ROOMS) {
      this.currentData.set(room, this.generateData());
      this.history.set(room, {
        temperature: [],
        humidity: [],
        light: [],
        timestamps: [],
      });
    }
  }

  private generateData(): SensorData {
    return {
      temperature: randomInRange(20, 35),
      humidity: randomInRange(30, 80),
      light: Math.round(randomInRange(0, 1000)),
    };
  }

  start(callback: (update: SensorUpdate) => void): void {
    this.callback = callback;
    this.updateInterval = setInterval(() => {
      for (const room of ROOMS) {
        const sensors = this.generateData();
        this.currentData.set(room, sensors);
        if (this.callback) {
          this.callback({
            roomId: room,
            sensors,
            timestamp: Date.now(),
          });
        }
      }
    }, 2000);
  }

  startHistorySampling(): void {
    this.historyInterval = setInterval(() => {
      for (const room of ROOMS) {
        const data = this.currentData.get(room);
        const hist = this.history.get(room);
        if (!data || !hist) continue;

        hist.temperature.push(data.temperature);
        hist.humidity.push(data.humidity);
        hist.light.push(data.light);
        hist.timestamps.push(Date.now());

        if (hist.temperature.length > HISTORY_MAX) {
          hist.temperature.shift();
          hist.humidity.shift();
          hist.light.shift();
          hist.timestamps.shift();
        }
      }
    }, 10000);
  }

  getHistory(roomId: string): SensorHistory | undefined {
    return this.history.get(roomId);
  }

  getCurrentData(roomId: string): SensorData | undefined {
    return this.currentData.get(roomId);
  }

  getAllCurrentData(): Map<string, SensorData> {
    return new Map(this.currentData);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.historyInterval) {
      clearInterval(this.historyInterval);
      this.historyInterval = null;
    }
    this.callback = null;
  }
}
