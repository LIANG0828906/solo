import { Point } from '@/types';

export const getDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const greedyRoute = (entrance: Point, booths: Point[]): Point[] => {
  if (booths.length === 0) return [entrance];
  
  const route: Point[] = [entrance];
  const remaining = [...booths];
  let current = entrance;
  
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = getDistance(current, remaining[i]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }
    
    current = remaining[nearestIndex];
    route.push(current);
    remaining.splice(nearestIndex, 1);
  }
  
  return route;
};
