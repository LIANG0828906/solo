import type { Fleet, Ship, CombatResult, CombatLogEntry, ShipType, StarNode } from '../types';

const SHIP_TYPE_NAMES: Record<ShipType, string> = {
  cruiser: '巡洋舰',
  frigate: '护卫舰',
  mothership: '母舰',
};

function cloneShip(ship: Ship): Ship {
  return { ...ship };
}

function cloneShips(ships: Ship[]): Ship[] {
  return ships.map(cloneShip);
}

function sortShipsByHpAsc(ships: Ship[]): Ship[] {
  return [...ships].sort((a, b) => a.hp - b.hp);
}

function isResourceNode(node: StarNode | undefined): boolean {
  return node?.type === 'resource';
}

function getTerrainBonus(node: StarNode | undefined): number {
  return isResourceNode(node) ? 1 : 0;
}

interface DamageApplicationResult {
  remainingShips: Ship[];
  logs: CombatLogEntry[];
  totalDamageDealt: number;
}

function applyDamageToFleet(
  ships: Ship[],
  totalDamage: number,
  attackerShips: Ship[]
): DamageApplicationResult {
  const remainingShips = cloneShips(ships);
  const logs: CombatLogEntry[] = [];
  let totalDamageDealt = 0;
  let damageLeft = totalDamage;

  while (damageLeft > 0 && remainingShips.length > 0) {
    const sortedTargets = sortShipsByHpAsc(remainingShips);
    const target = sortedTargets[0];

    const damageToApply = Math.min(damageLeft, target.hp);
    target.hp -= damageToApply;
    damageLeft -= damageToApply;
    totalDamageDealt += damageToApply;

    const attackerType = attackerShips[0]?.type || 'frigate';

    const logEntry: CombatLogEntry = {
      attackerType,
      defenderType: target.type,
      damage: damageToApply,
      defenderRemainingHp: Math.max(0, target.hp),
      defenderDestroyed: target.hp <= 0,
    };
    logs.push(logEntry);

    if (target.hp <= 0) {
      const idx = remainingShips.findIndex((s) => s.id === target.id);
      if (idx !== -1) {
        remainingShips.splice(idx, 1);
      }
    }
  }

  return { remainingShips, logs, totalDamageDealt };
}

export function calculateCombat(
  attackerFleet: Fleet,
  defenderFleet: Fleet,
  defenderNode?: StarNode
): CombatResult {
  const attackerShips = cloneShips(attackerFleet.ships);
  const defenderShips = cloneShips(defenderFleet.ships);
  const allLogs: CombatLogEntry[] = [];

  const terrainBonus = getTerrainBonus(defenderNode);

  const maxRounds = 10;
  let round = 0;
  let attRemaining = attackerShips;
  let defRemaining = defenderShips;

  while (attRemaining.length > 0 && defRemaining.length > 0 && round < maxRounds) {
    const attAttack = attRemaining.reduce((sum, s) => sum + s.attack, 0);
    const defAttack = defRemaining.reduce((sum, s) => sum + s.attack, 0) + terrainBonus;

    const defResult = applyDamageToFleet(defRemaining, attAttack, attRemaining);
    const attResult = applyDamageToFleet(attRemaining, defAttack, defRemaining);

    allLogs.push(...defResult.logs);
    allLogs.push(...attResult.logs);

    defRemaining = defResult.remainingShips;
    attRemaining = attResult.remainingShips;
    round++;
  }

  let winner: 'player' | 'ai' | null = null;
  if (attRemaining.length > 0 && defRemaining.length === 0) {
    winner = attackerFleet.owner;
  } else if (defRemaining.length > 0 && attRemaining.length === 0) {
    winner = defenderFleet.owner;
  }

  const attackerTotalDamage = allLogs
    .filter((_, i) => i % 2 === 0)
    .reduce((sum, log) => sum + log.damage, 0);
  const defenderTotalDamage = allLogs
    .filter((_, i) => i % 2 === 1)
    .reduce((sum, log) => sum + log.damage, 0);

  return {
    winner,
    attackerShipsRemaining: attRemaining,
    defenderShipsRemaining: defRemaining,
    logs: allLogs,
    attackerTotalDamage,
    defenderTotalDamage,
  };
}

export function formatCombatLog(log: CombatLogEntry): string {
  const attackerName = SHIP_TYPE_NAMES[log.attackerType];
  const defenderName = SHIP_TYPE_NAMES[log.defenderType];
  if (log.defenderDestroyed) {
    return `${attackerName}攻击${defenderName}，造成${log.damage}点伤害，${defenderName}被摧毁！`;
  }
  return `${attackerName}攻击${defenderName}，造成${log.damage}点伤害，${defenderName}剩余${log.defenderRemainingHp}HP`;
}

export function getFleetTotalAttack(fleet: Fleet, node?: StarNode): number {
  const base = fleet.ships.reduce((sum, s) => sum + s.attack, 0);
  return base + getTerrainBonus(node);
}

export function getFleetTotalHp(fleet: Fleet): number {
  return fleet.ships.reduce((sum, s) => sum + s.hp, 0);
}

export function getFleetPower(fleet: Fleet, node?: StarNode): number {
  return getFleetTotalAttack(fleet, node) + getFleetTotalHp(fleet);
}
