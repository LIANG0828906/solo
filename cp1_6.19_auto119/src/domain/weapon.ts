import type { Ship, WeaponType, WeaponConfig, AttackLine } from '../eventBus';

const DEFAULT_WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  laser: {
    type: 'laser',
    damage: 10,
    range: 60,
    fireRate: 0.5,
    color: '#66FCF1',
  },
  missile: {
    type: 'missile',
    damage: 25,
    range: 90,
    fireRate: 1.5,
    color: '#FFB347',
  },
  railgun: {
    type: 'railgun',
    damage: 50,
    range: 120,
    fireRate: 3,
    color: '#C5C6C7',
  },
};

export function getDefaultWeaponConfigs(): Record<WeaponType, WeaponConfig> {
  return { ...DEFAULT_WEAPON_CONFIGS };
}

export function getWeaponConfig(
  type: WeaponType,
  configs: Record<WeaponType, WeaponConfig>
): WeaponConfig {
  return configs[type];
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isInRange(
  ship: Ship,
  target: Ship,
  configs: Record<WeaponType, WeaponConfig>
): boolean {
  const weapon = getWeaponConfig(ship.weaponType, configs);
  const dist = distance(ship.x, ship.y, target.x, target.y);
  return dist <= weapon.range;
}

export function getShipsInRange(
  ships: Ship[],
  target: Ship,
  configs: Record<WeaponType, WeaponConfig>
): Ship[] {
  return ships.filter((ship) => isInRange(ship, target, configs));
}

let attackLineId = 0;

export function createFocusFireAttackLines(
  playerShips: Ship[],
  targetShip: Ship,
  configs: Record<WeaponType, WeaponConfig>,
  now: number
): AttackLine[] {
  const shipsInRange = getShipsInRange(playerShips, targetShip, configs);
  return shipsInRange.map((ship) => {
    const weapon = getWeaponConfig(ship.weaponType, configs);
    return {
      id: `attack-${attackLineId++}`,
      fromShipId: ship.id,
      toShipId: targetShip.id,
      startX: ship.x,
      startY: ship.y,
      endX: targetShip.x,
      endY: targetShip.y,
      color: weapon.color,
      createdAt: now,
      duration: 800,
    };
  });
}

export function isAttackLineActive(line: AttackLine, now: number): boolean {
  return now - line.createdAt < line.duration;
}

export function countTargetsInRange(
  target: Ship,
  ships: Ship[],
  configs: Record<WeaponType, WeaponConfig>
): number {
  return ships.filter((ship) => isInRange(ship, target, configs)).length;
}
