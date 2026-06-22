import { v4 as uuidv4 } from 'uuid';

export type 种族类型 = 'dragon' | 'cat' | 'bird';
export type 稀有度类型 = 'common' | 'rare' | 'epic' | 'legendary';
export type 技能效果类型 = 'damage' | 'heal' | 'buff' | 'debuff';

export interface 技能模板 {
  id: string;
  name: string;
  稀有度: 稀有度类型;
  基础伤害: number;
  冷却回合: number;
  效果类型: 技能效果类型;
  描述: string;
  种族限制?: 种族类型[];
}

export interface 宠物种族模板 {
  种族: 种族类型;
  name: string;
  描述: string;
  基础属性: {
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  成长系数: {
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  外观配色: {
    主色: string;
    副色: string;
    强调色: string;
  };
  初始技能ids: string[];
  进化形态: string[];
}

export interface AI策略 {
  id: string;
  name: string;
  攻击倾向: number;
  防御倾向: number;
  技能偏好: string[];
}

export const 稀有度配色: Record<稀有度类型, { 边框: string; 背景: string; 文字: string; 辉光: string }> = {
  common: { 边框: '#9ca3af', 背景: '#374151', 文字: '#e5e7eb', 辉光: 'rgba(156, 163, 175, 0.4)' },
  rare: { 边框: '#3b82f6', 背景: '#1e40af', 文字: '#93c5fd', 辉光: 'rgba(59, 130, 246, 0.5)' },
  epic: { 边框: '#a855f7', 背景: '#6b21a8', 文字: '#d8b4fe', 辉光: 'rgba(168, 85, 247, 0.5)' },
  legendary: { 边框: '#f59e0b', 背景: '#b45309', 文字: '#fde047', 辉光: 'rgba(245, 158, 11, 0.6)' },
};

export const 宠物种族模板列表: 宠物种族模板[] = [
  {
    种族: 'dragon',
    name: '烈焰龙',
    描述: '来自火山深处的龙族后裔，拥有强大的火焰吐息和坚硬的鳞片。',
    基础属性: { maxHp: 120, attack: 18, defense: 14, speed: 10 },
    成长系数: { maxHp: 15, attack: 3, defense: 2, speed: 1.5 },
    外观配色: { 主色: '#dc2626', 副色: '#7f1d1d', 强调色: '#fbbf24' },
    初始技能ids: ['skill_fire_breath', 'skill_tackle'],
    进化形态: ['幼龙', '飞龙', '炎龙'],
  },
  {
    种族: 'cat',
    name: '闪电猫',
    描述: '敏捷的雷属性猫咪，速度极快，擅长连续攻击。',
    基础属性: { maxHp: 90, attack: 15, defense: 8, speed: 20 },
    成长系数: { maxHp: 10, attack: 2.5, defense: 1.2, speed: 3 },
    外观配色: { 主色: '#facc15', 副色: '#a16207', 强调色: '#06b6d4' },
    初始技能ids: ['skill_lightning_paw', 'skill_tackle'],
    进化形态: ['小猫', '雷猫', '雷神猫'],
  },
  {
    种族: 'bird',
    name: '苍穹鸟',
    描述: '翱翔天际的风之使者，拥有精准的远程攻击能力。',
    基础属性: { maxHp: 100, attack: 16, defense: 10, speed: 16 },
    成长系数: { maxHp: 12, attack: 2.8, defense: 1.5, speed: 2.2 },
    外观配色: { 主色: '#0ea5e9', 副色: '#0c4a6e', 强调色: '#a7f3d0' },
    初始技能ids: ['skill_wind_blade', 'skill_tackle'],
    进化形态: ['雏鸟', '风鸟', '天空鸟'],
  },
];

export const 技能模板列表: 技能模板[] = [
  {
    id: 'skill_tackle',
    name: '冲撞',
    稀有度: 'common',
    基础伤害: 10,
    冷却回合: 0,
    效果类型: 'damage',
    描述: '最基础的物理攻击，用身体撞击对手。',
  },
  {
    id: 'skill_fire_breath',
    name: '火焰吐息',
    稀有度: 'rare',
    基础伤害: 25,
    冷却回合: 2,
    效果类型: 'damage',
    描述: '喷出炽热的火焰，造成大量火属性伤害。',
    种族限制: ['dragon'],
  },
  {
    id: 'skill_lightning_paw',
    name: '闪电爪',
    稀有度: 'rare',
    基础伤害: 22,
    冷却回合: 2,
    效果类型: 'damage',
    描述: '用带电的爪子快速攻击，有几率麻痹对手。',
    种族限制: ['cat'],
  },
  {
    id: 'skill_wind_blade',
    name: '风刃',
    稀有度: 'rare',
    基础伤害: 20,
    冷却回合: 1,
    效果类型: 'damage',
    描述: '挥出锋利的风之刀刃，远距离攻击对手。',
    种族限制: ['bird'],
  },
  {
    id: 'skill_iron_wall',
    name: '铁壁',
    稀有度: 'rare',
    基础伤害: 0,
    冷却回合: 3,
    效果类型: 'buff',
    描述: '大幅提升防御力，持续2回合。',
  },
  {
    id: 'skill_heal_light',
    name: '治愈之光',
    稀有度: 'epic',
    基础伤害: -30,
    冷却回合: 3,
    效果类型: 'heal',
    描述: '召唤神圣光芒，恢复自身生命值。',
  },
  {
    id: 'skill_dragon_rage',
    name: '龙之怒',
    稀有度: 'epic',
    基础伤害: 40,
    冷却回合: 4,
    效果类型: 'damage',
    描述: '释放龙族的愤怒力量，造成毁灭性伤害。',
    种族限制: ['dragon'],
  },
  {
    id: 'skill_thunder_storm',
    name: '雷暴',
    稀有度: 'epic',
    基础伤害: 35,
    冷却回合: 4,
    效果类型: 'damage',
    描述: '召唤雷霆风暴，对敌人造成强力雷属性伤害。',
    种族限制: ['cat'],
  },
  {
    id: 'skill_tornado',
    name: '龙卷风',
    稀有度: 'epic',
    基础伤害: 32,
    冷却回合: 3,
    效果类型: 'damage',
    描述: '卷起强力龙卷风，将敌人卷入其中。',
    种族限制: ['bird'],
  },
  {
    id: 'skill_ultimate_blast',
    name: '终极爆发',
    稀有度: 'legendary',
    基础伤害: 60,
    冷却回合: 6,
    效果类型: 'damage',
    描述: '释放全部力量的终极技能，造成巨大伤害。',
  },
];

export const AI策略列表: AI策略[] = [
  {
    id: 'ai_aggressive',
    name: '激进型',
    攻击倾向: 0.8,
    防御倾向: 0.2,
    技能偏好: ['skill_fire_breath', 'skill_lightning_paw', 'skill_wind_blade'],
  },
  {
    id: 'ai_balanced',
    name: '均衡型',
    攻击倾向: 0.5,
    防御倾向: 0.5,
    技能偏好: ['skill_tackle', 'skill_iron_wall', 'skill_heal_light'],
  },
  {
    id: 'ai_defensive',
    name: '防守型',
    攻击倾向: 0.3,
    防御倾向: 0.7,
    技能偏好: ['skill_iron_wall', 'skill_heal_light', 'skill_tackle'],
  },
];

export function 生成随机AI宠物(玩家等级: number) {
  const 种族池: 种族类型[] = ['dragon', 'cat', 'bird'];
  const 随机种族 = 种族池[Math.floor(Math.random() * 种族池.length)];
  const 种族模板 = 宠物种族模板列表.find(r => r.种族 === 随机种族)!;
  const 等级 = Math.max(1, 玩家等级 + Math.floor(Math.random() * 5) - 2);
  
  const AI名字前缀 = ['野生', '训练师', '竞技场', '神秘'];
  const AI名字 = AI名字前缀[Math.floor(Math.random() * AI名字前缀.length)] + 种族模板.name;

  const 可用技能 = 技能模板列表.filter(s => !s.种族限制 || s.种族限制.includes(随机种族));
  const 已装备技能ids: string[] = ['skill_tackle'];
  while (已装备技能ids.length < 3 && 可用技能.length > 已装备技能ids.length) {
    const 随机技能 = 可用技能[Math.floor(Math.random() * 可用技能.length)];
    if (!已装备技能ids.includes(随机技能.id)) {
      已装备技能ids.push(随机技能.id);
    }
  }

  return {
    id: uuidv4(),
    name: AI名字,
    种族: 随机种族,
    level: 等级,
    exp: 0,
    expToNext: 等级 * 100,
    hp: Math.floor(种族模板.基础属性.maxHp + 种族模板.成长系数.maxHp * (等级 - 1)),
    maxHp: Math.floor(种族模板.基础属性.maxHp + 种族模板.成长系数.maxHp * (等级 - 1)),
    attack: Math.floor(种族模板.基础属性.attack + 种族模板.成长系数.attack * (等级 - 1)),
    defense: Math.floor(种族模板.基础属性.defense + 种族模板.成长系数.defense * (等级 - 1)),
    speed: Math.floor(种族模板.基础属性.speed + 种族模板.成长系数.speed * (等级 - 1)),
    进化阶段: Math.min(2, Math.floor(等级 / 10)),
    已装备技能ids,
    装饰品ids: [] as string[],
    配色: 种族模板.外观配色,
  };
}
