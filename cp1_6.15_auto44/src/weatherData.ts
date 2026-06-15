export type WeatherDataType = 'temperature' | 'humidity' | 'windSpeed';

export interface WeatherHourData {
  hour: number;
  temperature: number[][];
  humidity: number[][];
  windSpeed: number[][];
}

export interface WeatherAPIResponse {
  success: boolean;
  requestId: string;
  generatedAt: string;
  hours: number;
  resolution: { cols: number; rows: number };
  data: WeatherHourData[];
}

const API_URL = 'http://localhost:3500/api/weather';

export class WeatherDataManager {
  private data: WeatherHourData[] = [];
  private cols: number = 36;
  private rows: number = 18;
  private loaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  public async load(resolution: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.fetchData(resolution);
    await this.loadPromise;
  }

  private async fetchData(resolution: string): Promise<void> {
    try {
      const url = `${API_URL}?startHour=0&endHour=71&resolution=${resolution}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json: WeatherAPIResponse = await resp.json();

      if (!json.success || !json.data || json.data.length === 0) {
        throw new Error('Invalid API response');
      }

      this.cols = json.resolution.cols;
      this.rows = json.resolution.rows;
      this.data = json.data;
      this.loaded = true;
      console.log(`[weatherData] Loaded ${this.data.length} hours, ${this.cols}x${this.rows}`);
    } catch (e) {
      console.warn('[weatherData] API failed, using fallback mock data:', e);
      this.generateFallbackData();
    }
  }

  private generateFallbackData(): void {
    this.cols = 36;
    this.rows = 18;
    this.data = [];

    for (let h = 0; h < 72; h++) {
      const temperature: number[][] = [];
      const humidity: number[][] = [];
      const windSpeed: number[][] = [];

      for (let r = 0; r < this.rows; r++) {
        const tRow: number[] = [];
        const hRow: number[] = [];
        const wRow: number[] = [];
        const lat = 90 - (r / (this.rows - 1)) * 180;
        const latBiasT = 20 - Math.abs(lat) * 0.5;
        const latBiasH = 50 + Math.exp(-Math.pow(lat / 25, 2)) * 30;
        const latBiasW = 20 + Math.exp(-Math.pow((Math.abs(lat) - 45) / 12, 2)) * 80;

        for (let c = 0; c < this.cols; c++) {
          const wave = Math.sin((c / this.cols) * Math.PI * 4 + h * 0.1) * 0.5 + 0.5;
          const wave2 = Math.cos((r / this.rows) * Math.PI * 3 - h * 0.08) * 0.5 + 0.5;
          const noise = Math.sin(r * 12.9898 + c * 78.233 + h * 37.719) * 43758.5453 % 1;
          const n = (noise + 1) * 0.5;

          tRow.push(Math.round((latBiasT + (wave - 0.5) * 40 + (n - 0.5) * 15) * 100) / 100);
          hRow.push(Math.max(0, Math.min(100, Math.round((latBiasH + (wave2 - 0.5) * 30 + (n - 0.5) * 20) * 100) / 100)));
          wRow.push(Math.max(0, Math.round((latBiasW * (0.5 + wave * 0.5) + (n - 0.5) * 30) * 100) / 100));
        }
        temperature.push(tRow);
        humidity.push(hRow);
        windSpeed.push(wRow);
      }
      this.data.push({ hour: h, temperature, humidity, windSpeed });
    }
    this.loaded = true;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  public getHourData(hour: number): WeatherHourData {
    const clamped = Math.max(0, Math.min(this.data.length - 1, Math.floor(hour)));
    return this.data[clamped];
  }

  public getResolution(): { cols: number; rows: number } {
    return { cols: this.cols, rows: this.rows };
  }

  public getTotalHours(): number {
    return this.data.length;
  }
}
