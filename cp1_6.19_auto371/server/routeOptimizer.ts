export interface AddressInput {
  orderId: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RouteStop {
  orderId: string;
  address: string;
  lat: number;
  lng: number;
  sequence: number;
  distanceFromPrev: number;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function optimizeRoute(addresses: AddressInput[]): RouteStop[] {
  if (addresses.length === 0) return [];
  if (addresses.length === 1) {
    return [{
      ...addresses[0],
      sequence: 1,
      distanceFromPrev: 0,
    }];
  }

  const visited = new Set<number>();
  const result: RouteStop[] = [];
  let currentIndex = 0;

  visited.add(0);
  result.push({
    ...addresses[0],
    sequence: 1,
    distanceFromPrev: 0,
  });

  while (visited.size < addresses.length) {
    let nearestIndex = -1;
    let nearestDist = Infinity;
    const current = addresses[currentIndex];

    for (let i = 0; i < addresses.length; i++) {
      if (visited.has(i)) continue;
      const dist = haversineDistance(current.lat, current.lng, addresses[i].lat, addresses[i].lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    visited.add(nearestIndex);
    currentIndex = nearestIndex;
    result.push({
      ...addresses[nearestIndex],
      sequence: result.length + 1,
      distanceFromPrev: Math.round(nearestDist * 10) / 10,
    });
  }

  return result;
}
