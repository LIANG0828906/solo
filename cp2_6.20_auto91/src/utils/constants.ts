import type { EggConfig } from '../types';

export const EGG_CONFIGS: Record<string, EggConfig> = {
  phoenix: {
    id: 'phoenix',
    name: '火凤',
    rarity: 'legendary',
    baseSuccessRate: 45,
    color: '#ff4500',
    glowColor: '#ff6347',
    element: 'fire',
    optimalTemp: { min: 30, max: 50 },
    optimalHumidity: { min: 10, max: 30 },
    optimalAura: { min: 120, max: 200 },
    skills: {
      baby: [
        { name: '烈焰吐息', description: '喷出小型火焰', icon: 'Flame' },
        { name: '温暖光环', description: '提升周围温度', icon: 'Sun' },
      ],
      adult: [
        { name: '凤凰之翼', description: '火焰翅膀攻击', icon: 'Wind' },
        { name: '涅槃之心', description: '恢复生命值', icon: 'Heart' },
      ],
      evolved: [
        { name: '地狱烈焰', description: '全屏火焰攻击', icon: 'Zap' },
        { name: '不朽之躯', description: '死亡后复活一次', icon: 'Shield' },
      ],
    },
  },
  dragon: {
    id: 'dragon',
    name: '冰龙',
    rarity: 'legendary',
    baseSuccessRate: 40,
    color: '#1e90ff',
    glowColor: '#00bfff',
    element: 'ice',
    optimalTemp: { min: -10, max: 10 },
    optimalHumidity: { min: 70, max: 100 },
    optimalAura: { min: 100, max: 180 },
    skills: {
      baby: [
        { name: '冰霜吐息', description: '喷出寒气', icon: 'Snowflake' },
        { name: '寒冰护甲', description: '增加防御', icon: 'Shield' },
      ],
      adult: [
        { name: '龙翼横扫', description: '冰翼横扫攻击', icon: 'Wind' },
        { name: '极寒领域', description: '冻结周围敌人', icon: 'Thermometer' },
      ],
      evolved: [
        { name: '绝对零度', description: '创造极寒空间', icon: 'Zap' },
        { name: '永恒冰川', description: '召唤冰川攻击', icon: 'Mountain' },
      ],
    },
  },
  wolf: {
    id: 'wolf',
    name: '雷狼',
    rarity: 'epic',
    baseSuccessRate: 55,
    color: '#9932cc',
    glowColor: '#ba55d3',
    element: 'thunder',
    optimalTemp: { min: 15, max: 35 },
    optimalHumidity: { min: 40, max: 60 },
    optimalAura: { min: 80, max: 160 },
    skills: {
      baby: [
        { name: '静电释放', description: '释放微弱电流', icon: 'Zap' },
        { name: '疾跑', description: '提升移动速度', icon: 'Wind' },
      ],
      adult: [
        { name: '雷电撕咬', description: '带电攻击', icon: 'Flame' },
        { name: '雷鸣咆哮', description: '震慑敌人', icon: 'Volume2' },
      ],
      evolved: [
        { name: '万雷轰顶', description: '召唤天雷', icon: 'Zap' },
        { name: '雷神降临', description: '短暂无敌', icon: 'Shield' },
      ],
    },
  },
  tortoise: {
    id: 'tortoise',
    name: '岩龟',
    rarity: 'rare',
    baseSuccessRate: 70,
    color: '#228b22',
    glowColor: '#32cd32',
    element: 'earth',
    optimalTemp: { min: 20, max: 40 },
    optimalHumidity: { min: 30, max: 70 },
    optimalAura: { min: 50, max: 150 },
    skills: {
      baby: [
        { name: '岩石护盾', description: '增加防御', icon: 'Shield' },
        { name: '地脉感应', description: '感知周围环境', icon: 'Eye' },
      ],
      adult: [
        { name: '大地震击', description: '震动地面', icon: 'Mountain' },
        { name: '玄武之甲', description: '大幅提升防御', icon: 'Shield' },
      ],
      evolved: [
        { name: '山崩地裂', description: '毁灭地形', icon: 'Zap' },
        { name: '大地之心', description: '无限回复', icon: 'Heart' },
      ],
    },
  },
};

export const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff4500',
  ice: '#1e90ff',
  thunder: '#9932cc',
  earth: '#228b22',
};

export const STAT_LABELS: Record<string, string> = {
  health: '生命',
  attack: '攻击',
  defense: '防御',
  speed: '速度',
  spirit: '灵力',
  potential: '成长潜力',
};

export const EVOLUTION_STAGE_LABELS: Record<string, string> = {
  egg: '灵兽蛋',
  baby: '幼体',
  adult: '成体',
  evolved: '进化体',
};

export const EVOLUTION_REQUIREMENTS = {
  baby_to_adult: {
    level: 15,
    trainingCount: 20,
  },
  adult_to_evolved: {
    level: 30,
    trainingCount: 50,
  },
};

export const INCUBATION_DURATION = 120;

export const PARTICLE_COUNT = 500;
