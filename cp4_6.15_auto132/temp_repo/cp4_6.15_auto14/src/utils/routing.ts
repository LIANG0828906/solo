import type { CommunityLocation, DeliveryRoute } from '../types';

export const COMMUNITY_LOCATIONS: CommunityLocation[] = [
  { community: '阳光花园', x: 150, y: 120 },
  { community: '翠湖小区', x: 350, y: 80 },
  { community: '绿城家园', x: 550, y: 150 },
  { community: '金色港湾', x: 450, y: 300 },
  { community: '幸福里', x: 250, y: 280 },
];

export const START_POINT: CommunityLocation = {
  community: '团长仓库',
  x: 50,
  y: 200,
};

export function distance(a: CommunityLocation, b: CommunityLocation): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getCommunityLocation(community: string): CommunityLocation | undefined {
  return COMMUNITY_LOCATIONS.find((loc) => loc.community === community);
}

export function calculateOptimalRoute(communities: string[]): DeliveryRoute {
  const locations: CommunityLocation[] = [];

  for (const community of communities) {
    const loc = getCommunityLocation(community);
    if (loc) {
      locations.push(loc);
    }
  }

  if (locations.length === 0) {
    return { order: [START_POINT], totalDistance: 0 };
  }

  const visited = new Set<string>();
  const route: CommunityLocation[] = [START_POINT];
  let totalDistance = 0;
  let current = START_POINT;

  while (visited.size < locations.length) {
    let nearest: CommunityLocation | null = null;
    let nearestDist = Infinity;

    for (const loc of locations) {
      if (!visited.has(loc.community)) {
        const d = distance(current, loc);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = loc;
        }
      }
    }

    if (nearest) {
      visited.add(nearest.community);
      route.push(nearest);
      totalDistance += nearestDist;
      current = nearest;
    } else {
      break;
    }
  }

  return { order: route, totalDistance };
}

export function buildRoutePath(route: CommunityLocation[]): string {
  if (route.length < 2) return '';
  return route
    .map((loc, index) => (index === 0 ? `M ${loc.x} ${loc.y}` : `L ${loc.x} ${loc.y}`))
    .join(' ');
}
