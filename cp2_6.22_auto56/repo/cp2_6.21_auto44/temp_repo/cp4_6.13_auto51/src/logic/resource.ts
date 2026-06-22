import { Resources, Outpost, Tile, Caravan, MAP_WIDTH, MAP_HEIGHT, CargoType } from '@/types';

export interface DailyResult {
  resources: Resources;
  outposts: Outpost[];
  caravans: Caravan[];
  notifications: string[];
}

export function applyDailyResourceTick(
  resources: Resources,
  outposts: Outpost[],
  caravans: Caravan[],
  map: Tile[][],
  day: number
): DailyResult {
  const newResources = { ...resources };
  const notifications: string[] = [];
  let newOutposts = outposts.map(o => ({ ...o, collectAnimText: undefined, collectAnimKey: undefined }));
  const newCaravans: Caravan[] = [];

  const main = newOutposts.find(o => o.isMain);
  if (main && !main.isDried) {
    newResources.water += 50;
    notifications.push('主绿洲产出 +50 水');
  }

  newResources.water = Math.floor(newResources.water * 0.9);

  newOutposts = newOutposts.map(o => {
    if (o.isDried) {
      const d = o.driedDays - 1;
      if (d <= 0) {
        notifications.push(`${o.name} 绿洲已恢复`);
        return { ...o, isDried: false, driedDays: 0 };
      }
      return { ...o, driedDays: d };
    }
    if (!o.isEnabled) return o;
    if (day - o.lastCollectDay < 3) return o;

    let gainedWater = 0;
    let gainedFood = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = o.pos.x + dx;
        const ny = o.pos.y + dy;
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
        const t = map[ny][nx];
        if (t.type === 'oasis') gainedWater += 5;
        else if (t.type === 'oasis_edge') gainedFood += 1;
      }
    }
    newResources.water += gainedWater;
    newResources.food += gainedFood;
    const parts: string[] = [];
    if (gainedWater > 0) parts.push(`+${gainedWater} 水`);
    if (gainedFood > 0) parts.push(`+${gainedFood} 食物`);
    const animText = parts.length > 0 ? parts.join(' ') : undefined;
    notifications.push(`${o.name} 采集 ${animText ?? '无'}`);
    return { ...o, lastCollectDay: day, collectAnimText: animText, collectAnimKey: Date.now() };
  });

  for (const c of caravans) {
    const nc = { ...c };
    const onSandstorm = map[Math.round(nc.pos.y)]?.[Math.round(nc.pos.x)]?.inSandstorm;
    const mult = onSandstorm ? 3 : 1;
    const waterCost = Math.ceil(5 / 15) * mult;
    const foodCost = Math.ceil(8 / 15) * mult;
    newResources.water = Math.max(0, newResources.water - waterCost);
    newResources.food = Math.max(0, newResources.food - foodCost);
    if (onSandstorm) {
      nc.morale = Math.max(0, nc.morale - 20);
    }
    newCaravans.push(nc);
  }

  newResources.morale = Math.max(0, Math.min(100, newResources.morale));

  return {
    resources: newResources,
    outposts: newOutposts,
    caravans: newCaravans,
    notifications,
  };
}

export function calcTradeProfit(
  cargo: CargoType,
  cargoAmount: number,
  routeDays: number
): Partial<Resources> {
  const result: Partial<Resources> = {};
  if (cargo === 'crafts') {
    result.gold = cargoAmount * 3 + Math.floor(routeDays * 0.5);
    result.water = 20 + Math.floor(routeDays * 1.2);
  } else if (cargo === 'water') {
    result.gold = cargoAmount * 2;
    result.food = Math.floor(cargoAmount * 0.5);
  } else if (cargo === 'food') {
    result.gold = cargoAmount * 2;
    result.water = Math.floor(cargoAmount * 0.8);
  }
  return result;
}

export function estimateCaravanCost(routeDays: number, hasSandstorm: boolean) {
  const mult = hasSandstorm ? 3 : 1;
  return {
    water: Math.ceil((5 / 15) * routeDays * mult),
    food: Math.ceil((8 / 15) * routeDays * mult),
  };
}
