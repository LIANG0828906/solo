import type { Station, HistoryData, PollutantType, AqiLevel, TimeRange, HistoryDataPoint } from '../types';
import { AQI_LEVELS } from '../types';

const STATION_NAMES = [
  { name: '朝阳区监测站', city: '北京' },
  { name: '海淀区监测站', city: '北京' },
  { name: '浦东新区监测站', city: '上海' },
  { name: '徐汇区监测站', city: '上海' },
  { name: '天河区监测站', city: '广州' },
  { name: '南山区监测站', city: '深圳' },
  { name: '西湖区监测站', city: '杭州' },
  { name: '鼓楼区监测站', city: '南京' },
];

const POLLUTANT_RANGES: Record<PollutantType, { min: number; max: number }> = {
  'PM2.5': { min: 10, max: 150 },
  'PM10': { min: 20, max: 200 },
  'O3': { min: 30, max: 180 },
  'NO2': { min: 15, max: 100 },
  'CO': { min: 0.5, max: 2.5 },
  'SO2': { min: 5, max: 80 },
};

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function getAqiLevel(aqi: number): AqiLevel {
  if (aqi <= 50) return 'excellent';
  if (aqi <= 100) return 'good';
  if (aqi <= 150) return 'light';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'heavy';
  return 'severe';
}

function getPrimaryPollutant(pollutants: Record<PollutantType, number>): PollutantType {
  const entries = Object.entries(pollutants) as [PollutantType, number][];
  let maxPollutant: PollutantType = 'PM2.5';
  let maxRatio = 0;
  
  for (const [name, value] of entries) {
    const range = POLLUTANT_RANGES[name];
    const ratio = value / range.max;
    if (ratio > maxRatio) {
      maxRatio = ratio;
      maxPollutant = name;
    }
  }
  
  return maxPollutant;
}

function generateStation(id: number): Station {
  const stationInfo = STATION_NAMES[id % STATION_NAMES.length];
  
  const pollutants = {
    'PM2.5': randomInRange(POLLUTANT_RANGES['PM2.5'].min, POLLUTANT_RANGES['PM2.5'].max),
    'PM10': randomInRange(POLLUTANT_RANGES['PM10'].min, POLLUTANT_RANGES['PM10'].max),
    'O3': randomInRange(POLLUTANT_RANGES['O3'].min, POLLUTANT_RANGES['O3'].max),
    'NO2': randomInRange(POLLUTANT_RANGES['NO2'].min, POLLUTANT_RANGES['NO2'].max),
    'CO': randomInRange(POLLUTANT_RANGES['CO'].min, POLLUTANT_RANGES['CO'].max),
    'SO2': randomInRange(POLLUTANT_RANGES['SO2'].min, POLLUTANT_RANGES['SO2'].max),
  };
  
  const pm25 = pollutants['PM2.5'];
  const aqi = Math.round(pm25 * 1.2 + pollutants['PM10'] * 0.3 + pollutants['O3'] * 0.2);
  const level = getAqiLevel(aqi);
  const primaryPollutant = getPrimaryPollutant(pollutants);
  
  return {
    id: `station-${id}`,
    name: stationInfo.name,
    city: stationInfo.city,
    aqi,
    level,
    primaryPollutant,
    pollutants,
    updateTime: new Date().toISOString(),
  };
}

function generateHistoryData(stationId: string, range: TimeRange): HistoryData {
  const data: Partial<HistoryData> = {};
  const pollutants: PollutantType[] = ['PM2.5', 'PM10', 'O3', 'NO2', 'CO', 'SO2'];
  
  let points: number;
  let labelFormat: (i: number) => string;
  
  switch (range) {
    case '24h':
      points = 24;
      labelFormat = (i) => `${i.toString().padStart(2, '0')}:00`;
      break;
    case '7d':
      points = 7;
      labelFormat = (i) => {
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        return days[i];
      };
      break;
    case '30d':
      points = 30;
      labelFormat = (i) => `${(i + 1).toString().padStart(2, '0')}日`;
      break;
  }
  
  for (const pollutant of pollutants) {
    const rangeData = POLLUTANT_RANGES[pollutant];
    const baseValue = (rangeData.min + rangeData.max) / 2;
    const variation = (rangeData.max - rangeData.min) * 0.3;
    
    const pointsArray: HistoryDataPoint[] = [];
    let currentValue = baseValue;
    
    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * variation;
      currentValue = Math.max(rangeData.min, Math.min(rangeData.max, currentValue + change));
      
      pointsArray.push({
        time: labelFormat(i),
        value: Math.round(currentValue * 10) / 10,
      });
    }
    
    data[pollutant] = pointsArray;
  }
  
  return data as HistoryData;
}

export function getAllStations(): Promise<Station[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stations: Station[] = [];
      for (let i = 0; i < 8; i++) {
        stations.push(generateStation(i));
      }
      resolve(stations);
    }, 300);
  });
}

export function refreshStationData(stations: Station[]): Promise<Station[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const refreshed = stations.map((station) => {
        const newPollutants = { ...station.pollutants };
        
        (Object.keys(newPollutants) as PollutantType[]).forEach((key) => {
          const range = POLLUTANT_RANGES[key];
          const change = (Math.random() - 0.5) * (range.max - range.min) * 0.1;
          newPollutants[key] = Math.round(
            Math.max(range.min, Math.min(range.max, newPollutants[key] + change)) * 10
          ) / 10;
        });
        
        const aqi = Math.round(
          newPollutants['PM2.5'] * 1.2 + newPollutants['PM10'] * 0.3 + newPollutants['O3'] * 0.2
        );
        
        return {
          ...station,
          aqi,
          level: getAqiLevel(aqi),
          primaryPollutant: getPrimaryPollutant(newPollutants),
          pollutants: newPollutants,
          updateTime: new Date().toISOString(),
        };
      });
      
      resolve(refreshed);
    }, 200);
  });
}

export function getHistoryData(stationId: string, range: TimeRange): Promise<HistoryData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateHistoryData(stationId, range));
    }, 300);
  });
}
