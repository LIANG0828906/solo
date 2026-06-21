import type { Card } from '../types/game';

export const CARD_DEFINITIONS: Omit<Card, 'id'>[] = [
  {
    cardId: 'fireball',
    name: '火球术',
    cost: 2,
    type: 'attack',
    description: '对单体造成4点伤害',
    targetType: 'single',
    effect: { damage: 4 },
    icon: '🔥',
  },
  {
    cardId: 'heal_light',
    name: '治愈之光',
    cost: 2,
    type: 'heal',
    description: '为友方单体恢复3点生命',
    targetType: 'single',
    effect: { heal: 3 },
    icon: '✨',
  },
  {
    cardId: 'iron_shield',
    name: '铁甲护盾',
    cost: 2,
    type: 'shield',
    description: '为友方单体增加2点护盾，持续2回合',
    targetType: 'single',
    effect: { shield: 2, duration: 2 },
    icon: '🛡️',
  },
  {
    cardId: 'weakness_curse',
    name: '虚弱诅咒',
    cost: 1,
    type: 'debuff',
    description: '使敌方单体攻击力-2，持续2回合',
    targetType: 'single',
    effect: { attackModifier: -2, duration: 2 },
    icon: '💀',
  },
  {
    cardId: 'lightning_chain',
    name: '闪电链',
    cost: 3,
    type: 'attack',
    description: '随机攻击2个敌方单位，各造成2点伤害',
    targetType: 'random_enemy',
    effect: { damage: 2, targetCount: 2 },
    icon: '⚡',
  },
  {
    cardId: 'group_heal',
    name: '群体治疗',
    cost: 3,
    type: 'heal',
    description: '全体友方恢复1点生命',
    targetType: 'all_friendly',
    effect: { heal: 1 },
    icon: '💚',
  },
  {
    cardId: 'precise_strike',
    name: '精准打击',
    cost: 3,
    type: 'attack',
    description: '无视护盾造成3点伤害',
    targetType: 'single',
    effect: { damage: 3, ignoreShield: true },
    icon: '🎯',
  },
  {
    cardId: 'energy_surge',
    name: '能量涌动',
    cost: 0,
    type: 'utility',
    description: '回复2点能量',
    targetType: 'self',
    effect: { energyRestore: 2 },
    icon: '💎',
  },
];

export function createCardInstance(cardId: string): Card | null {
  const def = CARD_DEFINITIONS.find((c) => c.cardId === cardId);
  if (!def) return null;
  return {
    ...def,
    id: `${cardId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function createInitialDeck(): Card[] {
  const deck: Card[] = [];
  const cardCounts: Record<string, number> = {
    fireball: 3,
    heal_light: 2,
    iron_shield: 2,
    weakness_curse: 2,
    lightning_chain: 2,
    group_heal: 2,
    precise_strike: 2,
    energy_surge: 2,
  };

  for (const [cardId, count] of Object.entries(cardCounts)) {
    for (let i = 0; i < count; i++) {
      const card = createCardInstance(cardId);
      if (card) deck.push(card);
    }
  }

  return shuffleArray(deck);
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
