export interface CityData {
  name: string;
  x: number;
  y: number;
}

export interface RouteResult {
  orderedCities: string[];
  distances: number[];
}

export interface CityGuide {
  name: string;
  attractions: string;
  food: string[];
  season: string;
}

export const cityCoordinates: Record<string, CityData> = {
  '北京': { name: '北京', x: 200, y: 100 },
  '上海': { name: '上海', x: 400, y: 200 },
  '成都': { name: '成都', x: 100, y: 400 },
  '西安': { name: '西安', x: 300, y: 300 },
  '广州': { name: '广州', x: 500, y: 500 }
};

export const cityGuides: Record<string, CityGuide> = {
  '北京': {
    name: '北京',
    attractions: '故宫、天安门、八达岭长城、颐和园',
    food: ['北京烤鸭', '炸酱面', '豆汁儿'],
    season: '春季（4-5月）和秋季（9-10月）'
  },
  '上海': {
    name: '上海',
    attractions: '外滩、东方明珠、豫园、迪士尼乐园',
    food: ['小笼包', '生煎包', '红烧肉'],
    season: '春季（3-5月）和秋季（9-11月）'
  },
  '成都': {
    name: '成都',
    attractions: '宽窄巷子、锦里、大熊猫基地、都江堰',
    food: ['火锅', '串串香', '龙抄手'],
    season: '春季（3-6月）和秋季（9-11月）'
  },
  '西安': {
    name: '西安',
    attractions: '兵马俑、大雁塔、古城墙、回民街',
    food: ['肉夹馍', '凉皮', '羊肉泡馍'],
    season: '春季（3-5月）和秋季（9-11月）'
  },
  '广州': {
    name: '广州',
    attractions: '广州塔、沙面岛、陈家祠、越秀公园',
    food: ['白切鸡', '烧鹅', '肠粉'],
    season: '秋季（10-12月）和冬季（1-2月）'
  }
};

function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function permute<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const remainingPerms = permute(remaining);
    for (const perm of remainingPerms) {
      result.push([current, ...perm]);
    }
  }
  return result;
}

export function planRoute(cities: string[]): RouteResult {
  const validCities = cities.filter(city => cityCoordinates[city]);

  if (validCities.length === 0) {
    return { orderedCities: [], distances: [] };
  }

  if (validCities.length === 1) {
    return { orderedCities: validCities, distances: [] };
  }

  if (validCities.length <= 6) {
    const allPermutations = permute(validCities);
    let bestRoute: string[] = validCities;
    let bestDistance = Infinity;

    for (const perm of allPermutations) {
      let totalDist = 0;
      for (let i = 0; i < perm.length - 1; i++) {
        const c1 = cityCoordinates[perm[i]];
        const c2 = cityCoordinates[perm[i + 1]];
        totalDist += manhattanDistance(c1.x, c1.y, c2.x, c2.y);
      }
      if (totalDist < bestDistance) {
        bestDistance = totalDist;
        bestRoute = perm;
      }
    }

    const distances: number[] = [];
    for (let i = 0; i < bestRoute.length - 1; i++) {
      const c1 = cityCoordinates[bestRoute[i]];
      const c2 = cityCoordinates[bestRoute[i + 1]];
      distances.push(manhattanDistance(c1.x, c1.y, c2.x, c2.y));
    }

    return { orderedCities: bestRoute, distances };
  }

  const visited = new Set<string>();
  const orderedCities: string[] = [validCities[0]];
  visited.add(validCities[0]);

  while (orderedCities.length < validCities.length) {
    const current = orderedCities[orderedCities.length - 1];
    const currCoord = cityCoordinates[current];
    let nearestCity = '';
    let nearestDist = Infinity;

    for (const city of validCities) {
      if (visited.has(city)) continue;
      const coord = cityCoordinates[city];
      const dist = manhattanDistance(currCoord.x, currCoord.y, coord.x, coord.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestCity = city;
      }
    }

    orderedCities.push(nearestCity);
    visited.add(nearestCity);
  }

  const distances: number[] = [];
  for (let i = 0; i < orderedCities.length - 1; i++) {
    const c1 = cityCoordinates[orderedCities[i]];
    const c2 = cityCoordinates[orderedCities[i + 1]];
    distances.push(manhattanDistance(c1.x, c1.y, c2.x, c2.y));
  }

  return { orderedCities, distances };
}

export function parseCities(input: string): string[] {
  const separators = /[、,，;；\s]+/;
  const parts = input.split(separators).filter(p => p.trim().length > 0);
  return Array.from(new Set(parts.map(p => p.trim()))).slice(0, 6);
}

export function getGuide(city: string): CityGuide | null {
  return cityGuides[city] || null;
}

export function distanceToKm(distance: number): number {
  return Math.round(distance * 2.5);
}

export function estimateDuration(distanceKm: number): string {
  const hours = distanceKm / 300;
  if (hours < 1) {
    return `${Math.round(hours * 60)}分钟`;
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) {
    return `${wholeHours}小时`;
  }
  return `${wholeHours}小时${minutes}分钟`;
}
