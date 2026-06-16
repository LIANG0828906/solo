import { GeoPoint, Restaurant } from '@/types';
import { restaurants } from '@/data/foodData';

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
