import type { ModuleType, ShipModule, BattleshipState } from './types';

export const MODULE_CATALOG: ModuleType[] = [
  {
    id: 'cockpit',
    name: '驾驶舱',
    category: 'cockpit',
    weight: 3,
    energyCost: 1,
    hp: 20,
    attack: 0,
    armor: 2,
    color: '#78909c',
    icon: '🛸',
  },
  {
    id: 'engine',
    name: '引擎',
    category: 'engine',
    weight: 5,
    energyCost: 0,
    hp: 15,
    attack: 0,
    armor: 1,
    color: '#ff7043',
    icon: '🔥',
  },
  {
    id: 'weapon',
    name: '武器',
    category: 'weapon',
    weight: 4,
    energyCost: 3,
    hp: 10,
    attack: 8,
    armor: 0,
    color: '#e53935',
    icon: '⚡',
  },
  {
    id: 'shield',
    name: '护盾',
    category: 'shield',
    weight: 4,
    energyCost: 4,
    hp: 25,
    attack: 0,
    armor: 5,
    color: '#42a5f5',
    icon: '🛡',
  },
  {
    id: 'cargo',
    name: '货舱',
    category: 'cargo',
    weight: 2,
    energyCost: 2,
    hp: 12,
    attack: 0,
    armor: 1,
    color: '#66bb6a',
    icon: '📦',
  },
];

export const GRID_SIZE = 5;
export const DEFAULT_THRUST_CAP = 20;
export const DEFAULT_ENERGY_CAP = 15;

export function getModuleType(category: string): ModuleType | undefined {
  return MODULE_CATALOG.find((m) => m.category === category);
}

export function isAdjacent(modules: ShipModule[], x: number, y: number): boolean {
  if (modules.length === 0) return true;
  const directions = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  return modules.some((m) =>
    directions.some(([dx, dy]) => m.gridX === x + dx && m.gridY === y + dy)
  );
}

export function isOverlapping(modules: ShipModule[], x: number, y: number): boolean {
  return modules.some((m) => m.gridX === x && m.gridY === y);
}

export function canPlaceModule(
  modules: ShipModule[],
  x: number,
  y: number,
  newModuleType: ModuleType
): boolean {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  if (isOverlapping(modules, x, y)) return false;
  if (!isAdjacent(modules, x, y)) return false;

  const engineCount = modules.filter((m) => m.type.category === 'engine').length;
  if (newModuleType.category === 'engine' && engineCount > 0) return false;

  const cockpitCount = modules.filter((m) => m.type.category === 'cockpit').length;
  if (newModuleType.category === 'cockpit' && cockpitCount > 0) return false;

  return true;
}

export function calculateAttributes(modules: ShipModule[]) {
  let totalWeight = 0;
  let totalEnergyCost = 0;
  let totalHP = 0;
  let totalAttack = 0;
  let totalArmor = 0;
  let thrustCap = 0;
  let energyCap = 0;

  for (const m of modules) {
    totalWeight += m.type.weight;
    totalEnergyCost += m.type.energyCost;
    totalHP += m.type.hp;
    totalAttack += m.type.attack;
    totalArmor += m.type.armor;

    if (m.type.category === 'engine') {
      thrustCap += DEFAULT_THRUST_CAP;
      energyCap += DEFAULT_ENERGY_CAP;
    }
  }

  if (thrustCap === 0) thrustCap = 0;
  if (energyCap === 0) energyCap = 0;

  return {
    totalWeight,
    totalEnergyCost,
    totalHP,
    totalAttack,
    totalArmor,
    thrustCap: thrustCap || DEFAULT_THRUST_CAP,
    energyCap: energyCap || DEFAULT_ENERGY_CAP,
  };
}

export function isOverWeight(modules: ShipModule[]): boolean {
  const attrs = calculateAttributes(modules);
  return attrs.totalWeight > attrs.thrustCap;
}

export function isOverEnergy(modules: ShipModule[]): boolean {
  const attrs = calculateAttributes(modules);
  return attrs.totalEnergyCost > attrs.energyCap;
}

export function createBattleshipState(
  modules: ShipModule[],
  ownerId: string,
  startX: number,
  startY: number
): BattleshipState {
  const attrs = calculateAttributes(modules);
  return {
    shipId: `ship-${ownerId}-${Date.now()}`,
    ownerId,
    modules: [...modules],
    totalHP: attrs.totalHP,
    maxHP: attrs.totalHP,
    totalAttack: attrs.totalAttack,
    totalArmor: attrs.totalArmor,
    totalWeight: attrs.totalWeight,
    totalEnergy: attrs.totalEnergyCost,
    thrustCap: attrs.thrustCap,
    energyCap: attrs.energyCap,
    posX: startX,
    posY: startY,
    alive: true,
  };
}

export function generateMockOpponentModules(): ShipModule[] {
  const modules: ShipModule[] = [];
  const cockpit = MODULE_CATALOG.find((m) => m.category === 'cockpit')!;
  const engine = MODULE_CATALOG.find((m) => m.category === 'engine')!;
  const weapon = MODULE_CATALOG.find((m) => m.category === 'weapon')!;
  const shield = MODULE_CATALOG.find((m) => m.category === 'shield')!;

  modules.push({
    moduleId: `opp-cockpit-${Date.now()}`,
    type: cockpit,
    gridX: 2,
    gridY: 2,
  });
  modules.push({
    moduleId: `opp-engine-${Date.now()}`,
    type: engine,
    gridX: 2,
    gridY: 1,
  });
  modules.push({
    moduleId: `opp-weapon-${Date.now()}`,
    type: weapon,
    gridX: 1,
    gridY: 2,
  });
  modules.push({
    moduleId: `opp-shield-${Date.now()}`,
    type: shield,
    gridX: 3,
    gridY: 2,
  });

  return modules;
}

export function getModuleConnections(modules: ShipModule[]): Array<{ x: number; y: number }> {
  const connections: Array<{ x: number; y: number }> = [];
  const directions = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  for (const m of modules) {
    for (const [dx, dy] of directions) {
      const nx = m.gridX + dx;
      const ny = m.gridY + dy;
      if (modules.some((other) => other.gridX === nx && other.gridY === ny)) {
        const cx = m.gridX + dx * 0.5;
        const cy = m.gridY + dy * 0.5;
        if (!connections.some((c) => c.x === cx && c.y === cy)) {
          connections.push({ x: cx, y: cy });
        }
      }
    }
  }
  return connections;
}
