import { Card, Unit, GameState } from './types';

export const presetCards: Card[] = [
  {
    id: 'minion_fire_warlock',
    name: '火焰术士',
    type: 'minion',
    cost: 3,
    attack: 3,
    health: 2,
    maxHealth: 2,
    element: 'fire',
    description: '战吼：对一个随从造成1点伤害'
  },
  {
    id: 'minion_water_guardian',
    name: '水元素守卫',
    type: 'minion',
    cost: 4,
    attack: 2,
    health: 5,
    maxHealth: 5,
    element: 'water',
    description: '嘲讽。冻结任何受到其伤害的随从'
  },
  {
    id: 'minion_earth_golem',
    name: '大地魔像',
    type: 'minion',
    cost: 5,
    attack: 4,
    health: 6,
    maxHealth: 6,
    element: 'earth',
    description: '嘲讽'
  },
  {
    id: 'minion_wind_assassin',
    name: '疾风刺客',
    type: 'minion',
    cost: 2,
    attack: 3,
    health: 1,
    maxHealth: 1,
    element: 'wind',
    description: '突袭'
  },
  {
    id: 'minion_neutral_knight',
    name: '白银骑士',
    type: 'minion',
    cost: 4,
    attack: 3,
    health: 4,
    maxHealth: 4,
    element: 'neutral',
    description: '圣盾'
  },
  {
    id: 'minion_fire_mage',
    name: '火焰法师',
    type: 'minion',
    cost: 2,
    attack: 2,
    health: 3,
    maxHealth: 3,
    element: 'fire',
    description: '法术伤害+1'
  },
  {
    id: 'minion_water_healer',
    name: '泉水治疗者',
    type: 'minion',
    cost: 3,
    attack: 1,
    health: 4,
    maxHealth: 4,
    element: 'water',
    description: '战吼：恢复英雄3点生命值'
  },
  {
    id: 'minion_earth_shaman',
    name: '土元素萨满',
    type: 'minion',
    cost: 3,
    attack: 2,
    health: 3,
    maxHealth: 3,
    element: 'earth',
    description: '嘲讽。风怒'
  },
  {
    id: 'minion_wind_drake',
    name: '风龙',
    type: 'minion',
    cost: 6,
    attack: 5,
    health: 5,
    maxHealth: 5,
    element: 'wind',
    description: '风怒'
  },
  {
    id: 'minion_neutral_warlord',
    name: '战歌指挥官',
    type: 'minion',
    cost: 3,
    attack: 2,
    health: 3,
    maxHealth: 3,
    element: 'neutral',
    description: '你的其他随从获得+1攻击力'
  },
  {
    id: 'spell_fireball',
    name: '火球术',
    type: 'spell',
    cost: 4,
    element: 'fire',
    description: '造成6点伤害',
    spellEffect: 'damage_6'
  },
  {
    id: 'spell_frostbolt',
    name: '寒冰箭',
    type: 'spell',
    cost: 2,
    element: 'water',
    description: '造成3点伤害并冻结目标',
    spellEffect: 'damage_3_freeze'
  },
  {
    id: 'spell_lightning',
    name: '闪电箭',
    type: 'spell',
    cost: 1,
    element: 'wind',
    description: '造成2点伤害',
    spellEffect: 'damage_2'
  },
  {
    id: 'spell_stoneskin',
    name: '石肤术',
    type: 'spell',
    cost: 2,
    element: 'earth',
    description: '使一个随从获得+0/+3',
    spellEffect: 'buff_health_3'
  },
  {
    id: 'spell_blessing',
    name: '力量祝福',
    type: 'spell',
    cost: 1,
    element: 'neutral',
    description: '使一个随从获得+3攻击力',
    spellEffect: 'buff_attack_3'
  }
];

export const heroPowers: Card[] = [
  {
    id: 'hp_fire',
    name: '火焰冲击',
    type: 'hero_power',
    cost: 2,
    element: 'fire',
    description: '造成1点伤害',
    spellEffect: 'damage_1'
  },
  {
    id: 'hp_armor',
    name: '叠甲',
    type: 'hero_power',
    cost: 2,
    element: 'earth',
    description: '获得2点护甲',
    spellEffect: 'armor_2'
  },
  {
    id: 'hp_heal',
    name: '治疗之泉',
    type: 'hero_power',
    cost: 2,
    element: 'water',
    description: '恢复2点生命值',
    spellEffect: 'heal_2'
  }
];

function createUnit(cardId: string, x: number, y: number, owner: 'player' | 'enemy'): Unit {
  const card = presetCards.find(c => c.id === cardId);
  if (!card || card.type !== 'minion') {
    throw new Error('Invalid minion card');
  }
  return {
    id: `${owner}_${cardId}_${x}_${y}_${Date.now()}`,
    cardId: card.id,
    name: card.name,
    attack: card.attack!,
    health: card.health!,
    maxHealth: card.maxHealth!,
    element: card.element || 'neutral',
    position: { x, y },
    owner,
    canAttack: false,
    hasTaunt: card.description.includes('嘲讽')
  };
}

export function createInitialGameState(): GameState {
  const board: (Unit | null)[][] = [];
  for (let y = 0; y < 8; y++) {
    board[y] = new Array(8).fill(null);
  }

  board[0][2] = createUnit('minion_water_guardian', 2, 0, 'enemy');
  board[0][5] = createUnit('minion_wind_assassin', 5, 0, 'enemy');
  board[1][3] = createUnit('minion_neutral_knight', 3, 1, 'enemy');

  board[7][2] = createUnit('minion_fire_mage', 2, 7, 'player');
  board[7][4] = createUnit('minion_earth_golem', 4, 7, 'player');
  board[6][5] = createUnit('minion_water_healer', 5, 6, 'player');

  const playerHand: Card[] = [
    { ...presetCards[0], id: 'hand_1_' + presetCards[0].id },
    { ...presetCards[3], id: 'hand_2_' + presetCards[3].id },
    { ...presetCards[10], id: 'hand_3_' + presetCards[10].id },
    { ...presetCards[13], id: 'hand_4_' + presetCards[13].id },
  ];

  const enemyHand: Card[] = [
    { ...presetCards[1], id: 'ehand_1_' + presetCards[1].id },
    { ...presetCards[2], id: 'ehand_2_' + presetCards[2].id },
    { ...presetCards[11], id: 'ehand_3_' + presetCards[11].id },
  ];

  return {
    turn: 1,
    currentPlayer: 'player',
    player: {
      health: 30,
      maxHealth: 30,
      mana: 3,
      maxMana: 3,
      deck: [],
      hand: playerHand,
      heroPower: heroPowers[0],
      heroPowerUsed: false
    },
    enemy: {
      health: 28,
      maxHealth: 30,
      mana: 3,
      maxMana: 3,
      deck: [],
      hand: enemyHand,
      heroPower: heroPowers[2],
      heroPowerUsed: false
    },
    board,
    selectedCard: null,
    selectedUnit: null,
    gameOver: false,
    winner: null
  };
}
