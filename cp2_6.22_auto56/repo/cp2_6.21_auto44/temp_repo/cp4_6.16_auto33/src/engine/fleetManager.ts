import { v4 as uuidv4 } from 'uuid';
import {
  Ship,
  ShipType,
  Resources,
  BuildQueueItem,
  MAX_FORMATION_SLOTS,
  SHIP_CONFIGS,
  BuildResult,
  BuildResultCode
} from './types';

export function canAfford(resources: Resources, cost: Resources): {
  canAfford: boolean;
  code: BuildResultCode;
  missingResource?: keyof Resources;
} {
  if (resources.iron < cost.iron) {
    return { canAfford: false, code: 'ERR_INSUFFICIENT_IRON', missingResource: 'iron' };
  }
  if (resources.crystal < cost.crystal) {
    return { canAfford: false, code: 'ERR_INSUFFICIENT_CRYSTAL', missingResource: 'crystal' };
  }
  if (resources.energy < cost.energy) {
    return { canAfford: false, code: 'ERR_INSUFFICIENT_ENERGY', missingResource: 'energy' };
  }
  return { canAfford: true, code: 'SUCCESS' };
}

export function subtractResources(resources: Resources, cost: Resources): Resources {
  return {
    iron: resources.iron - cost.iron,
    crystal: resources.crystal - cost.crystal,
    energy: resources.energy - cost.energy
  };
}

export function addResources(resources: Resources, gain: Resources): Resources {
  return {
    iron: resources.iron + gain.iron,
    crystal: resources.crystal + gain.crystal,
    energy: resources.energy + gain.energy
  };
}

export function createPlayerShip(type: ShipType): Ship {
  const config = SHIP_CONFIGS[type];
  return {
    id: uuidv4(),
    type,
    name: config.name,
    stats: {
      ...config.baseStats,
      shield: { ...config.baseStats.shield }
    },
    bridgeSlots: config.bridgeSlots,
    position: { x: 0, y: 0 },
    isEnemy: false,
    hasActed: false
  };
}

export function buildShip(
  type: ShipType,
  resources: Resources
): {
  success: boolean;
  code: BuildResultCode;
  message: string;
  newResources: Resources;
  newShip: Ship | null;
} {
  const config = SHIP_CONFIGS[type];
  const affordability = canAfford(resources, config.cost);

  if (!affordability.canAfford) {
    let message = '资源不足';
    switch (affordability.code) {
      case 'ERR_INSUFFICIENT_IRON':
        message = `铁不足 (需要 ${config.cost.iron}，当前 ${resources.iron})`;
        break;
      case 'ERR_INSUFFICIENT_CRYSTAL':
        message = `晶体不足 (需要 ${config.cost.crystal}，当前 ${resources.crystal})`;
        break;
      case 'ERR_INSUFFICIENT_ENERGY':
        message = `能量不足 (需要 ${config.cost.energy}，当前 ${resources.energy})`;
        break;
    }
    return {
      success: false,
      code: affordability.code,
      message,
      newResources: resources,
      newShip: null
    };
  }

  const newResources = subtractResources(resources, config.cost);
  const newShip = createPlayerShip(type);
  return {
    success: true,
    code: 'SUCCESS',
    message: `${config.name} 建造完成`,
    newResources,
    newShip
  };
}

export function getBuildErrorMessage(code: BuildResultCode): string {
  const messages: Record<BuildResultCode, string> = {
    SUCCESS: '操作成功',
    ERR_INSUFFICIENT_IRON: '铁不足',
    ERR_INSUFFICIENT_CRYSTAL: '晶体不足',
    ERR_INSUFFICIENT_ENERGY: '能量不足',
    ERR_INSUFFICIENT_RESOURCES: '资源不足',
    ERR_FORMATION_FULL: '编队已满',
    ERR_SLOT_OCCUPIED: '该槽位已被占用',
    ERR_SHIP_IN_FORMATION: '该飞船已在编队中',
    ERR_SHIP_NOT_FOUND: '未找到该飞船'
  };
  return messages[code];
}

