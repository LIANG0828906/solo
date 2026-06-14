import type { Skill, Character, Race } from '@/types';

export const createSkill = (base: Omit<Skill, 'currentCooldown'>): Skill => ({
  ...base,
  currentCooldown: 0,
});

const humanSkills: Omit<Skill, 'currentCooldown'>[] = [
  {
    id: 'human_slash',
    name: '烈焰斩',
    type: 'attack',
    damage: 35,
    cooldown: 0,
    manaCost: 15,
    icon: '⚔️',
    description: '以燃烧的战刃劈向敌人，造成火焰伤害',
    effect: '对目标造成攻击力×1.2的火焰伤害',
    element: 'fire',
  },
  {
    id: 'human_shield',
    name: '圣光护盾',
    type: 'defense',
    damage: 0,
    cooldown: 3,
    manaCost: 20,
    icon: '🛡️',
    description: '召唤神圣护盾，抵挡下一次攻击',
    effect: '获得相当于最大生命值20%的护盾',
    element: 'light',
    shieldAmount: 0.2,
  },
  {
    id: 'human_heal',
    name: '治愈之光',
    type: 'heal',
    damage: 0,
    cooldown: 2,
    manaCost: 25,
    icon: '✨',
    description: '圣光之力恢复自身生命',
    effect: '恢复最大生命值25%的生命值',
    element: 'light',
    healAmount: 0.25,
  },
];

const elfSkills: Omit<Skill, 'currentCooldown'>[] = [
  {
    id: 'elf_ice',
    name: '寒冰箭',
    type: 'attack',
    damage: 30,
    cooldown: 0,
    manaCost: 12,
    icon: '❄️',
    description: '凝聚冰雪之力射出寒冰利箭',
    effect: '对目标造成攻击力×1.1的冰霜伤害，有几率减速',
    element: 'ice',
  },
  {
    id: 'elf_barrier',
    name: '自然屏障',
    type: 'defense',
    damage: 0,
    cooldown: 4,
    manaCost: 18,
    icon: '🌿',
    description: '召唤藤蔓形成保护屏障',
    effect: '获得相当于最大生命值25%的护盾，并提升防御',
    element: 'nature',
    shieldAmount: 0.25,
  },
  {
    id: 'elf_buff',
    name: '精灵祝福',
    type: 'buff',
    damage: 0,
    cooldown: 3,
    manaCost: 22,
    icon: '🌟',
    description: '古老精灵的祝福提升攻击能力',
    effect: '接下来3回合攻击力提升30%',
    element: 'nature',
    buffAmount: 0.3,
  },
];

const undeadSkills: Omit<Skill, 'currentCooldown'>[] = [
  {
    id: 'undead_shadow',
    name: '暗影打击',
    type: 'attack',
    damage: 40,
    cooldown: 1,
    manaCost: 18,
    icon: '🌑',
    description: '召唤暗影之力侵蚀敌人',
    effect: '对目标造成攻击力×1.3的暗影伤害',
    element: 'shadow',
  },
  {
    id: 'undead_bone',
    name: '骨盾术',
    type: 'defense',
    damage: 0,
    cooldown: 3,
    manaCost: 16,
    icon: '💀',
    description: '召唤骸骨组成的护盾',
    effect: '获得相当于最大生命值18%的护盾',
    element: 'shadow',
    shieldAmount: 0.18,
  },
  {
    id: 'undead_drain',
    name: '生命汲取',
    type: 'heal',
    damage: 20,
    cooldown: 2,
    manaCost: 28,
    icon: '🩸',
    description: '吸取敌人生命力转化为自身能量',
    effect: '造成攻击力×0.8伤害，并恢复等量生命',
    element: 'shadow',
    healAmount: 0.8,
  },
];

export const getSkillsByRace = (race: Race): Skill[] => {
  const skillMap: Record<Race, Omit<Skill, 'currentCooldown'>[]> = {
    human: humanSkills,
    elf: elfSkills,
    undead: undeadSkills,
  };
  return skillMap[race].map(createSkill);
};

export const createCharacter = (
  id: string,
  name: string,
  race: Race,
  className: string,
  isPlayer: boolean,
): Character => {
  const baseStats: Record<Race, { hp: number; mp: number; atk: number; def: number; avatar: string }> = {
    human: { hp: 280, mp: 120, atk: 38, def: 22, avatar: '🗡️' },
    elf: { hp: 240, mp: 160, atk: 42, def: 18, avatar: '🧝' },
    undead: { hp: 320, mp: 100, atk: 45, def: 15, avatar: '💀' },
  };

  const stats = baseStats[race];

  return {
    id,
    name,
    race,
    className,
    maxHp: stats.hp,
    currentHp: stats.hp,
    maxMp: stats.mp,
    currentMp: stats.mp,
    attack: stats.atk,
    defense: stats.def,
    defenseReduction: 0.3,
    avatar: stats.avatar,
    skills: getSkillsByRace(race),
    statuses: [],
    isPlayer,
  };
};

export const battleCharacters: { player: Character; enemy: Character } = {
  player: createCharacter('player_1', '亚瑟·圣光', 'human', '圣骑士', true),
  enemy: createCharacter('enemy_1', '死亡领主·莫德雷', 'undead', '黑暗骑士', false),
};
