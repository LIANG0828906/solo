import { v4 as uuidv4 } from 'uuid';
import type { Planet, Commodity } from './types';

const COMMODITY_NAMES = ['水', '矿石', '芯片', '药品', '武器', '稀有金属', '能源晶体', '食品', '纳米材料', '星图数据'];

const PLANET_NAMES = [
  '阿尔法-7', '贝塔-3', '伽马-9', '德尔塔-2', '厄普西隆-5',
  '泽塔-1', '伊塔-8', '西塔-4', '卡帕-6', '兰布达-0'
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCommodities(): Commodity[] {
  const count = randomBetween(4, 6);
  const shuffled = [...COMMODITY_NAMES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  return selected.map(name => {
    const basePrice = randomBetween(10, 1000);
    const fluctuation = (Math.random() * 0.3 - 0.15);
    return {
      id: uuidv4(),
      name,
      basePrice,
      currentPrice: Math.max(1, Math.round(basePrice * (1 + fluctuation))),
    };
  });
}

function generatePlanetPositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const margin = 40;
  const width = 600;
  const height = 400;
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = randomBetween(margin, width - margin);
      y = randomBetween(margin, height - margin);
      attempts++;
    } while (
      attempts < 100 &&
      positions.some(p => Math.hypot(p.x - x, p.y - y) < 70)
    );
    positions.push({ x, y });
  }
  return positions;
}

export function generatePlanets(): Planet[] {
  const positions = generatePlanetPositions(10);
  return positions.map((pos, i) => ({
    id: uuidv4(),
    name: PLANET_NAMES[i],
    x: pos.x,
    y: pos.y,
    commodities: generateCommodities(),
    refusesTrade: false,
  }));
}

export function fluctuatePrices(planet: Planet): Planet {
  return {
    ...planet,
    commodities: planet.commodities.map(c => {
      const fluctuation = (Math.random() * 0.3 - 0.15);
      const newPrice = Math.max(1, Math.round(c.basePrice * (1 + fluctuation)));
      return { ...c, currentPrice: newPrice };
    }),
  };
}

export function adjustPriceAfterBuy(commodity: Commodity): Commodity {
  const newPrice = Math.max(1, Math.round(commodity.currentPrice * 1.05));
  return { ...commodity, currentPrice: newPrice };
}

export function adjustPriceAfterSell(commodity: Commodity): Commodity {
  const newPrice = Math.max(1, Math.round(commodity.currentPrice * 0.95));
  return { ...commodity, currentPrice: newPrice };
}

export function getConnections(planets: Planet[]): [Planet, Planet][] {
  const connections: [Planet, Planet][] = [];
  const sorted = [...planets].sort((a, b) => a.x - b.x);

  for (let i = 0; i < sorted.length; i++) {
    const nearest = sorted
      .filter((_, j) => j !== i)
      .sort((a, b) => {
        const da = Math.hypot(a.x - sorted[i].x, a.y - sorted[i].y);
        const db = Math.hypot(b.x - sorted[i].x, b.y - sorted[i].y);
        return da - db;
      })
      .slice(0, randomBetween(2, 3));

    for (const n of nearest) {
      const exists = connections.some(
        ([p1, p2]) =>
          (p1.id === sorted[i].id && p2.id === n.id) ||
          (p1.id === n.id && p2.id === sorted[i].id)
      );
      if (!exists) {
        connections.push([sorted[i], n]);
      }
    }
  }
  return connections;
}

export function createEconomyEngine() {
  let planets = generatePlanets();

  return {
    getPlanets: () => planets,
    getPlanetById: (id: string) => planets.find(p => p.id === id) ?? null,
    dailyFluctuation: () => {
      planets = planets.map(fluctuatePrices);
      return planets;
    },
    updatePlanet: (updated: Planet) => {
      planets = planets.map(p => (p.id === updated.id ? updated : p));
      return planets;
    },
    reset: () => {
      planets = generatePlanets();
      return planets;
    },
    loadPlanets: (data: Planet[]) => {
      planets = data;
      return planets;
    },
  };
}
