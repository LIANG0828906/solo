export type CardType = 'minion' | 'spell' | 'weapon';

export type SpellEffectType =
  | 'damage'
  | 'aoe_damage'
  | 'heal'
  | 'heal_all'
  | 'draw'
  | 'summon'
  | 'buff'
  | 'freeze';

export interface TokenDefinition {
  name: string;
  attack: number;
  health: number;
  taunt?: boolean;
  charge?: boolean;
  description?: string;
}

export interface BaseCard {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DeathrattleEffect {
  type: 'damage' | 'summon' | 'draw' | 'heal' | 'buff';
  value?: number;
  target?: 'enemy' | 'friendly' | 'all' | 'any';
  token?: TokenDefinition;
  count?: number;
}

export interface MinionCard extends BaseCard {
  type: 'minion';
  attack: number;
  health: number;
  taunt?: boolean;
  charge?: boolean;
  battlecry?: SpellEffect;
  deathrattle?: DeathrattleEffect;
}

export interface SpellEffect {
  type: SpellEffectType;
  value?: number;
  target?: 'enemy' | 'friendly' | 'all' | 'self' | 'enemy_hero' | 'any';
  summonId?: string;
  count?: number;
  token?: TokenDefinition;
}

export interface SpellCard extends BaseCard {
  type: 'spell';
  effect: SpellEffect;
}

export interface WeaponCard extends BaseCard {
  type: 'weapon';
  attack: number;
  durability: number;
}

export type Card = MinionCard | SpellCard | WeaponCard;

export const CARD_DATABASE: Card[] = [
  {
    id: 'minion_1',
    name: '暗影新兵',
    cost: 1,
    type: 'minion',
    attack: 1,
    health: 2,
    description: '一名初出茅庐的暗影战士。',
    rarity: 'common',
  },
  {
    id: 'minion_2',
    name: '石像守卫',
    cost: 2,
    type: 'minion',
    attack: 1,
    health: 4,
    taunt: true,
    description: '嘲讽：敌方必须先攻击此随从。',
    rarity: 'common',
  },
  {
    id: 'minion_3',
    name: '火焰术士',
    cost: 3,
    type: 'minion',
    attack: 3,
    health: 2,
    battlecry: {
      type: 'damage',
      value: 3,
      target: 'any',
    },
    description: '战吼：对任意目标造成3点伤害。',
    rarity: 'rare',
  },
  {
    id: 'minion_4',
    name: '冲锋骑士',
    cost: 4,
    type: 'minion',
    attack: 4,
    health: 3,
    charge: true,
    description: '冲锋：召唤当回合即可攻击。',
    rarity: 'rare',
  },
  {
    id: 'minion_5',
    name: '远古巨龙',
    cost: 7,
    type: 'minion',
    attack: 7,
    health: 7,
    deathrattle: {
      type: 'damage',
      value: 2,
      target: 'all',
    },
    description: '亡语：对所有敌方随从造成2点伤害。',
    rarity: 'legendary',
  },
  {
    id: 'minion_6',
    name: '治愈祭司',
    cost: 2,
    type: 'minion',
    attack: 1,
    health: 3,
    battlecry: { type: 'heal', value: 4, target: 'friendly' },
    description: '战吼：为一个友方目标恢复4点生命值。',
    rarity: 'common',
  },
  {
    id: 'minion_7',
    name: '幽灵狼',
    cost: 3,
    type: 'minion',
    attack: 3,
    health: 3,
    description: '从暗影中召唤的神秘生物。',
    rarity: 'common',
  },
  {
    id: 'minion_8',
    name: '狂战士',
    cost: 5,
    type: 'minion',
    attack: 6,
    health: 5,
    charge: true,
    deathrattle: {
      type: 'summon',
      count: 1,
      token: {
        name: '狂战士之魂',
        attack: 2,
        health: 1,
        charge: true,
        description: '狂战士牺牲后残留的战意。',
      },
    },
    description: '冲锋：召唤当回合即可攻击。亡语：召唤一个2/1的狂战士之魂。',
    rarity: 'epic',
  },
  {
    id: 'spell_1',
    name: '火球术',
    cost: 4,
    type: 'spell',
    effect: { type: 'damage', value: 6, target: 'any' },
    description: '对任意目标造成6点伤害。',
    rarity: 'common',
  },
  {
    id: 'spell_2',
    name: '烈焰风暴',
    cost: 5,
    type: 'spell',
    effect: { type: 'aoe_damage', value: 3, target: 'enemy' },
    description: '对所有敌方随从造成3点伤害。',
    rarity: 'epic',
  },
  {
    id: 'spell_3',
    name: '治疗术',
    cost: 2,
    type: 'spell',
    effect: { type: 'heal', value: 5, target: 'friendly' },
    description: '为一个友方目标恢复5点生命值。',
    rarity: 'common',
  },
  {
    id: 'spell_4',
    name: '神圣光辉',
    cost: 4,
    type: 'spell',
    effect: { type: 'heal_all', value: 6, target: 'friendly' },
    description: '为所有友方角色恢复6点生命值。',
    rarity: 'rare',
  },
  {
    id: 'spell_5',
    name: '智慧卷轴',
    cost: 2,
    type: 'spell',
    effect: { type: 'draw', count: 2 },
    description: '抽2张牌。',
    rarity: 'common',
  },
  {
    id: 'spell_6',
    name: '召唤小鬼',
    cost: 3,
    type: 'spell',
    effect: {
      type: 'summon',
      summonId: 'token_imp',
      count: 2,
      token: {
        name: '小鬼',
        attack: 2,
        health: 2,
        description: '被召唤的小鬼。',
      },
    },
    description: '召唤2个2/2的小鬼。',
    rarity: 'rare',
  },
  {
    id: 'spell_7',
    name: '寒冰箭',
    cost: 2,
    type: 'spell',
    effect: { type: 'damage', value: 3, target: 'any' },
    description: '对任意目标造成3点伤害。',
    rarity: 'common',
  },
  {
    id: 'spell_8',
    name: '力量祝福',
    cost: 2,
    type: 'spell',
    effect: { type: 'buff', value: 3, target: 'friendly' },
    description: '使一个友方随从获得+3/+0。',
    rarity: 'common',
  },
  {
    id: 'weapon_1',
    name: '暗影之刃',
    cost: 3,
    type: 'weapon',
    attack: 3,
    durability: 3,
    description: '装备后英雄攻击力+3，持续3回合。',
    rarity: 'rare',
  },
  {
    id: 'weapon_2',
    name: '战斧',
    cost: 2,
    type: 'weapon',
    attack: 2,
    durability: 2,
    description: '装备后英雄攻击力+2，持续2回合。',
    rarity: 'common',
  },
];

export const TOKEN_CARDS: Record<string, MinionCard> = {
  token_imp: {
    id: 'token_imp',
    name: '小鬼',
    cost: 1,
    type: 'minion',
    attack: 2,
    health: 2,
    description: '被召唤的小鬼。',
    rarity: 'common',
  },
};

export function getCardById(id: string): Card | undefined {
  return CARD_DATABASE.find((c) => c.id === id) || TOKEN_CARDS[id];
}

export function tokenDefinitionToMinionCard(token: TokenDefinition): MinionCard {
  return {
    id: `token_${token.name}_${Date.now()}`,
    name: token.name,
    cost: 0,
    type: 'minion',
    attack: token.attack,
    health: token.health,
    taunt: token.taunt,
    charge: token.charge,
    description: token.description || '',
    rarity: 'common',
  };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  CARD_DATABASE.forEach((card) => {
    deck.push({ ...card });
    deck.push({ ...card });
  });
  while (deck.length < 40) {
    const randomCard = CARD_DATABASE[Math.floor(Math.random() * CARD_DATABASE.length)];
    deck.push({ ...randomCard });
  }
  return shuffleDeck(deck.slice(0, 40));
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
