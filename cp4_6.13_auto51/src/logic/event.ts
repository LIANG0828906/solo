import { GameEvent, EventType, Outpost, Caravan, Tile, MAP_WIDTH, MAP_HEIGHT } from '@/types';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shouldTriggerEvent(day: number): boolean {
  return day > 0 && day % 3 === 0;
}

export function generateEvent(
  outposts: Outpost[],
  caravans: Caravan[],
  map: Tile[][],
  resolvers: {
    resolveSandstorm: (center: { x: number; y: number }) => void;
    resolveDrought: (outpostId: string) => void;
    resolveBandits: (caravanId: string, choice: 'pay' | 'fight') => void;
  }
): GameEvent | null {
  const types: EventType[] = ['sandstorm', 'drought', 'bandits'];
  const type = types[rand(0, 2)];

  if (type === 'sandstorm') {
    const cx = rand(3, MAP_WIDTH - 4);
    const cy = rand(3, MAP_HEIGHT - 4);
    return {
      id: 'ev_' + Date.now(),
      type: 'sandstorm',
      title: '沙暴来袭！',
      description: `一场沙暴正在 (${cx}, ${cy}) 附近形成，3x3 区域内的商队将延迟1天并损耗加倍。`,
      icon: '🌪️',
      options: [
        {
          label: '接受现实',
          action: () => resolvers.resolveSandstorm({ x: cx, y: cy }),
        },
      ],
    };
  }

  if (type === 'drought') {
    const candidates = outposts.filter(o => o.isEnabled && !o.isDried);
    if (candidates.length === 0) return null;
    const target = candidates[rand(0, candidates.length - 1)];
    return {
      id: 'ev_' + Date.now(),
      type: 'drought',
      title: '绿洲干涸！',
      description: `${target.name} 遭遇干旱，未来3天内无法取水，资源将陷入紧缺。`,
      icon: '🏜️',
      options: [
        {
          label: '派遣支援',
          action: () => resolvers.resolveDrought(target.id),
        },
      ],
      targetOutpostId: target.id,
    };
  }

  if (type === 'bandits') {
    const candidates = caravans.filter(c => !c.isBuilding);
    if (candidates.length === 0) return null;
    const target = candidates[rand(0, candidates.length - 1)];
    return {
      id: 'ev_' + Date.now(),
      type: 'bandits',
      title: '游牧强盗出现！',
      description: `商队携带的金币被强盗盯上。支付 5 单位水作为赎金，或战斗（70% 胜率，失败损失全部物资）。`,
      icon: '⚔️',
      options: [
        {
          label: '支付赎金 (5水)',
          action: () => resolvers.resolveBandits(target.id, 'pay'),
        },
        {
          label: '奋起战斗',
          action: () => resolvers.resolveBandits(target.id, 'fight'),
        },
      ],
      targetCaravanId: target.id,
    };
  }

  return null;
}

export function applySandstorm(
  map: Tile[][],
  caravans: Caravan[],
  center: { x: number; y: number }
): { map: Tile[][]; caravans: Caravan[] } {
  const newMap = map.map(row => row.map(t => ({ ...t, inSandstorm: false })));
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = center.x + dx;
      const ny = center.y + dy;
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        newMap[ny][nx].inSandstorm = true;
      }
    }
  }
  const newCaravans = caravans.map(c => {
    const dist = Math.abs(c.pos.x - center.x) + Math.abs(c.pos.y - center.y);
    if (dist <= 2) {
      return { ...c, daysDelayed: c.daysDelayed + 1 };
    }
    return c;
  });
  return { map: newMap, caravans: newCaravans };
}

export function applyDrought(outposts: Outpost[], outpostId: string): Outpost[] {
  return outposts.map(o =>
    o.id === outpostId ? { ...o, isDried: true, driedDays: 3 } : o
  );
}

export function applyBandits(
  resources: { water: number; gold: number },
  caravans: Caravan[],
  caravanId: string,
  choice: 'pay' | 'fight'
): { resources: { water: number; gold: number; morale?: number; food?: number }; caravans: Caravan[] } {
  const newResources = { ...resources };
  let newCaravans = caravans;

  if (choice === 'pay') {
    newResources.water = Math.max(0, newResources.water - 5);
  } else {
    const won = Math.random() < 0.7;
    if (won) {
      newResources.morale = Math.min(100, (newResources as any).morale ?? 50 + 10);
    } else {
      newCaravans = caravans.map(c => {
        if (c.id === caravanId) {
          return {
            ...c,
            cargoAmount: { water: 0, food: 0, gold: 0, morale: c.morale },
            morale: Math.max(0, c.morale - 30),
          };
        }
        return c;
      });
      if ((newResources as any).morale !== undefined) {
        (newResources as any).morale = Math.max(0, (newResources as any).morale - 15);
      }
    }
  }

  newCaravans = newCaravans.map(c => {
    if (c.id === caravanId && newResources.gold > 50) {
      const stolen = Math.floor(newResources.gold * 0.3);
      newResources.gold = newResources.gold - (choice === 'fight' && Math.random() >= 0.7 ? 0 : stolen);
    }
    return c;
  });

  return { resources: newResources, caravans: newCaravans };
}