export function addShipToFormation(
  formationSlots: (Ship | null)[],
  ship: Ship,
  slotIndex?: number
): {
  success: boolean;
  code: BuildResultCode;
  message: string;
  newFormation: (Ship | null)[];
} {
  const targetIndex = slotIndex ?? formationSlots.findIndex(s => s === null);
  if (targetIndex === -1 || targetIndex >= MAX_FORMATION_SLOTS) {
    return {
      success: false,
      code: 'ERR_FORMATION_FULL',
      message: getBuildErrorMessage('ERR_FORMATION_FULL'),
      newFormation: formationSlots
    };
  }
  if (formationSlots[targetIndex] !== null) {
    return {
      success: false,
      code: 'ERR_SLOT_OCCUPIED',
      message: getBuildErrorMessage('ERR_SLOT_OCCUPIED'),
      newFormation: formationSlots
    };
  }
  if (formationSlots.some(s => s?.id === ship.id)) {
    return {
      success: false,
      code: 'ERR_SHIP_IN_FORMATION',
      message: getBuildErrorMessage('ERR_SHIP_IN_FORMATION'),
      newFormation: formationSlots
    };
  }
  const newFormation = [...formationSlots];
  newFormation[targetIndex] = ship;
  return {
    success: true,
    code: 'SUCCESS',
    message: '飞船已加入编队',
    newFormation
  };
}

export function removeShipFromFormation(
  formationSlots: (Ship | null)[],
  slotIndex: number
): (Ship | null)[] {
  const newFormation = [...formationSlots];
  newFormation[slotIndex] = null;
  return newFormation;
}

export function reorderFormation(
  formationSlots: (Ship | null)[],
  fromIndex: number,
  toIndex: number
): (Ship | null)[] {
  if (fromIndex < 0 || fromIndex >= MAX_FORMATION_SLOTS) return formationSlots;
  if (toIndex < 0 || toIndex >= MAX_FORMATION_SLOTS) return formationSlots;
  if (fromIndex === toIndex) return formationSlots;
  const newFormation = [...formationSlots];
  const [removed] = newFormation.splice(fromIndex, 1);
  newFormation.splice(toIndex, 0, removed);
  return newFormation;
}

export function getActiveFormationShips(formationSlots: (Ship | null)[]): Ship[] {
  return formationSlots.filter((s): s is Ship => s !== null);
}

export function restoreEnergyByPercent(resources: Resources, percent: number): Resources {
  const baseEnergy = 100;
  const restoreAmount = Math.floor(baseEnergy * percent / 100);
  return {
    ...resources,
    energy: resources.energy + restoreAmount
  };
}

export function regenerateResources(resources: Resources, amount: number = 1): Resources {
  return {
    iron: resources.iron + amount,
    crystal: resources.crystal + amount,
    energy: resources.energy + amount
  };
}

export function addBuildQueueItem(
  queue: BuildQueueItem[],
  type: ShipType
): BuildQueueItem[] {
  return [...queue, { shipType: type, timeLeft: 0 }];
}

export function processBuildQueue(
  queue: BuildQueueItem[],
  resources: Resources,
  availableShips: Ship[]
): {
  newQueue: BuildQueueItem[];
  newResources: Resources;
  newShips: Ship[];
  results: BuildResult[];
} {
  const newShips: Ship[] = [...availableShips];
  let newResources = { ...resources };
  const remainingQueue: BuildQueueItem[] = [];
  const results: BuildResult[] = [];

  queue.forEach(item => {
    const buildResult = buildShip(item.shipType, newResources);
    if (buildResult.success && buildResult.newShip) {
      newResources = buildResult.newResources;
      newShips.push(buildResult.newShip);
      results.push({ success: true, code: 'SUCCESS', message: buildResult.message });
    } else {
      remainingQueue.push(item);
      results.push({ success: false, code: buildResult.code, message: buildResult.message });
    }
  });

  return { newQueue: remainingQueue, newResources, newShips, results };
}
