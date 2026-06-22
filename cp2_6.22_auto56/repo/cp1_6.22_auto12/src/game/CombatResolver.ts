import { Hero, Monster, Item, CombatLog } from '@/types';
import { MapGenerator } from './MapGenerator';

export interface CombatResult {
  logs: CombatLog[];
  heroHp: number;
  monsterHp: number;
  monsterDefeated: boolean;
  heroDefeated: boolean;
  drops: Item[];
}

export class CombatResolver {
  static calculateDamage(attackerAtk: number, defenderDef: number): number {
    const baseDamage = Math.max(1, attackerAtk - defenderDef);
    const variance = Math.floor(baseDamage * 0.2);
    const randomBonus = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
    const critChance = Math.random();
    let damage = baseDamage + randomBonus;
    if (critChance > 0.9) {
      damage = Math.floor(damage * 1.5);
    }
    return Math.max(1, damage);
  }

  static heroAttack(hero: Hero, monster: Monster): { damage: number; isCrit: boolean; log: CombatLog } {
    const totalAtk = hero.attack + (hero.equipment.weapon?.attackBonus || 0);
    const baseDamage = Math.max(1, totalAtk - monster.defense);
    const variance = Math.floor(baseDamage * 0.2);
    const randomBonus = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
    const isCrit = Math.random() > 0.9;
    let damage = baseDamage + randomBonus;
    if (isCrit) damage = Math.floor(damage * 1.5);
    damage = Math.max(1, damage);

    const log: CombatLog = {
      text: isCrit
        ? `⚔️ 暴击！${hero.name} 对 ${monster.name} 造成了 ${damage} 点伤害！`
        : `⚔️ ${hero.name} 对 ${monster.name} 造成了 ${damage} 点伤害`,
      type: 'damage',
    };

    return { damage, isCrit, log };
  }

  static monsterAttack(monster: Monster, hero: Hero): { damage: number; isCrit: boolean; log: CombatLog } {
    const totalDef = hero.defense + (hero.equipment.shield?.defenseBonus || 0);
    const baseDamage = Math.max(1, monster.attack - totalDef);
    const variance = Math.floor(baseDamage * 0.2);
    const randomBonus = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
    const isCrit = Math.random() > 0.9;
    let damage = baseDamage + randomBonus;
    if (isCrit) damage = Math.floor(damage * 1.5);
    damage = Math.max(1, damage);

    const log: CombatLog = {
      text: isCrit
        ? `💀 暴击！${monster.name} 对 ${hero.name} 造成了 ${damage} 点伤害！`
        : `💀 ${monster.name} 对 ${hero.name} 造成了 ${damage} 点伤害`,
      type: 'damage',
    };

    return { damage, isCrit, log };
  }

  static generateDrops(monster: Monster, floor: number): Item[] {
    const drops: Item[] = [];
    const dropChance = 0.4 + floor * 0.05;

    if (Math.random() < dropChance) {
      drops.push(MapGenerator.generateRandomItem(floor));
    }

    if (Math.random() < 0.3) {
      drops.push(MapGenerator.generateRandomItem(floor));
    }

    return drops;
  }

  static simulateFullCombat(hero: Hero, monster: Monster, floor: number): CombatResult {
    const logs: CombatLog[] = [];
    let heroHp = hero.hp;
    let monsterHp = monster.hp;
    let monsterDefeated = false;
    let heroDefeated = false;
    let turn = 0;

    const totalHeroAtk = hero.attack + (hero.equipment.weapon?.attackBonus || 0);
    const totalHeroDef = hero.defense + (hero.equipment.shield?.defenseBonus || 0);

    logs.push({
      text: `🏰 遭遇 ${monster.name}！战斗开始！`,
      type: 'info',
    });

    while (heroHp > 0 && monsterHp > 0 && turn < 100) {
      if (turn % 2 === 0) {
        const damage = this.calculateDamage(totalHeroAtk, monster.defense);
        monsterHp -= damage;
        logs.push({
          text: `⚔️ ${hero.name} 对 ${monster.name} 造成了 ${damage} 点伤害`,
          type: 'damage',
        });
        if (monsterHp <= 0) {
          monsterHp = 0;
          monsterDefeated = true;
          logs.push({
            text: `🎉 ${monster.name} 被击败了！`,
            type: 'victory',
          });
          break;
        }
      } else {
        const damage = this.calculateDamage(monster.attack, totalHeroDef);
        heroHp -= damage;
        logs.push({
          text: `💀 ${monster.name} 对 ${hero.name} 造成了 ${damage} 点伤害`,
          type: 'damage',
        });
        if (heroHp <= 0) {
          heroHp = 0;
          heroDefeated = true;
          logs.push({
            text: `💔 你被击败了...`,
            type: 'info',
          });
          break;
        }
      }
      turn++;
    }

    const drops = monsterDefeated ? this.generateDrops(monster, floor) : [];

    return {
      logs,
      heroHp,
      monsterHp,
      monsterDefeated,
      heroDefeated,
      drops,
    };
  }
}
