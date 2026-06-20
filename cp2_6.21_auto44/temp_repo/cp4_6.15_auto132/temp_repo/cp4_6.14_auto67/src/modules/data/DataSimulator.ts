export interface MaintenanceRecord {
  date: string;
  type: string;
  description: string;
}

export interface WindTurbineData {
  id: string;
  index: number;
  position: [number, number, number];
  windSpeed: number;
  windDirection: number;
  powerOutput: number;
  healthStatus: 'normal' | 'warning' | 'fault';
  model: string;
  installationDate: string;
  hourlyOutput: number[];
  maintenanceRecords: MaintenanceRecord[];
}

export interface WindFarmData {
  turbines: WindTurbineData[];
  totalPower: number;
  averageWindSpeed: number;
  windDirectionDistribution: number[];
  windSpeedHistory: number[];
}

export type SubscribeCallback = (data: WindFarmData) => void;

class DataSimulator {
  private static instance: DataSimulator | null = null;
  private subscribers: Set<SubscribeCallback> = new Set();
  private turbines: WindTurbineData[] = [];
  private windSpeedHistory: number[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly turbineCount = 20;
  private readonly gridSize = 50;
  private readonly minSpacing = 12;
  private readonly maxSpacing = 15;
  private readonly minRatedPower = 2000;
  private readonly maxRatedPower = 3000;
  private readonly minWindSpeed = 3;
  private readonly maxWindSpeed = 25;
  private readonly lerpFactor = 0.2;
  private readonly updateInterval = 2000;
  private readonly historyLength = 60;
  private readonly directionSectors = 12;

  private constructor() {
    this.initializeTurbines();
  }

  static getInstance(): DataSimulator {
    if (!DataSimulator.instance) {
      DataSimulator.instance = new DataSimulator();
    }
    return DataSimulator.instance;
  }

  private initializeTurbines(): void {
    const positions = this.generatePositions();
    const models = ['WT-2000X', 'WT-2500X', 'WT-3000X', 'WT-2200Pro', 'WT-2800Pro'];

    for (let i = 0; i < this.turbineCount; i++) {
      const ratedPower = this.randomRange(this.minRatedPower, this.maxRatedPower);
      const windSpeed = this.randomRange(this.minWindSpeed, this.maxWindSpeed);
      const windDirection = this.randomRange(0, 360);
      const powerOutput = this.calculatePowerOutput(windSpeed, ratedPower);

      this.turbines.push({
        id: `TURBINE-${String(i + 1).padStart(3, '0')}`,
        index: i,
        position: positions[i],
        windSpeed,
        windDirection,
        powerOutput,
        healthStatus: this.generateHealthStatus(),
        model: models[Math.floor(Math.random() * models.length)],
        installationDate: this.generateInstallationDate(),
        hourlyOutput: this.generateHourlyOutput(ratedPower),
        maintenanceRecords: this.generateMaintenanceRecords(),
      });
    }

    this.updateWindSpeedHistory();
  }

  private generatePositions(): [number, number, number][] {
    const positions: [number, number, number][] = [];
    const cols = Math.ceil(Math.sqrt(this.turbineCount));
    const rows = Math.ceil(this.turbineCount / cols);
    const spacingX = this.gridSize / (cols + 1);
    const spacingY = this.gridSize / (rows + 1);

    let index = 0;
    for (let row = 0; row < rows && index < this.turbineCount; row++) {
      for (let col = 0; col < cols && index < this.turbineCount; col++) {
        const jitterX = this.randomRange(-this.minSpacing / 4, this.minSpacing / 4);
        const jitterY = this.randomRange(-this.minSpacing / 4, this.minSpacing / 4);
        const x = spacingX * (col + 1) + jitterX;
        const y = spacingY * (row + 1) + jitterY;
        const z = this.randomRange(80, 120);
        positions.push([x, y, z]);
        index++;
      }
    }

    return positions;
  }

  private randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private calculatePowerOutput(windSpeed: number, ratedPower: number): number {
    const power = 0.4 * 0.5 * 1.225 * Math.PI * 1600 * Math.pow(windSpeed, 3) / 1000;
    return Math.min(power, ratedPower);
  }

  private generateHealthStatus(): 'normal' | 'warning' | 'fault' {
    const rand = Math.random();
    if (rand < 0.01) return 'fault';
    if (rand < 0.05) return 'warning';
    return 'normal';
  }

  private generateInstallationDate(): string {
    const year = Math.floor(this.randomRange(2018, 2024));
    const month = Math.floor(this.randomRange(1, 13));
    const day = Math.floor(this.randomRange(1, 29));
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private generateHourlyOutput(ratedPower: number): number[] {
    const hourly: number[] = [];
    for (let i = 0; i < 24; i++) {
      hourly.push(this.randomRange(ratedPower * 0.4, ratedPower * 0.9));
    }
    return hourly;
  }

  private generateMaintenanceRecords(): MaintenanceRecord[] {
    const types = ['routine', 'repair', 'upgrade', 'inspection'];
    const descriptions = [
      '常规维护检查',
      '齿轮箱油更换',
      '叶片清洁',
      '控制系统升级',
      '轴承更换',
      '电气系统检修',
      '风速传感器校准',
      '防雷系统检测',
    ];
    const records: MaintenanceRecord[] = [];
    const now = new Date();

    for (let i = 0; i < 3; i++) {
      const daysAgo = Math.floor(this.randomRange(30, 365 * (i + 1)));
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      records.push({
        date: date.toISOString().split('T')[0],
        type: types[Math.floor(Math.random() * types.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
      });
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private updateWindSpeedHistory(): void {
    const avgSpeed = this.turbines.reduce((sum, t) => sum + t.windSpeed, 0) / this.turbines.length;
    this.windSpeedHistory.push(avgSpeed);
    if (this.windSpeedHistory.length > this.historyLength) {
      this.windSpeedHistory.shift();
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private update(): void {
    for (const turbine of this.turbines) {
      const targetWindSpeed = this.randomRange(this.minWindSpeed, this.maxWindSpeed);
      const targetWindDirection = this.randomRange(0, 360);

      turbine.windSpeed = this.lerp(turbine.windSpeed, targetWindSpeed, this.lerpFactor);
      turbine.windDirection = this.lerp(turbine.windDirection, targetWindDirection, this.lerpFactor);

      const ratedPower = this.getRatedPowerFromModel(turbine.model);
      turbine.powerOutput = this.calculatePowerOutput(turbine.windSpeed, ratedPower);

      if (Math.random() < 0.02) {
        turbine.healthStatus = this.generateHealthStatus();
      }
    }

    this.updateWindSpeedHistory();
    this.notifySubscribers();
  }

  private getRatedPowerFromModel(model: string): number {
    const match = model.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    return 2500;
  }

  private calculateWindDirectionDistribution(): number[] {
    const distribution = new Array(this.directionSectors).fill(0);
    const sectorWidth = 360 / this.directionSectors;

    for (const turbine of this.turbines) {
      const sector = Math.floor(turbine.windDirection / sectorWidth) % this.directionSectors;
      distribution[sector]++;
    }

    return distribution.map((count) => count / this.turbines.length);
  }

  private getWindFarmData(): WindFarmData {
    const totalPower = this.turbines.reduce((sum, t) => sum + t.powerOutput, 0);
    const averageWindSpeed = this.turbines.reduce((sum, t) => sum + t.windSpeed, 0) / this.turbines.length;
    const windDirectionDistribution = this.calculateWindDirectionDistribution();

    return {
      turbines: [...this.turbines],
      totalPower,
      averageWindSpeed,
      windDirectionDistribution,
      windSpeedHistory: [...this.windSpeedHistory],
    };
  }

  private notifySubscribers(): void {
    const data = this.getWindFarmData();
    for (const callback of this.subscribers) {
      callback(data);
    }
  }

  subscribe(callback: SubscribeCallback): void {
    this.subscribers.add(callback);
    callback(this.getWindFarmData());
  }

  unsubscribe(callback: SubscribeCallback): void {
    this.subscribers.delete(callback);
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.update(), this.updateInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const dataSimulator = DataSimulator.getInstance();
