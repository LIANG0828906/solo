import type { Monster, Player, Equipment, CombatState } from './types';
import { generateEquipment } from './dungeonGenerator';

export interface CombatResult {
  monsterDefeated: boolean;
  playerDead: boolean;
  damageToMonster: number;
  damageToPlayer: number;
  loot: Equipment[];
  isSkillAttack: boolean;
  isBossSpecial: boolean;
}

export function playerAttack(
  player: Player,
  monster: Monster,
  useSkill: boolean
): CombatResult {
  let damageToMonster = 0;
  let isSkillAttack = false;

  if (useSkill) {
    if (player.mp < player.maxMp * 0.25) {
      return {
        monsterDefeated: false,
        playerDead: false,
        damageToMonster: 0,
        damageToPlayer: 0,
        loot: [],
        isSkillAttack: false,
        isBossSpecial: false,
      };
    }
    isSkillAttack = true;
    damageToMonster = Math.floor(Math.random() * 16) + 25;
    damageToMonster += Math.floor(player.attack * 0.5);
  } else {
    damageToMonster = Math.floor(Math.random() * 6) + 10;
    damageToMonster += Math.floor(player.attack * 0.3);
  }

  const newHp = Math.max(0, monster.hp - damageToMonster);
  const monsterDefeated = newHp <= 0;

  let loot: Equipment[] = [];
  if (monsterDefeated) {
    const lootCount = monster.isBoss ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < lootCount; i++) {
      loot.push(generateEquipment({ next: Math.random } as never, 0));
    }
  }

  return {
    monsterDefeated,
    playerDead: false,
    damageToMonster,
    damageToPlayer: 0,
    loot,
    isSkillAttack,
    isBossSpecial: false,
  };
}

export function monsterAttack(monster: Monster, player: Player): CombatResult {
  let damageToPlayer = 0;
  let isBossSpecial = false;

  if (
    monster.isBoss &&
    monster.specialSkill &&
    monster.specialSkill.currentCooldown <= 0
  ) {
    isBossSpecial = true;
    damageToPlayer = monster.specialSkill.damage - Math.floor(player.defense * 0.3);
    monster.specialSkill.currentCooldown = monster.specialSkill.cooldown;
  } else {
    damageToPlayer = monster.attack - Math.floor(player.defense * 0.2);
    if (monster.isBoss && monster.specialSkill) {
      monster.specialSkill.currentCooldown--;
    }
  }

  damageToPlayer = Math.max(1, damageToPlayer);
  const playerDead = player.hp - damageToPlayer <= 0;

  return {
    monsterDefeated: false,
    playerDead,
    damageToMonster: 0,
    damageToPlayer,
    loot: [],
    isSkillAttack: false,
    isBossSpecial,
  };
}

export function createInitialCombatState(monster: Monster): CombatState {
  return {
    inCombat: true,
    currentMonster: { ...monster, specialSkill: monster.specialSkill ? { ...monster.specialSkill } : null },
    normalAttackCooldown: 0,
    skillAttackCooldown: 0,
    playerTurn: true,
    bossWarningActive: false,
    bossWarningStartTime: 0,
    combatLog: [`遭遇 ${monster.name}！`],
  };
}
