import type { City, DataCategory, MonthData, Stats, ValueMapping } from './types';

type ClimateType = 'monsoon' | 'mediterranean' | 'temperate' | 'continental' | 'tropical' | 'desert' | 'oceanic';

interface CityConfig {
  id: string;
  name: string;
  lat: number;
  lng: number;
  climateType: ClimateType;
  baseTemp: number;
  tempAmplitude: number;
  precipitationPattern: number[];
}

class DataManager {
  private static instance: DataManager;
  private cities: City[] = [];
  private cityConfigs: Map<string, CityConfig> = new Map();
  private data: Map<string, Map<number, MonthData[]>> = new Map();

  private readonly START_YEAR = 2014;
  private readonly END_YEAR = 2024;

  private constructor() {
    this.initializeCities();
    this.generateAllData();
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  private initializeCities(): void {
    const cityConfigs: CityConfig[] = [
      {
        id: 'tokyo',
        name: '东京',
        lat: 35.6762,
        lng: 139.6503,
        climateType: 'monsoon',
        baseTemp: 15,
        tempAmplitude: 22,
        precipitationPattern: [52, 56, 118, 135, 145, 178, 165, 185, 220, 178, 88, 52]
      },
      {
        id: 'newyork',
        name: '纽约',
        lat: 40.7128,
        lng: -74.0060,
        climateType: 'temperate',
        baseTemp: 12,
        tempAmplitude: 25,
        precipitationPattern: [85, 80, 105, 100, 105, 95, 105, 100, 90, 100, 85, 90]
      },
      {
        id: 'london',
        name: '伦敦',
        lat: 51.5074,
        lng: -0.1278,
        climateType: 'oceanic',
        baseTemp: 11,
        tempAmplitude: 12,
        precipitationPattern: [55, 40, 40, 45, 50, 45, 45, 50, 55, 65, 60, 55]
      },
      {
        id: 'sydney',
        name: '悉尼',
        lat: -33.8688,
        lng: 151.2093,
        climateType: 'mediterranean',
        baseTemp: 18,
        tempAmplitude: 12,
        precipitationPattern: [104, 118, 131, 124, 119, 129, 97, 80, 69, 77, 90, 77]
      },
      {
        id: 'cairo',
        name: '开罗',
        lat: 30.0444,
        lng: 31.2357,
        climateType: 'desert',
        baseTemp: 22,
        tempAmplitude: 16,
        precipitationPattern: [5, 3, 3, 2, 1, 0, 0, 0, 0, 2, 3, 5]
      },
      {
        id: 'moscow',
        name: '莫斯科',
        lat: 55.7558,
        lng: 37.6173,
        climateType: 'continental',
        baseTemp: 5,
        tempAmplitude: 29,
        precipitationPattern: [50, 40, 35, 40, 50, 75, 85, 70, 60, 55, 50, 50]
      },
      {
        id: 'rio',
        name: '里约',
        lat: -22.9068,
        lng: -43.1729,
        climateType: 'tropical',
        baseTemp: 24,
        tempAmplitude: 7,
        precipitationPattern: [155, 140, 125, 90, 70, 50, 45, 50, 70, 95, 120, 145]
      },
      {
        id: 'mumbai',
        name: '孟买',
        lat: 19.0760,
        lng: 72.8777,
        climateType: 'monsoon',
        baseTemp: 27,
        tempAmplitude: 8,
        precipitationPattern: [3, 3, 1, 2, 20, 520, 720, 480, 300, 80, 20, 5]
      },
      {
        id: 'beijing',
        name: '北京',
        lat: 39.9042,
        lng: 116.4074,
        climateType: 'monsoon',
        baseTemp: 12,
        tempAmplitude: 28,
        precipitationPattern: [3, 5, 10, 25, 40, 85, 180, 150, 50, 20, 10, 3]
      },
      {
        id: 'capetown',
        name: '开普敦',
        lat: -33.9249,
        lng: 18.4241,
        climateType: 'mediterranean',
        baseTemp: 17,
        tempAmplitude: 10,
        precipitationPattern: [15, 17, 20, 41, 69, 93, 82, 77, 50, 34, 27, 19]
      }
    ];

    const spacing = 4;
    const startX = -((cityConfigs.length - 1) * spacing) / 2;

    this.cities = cityConfigs.map((config, index) => {
      this.cityConfigs.set(config.id, config);
      return {
        id: config.id,
        name: config.name,
        lat: config.lat,
        lng: config.lng,
        position: {
          x: startX + index * spacing,
          z: 0
        }
      };
    });
  }

  private generateAllData(): void {
    for (const city of this.cities) {
      const cityData = new Map<number, MonthData[]>();
      for (let year = this.START_YEAR; year <= this.END_YEAR; year++) {
        cityData.set(year, this.generateCityYearData(city.id, year));
      }
      this.data.set(city.id, cityData);
    }
  }

  private generateCityYearData(cityId: string, year: number): MonthData[] {
    const config = this.cityConfigs.get(cityId)!;
    const months: MonthData[] = [];

    const isNorthernHemisphere = config.lat > 0;
    const latFactor = Math.abs(config.lat) / 90;

    for (let month = 0; month < 12; month++) {
      const monthIndex = month;

      const seasonalPhase = isNorthernHemisphere
        ? Math.sin((monthIndex - 1) * Math.PI / 6)
        : -Math.sin((monthIndex - 1) * Math.PI / 6);

      const amplitude = config.tempAmplitude * (0.7 + latFactor * 0.6);
      let temperature = config.baseTemp + seasonalPhase * amplitude / 2;
      temperature += (Math.random() - 0.5) * 2;
      temperature = Math.max(-10, Math.min(40, temperature));

      const basePrecip = config.precipitationPattern[monthIndex];
      const yearVariation = 0.7 + Math.random() * 0.6;
      let precipitation = basePrecip * yearVariation;
      precipitation += (Math.random() - 0.5) * basePrecip * 0.3;
      precipitation = Math.max(0, Math.min(500, precipitation));

      const seasonalWind = isNorthernHemisphere
        ? 1 + 0.3 * Math.sin((monthIndex + 2) * Math.PI / 6)
        : 1 + 0.3 * Math.sin((monthIndex + 8) * Math.PI / 6);
      let windSpeed = (3 + latFactor * 5) * seasonalWind;
      windSpeed += (Math.random() - 0.5) * 6;
      windSpeed = Math.max(0, Math.min(30, windSpeed));

      months.push({
        month: monthIndex + 1,
        year,
        temperature: Math.round(temperature * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        windSpeed: Math.round(windSpeed * 10) / 10
      });
    }

    return months;
  }

  public getCities(): City[] {
    return [...this.cities];
  }

  public getCityById(id: string): City | undefined {
    return this.cities.find(city => city.id === id);
  }

  public getData(
    cityIds: string[],
    category: DataCategory,
    yearRange: [number, number]
  ): { cityId: string; month: number; values: number[] }[] {
    const result: { cityId: string; month: number; values: number[] }[] = [];
    const [startYear, endYear] = yearRange;

    for (const cityId of cityIds) {
      const cityData = this.data.get(cityId);
      if (!cityData) continue;

      for (let month = 1; month <= 12; month++) {
        const values: number[] = [];
        for (let year = startYear; year <= endYear; year++) {
          const yearData = cityData.get(year);
          if (yearData) {
            const monthData = yearData.find(m => m.month === month);
            if (monthData) {
              values.push(monthData[category]);
            }
          }
        }
        result.push({ cityId, month, values });
      }
    }

    return result;
  }

  public getYearlyData(
    cityId: string,
    category: DataCategory,
    yearRange: [number, number]
  ): MonthData[] {
    const result: MonthData[] = [];
    const [startYear, endYear] = yearRange;
    const cityData = this.data.get(cityId);

    if (!cityData) return result;

    for (let year = startYear; year <= endYear; year++) {
      const yearData = cityData.get(year);
      if (yearData) {
        for (const monthData of yearData) {
          result.push(monthData);
        }
      }
    }

    return result;
  }

  public getStats(
    cityId: string,
    category: DataCategory,
    yearRange: [number, number]
  ): Stats {
    const yearlyData = this.getYearlyData(cityId, category, yearRange);
    const values = yearlyData.map(d => d[category]);

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);

    return {
      mean: Math.round(mean * 10) / 10,
      max: Math.round(max * 10) / 10,
      min: Math.round(min * 10) / 10,
      maxMonth: yearlyData[maxIndex]?.month || 1,
      minMonth: yearlyData[minIndex]?.month || 1
    };
  }

  public getValueMapping(category: DataCategory): ValueMapping {
    const mappings: Record<DataCategory, ValueMapping> = {
      temperature: {
        min: -10,
        max: 40,
        heightMin: 0.5,
        heightMax: 5,
        colorStart: '#3B82F6',
        colorEnd: '#EF4444',
        unit: '°C'
      },
      precipitation: {
        min: 0,
        max: 500,
        heightMin: 0.1,
        heightMax: 4,
        colorStart: '#10B981',
        colorEnd: '#06B6D4',
        unit: 'mm'
      },
      windSpeed: {
        min: 0,
        max: 30,
        heightMin: 0.2,
        heightMax: 3,
        colorStart: '#F59E0B',
        colorEnd: '#8B5CF6',
        unit: 'm/s'
      }
    };

    return mappings[category];
  }
}

export const dataManager = DataManager.getInstance();
export { DataManager };
