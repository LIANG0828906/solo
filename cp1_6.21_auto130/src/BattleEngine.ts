import { PokemonData, Skill, BattleResult, BattleLogEntry } from './types';

export function calculateDamage(
  attacker: PokemonData,
  defender: PokemonData,
  skill: Skill
): BattleResult {
  const hitRoll = Math.random();
  const hit = hitRoll <= skill.hitRate;

  if (!hit) {
    return {
      hit: false,
      critical: false,
      damage: 0,
      remainingHp: defender.hp,
    };
  }

  const randomFactor = 0.85 + Math.random() * 0.15;
  const critRoll = Math.random();
  const critical = critRoll <= skill.critRate;
  const critMultiplier = critical ? 1.5 : 1.0;

  let damage =
    attacker.attack * skill.multiplier * randomFactor * critMultiplier -
    defender.defense * 0.3;

  damage = Math.max(1, Math.round(damage));

  const remainingHp = Math.max(0, defender.hp - damage);

  return {
    hit: true,
    critical,
    damage,
    remainingHp,
  };
}

export function buildLogEntry(
  attackerName: string,
  skillName: string,
  result: BattleResult,
  defenderName: string,
  defenderHp: number,
  defenderMaxHp: number
): BattleLogEntry {
  return {
    attacker: attackerName,
    skillName,
    hit: result.hit,
    critical: result.critical,
    damage: result.damage,
    defenderHp,
    defenderMaxHp,
  };
}

export function formatLogMessage(entry: BattleLogEntry): string {
  if (!entry.hit) {
    return `${entry.attacker}使用了${entry.skillName}！未命中！`;
  }
  const critText = entry.critical ? '暴击！' : '';
  return `${entry.attacker}使用了${entry.skillName}！命中！${critText}造成${entry.damage}点伤害！`;
}

export function isAdjacent(
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return dr <= 1 && dc <= 1 && (dr + dc > 0);
}
