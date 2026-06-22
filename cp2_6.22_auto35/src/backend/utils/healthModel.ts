export interface ElevationPoint {
  distance: number;
  elevation: number;
}

export interface CalorieData {
  segment: string;
  calories: number;
  duration: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  points: RoutePoint[];
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  maxElevation: number;
  minElevation: number;
  estimatedTime: number;
  createdAt: Date;
}

export interface Activity {
  id: string;
  routeId: string;
  name: string;
  date: Date;
  inviteCode: string;
  participants: string[];
  createdAt: Date;
}

export interface WeatherData {
  date: string;
  temperature: {
    high: number;
    low: number;
  };
  condition: string;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

export interface GearItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  essential: boolean;
}

export function calculateDistance(points: RoutePoint[]): number {
  const R = 6371;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dLat = (points[i].lat - points[i - 1].lat) * Math.PI / 180;
    const dLng = (points[i].lng - points[i - 1].lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(points[i - 1].lat * Math.PI / 180) * Math.cos(points[i].lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return Math.round(total * 100) / 100;
}

export function calculateElevationStats(points: RoutePoint[]): {
  gain: number;
  loss: number;
  max: number;
  min: number;
} {
  let gain = 0;
  let loss = 0;
  let max = -Infinity;
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    const ele = points[i].elevation || 0;
    if (ele > max) max = ele;
    if (ele < min) min = ele;
    if (i > 0) {
      const prevEle = points[i - 1].elevation || 0;
      const diff = ele - prevEle;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }
  }
  return {
    gain: Math.round(gain),
    loss: Math.round(loss),
    max: Math.round(max),
    min: Math.round(min)
  };
}

export function estimateTime(distance: number, elevationGain: number): number {
  const baseTime = distance * 12;
  const elevationTime = elevationGain * 0.01;
  return Math.round(baseTime + elevationTime);
}

export function generateElevationData(points: RoutePoint[], distance: number): ElevationPoint[] {
  const result: ElevationPoint[] = [];
  const totalDistance = distance;
  const step = totalDistance / (points.length - 1 || 1);
  let accumulated = 0;
  for (let i = 0; i < points.length; i++) {
    result.push({
      distance: Math.round(accumulated * 100) / 100,
      elevation: Math.round(points[i].elevation || 0)
    });
    accumulated += step;
  }
  return result;
}

export function generateWeatherData(): WeatherData[] {
  const conditions = ['晴', '多云', '阴', '小雨', '阵雨'];
  const result: WeatherData[] = [];
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    result.push({
      date: date.toISOString().split('T')[0],
      temperature: {
        high: Math.floor(Math.random() * 15) + 20,
        low: Math.floor(Math.random() * 10) + 10
      },
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      precipitation: Math.round(Math.random() * 100) / 100,
      windSpeed: Math.floor(Math.random() * 30) + 5,
      humidity: Math.floor(Math.random() * 40) + 40
    });
  }
  return result;
}

export function calculateCalories(
  distance: number,
  elevationGain: number,
  weight: number,
  packWeight: number
): CalorieData[] {
  const totalWeight = weight + packWeight;
  const flatCalories = distance * 70 * (totalWeight / 70);
  const climbCalories = elevationGain * 0.5 * (totalWeight / 70);
  const totalCalories = flatCalories + climbCalories;
  const totalDuration = distance * 12 + elevationGain * 0.01;
  const segments = Math.ceil(distance / 2);
  const result: CalorieData[] = [];
  for (let i = 0; i < segments; i++) {
    const segmentDistance = Math.min(2, distance - i * 2);
    const segmentRatio = segmentDistance / distance;
    result.push({
      segment: `第${i + 1}段 (${i * 2}-${Math.min((i + 1) * 2, distance)}km)`,
      calories: Math.round(totalCalories * segmentRatio),
      duration: Math.round(totalDuration * segmentRatio)
    });
  }
  return result;
}

export function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getDefaultGearList(): GearItem[] {
  return [
    { id: '1', name: '登山杖', category: '登山装备', weight: 0.5, essential: true },
    { id: '2', name: '头灯', category: '照明', weight: 0.2, essential: true },
    { id: '3', name: '急救包', category: '安全', weight: 0.8, essential: true },
    { id: '4', name: '水壶', category: '补给', weight: 1.0, essential: true },
    { id: '5', name: '食物', category: '补给', weight: 1.5, essential: true },
    { id: '6', name: '雨衣', category: '防护', weight: 0.4, essential: true },
    { id: '7', name: '手套', category: '防护', weight: 0.15, essential: true },
    { id: '8', name: '帽子', category: '防护', weight: 0.1, essential: true },
    { id: '9', name: '防晒霜', category: '护肤', weight: 0.1, essential: false },
    { id: '10', name: '地图', category: '导航', weight: 0.1, essential: true }
  ];
}
