import type { ShipData, BattleAction, BattleResult } from './types.js';

const HULL_HP = [100, 150, 200];
const SHIELD_ABSORB = [30, 50, 80];
const ENGINE_DODGE = [0.1, 0.2, 0.3];

function getHullHp(parts: ShipData['parts']): number {
  const hull = parts.find(p => p.type === 'hull');
  if (!hull) return 100;
  return HULL_HP[hull.variant] ?? 100;
}

function getShieldAbsorb(parts: ShipData['parts']): number {
  const shield = parts.find(p => p.type === 'shield');
  if (!shield) return 0;
  return SHIELD_ABSORB[shield.variant] ?? 0;
}

function getDodgeChance(parts: ShipData['parts']): number {
  const engine = parts.find(p => p.type === 'engine');
  if (!engine) return 0;
  return ENGINE_DODGE[engine.variant] ?? 0;
}

function getWeaponDamage(parts: ShipData['parts']): number {
  const weapons = parts.filter(p => p.type === 'weapon');
  let total = 0;
  for (const w of weapons) {
    if (w.config) {
      total += w.config.fireRate * w.config.damage;
    }
  }
  return total;
}

function getWeaponName(parts: ShipData['parts']): string {
  const weapons = parts.filter(p => p.type === 'weapon');
  if (weapons.length === 0) return 'basic-laser';
  return weapons.map(w => w.slot).join('+');
}

function resolveAttack(
  round: number,
  attacker: 'player' | 'enemy',
  attackerParts: ShipData['parts'],
  defenderCurrentShield: number,
  defenderCurrentHull: number,
): { action: BattleAction; remainingShield: number; remainingHull: number } {
  const dodgeChance = getDodgeChance(attackerParts);
  const dodged = Math.random() < dodgeChance;

  if (dodged) {
    return {
      action: {
        round,
        attacker,
        weapon: getWeaponName(attackerParts),
        damage: 0,
        shieldAbsorbed: 0,
        hullDamage: 0,
        dodged: true,
      },
      remainingShield: defenderCurrentShield,
      remainingHull: defenderCurrentHull,
    };
  }

  const damage = getWeaponDamage(attackerParts) || 10;
  const shieldAbsorbed = Math.min(defenderCurrentShield, damage);
  const hullDamage = Math.max(0, damage - shieldAbsorbed);
  const remainingShield = defenderCurrentShield - shieldAbsorbed;
  const remainingHull = defenderCurrentHull - hullDamage;

  return {
    action: {
      round,
      attacker,
      weapon: getWeaponName(attackerParts),
      damage,
      shieldAbsorbed,
      hullDamage,
      dodged: false,
    },
    remainingShield,
    remainingHull: Math.max(0, remainingHull),
  };
}

export function runBattle(player: ShipData, enemy: ShipData): BattleResult {
  const log: BattleAction[] = [];
  let playerHull = getHullHp(player.parts);
  let playerShield = getShieldAbsorb(player.parts);
  let enemyHull = getHullHp(enemy.parts);
  let enemyShield = getShieldAbsorb(enemy.parts);

  const totalRounds = 3;

  for (let round = 1; round <= totalRounds; round++) {
    if (enemyHull <= 0 || playerHull <= 0) break;

    const playerAttack = resolveAttack(round, 'player', player.parts, enemyShield, enemyHull);
    log.push(playerAttack.action);
    enemyShield = playerAttack.remainingShield;
    enemyHull = playerAttack.remainingHull;

    if (enemyHull <= 0) break;

    const enemyAttack = resolveAttack(round, 'enemy', enemy.parts, playerShield, playerHull);
    log.push(enemyAttack.action);
    playerShield = enemyAttack.remainingShield;
    playerHull = enemyAttack.remainingHull;

    playerShield = getShieldAbsorb(player.parts);
    enemyShield = getShieldAbsorb(enemy.parts);
  }

  const victory = enemyHull <= 0;
  const resourcesGained = victory ? Math.floor(Math.random() * 50) + 20 : 0;
  const partsLost: string[] = [];

  if (!victory && playerHull <= 0) {
    const weaponParts = player.parts.filter(p => p.type === 'weapon');
    if (weaponParts.length > 0) {
      partsLost.push(weaponParts[0].id);
    }
  }

  return {
    victory,
    playerHullRemaining: playerHull,
    enemyHullRemaining: enemyHull,
    log,
    resourcesGained,
    partsLost,
  };
}
