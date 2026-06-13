import { Card, Deck, BattleRecord, UserStats, Rarity } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const rarityColors: Record<Rarity, string> = {
  common: '#c0c0c0',
  rare: '#4a90d9',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

const generateCardImage = (name: string, rarity: Rarity): string => {
  const color = rarityColors[rarity].replace('#', '');
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`fantasy card art for ${name}, magical illustration, dark background`)}&image_size=square`;
};

const cardTemplates: Array<{
  name: string;
  cost: number;
  attack: number;
  health: number;
  rarity: Rarity;
  skill: string;
}> = [
  { name: '新兵战士', cost: 1, attack: 1, health: 2, rarity: 'common', skill: '战吼：抽一张牌' },
  { name: '精灵弓手', cost: 2, attack: 2, health: 3, rarity: 'common', skill: '亡语：对敌方英雄造成1点伤害' },
  { name: '盾牌卫士', cost: 2, attack: 1, health: 4, rarity: 'common', skill: '嘲讽' },
  { name: '火球术', cost: 4, attack: 0, health: 0, rarity: 'common', skill: '造成6点伤害' },
  { name: '治疗药水', cost: 2, attack: 0, health: 0, rarity: 'common', skill: '恢复8点生命值' },
  { name: '闪电链', cost: 3, attack: 0, health: 0, rarity: 'rare', skill: '对3个随机敌方单位各造成3点伤害' },
  { name: '圣光骑士', cost: 4, attack: 4, health: 5, rarity: 'rare', skill: '圣盾；战吼：恢复英雄4点生命' },
  { name: '冰霜女巫', cost: 3, attack: 3, health: 3, rarity: 'rare', skill: '战吼：冻结一个敌方随从' },
  { name: '暗影刺客', cost: 3, attack: 4, health: 2, rarity: 'rare', skill: '潜行；连击：获得+2攻击力' },
  { name: '狂战士', cost: 5, attack: 6, health: 5, rarity: 'rare', skill: '冲锋' },
  { name: '龙息术', cost: 5, attack: 0, health: 0, rarity: 'rare', skill: '对所有敌方随从造成4点伤害' },
  { name: '奥术智慧', cost: 3, attack: 0, health: 0, rarity: 'rare', skill: '抽2张牌' },
  { name: '巨型蜘蛛', cost: 4, attack: 3, health: 5, rarity: 'rare', skill: '剧毒' },
  { name: '火焰元素', cost: 6, attack: 6, health: 6, rarity: 'epic', skill: '战吼：对一个随机敌方随从造成3点伤害' },
  { name: '死亡领主', cost: 8, attack: 8, health: 8, rarity: 'epic', skill: '嘲讽；亡语：双方各抽2张牌' },
  { name: '大法师', cost: 7, attack: 4, health: 7, rarity: 'epic', skill: '你的法术伤害+3' },
  { name: '暗影领主', cost: 6, attack: 5, health: 6, rarity: 'epic', skill: '战吼：消灭一个攻击力小于等于3的随从' },
  { name: '生命之树', cost: 9, attack: 0, health: 0, rarity: 'epic', skill: '将所有角色的生命值恢复至满' },
  { name: '远古巨龙', cost: 10, attack: 10, health: 10, rarity: 'legendary', skill: '战吼：对所有敌方随从造成5点伤害' },
  { name: '光明使者', cost: 8, attack: 6, health: 8, rarity: 'legendary', skill: '圣盾；战吼：为所有友方随从恢复全部生命值' },
  { name: '时空法师', cost: 7, attack: 5, health: 5, rarity: 'legendary', skill: '战吼：获得一个额外回合' },
  { name: '死亡之翼', cost: 10, attack: 12, health: 12, rarity: 'legendary', skill: '战吼：消灭所有其他随从，弃掉你的手牌' },
  { name: '世界之树', cost: 10, attack: 0, health: 10, rarity: 'legendary', skill: '嘲讽；在你的回合开始时，恢复英雄5点生命' },
  { name: '虚空领主', cost: 9, attack: 3, health: 9, rarity: 'legendary', skill: '嘲讽；亡语：召唤3个1/3虚空行者' },
  { name: '丛林巨兽', cost: 7, attack: 7, health: 7, rarity: 'epic', skill: '战吼：抽一张牌，获得+1/+1' },
  { name: '风暴元素', cost: 5, attack: 4, health: 4, rarity: 'epic', skill: '战吼：对所有敌方随从造成1点伤害' },
  { name: '神圣新星', cost: 5, attack: 0, health: 0, rarity: 'epic', skill: '对所有敌方角色造成2点伤害，恢复所有友方角色2点生命' },
  { name: '破法者', cost: 4, attack: 4, health: 3, rarity: 'rare', skill: '战吼：沉默一个随从' },
  { name: '灵魂收割者', cost: 6, attack: 5, health: 5, rarity: 'rare', skill: '吸血' },
  { name: '钢铁卫士', cost: 5, attack: 4, health: 7, rarity: 'rare', skill: '嘲讽' },
  { name: '狂暴图腾', cost: 3, attack: 0, health: 4, rarity: 'common', skill: '你的所有随从获得+1攻击力' },
  { name: '先祖治疗', cost: 4, attack: 0, health: 0, rarity: 'common', skill: '恢复一个友方角色全部生命值' },
];

export const initialCards: Card[] = cardTemplates.map((c) => ({
  id: uuidv4(),
  ...c,
  image: generateCardImage(c.name, c.rarity),
}));

export const initialDecks: Deck[] = [];

export const initialBattles: BattleRecord[] = [];

export const initialStats: UserStats = {
  deckCount: 0,
  battleCount: 0,
  topCards: [],
};
