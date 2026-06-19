import type { HexCoord, Terrain, WeatherType } from '../board/hexUtils';
import { hexDistance, hexEquals, WEATHER_CONFIG } from '../board/hexUtils';
import type { SpiritOnBoard } from './GameStore';
import { ELEMENT_ADVANTAGE } from '../entities/spiritData';

export interface AttackResult {
  damage: number;
  isDodged: boolean;
  isCritical: boolean;
  elementBonus: boolean;
  message: string;
}

export interface TerrainEffectResult {
  damage: number;
  heal: number;
  message: string;
}

export function calculateDamage(
  attacker: SpiritOnBoard,
  defender: SpiritOnBoard,
  terrain: Terrain | undefined,
  weather: WeatherType,
  skillMultiplier: number = 1
): AttackResult {
  const weatherMod = WEATHER_CONFIG[weather].modifier;
  
  let attack = attacker.stats.attack;
  let defense = defender.stats.defense;
  let dodge = defender.buffs.dodge;
  
  if (terrain?.effect.dodge) {
    dodge += terrain.effect.dodge;
  }
  
  if (terrain?.effect.defense) {
    defense += terrain.effect.defense;
  }
  
  if (terrain?.effect.attack) {
    attack += terrain.effect.attack;
  }
  
  const isDodged = Math.random() < dodge;
  if (isDodged) {
    return {
      damage: 0,
      isDodged: true,
      isCritical: false,
      elementBonus: false,
      message: `${defender.name} 闪避了攻击！`
    };
  }
  
  let elementBonus = false;
  let elementMultiplier = 1;
  if (ELEMENT_ADVANTAGE[attacker.element] === defender.element) {
    elementBonus = true;
    elementMultiplier = 1.5;
  }
  
  const isCritical = Math.random() < 0.1;
  const critMultiplier = isCritical ? 1.5 : 1;
  
  const baseDamage = Math.max(1, attack * skillMultiplier - defense * 0.5);
  const finalDamage = Math.floor(baseDamage * elementMultiplier * critMultiplier * weatherMod);
  
  let message = `${attacker.name} 对 ${defender.name} 造成 ${finalDamage} 点伤害`;
  if (elementBonus) message += '（元素克制！）';
  if (isCritical) message += '（暴击！）';
  
  return {
    damage: finalDamage,
    isDodged: false,
    isCritical,
    elementBonus,
    message
  };
}

export function applyTerrainEffect(
  spirit: SpiritOnBoard,
  terrain: Terrain | undefined,
  weather: WeatherType
): TerrainEffectResult {
  if (!terrain || terrain.type === 'normal') {
    return { damage: 0, heal: 0, message: '' };
  }
  
  const weatherMod = WEATHER_CONFIG[weather].modifier;
  let damage = 0;
  let heal = 0;
  const messages: string[] = [];
  
  if (terrain.effect.damage) {
    damage = Math.floor(terrain.effect.damage * weatherMod);
    messages.push(`${terrain.type === 'lava' ? '熔岩' : ''}造成 ${damage} 点伤害`);
  }
  
  if (terrain.effect.heal) {
    heal = Math.floor(terrain.effect.heal * weatherMod);
    messages.push(`圣光恢复 ${heal} 点生命`);
  }
  
  if (terrain.effect.hpLoss) {
    damage += Math.floor(terrain.effect.hpLoss * weatherMod);
    messages.push(`暗影侵蚀造成 ${terrain.effect.hpLoss} 点伤害`);
  }
  
  return {
    damage,
    heal,
    message: messages.join('，')
  };
}

export function canMoveTo(
  spirit: SpiritOnBoard,
  target: HexCoord,
  spirits: SpiritOnBoard[],
  boardSize: number
): boolean {
  if (!spirit.position) return false;
  
  const distance = hexDistance(spirit.position, target);
  const moveRange = Math.floor(spirit.stats.speed / 2) + 1;
  
  if (distance > moveRange) return false;
  
  const occupied = spirits.some(
    s => s.id !== spirit.id && s.position && hexEquals(s.position, target)
  );
  
  return !occupied;
}

export function canAttack(
  attacker: SpiritOnBoard,
  target: SpiritOnBoard
): boolean {
  if (!attacker.position || !target.position) return false;
  if (attacker.owner === target.owner) return false;
  
  const distance = hexDistance(attacker.position, target.position);
  return distance <= attacker.stats.range;
}

export function findComboSpirits(
  attacker: SpiritOnBoard,
  spirits: SpiritOnBoard[]
): SpiritOnBoard[] {
  if (!attacker.position) return [];
  
  return spirits.filter(s => {
    if (s.id === attacker.id) return false;
    if (s.owner !== attacker.owner) return false;
    if (!s.position) return false;
    
    const distance = hexDistance(attacker.position, s.position);
    return distance <= 1 && s.element === attacker.element;
  });
}

export function calculateComboDamage(
  baseDamage: number,
  comboCount: number
): number {
  return Math.floor(baseDamage * (1 + comboCount * 0.2));
}

export function getSpiritAtPosition(
  position: HexCoord,
  spirits: SpiritOnBoard[]
): SpiritOnBoard | undefined {
  return spirits.find(s => s.position && hexEquals(s.position, position));
}

export function isGameOver(spirits: SpiritOnBoard[]): { over: boolean; winner: 'player' | 'enemy' | null } {
  const playerSpirits = spirits.filter(s => s.owner === 'player' && s.stats.hp > 0);
  const enemySpirits = spirits.filter(s => s.owner === 'enemy' && s.stats.hp > 0);
  
  if (playerSpirits.length === 0 && enemySpirits.length === 0) {
    return { over: true, winner: null };
  }
  if (playerSpirits.length === 0) {
    return { over: true, winner: 'enemy' };
  }
  if (enemySpirits.length === 0) {
    return { over: true, winner: 'player' };
  }
  
  return { over: false, winner: null };
}
