import { GeoPoint, Restaurant, ScenarioType } from '@/types';
import { restaurants } from '@/data/foodData';

export const inferScenarios = (tags: string[], rating: number, signatureDishes: string[]): ScenarioType[] => {
  const scenarios: ScenarioType[] = [];
  const tagsLower = tags.map(t => t.toLowerCase());
  const dishesLower = signatureDishes.map(d => d.toLowerCase());
  const dishesStr = dishesLower.join(' ');

  const isFast = tagsLower.some(t => ['小吃', '街头', '面食'].includes(t)) || 
                 dishesLower.some(d => ['面', '粉', '包', '饺', '馍'].some(c => d.includes(c)));
  
  const isFormal = tagsLower.some(t => ['老字号', '西餐', '景观', '粤菜', '闽菜', '鲁菜', '杭帮菜', '苏帮菜', '陕菜', '徽菜', '赣菜', '湘菜'].includes(t));
  
  const isHotpot = tagsLower.includes('火锅');
  const isSeafood = tagsLower.includes('海鲜') || dishesStr.includes('虾') || dishesStr.includes('鱼') || dishesStr.includes('蟹');
  const isSpicy = tagsLower.includes('麻辣') || dishesLower.some(d => d.includes('辣') || d.includes('麻') || d.includes('椒'));
  const isNight = tagsLower.some(t => ['小龙虾', '烤串'].includes(t)) || dishesLower.some(d => d.includes('龙虾') || d.includes('烤'));
  
  const hasSoup = dishesLower.some(d => d.includes('汤') || d.includes('粥'));
  const hasDimsum = dishesLower.some(d => d.includes('包') || d.includes('饺') || d.includes('小笼') || d.includes('粉'));

  if (isFast) {
    scenarios.push('适合赶路快餐');
    if (hasSoup || hasDimsum || tagsLower.includes('面食')) {
      scenarios.push('适合午餐');
    }
  } else {
    scenarios.push('适合悠闲慢享');
    scenarios.push('适合晚餐');
  }

  if (isHotpot || isSeafood || tagsLower.some(t => ['火锅', '麻辣', '海鲜'].includes(t))) {
    if (!scenarios.includes('适合晚餐')) scenarios.push('适合晚餐');
    scenarios.push('适合朋友聚会');
  }

  if (isNight || tagsLower.some(t => ['小龙虾', '烤串'].includes(t))) {
    scenarios.push('适合夜宵');
  }

  if (rating >= 4.6 && isFormal) {
    scenarios.push('适合商务宴请');
  }

  if (tagsLower.includes('景观') || tagsLower.includes('西餐') || (rating >= 4.6 && !isFast)) {
    scenarios.push('适合情侣约会');
  }

  if ((isFormal && rating >= 4.5) || tagsLower.some(t => ['老字号', '家庭'].includes(t)) || 
      dishesStr.includes('鸡') || dishesStr.includes('鸭') || dishesStr.includes('鱼')) {
    if (!scenarios.some(s => s.includes('家庭'))) {
      scenarios.push('适合家庭聚餐');
    }
  }

  if (hasSoup && (isFast || tagsLower.includes('面食'))) {
    if (!scenarios.includes('适合午餐')) scenarios.push('适合午餐');
  }

  if (rating >= 4.7 && !scenarios.includes('适合家庭聚餐')) {
    if (!isFast) scenarios.push('适合家庭聚餐');
  }

  const uniqueScenarios = Array.from(new Set(scenarios));
  return uniqueScenarios.slice(0, 3);
};

const haversineDistance = (p1: GeoPoint, p2: GeoPoint): number => {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const pointToLineDistance = (point: GeoPoint, lineStart: GeoPoint, lineEnd: GeoPoint): number => {
  const A = point.lng - lineStart.lng;
  const B = point.lat - lineStart.lat;
  const C = lineEnd.lng - lineStart.lng;
  const D = lineEnd.lat - lineStart.lat;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.lng;
    yy = lineStart.lat;
  } else if (param > 1) {
    xx = lineEnd.lng;
    yy = lineEnd.lat;
  } else {
    xx = lineStart.lng + param * C;
    yy = lineStart.lat + param * D;
  }

  return haversineDistance(point, { lat: yy, lng: xx });
};

export interface FoodSearchOptions {
  radiusKm?: number;
  maxResults?: number;
  minRating?: number;
  tags?: string[];
}

export const findRestaurantsAlongPath = (
  path: GeoPoint[],
  options: FoodSearchOptions = {}
): Restaurant[] => {
  const { 
    radiusKm = 50, 
    maxResults = 20, 
    minRating = 3.5,
    tags = []
  } = options;

  if (path.length < 2) return [];

  const matchedRestaurants = new Map<string, { restaurant: Restaurant; minDistance: number }>();

  restaurants.forEach(restaurant => {
    if (restaurant.rating < minRating) return;
    
    if (tags.length > 0) {
      const hasMatchingTag = restaurant.tags.some(tag => 
        tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
      if (!hasMatchingTag) return;
    }

    let minDistance = Infinity;
    
    for (let i = 0; i < path.length - 1; i++) {
      const dist = pointToLineDistance(
        { lat: restaurant.lat, lng: restaurant.lng },
        path[i],
        path[i + 1]
      );
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    if (minDistance <= radiusKm) {
      matchedRestaurants.set(restaurant.id, { restaurant, minDistance });
    }
  });

  const sorted = Array.from(matchedRestaurants.values())
    .sort((a, b) => {
      const ratingDiff = b.restaurant.rating - a.restaurant.rating;
      if (Math.abs(ratingDiff) > 0.5) return ratingDiff;
      return a.minDistance - b.minDistance;
    })
    .slice(0, maxResults)
    .map(item => item.restaurant);

  return sorted;
};

export const findRestaurantsNearPoint = (
  point: GeoPoint,
  options: FoodSearchOptions = {}
): Restaurant[] => {
  const { radiusKm = 50, maxResults = 10, minRating = 0 } = options;

  return restaurants
    .filter(r => r.rating >= minRating)
    .map(r => ({
      restaurant: r,
      distance: haversineDistance(point, { lat: r.lat, lng: r.lng })
    }))
    .filter(item => item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
    .map(item => item.restaurant);
};

export const validateGeofence = (
  testPoint: GeoPoint,
  radiusKm: number = 50
): { valid: boolean; details: string; restaurantsWithin: { name: string; distance: number }[] } => {
  const results = restaurants
    .map(r => ({
      name: r.name,
      distance: haversineDistance(testPoint, { lat: r.lat, lng: r.lng })
    }))
    .filter(r => r.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  const allWithinRadius = results.every(r => r.distance <= radiusKm);
  
  const nearBoundary = results.filter(r => 
    Math.abs(r.distance - radiusKm) / radiusKm < 0.1 && r.distance <= radiusKm
  );

  return {
    valid: allWithinRadius,
    details: `地理围栏验证: 半径${radiusKm}km, 共找到${results.length}家餐厅, 边界附近${nearBoundary.length}家`,
    restaurantsWithin: results
  };
};
