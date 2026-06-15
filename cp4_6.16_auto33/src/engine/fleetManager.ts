import { v4 as uuidv4 } from 'uuid';
import {
  Ship,
  ShipType,
  Resources,
  BuildQueueItem,
  MAX_FORMATION_SLOTS,
  SHIP_CONFIGS
} from './types';

export function canAfford(resources: Resources, cost: Resources): boolean {
  return (
    resources.iron >= cost.iron &&
    resources.crystal >= cost.crystal &&
    resources.energy >= cost.energy
  );
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
    stats: { ...config.baseStats },
    bridgeSlots: config.bridgeSlots,
    position: { x: 0, y: 0 },
    isEnemy: false,
    hasActed: false
  };
}

export function buildShip(
  type: ShipType,
  resources: Resources,
  availableShips: Ship[]
): { success: boolean; newResources: Resources; newShip: Ship | null; message: string } {
  const config = SHIP_CONFIGS[type];
  if (!canAfford(resources, config.cost)) {
    return {
      success: false,
      newResources: resources,
      newShip: null,
      message: '资源不足'
    };
  }
  const newResources = subtractResources(resources, config.cost);
  const newShip = createPlayerShip(type);
  return {
    success: true,
    newResources,
    newShip,
    message: `${config.name} 建造完成`
  };
}

export function addShipToFormation(
  formationSlots: (Ship | null)[],
  ship: Ship,
  slotIndex?: number
): { success: boolean; newFormation: (Ship | null)[]; message: string } {
  const targetIndex = slotIndex ?? formationSlots.findIndex(s => s === null);
  if (targetIndex === -1 || targetIndex >= MAX_FORMATION_SLOTS) {
    return {
      success: false,
      newFormation: formationSlots,
      message: '编队已满'
    };
  }
  if (formationSlots[targetIndex] !== null) {
    return {
      success: false,
      newFormation: formationSlots,
      message: '该槽位已被占用'
    };
  }
  if (formationSlots.some(s => s?.id === ship.id)) {
    return {
      success: false,
      newFormation: formationSlots,
      message: '该飞船已在编队中'
    };
  }
  const newFormation = [...formationSlots];
  newFormation[targetIndex] = ship;
  return {
    success: true,
    newFormation,
    message: '飞船已加入编队'
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
): { newQueue: BuildQueueItem[]; newResources: Resources; newShips: Ship[] } {
  const newShips: Ship[] = [...availableShips];
  let newResources = { ...resources };
  const remainingQueue: BuildQueueItem[] = [];

  queue.forEach(item => {
    const config = SHIP_CONFIGS[item.shipType];
    if (canAfford(newResources, config.cost)) {
      newResources = subtractResources(newResources, config.cost);
      newShips.push(createPlayerShip(item.shipType));
    } else {
      remainingQueue.push(item);
    }
  });

  return { newQueue: remainingQueue, newResources, newShips };
}
