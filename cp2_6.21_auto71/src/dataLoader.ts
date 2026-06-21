import type { POI, POICategory } from './types';

const CENTER_LAT = 39.9042;
const CENTER_LNG = 116.4074;

const NAMES: Record<POICategory, string[]> = {
  toilet: [
    '天安门公共厕所', '前门大街公厕', '王府井公厕', '东单公厕', '西单公厕',
    '建国门公厕', '朝阳门公厕', '东直门公厕', '西直门公厕', '复兴门公厕',
    '德胜门公厕', '安定门公厕', '雍和宫公厕', '故宫东门公厕', '故宫北门公厕',
    '景山公园公厕', '北海公园公厕', '中山公园公厕', '劳动人民文化宫公厕', '太庙公厕',
    '南池子大街公厕', '南长街公厕', '北池子大街公厕', '北长街公厕', '长安街公厕',
    '北京站公厕', '北京西站公厕', '北京南站公厕', '北京北站公厕', '国贸公厕',
  ],
  convenience: [
    '7-11王府井店', '全家东单店', '罗森西单店', '便利蜂建国门店', '7-11朝阳门店',
    '全家东直门门店', '罗森西直门店', '便利蜂复兴门店', '7-11德胜门店', '全家安定门店',
    '罗森雍和宫店', '便利蜂故宫店', '7-11景山店', '全家北海店', '罗森中山公园店',
    '便利蜂南池子店', '7-11南长街店', '全家北池子店', '罗森北长街店', '便利蜂长安街店',
    '7-11北京站店', '全家北京西站店', '罗森北京南站店', '便利蜂北京北站店', '7-11国贸店',
    '全家大望路店', '罗森双井店', '便利蜂劲松店', '7-11潘家园店', '全家十里河店',
  ],
  cafe: [
    '星巴克王府井店', '瑞幸咖啡东单店', 'COSTA西单店', 'Manner建国门店', 'Seesaw朝阳门店',
    '星巴克东直门店', '瑞幸咖啡西直门店', 'COSTA复兴门店', 'Manner德胜门店', 'Seesaw安定门店',
    '星巴克雍和宫店', '瑞幸咖啡故宫店', 'COSTA景山店', 'Manner北海店', 'Seesaw中山公园店',
    '星巴克南池子店', '瑞幸咖啡南长街店', 'COSTA北池子店', 'Manner北长街店', 'Seesaw长安街店',
    '星巴克北京站店', '瑞幸咖啡北京西站店', 'COSTA北京南站店', 'Manner北京北站店', 'Seesaw国贸店',
    '星巴克大望路店', '瑞幸咖啡双井店', 'COSTA劲松店', 'Manner潘家园店', 'Seesaw三里屯店',
  ],
  charging: [
    '国家电网充电站王府井站', '特来电东单站', '星星充电西单站', '小桔建国门站', '开迈斯朝阳门站',
    '国家电网东直门站', '特来电西直门站', '星星充电复兴门站', '小桔德胜门站', '开迈斯安定门站',
    '国家电网雍和宫站', '特来电故宫站', '星星充电景山站', '小桔北海站', '开迈斯中山公园站',
    '国家电网南池子站', '特来电南长街站', '星星充电北池子站', '小桔北长街站', '开迈斯长安街站',
    '国家电网北京站', '特来电北京西站', '星星充电北京南站', '小桔北京北站', '开迈斯国贸站',
    '国家电网大望路站', '特来电双井站', '星星充电劲松站', '小桔潘家园站', '开迈斯三里屯站',
  ],
  pharmacy: [
    '同仁堂王府井药店', '同仁堂东单药店', '同仁堂西单药店', '金象大药房建国门店', '嘉事堂朝阳门店',
    '同仁堂东直门药店', '同仁堂西直门药店', '金象大药房复兴门店', '嘉事堂德胜门店', '同仁堂安定门药店',
    '同仁堂雍和宫药店', '同仁堂故宫药店', '金象大药房景山店', '嘉事堂北海店', '同仁堂中山公园药店',
    '同仁堂南池子药店', '同仁堂南长街药店', '金象大药房北池子店', '嘉事堂北长街店', '同仁堂长安街药店',
    '同仁堂北京站药店', '同仁堂北京西站药店', '金象大药房北京南站店', '嘉事堂北京北站店', '同仁堂国贸药店',
    '同仁堂大望路药店', '金象大药房双井店', '嘉事堂劲松店', '同仁堂潘家园药店', '同仁堂三里屯药店',
  ],
};

const STREETS = [
  '东长安街', '西长安街', '王府井大街', '东单北大街', '西单北大街',
  '建国门内大街', '朝阳门内大街', '东直门内大街', '西直门内大街', '复兴门内大街',
  '德胜门内大街', '安定门内大街', '雍和宫大街', '故宫东街', '故宫北街',
  '景山东街', '景山西街', '南池子大街', '南长街', '北池子大街',
  '北长街', '北京站街', '北京西站南路', '北京南站路', '国贸路',
  '大望路', '双井路', '劲松路', '潘家园路', '三里屯路',
];

function generateRandomOffset(): { lat: number; lng: number } {
  const radiusInDegrees = 0.01;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * radiusInDegrees;
  return {
    lat: Math.sin(angle) * distance,
    lng: Math.cos(angle) * distance,
  };
}

function generatePOIsForCategory(category: POICategory, count: number): POI[] {
  const names = NAMES[category];
  const pois: POI[] = [];
  
  for (let i = 0; i < count; i++) {
    const offset = generateRandomOffset();
    const street = STREETS[Math.floor(Math.random() * STREETS.length)];
    const houseNumber = Math.floor(Math.random() * 200) + 1;
    
    pois.push({
      id: `${category}-${i}`,
      category,
      name: names[i % names.length],
      address: `${street}${houseNumber}号`,
      lat: CENTER_LAT + offset.lat,
      lng: CENTER_LNG + offset.lng,
    });
  }
  
  return pois;
}

let cachedData: POI[] | null = null;

export function loadPOIData(): POI[] {
  if (cachedData) {
    return cachedData;
  }
  
  const categories: POICategory[] = ['toilet', 'convenience', 'cafe', 'charging', 'pharmacy'];
  const allPOIs: POI[] = [];
  
  for (const category of categories) {
    allPOIs.push(...generatePOIsForCategory(category, 30));
  }
  
  cachedData = allPOIs;
  return allPOIs;
}

export function filterPOIsByCategory(pois: POI[], categories: POICategory[]): POI[] {
  if (categories.length === 0) {
    return [];
  }
  return pois.filter(poi => categories.includes(poi.category));
}

export function filterPOIsByRadius(
  pois: POI[],
  center: [number, number],
  radius: number
): POI[] {
  return pois.filter(poi => {
    const distance = calculateDistance(center, [poi.lat, poi.lng]);
    return distance <= radius;
  });
}

function calculateDistance(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}
