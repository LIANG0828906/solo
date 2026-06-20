import { v4 as uuidv4 } from 'uuid';

export type EffectType = 'attack' | 'defense' | 'draw' | 'heal';
export type Rarity = 'common' | 'rare' | 'epic';

export interface CardEffect {
  id: string;
  name: string;
  type: EffectType;
  value: number;
  baseCost: number;
  description: string;
}

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  effects: CardEffect[];
  cost: number;
  power: number;
  isDraft?: boolean;
}

export interface BattleLog {
  turn: number;
  message: string;
}

export interface BattleResult {
  logs: BattleLog[];
  winner: 'player' | 'ai' | 'draw';
}

export const PRESET_EFFECTS: CardEffect[] = [
  { id: 'atk_1', name: '攻击力+3', type: 'attack', value: 3, baseCost: 2, description: '增加3点攻击力' },
  { id: 'atk_2', name: '攻击力+5', type: 'attack', value: 5, baseCost: 3, description: '增加5点攻击力' },
  { id: 'atk_3', name: '攻击力+8', type: 'attack', value: 8, baseCost: 5, description: '增加8点攻击力' },
  { id: 'def_1', name: '防御+2', type: 'defense', value: 2, baseCost: 1, description: '增加2点防御力' },
  { id: 'def_2', name: '防御+4', type: 'defense', value: 4, baseCost: 3, description: '增加4点防御力' },
  { id: 'def_3', name: '防御+6', type: 'defense', value: 6, baseCost: 4, description: '增加6点防御力' },
  { id: 'draw_1', name: '抽1张牌', type: 'draw', value: 1, baseCost: 2, description: '抽取1张卡牌' },
  { id: 'draw_2', name: '抽2张牌', type: 'draw', value: 2, baseCost: 4, description: '抽取2张卡牌' },
  { id: 'heal_1', name: '回复3生命', type: 'heal', value: 3, baseCost: 2, description: '回复3点生命值' },
  { id: 'heal_2', name: '回复5生命', type: 'heal', value: 5, baseCost: 3, description: '回复5点生命值' },
  { id: 'heal_3', name: '回复8生命', type: 'heal', value: 8, baseCost: 5, description: '回复8点生命值' },
];

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1.0,
  rare: 1.5,
  epic: 2.0,
};

export function calculateCardPower(effects: CardEffect[], rarity: Rarity): number {
  const basePower = effects.reduce((sum, effect) => {
    switch (effect.type) {
      case 'attack':
        return sum + effect.value * 2;
      case 'defense':
        return sum + effect.value * 1.5;
      case 'draw':
        return sum + effect.value * 3;
      case 'heal':
        return sum + effect.value * 1.2;
      default:
        return sum;
    }
  }, 0);

  const multiplier = RARITY_MULTIPLIER[rarity];
  return Math.round(basePower * multiplier);
}

export function calculateCardCost(effects: CardEffect[]): number {
  return effects.reduce((sum, effect) => sum + effect.baseCost, 0);
}

export function validateCardEffects(effects: CardEffect[]): { valid: boolean; error?: string } {
  if (effects.length === 0) {
    return { valid: false, error: '至少需要选择一个效果' };
  }
  if (effects.length > 5) {
    return { valid: false, error: '最多只能选择5个效果' };
  }
  return { valid: true };
}

const AI_DECK: Card[] = [
  {
    id: 'ai_1',
    name: '烈焰斩',
    rarity: 'rare',
    effects: [PRESET_EFFECTS[1], PRESET_EFFECTS[6]],
    cost: 5,
    power: 18,
  },
  {
    id: 'ai_2',
    name: '铁壁防御',
    rarity: 'common',
    effects: [PRESET_EFFECTS[3], PRESET_EFFECTS[4]],
    cost: 4,
    power: 9,
  },
  {
    id: 'ai_3',
    name: '生命汲取',
    rarity: 'epic',
    effects: [PRESET_EFFECTS[2], PRESET_EFFECTS[10]],
    cost: 10,
    power: 35,
  },
  {
    id: 'ai_4',
    name: '智慧之书',
    rarity: 'rare',
    effects: [PRESET_EFFECTS[7], PRESET_EFFECTS[8]],
    cost: 6,
    power: 15,
  },
  {
    id: 'ai_5',
    name: '疾风突刺',
    rarity: 'common',
    effects: [PRESET_EFFECTS[0], PRESET_EFFECTS[6]],
    cost: 4,
    power: 9,
  },
];

