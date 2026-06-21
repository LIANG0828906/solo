import { v4 as uuidv4 } from "uuid";

interface Alert {
  id: string;
  type: string;
  level: string;
  areaName: string;
  coordinates: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } };
  description: string;
}

const alertTypes = ["暴雨", "大风", "冰雹", "雷电", "高温", "大雾"];
const districtNames = [
  "海淀区", "朝阳区", "东城区", "西城区", "丰台区",
  "石景山区", "通州区", "顺义区", "大兴区", "昌平区",
];
const levels = ["yellow", "red"];

interface CacheEntry {
  alerts: Alert[];
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export function fetchWeatherAlerts(routes: any[]): Alert[] {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.alerts;
  }

  const allCoords: [number, number][] = [];
  for (const route of routes) {
    if (route.path) {
      for (const coord of route.path) {
        allCoords.push(coord);
      }
    }
  }

  if (allCoords.length === 0) {
    return [];
  }

  const count = 2 + Math.floor(Math.random() * 4);
  const alerts: Alert[] = [];

  for (let i = 0; i < count; i++) {
    const anchor = allCoords[Math.floor(Math.random() * allCoords.length)];
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const areaName = districtNames[Math.floor(Math.random() * districtNames.length)];

    const offsetLat = (Math.random() - 0.5) * 0.06;
    const offsetLng = (Math.random() - 0.5) * 0.06;
    const spanLat = 0.02 + Math.random() * 0.04;
    const spanLng = 0.02 + Math.random() * 0.04;

    const sw = {
      lat: anchor[0] + offsetLat - spanLat / 2,
      lng: anchor[1] + offsetLng - spanLng / 2,
    };
    const ne = {
      lat: anchor[0] + offsetLat + spanLat / 2,
      lng: anchor[1] + offsetLng + spanLng / 2,
    };

    const descriptions: Record<string, string> = {
      暴雨: `${areaName}预计未来6小时内将出现暴雨，降雨量达50毫米以上，请注意防范`,
      大风: `${areaName}预计未来6小时内将出现8级以上大风，请减少户外活动`,
      冰雹: `${areaName}预计未来2小时内可能出现冰雹天气，请做好防护`,
      雷电: `${areaName}预计未来6小时内将出现雷电天气，请注意防雷`,
      高温: `${areaName}预计未来24小时内最高气温将达40°C以上，请注意防暑`,
      大雾: `${areaName}预计未来12小时内将出现能见度低于200米的大雾，请注意出行安全`,
    };

    alerts.push({
      id: uuidv4(),
      type: alertType,
      level,
      areaName,
      coordinates: { sw, ne },
      description: descriptions[alertType],
    });
  }

  cache = { alerts, timestamp: Date.now() };
  return alerts;
}
