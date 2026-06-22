import { HeatPoint } from '@/types';

const industrialZones = [
  { lat: 39.9, lng: 116.4, name: '中国华北' },
  { lat: 31.2, lng: 121.5, name: '中国华东' },
  { lat: 22.5, lng: 114.1, name: '中国华南' },
  { lat: 40.7, lng: -74.0, name: '美国东北部' },
  { lat: 34.1, lng: -118.2, name: '美国西部' },
  { lat: 41.9, lng: 12.5, name: '欧洲南部' },
  { lat: 51.5, lng: -0.1, name: '欧洲西部' },
  { lat: 35.7, lng: 139.7, name: '日本关东' },
  { lat: 28.6, lng: 77.2, name: '印度北部' },
  { lat: 19.1, lng: 72.9, name: '印度西部' },
  { lat: 55.8, lng: 37.6, name: '俄罗斯西部' },
  { lat: -23.5, lng: -46.6, name: '巴西东南部' },
  { lat: 31.5, lng: 74.3, name: '巴基斯坦东部' },
  { lat: 37.6, lng: 127.0, name: '韩国西北部' },
  { lat: 14.6, lng: 121.0, name: '菲律宾吕宋' },
];

const agriculturalZones = [
  { lat: 45.0, lng: -93.0, name: '美国玉米带' },
  { lat: 52.0, lng: 19.0, name: '欧洲平原' },
  { lat: 35.0, lng: 117.0, name: '中国华北平原' },
  { lat: 30.0, lng: 105.0, name: '四川盆地' },
  { lat: 28.0, lng: 77.0, name: '印度恒河平原' },
  { lat: -20.0, lng: -50.0, name: '巴西高原' },
  { lat: -33.0, lng: 116.0, name: '澳大利亚西南部' },
  { lat: 48.0, lng: 16.0, name: '多瑙河流域' },
  { lat: 10.0, lng: 8.0, name: '尼日利亚北部' },
  { lat: 30.0, lng: 31.0, name: '埃及尼罗河谷' },
];

const generatePointsForSource = (
  sourceId: string,
  zones: { lat: number; lng: number }[],
  count: number
): HeatPoint[] => {
  const points: HeatPoint[] = [];
  for (let i = 0; i < count; i++) {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const latJitter = (Math.random() - 0.5) * 10;
    const lngJitter = (Math.random() - 0.5) * 15;
    points.push({
      id: `${sourceId}-${i}`,
      sourceId,
      lat: zone.lat + latJitter,
      lng: zone.lng + lngJitter,
      baseIntensity: 0.5 + Math.random() * 0.5,
    });
  }
  return points;
};

export const heatPoints: HeatPoint[] = [
  ...generatePointsForSource('energy-coal', industrialZones, 30),
  ...generatePointsForSource('energy-oil', industrialZones, 25),
  ...generatePointsForSource('energy-gas', industrialZones, 20),
  ...generatePointsForSource('industry-cement', industrialZones, 15),
  ...generatePointsForSource('industry-steel', industrialZones, 15),
  ...generatePointsForSource('transport-road', industrialZones, 25),
  ...generatePointsForSource('agriculture-livestock', agriculturalZones, 35),
  ...generatePointsForSource('agriculture-fertilizer', agriculturalZones, 35),
];
