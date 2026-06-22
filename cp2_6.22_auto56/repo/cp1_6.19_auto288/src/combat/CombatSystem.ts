import type { PlayerStats, Monster, Skill, Buff } from '../types';

export interface AttackResult {
  damage: number;
  isCrit: boolean;
  isDodged: boolean;
  message: string;
}

export interface SkillResult {
  success: boolean;
  damage?: number;
  heal?: number;
  manaCost: number;
  isCrit: boolean;
  message: string;
  buffApplied?: Buff;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function calculatePlayerDamage(player: PlayerStats, monster: Monster): AttackResult {
  if (Math.random() < (monster.type === 'boss' ? 0.05 : 0.10)) {
    return {
      damage: 0,
      isCrit: false,
      isDodged: true,
      message: `${monster.name}闪避了攻击！`,
    };
  }

  const baseAttack = player.attack;
  const variance = randomInRange(0.8, 1.3);
  let damage = Math.floor(baseAttack * variance);

  const isCrit = Math.random() < player.critRate;
  if (isCrit) {
    damage = Math.floor(damage * 2);
  }

  damage = Math.max(1, damage - monster.defense);

  return {
    damage,
    isCrit,
    isDodged: false,
    message: isCrit
      ? `暴击！你对${monster.name}造成了 ${damage} 点伤害！`
      : `你对${monster.name}造成了 ${damage} 点伤害`,
  };
}

export function calculateMonsterDamage(monster: Monster, player: PlayerStats): AttackResult {
  if (Math.random() < player.dodgeRate) {
    return {
      damage: 0,
      isCrit: false,
      isDodged: true,
      message: `你闪避了${monster.name}的攻击！`,
    };
  }

  const baseAttack = monster.attack;
  const variance = randomInRange(0.8, 1.2);
  let damage = Math.floor(baseAttack * variance);

  const isCrit = Math.random() < 0.08;
  if (isCrit) {
    damage = Math.floor(damage * 1.8);
  }

  damage = Math.max(1, damage - player.defense);

  return {
    damage,
    isCrit,
    isDodged: false,
    message: isCrit
      ? `${monster.name}暴击！对你造成了 ${damage} 点伤害！`
      : `${monster.name}对你造成了 ${damage} 点伤害`,
  };
}

export function useSkill(skill: Skill, player: PlayerStats, monster: Monster): SkillResult {
  if (player.mp < skill.manaCost) {
    return {
      success: false,
      manaCost: 0,
      isCrit: false,
      message: `法力不足，无法释放${skill.name}！`,
    };
  }

  if (skill.currentCooldown > 0) {
    return {
      success: false,
      manaCost: 0,
      isCrit: false,
      message: `${skill.name}正在冷却中！`,
    };
  }

  const isCrit = Math.random() < player.critRate;
  let message = '';
  let damage: number | undefined;
  let heal: number | undefined;
  let buffApplied: Buff | undefined;

  switch (skill.id) {
    case 'fireball': {
      const baseDmg = skill.damage + player.attack * 0.5;
      const variance = randomInRange(0.9, 1.3);
      damage = Math.floor(baseDmg * variance * (isCrit ? 2 : 1));
      damage = Math.max(1, damage - Math.floor(monster.defense * 0.5));
      message = isCrit
        ? `🔥 火球术暴击！对${monster.name}造成 ${damage} 点火焰伤害！`
        : `🔥 火球术对${monster.name}造成 ${damage} 点火焰伤害`;
      break;
    }
    case 'frost_nova': {
      const baseDmg = skill.damage + player.attack * 0.3;
      const variance = randomInRange(0.85, 1.15);
      damage = Math.floor(baseDmg * variance * (isCrit ? 1.8 : 1));
      damage = Math.max(1, damage - Math.floor(monster.defense * 0.3));
      buffApplied = {
        id: `buff_frost_${Date.now()}`,
        name: '冰冻',
        type: 'frost',
        duration: 3,
        value: 2,
      };
      message = isCrit
        ? `❄️ 冰霜新星暴击！对${monster.name}造成 ${damage} 点冰霜伤害，敌人被减速！`
        : `❄️ 冰霜新星对${monster.name}造成 ${damage} 点冰霜伤害，敌人被减速`;
      break;
    }
    case 'heal_wave': {
      const baseHeal = Math.abs(skill.damage) + player.maxHp * 0.1;
      const variance = randomInRange(0.9, 1.2);
      heal = Math.floor(baseHeal * variance * (isCrit ? 1.5 : 1));
      message = isCrit
        ? `💚 治疗波暴击！恢复了 ${heal} 点生命值！`
        : `💚 治疗波恢复了 ${heal} 点生命值`;
      break;
    }
    case 'poison_blade': {
      const baseDmg = skill.damage + player.attack * 0.6;
      const variance = randomInRange(0.9, 1.2);
      damage = Math.floor(baseDmg * variance * (isCrit ? 1.8 : 1));
      damage = Math.max(1, damage - Math.floor(monster.defense * 0.4));
      buffApplied = {
        id: `buff_poison_${Date.now()}`,
        name: '中毒',
        type: 'poison',
        duration: 5,
        value: Math.floor(damage * 0.2),
      };
      message = isCrit
        ? `🗡️ 毒刃暴击！对${monster.name}造成 ${damage} 点伤害并施加毒素！`
        : `🗡️ 毒刃对${monster.name}造成 ${damage} 点伤害并施加毒素`;
      break;
    }
  }

  return {
    success: true,
    damage,
    heal,
    manaCost: skill.manaCost,
    isCrit,
    message,
    buffApplied,
  };
}

export function processBuffDamage(buffs: Buff[]): { totalDamage: number; messages: string[] } {
  let totalDamage = 0;
  const messages: string[] = [];

  for (const buff of buffs) {
    if (buff.type === 'poison' && buff.duration > 0) {
      totalDamage += buff.value;
      messages.push(`☠️ 中毒效果造成 ${buff.value} 点伤害`);
    }
  }

  return { totalDamage, messages };
}

export function generateLoot(monster: Monster, floor: number): { gold: number; items: any[] } {
  const baseGold = monster.isBoss ? 100 : 10 + floor * 5;
  const goldVariance = randomInRange(0.8, 1.3);
  const gold = Math.floor(baseGold * goldVariance);

  const items: any[] = [];
  const dropChance = monster.isBoss ? 1 : 0.35;

  if (Math.random() < dropChance) {
    const rarities = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'epic'];
    const bossRarities = ['rare', 'epic', 'epic', 'legendary'];
    const rarityPool = monster.isBoss ? bossRarities : rarities;
    const rarity = rarityPool[Math.floor(Math.random() * rarityPool.length)];
    const itemType = Math.random();

    if (itemType < 0.4) {
      const tier = Math.min(4, Math.floor(floor / 2));
      const weaponNames = ['生锈的短剑', '铁剑', '精钢长剑', '火焰之刃', '龙牙剑'];
      const rarityMult = { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 }[rarity] || 1;
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: weaponNames[tier],
        type: 'weapon',
        rarity,
        attack: Math.floor((5 + tier * 3) * rarityMult),
      });
    } else if (itemType < 0.75) {
      const tier = Math.min(4, Math.floor(floor / 2));
      const armorNames = ['布甲', '皮甲', '锁子甲', '板甲', '龙鳞甲'];
      const rarityMult = { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 }[rarity] || 1;
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: armorNames[tier],
        type: 'armor',
        rarity,
        defense: Math.floor((3 + tier * 2) * rarityMult),
      });
    } else {
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: Math.random() < 0.5 ? '生命药水' : '法力药水',
        type: 'potion',
        rarity: 'common',
        hpRestore: Math.random() < 0.5 ? 30 : undefined,
        manaRestore: Math.random() >= 0.5 ? 25 : undefined,
      });
    }
  }

  return { gold, items };
}
