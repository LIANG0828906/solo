import { EventEmitter } from 'events';

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

const SENSOR_CONFIG = {
  temperature: {
    id: 'temp-sensor-001',
    min: 20,
    max: 100,
    threshold: 80,
    unit: '°C',
    anomalyChance: 0.1
  },
  vibration: {
    id: 'vib-sensor-001',
    min: 5,
    max: 70,
    threshold: 50,
    unit: 'm/s²',
    anomalyChance: 0.08
  },
  noise: {
    id: 'noise-sensor-001',
    min: 30,
    max: 100,
    threshold: 85,
    unit: 'dB',
    anomalyChance: 0.12
  }
};

export class SensorSimulator extends EventEmitter {
  private history: SensorSnapshot[] = [];
  private maxHistorySize = 600;
  private currentValues: Record<SensorType, number> = {
    temperature: 45,
    vibration: 25,
    noise: 55
  };
  private intervalId: NodeJS.Timeout | null = null;
  private readonly SAMPLE_RATE_MS = 500;

  constructor() {
    super();
  }

  public start(): void {
    this.generateHistory();
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.SAMPLE_RATE_MS);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateHistory(): void {
    const now = Date.now();
    for (let i = this.maxHistorySize; i > 0; i--) {
      const timestamp = now - i * this.SAMPLE_RATE_MS;
      const snapshot = this.generateSnapshot(timestamp);
      this.history.push(snapshot);
    }
  }

  private generateValue(type: SensorType): number {
    const config = SENSOR_CONFIG[type];
    const current = this.currentValues[type];
    const drift = (Math.random() - 0.5) * 8;
    let newValue = current + drift;
    
    if (Math.random() < config.anomalyChance) {
      newValue = config.threshold + Math.random() * (config.max - config.threshold);
    }
    
    newValue = Math.max(config.min, Math.min(config.max, newValue));
    this.currentValues[type] = newValue;
    return newValue;
  }

  private generateSnapshot(timestamp: number): SensorSnapshot {
    const temperature: SensorData = {
      id: SENSOR_CONFIG.temperature.id,
      type: 'temperature',
      value: parseFloat(this.generateValue('temperature').toFixed(1)),
      timestamp
    };
    
    const vibration: SensorData = {
      id: SENSOR_CONFIG.vibration.id,
      type: 'vibration',
      value: parseFloat(this.generateValue('vibration').toFixed(1)),
      timestamp
    };
    
    const noise: SensorData = {
      id: SENSOR_CONFIG.noise.id,
      type: 'noise',
      value: parseFloat(this.generateValue('noise').toFixed(1)),
      timestamp
    };
    
    return { temperature, vibration, noise, timestamp };
  }

  private tick(): void {
    const timestamp = Date.now();
    const snapshot = this.generateSnapshot(timestamp);
    
    if (this.history.length >= this.maxHistorySize) {
      this.history.shift();
    }
    this.history.push(snapshot);
    
    this.emit('data', snapshot);
  }

  public getLatestSnapshot(): SensorSnapshot {
    return this.history[this.history.length - 1];
  }

  public getHistory(startTime?: number, endTime?: number): SensorSnapshot[] {
    if (!startTime && !endTime) {
      return [...this.history];
    }
    
    return this.history.filter(s => {
      const afterStart = !startTime || s.timestamp >= startTime;
      const beforeEnd = !endTime || s.timestamp <= endTime;
      return afterStart && beforeEnd;
    });
  }

  public getHistoryLastSeconds(seconds: number): SensorSnapshot[] {
    const endTime = Date.now();
    const startTime = endTime - seconds * 1000;
    return this.getHistory(startTime, endTime);
  }

  public getSensorConfig(type: SensorType) {
    return SENSOR_CONFIG[type];
  }

  public getAllSensorConfigs() {
    return SENSOR_CONFIG;
  }

  public checkThreshold(type: SensorType, value: number): boolean {
    return value > SENSOR_CONFIG[type].threshold;
  }
}
