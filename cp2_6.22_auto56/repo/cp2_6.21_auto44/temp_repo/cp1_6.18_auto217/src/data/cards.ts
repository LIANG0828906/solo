import { Card, Rarity, Element } from '../types/game';

const createCard = (
  id: string,
  name: string,
  rarity: Rarity,
  element: Element,
  baseAttack: number,
  baseDefense: number,
  baseHp: number,
  speed: number,
  avatar: string,
  skillName: string,
  skillDesc: string,
  skillMultiplier: number,
  passiveName: string,
  passiveDesc: string
): Card => ({
  id,
  name,
  rarity,
  element,
  baseAttack,
  baseDefense,
  baseHp,
  speed,
  level: 1,
  maxLevel: 10,
  avatar,
  skills: [
    {
      name: skillName,
      description: skillDesc,
      multiplier: skillMultiplier,
      energyCost: 3,
      cooldown: 3,
      type: 'active',
    },
    {
      name: passiveName,
      description: passiveDesc,
      multiplier: 0,
      energyCost: 0,
      cooldown: 0,
      type: 'passive',
      effect: passiveDesc,
    },
  ],
});

export const initialCards: Card[] = [
  // 金色稀有度 (3张)
  createCard('g1', '孙悟空', 'gold', 'fire', 120, 60, 1800, 95, '🐒',
    '大闹天宫', '释放烈焰对敌方造成2.2倍伤害', 2.2,
    '火眼金睛', '暴击率提升15%'),
  createCard('g2', '杨戬', 'gold', 'earth', 110, 80, 2000, 85, '🐕',
    '三尖两刃', '挥戟造成2.0倍伤害并提升自身防御', 2.0,
    '九转玄功', '受到伤害时15%概率免疫'),
  createCard('g3', '哪吒', 'gold', 'fire', 115, 55, 1600, 100, '🔥',
    '三头六臂', '爆发攻击造成2.3倍伤害', 2.3,
    '莲花化身', '每回合恢复5%生命值'),

  // 紫色稀有度 (5张)
  createCard('p1', '姜子牙', 'purple', 'water', 85, 45, 1400, 75, '🐟',
    '打神鞭', '雷霆一击造成1.8倍伤害', 1.8,
    '封神榜', '战斗开始时提升全队10%攻击'),
  createCard('p2', '雷震子', 'purple', 'wind', 95, 40, 1300, 90, '⚡',
    '风雷双翅', '风刃造成1.7倍伤害', 1.7,
    '雷电护体', '被攻击时有10%概率反弹伤害'),
  createCard('p3', '李靖', 'purple', 'earth', 80, 70, 1600, 70, '🛡️',
    '玲珑宝塔', '镇压敌人造成1.6倍伤害', 1.6,
    '托塔天王', '全队防御力提升15%'),
  createCard('p4', '二郎神', 'purple', 'wind', 90, 50, 1450, 88, '👁️',
    '天眼射光', '神光造成1.9倍伤害', 1.9,
    '哮天犬', '普通攻击附带额外伤害'),
  createCard('p5', '土行孙', 'purple', 'earth', 75, 75, 1500, 80, '⛰️',
    '地行突袭', '遁地攻击造成1.7倍伤害', 1.7,
    '土遁术', '30%概率闪避攻击'),

  // 蓝色稀有度 (5张)
  createCard('b1', '黄天化', 'blue', 'fire', 70, 50, 1200, 82, '🗡️',
    '火龙标', '火焰投掷造成1.5倍伤害', 1.5,
    '玉麒麟', '速度提升10%'),
  createCard('b2', '邓婵玉', 'blue', 'water', 65, 45, 1100, 88, '💎',
    '五光石', '宝石飞射造成1.6倍伤害', 1.6,
    '先发制人', '首回合攻击必定命中'),
  createCard('b3', '殷洪', 'blue', 'earth', 68, 55, 1300, 72, '☯️',
    '阴阳镜', '幻境攻击造成1.5倍伤害', 1.5,
    '太极图', '每回合获得1点额外能量'),
  createCard('b4', '龙吉公主', 'blue', 'water', 72, 48, 1150, 78, '🌊',
    '四海瓶', '巨浪冲击造成1.55倍伤害', 1.55,
    '水属性', '水系技能伤害提升10%'),
  createCard('b5', '洪锦', 'blue', 'wind', 66, 52, 1250, 76, '🎋',
    '旗门遁', '风遁攻击造成1.45倍伤害', 1.45,
    '奇门遁甲', '受到伤害降低8%'),

  // 绿色稀有度 (5张)
  createCard('e1', '武吉', 'green', 'earth', 50, 45, 1000, 65, '🪓',
    '开山斧', '重击造成1.3倍伤害', 1.3,
    '樵夫', '生命值提升10%'),
  createCard('e2', '南宫适', 'green', 'fire', 55, 40, 950, 70, '🏹',
    '穿云箭', '火箭造成1.35倍伤害', 1.35,
    '神射', '命中率提升10%'),
  createCard('e3', '伯邑考', 'green', 'wind', 45, 35, 900, 60, '🎵',
    '琴音斩', '音波攻击造成1.25倍伤害', 1.25,
    '圣德', '全队每回合恢复2%生命'),
  createCard('e4', '散宜生', 'green', 'water', 48, 42, 980, 58, '📜',
    '符咒术', '水符攻击造成1.28倍伤害', 1.28,
    '智慧', '技能冷却减少1回合'),
  createCard('e5', '太鸾', 'green', 'fire', 52, 38, 920, 75, '⚔️',
    '火焰刀', '烈焰斩造成1.32倍伤害', 1.32,
    '勇猛', '攻击时5%概率造成双倍伤害'),
];

export const getCardStats = (card: Card) => {
  const levelBonus = card.level - 1;
  return {
    attack: Math.floor(card.baseAttack * (1 + 0.05 * levelBonus)),
    defense: Math.floor(card.baseDefense * (1 + 0.03 * levelBonus)),
    hp: Math.floor(card.baseHp * (1 + 0.04 * levelBonus)),
  };
};

export const upgradeCost = (level: number): number => {
  return 100 * level;
};
