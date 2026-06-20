export interface GridData {
  temperature: number[][];
  humidity: number[][];
  windSpeed: number[][];
  windDirection: number[][];
  elevation: number[][];
}

export interface ForecastPoint {
  time: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export interface CityConfig {
  name: string;
  baseTemp: number;
  baseHumidity: number;
  baseWind: number;
  elevationScale: number;
  lat: number;
  lon: number;
}

const GRID_SIZE = 20;

const cityConfigs: Record<string, CityConfig> = {
  cityA: {
    name: '城市A',
    baseTemp: 22,
    baseHumidity: 65,
    baseWind: 4,
    elevationScale: 1.5,
    lat: 31.2304,
    lon: 121.4737,
  },
  cityB: {
    name: '城市B',
    baseTemp: 15,
    baseHumidity: 75,
    baseWind: 6,
    elevationScale: 2.5,
    lat: 39.9042,
    lon: 116.4074,
  },
};

function noise2D(x: number, y: number, seed: number = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number, seed: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const fx = sx - x0;
  const fy = sy - y0;
  
  const v00 = noise2D(x0, y0, seed);
  const v10 = noise2D(x0 + 1, y0, seed);
  const v01 = noise2D(x0, y0 + 1, seed);
  const v11 = noise2D(x0 + 1, y0 + 1, seed);
  
  const sx2 = fx * fx * (3 - 2 * fx);
  const sy2 = fy * fy * (3 - 2 * fy);
  
  const v0 = v00 + (v10 - v00) * sx2;
  const v1 = v01 + (v11 - v01) * sx2;
  
  return v0 + (v1 - v0) * sy2;
}

function fbm(x: number, y: number, seed: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, y * frequency, 1, seed + i * 100) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value / maxValue;
}

export function getGridData(city: string, hour: number, tempLevel: number, humidityLevel: number, windLevel: number): GridData {
  const config = cityConfigs[city] || cityConfigs.cityA;
  const temperature: number[][] = [];
  const humidity: number[][] = [];
  const windSpeed: number[][] = [];
  const windDirection: number[][] = [];
  const elevation: number[][] = [];
  
  const hourFactor = Math.sin((hour - 6) / 24 * Math.PI * 2) * 0.3 + 0.7;
  const tempShift = (tempLevel - 20) * 0.8;
  const humidShift = (humidityLevel - 50) * 0.5;
  const windMultiplier = windLevel / 6;
  
  for (let y = 0; y < GRID_SIZE; y++) {
    temperature[y] = [];
    humidity[y] = [];
    windSpeed[y] = [];
    windDirection[y] = [];
    elevation[y] = [];
    
    for (let x = 0; x < GRID_SIZE; x++) {
      const elev = fbm(x, y, 1000, 4) * config.elevationScale;
      elevation[y][x] = elev;
      
      const tempNoise = fbm(x * 0.5, y * 0.5, 2000 + hour * 0.1, 3) * 8;
      const elevTempDrop = elev * 2;
      temperature[y][x] = config.baseTemp + tempShift + tempNoise - 4 + hourFactor * 8 - elevTempDrop;
      
      const humidNoise = fbm(x * 0.4, y * 0.4, 3000 + hour * 0.05, 3) * 20;
      const elevHumidDrop = elev * 5;
      humidity[y][x] = Math.max(0, Math.min(100, config.baseHumidity + humidShift + humidNoise - 10 - elevHumidDrop));
      
      const windNoise = fbm(x * 0.3, y * 0.3, 4000 + hour * 0.08, 3);
      const elevWindBoost = elev * 0.5;
      windSpeed[y][x] = Math.max(0, (config.baseWind + windNoise * 6 + elevWindBoost) * windMultiplier);
      
      const dirNoise = fbm(x * 0.2, y * 0.2, 5000 + hour * 0.03, 2) * 360;
      const baseDir = hour * 15 + dirNoise;
      windDirection[y][x] = ((baseDir % 360) + 360) % 360;
    }
  }
  
  return { temperature, humidity, windSpeed, windDirection, elevation };
}

export function getHourlyForecast(city: string, gridX: number, gridY: number, startHour: number, tempLevel: number, humidityLevel: number, windLevel: number): ForecastPoint[] {
  const config = cityConfigs[city] || cityConfigs.cityA;
  const forecast: ForecastPoint[] = [];
  const points = 12;
  
  for (let i = 0; i <= points; i++) {
    const hour = (startHour + i * (2 / points)) % 24;
    const hourFactor = Math.sin((hour - 6) / 24 * Math.PI * 2) * 0.3 + 0.7;
    
    const tempNoise = fbm(gridX * 0.5 + hour * 2, gridY * 0.5, 2000 + i * 10, 3) * 6;
    const temperature = config.baseTemp + (tempLevel - 20) * 0.8 + tempNoise - 3 + hourFactor * 7;
    
    const humidNoise = fbm(gridX * 0.4 + hour * 1.5, gridY * 0.4, 3000 + i * 10, 3) * 15;
    const humidity = Math.max(0, Math.min(100, config.baseHumidity + (humidityLevel - 50) * 0.5 + humidNoise - 8));
    
    const windNoise = fbm(gridX * 0.3 + hour, gridY * 0.3, 4000 + i * 10, 3);
    const windSpeed = Math.max(0, (config.baseWind + windNoise * 5) * (windLevel / 6));
    
    forecast.push({
      time: hour,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 10) / 10,
    });
  }
  
  return forecast;
}

export function getCityConfig(city: string): CityConfig {
  return cityConfigs[city] || cityConfigs.cityA;
}

export function getGridLatLon(city: string, gridX: number, gridY: number): { lat: number; lon: number } {
  const config = cityConfigs[city] || cityConfigs.cityA;
  const gridStep = 0.01;
  return {
    lat: config.lat + (gridY - GRID_SIZE / 2) * gridStep,
    lon: config.lon + (gridX - GRID_SIZE / 2) * gridStep,
  };
}

export const GRID_SIZE_CONST = GRID_SIZE;