export function simulateBattle(playerDeck: Card[]): BattleResult {
  const logs: BattleLog[] = [];
  let playerHP = 100;
  let aiHP = 100;
  let turn = 1;
  const maxTurns = 10;

  const validPlayerDeck = playerDeck.length >= 3 && playerDeck.length <= 5 ? playerDeck : playerDeck.slice(0, 3);
  let playerCardIndex = 0;
  let aiCardIndex = 0;

  logs.push({ turn: 0, message: '=== 战斗开始 ===' });
  logs.push({ turn: 0, message: `玩家牌组: ${validPlayerDeck.map(c => `『${c.name}』`).join(', ')}` });
  logs.push({ turn: 0, message: `AI牌组: ${AI_DECK.map(c => `『${c.name}』`).join(', ')}` });

  while (playerHP > 0 && aiHP > 0 && turn <= maxTurns) {
    const playerCard = validPlayerDeck[playerCardIndex % validPlayerDeck.length];
    const aiCard = AI_DECK[aiCardIndex % AI_DECK.length];

    const playerAttack = getEffectiveAttack(playerCard);
    const aiAttack = getEffectiveAttack(aiCard);
    const playerDefense = getEffectiveDefense(playerCard);
    const aiDefense = getEffectiveDefense(aiCard);
    const playerHeal = getEffectiveHeal(playerCard);
    const aiHeal = getEffectiveHeal(aiCard);

    const playerDamage = Math.max(0, playerAttack - aiDefense);
    const aiDamage = Math.max(0, aiAttack - playerDefense);

    aiHP -= playerDamage;
    logs.push({
      turn,
      message: `回合${turn}：玩家使用『${playerCard.name}』，对AI造成${playerDamage}点伤害`,
    });

    if (playerHeal > 0) {
      playerHP = Math.min(100, playerHP + playerHeal);
      logs.push({
        turn,
        message: `玩家『${playerCard.name}』回复${playerHeal}点生命，当前生命: ${playerHP}`,
      });
    }

    if (aiHP <= 0) {
      logs.push({ turn, message: `AI被击败！` });
      break;
    }

    playerHP -= aiDamage;
    logs.push({
      turn,
      message: `回合${turn}：AI使用『${aiCard.name}』，对玩家造成${aiDamage}点伤害`,
    });

    if (aiHeal > 0) {
      aiHP = Math.min(100, aiHP + aiHeal);
      logs.push({
        turn,
        message: `AI『${aiCard.name}』回复${aiHeal}点生命，当前生命: ${aiHP}`,
      });
    }

    if (playerHP <= 0) {
      logs.push({ turn, message: `玩家被击败！` });
      break;
    }

    logs.push({
      turn,
      message: `--- 回合${turn}结束：玩家HP ${Math.max(0, playerHP)} | AI HP ${Math.max(0, aiHP)} ---`,
    });

    playerCardIndex++;
    aiCardIndex++;
    turn++;
  }

  logs.push({ turn: 0, message: '=== 战斗结束 ===' });

  let winner: 'player' | 'ai' | 'draw';
  if (playerHP <= 0 && aiHP <= 0) {
    winner = 'draw';
    logs.push({ turn: 0, message: '结果：平局！' });
  } else if (playerHP <= 0) {
    winner = 'ai';
    logs.push({ turn: 0, message: '结果：AI获胜！' });
  } else if (aiHP <= 0) {
    winner = 'player';
    logs.push({ turn: 0, message: '结果：玩家获胜！' });
  } else {
    winner = playerHP > aiHP ? 'player' : playerHP < aiHP ? 'ai' : 'draw';
    logs.push({
      turn: 0,
      message: `结果：${winner === 'player' ? '玩家' : winner === 'ai' ? 'AI' : '平局'}获胜！（玩家HP: ${playerHP}, AI HP: ${aiHP}）`,
    });
  }

  return { logs, winner };
}

function getEffectiveAttack(card: Card): number {
  return card.effects
    .filter(e => e.type === 'attack')
    .reduce((sum, e) => sum + e.value, 0);
}

function getEffectiveDefense(card: Card): number {
  return card.effects
    .filter(e => e.type === 'defense')
    .reduce((sum, e) => sum + e.value, 0);
}

function getEffectiveHeal(card: Card): number {
  return card.effects
    .filter(e => e.type === 'heal')
    .reduce((sum, e) => sum + e.value, 0);
}

export function createCard(
  name: string,
  rarity: Rarity,
  effects: CardEffect[],
  isDraft: boolean = false
): Card {
  return {
    id: uuidv4(),
    name,
    rarity,
    effects,
    cost: calculateCardCost(effects),
    power: calculateCardPower(effects, rarity),
    isDraft,
  };
}
