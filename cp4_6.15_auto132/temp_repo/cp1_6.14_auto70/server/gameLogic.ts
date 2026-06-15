export interface DiceResult {
  value: number;
  seed: number;
  animationFrames: number[];
}

export interface BoardCell {
  index: number;
  type: 'start' | 'property' | 'chance' | 'tax' | 'parking' | 'jail' | 'shop';
  name: string;
  description: string;
  cost: number;
  color: string;
}

export interface GameEvent {
  id: string;
  type: 'draw_card' | 'toll' | 'bonus' | 'fine' | 'teleport' | 'random_coins';
  title: string;
  description: string;
  amount: number;
  targetPosition?: number;
}

export interface RoleCard {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bonus: { coins: number; type: 'start' | 'per_turn' | 'chance' };
}

export interface MoveResult {
  newPosition: number;
  cellsPassed: number[];
  passedStart: boolean;
  landedCell: BoardCell;
}

export interface AssetUpdate {
  oldCoins: number;
  newCoins: number;
  delta: number;
  reason: string;
}

export const BOARD_SIZE = 36;
export const INITIAL_COINS = 1500;
export const PASS_START_REWARD = 200;

export const ROLE_CARDS: RoleCard[] = [
  {
    id: 'banker',
    name: '银行家',
    emoji: '🏦',
    description: '精明的金融大亨，起步资金更丰厚',
    bonus: { coins: 500, type: 'start' },
  },
  {
    id: 'adventurer',
    name: '冒险家',
    emoji: '🎯',
    description: '运气爆棚，每回合有概率获得额外金币',
    bonus: { coins: 50, type: 'per_turn' },
  },
  {
    id: 'merchant',
    name: '商人',
    emoji: '💼',
    description: '擅长交易，过路费减少20%',
    bonus: { coins: 0, type: 'chance' },
  },
  {
    id: 'architect',
    name: '建筑师',
    emoji: '🏗️',
    description: '房产专家，购买地产享受折扣',
    bonus: { coins: 200, type: 'start' },
  },
  {
    id: 'magician',
    name: '魔术师',
    emoji: '🎩',
    description: '神秘力量，抽卡时正面效果翻倍',
    bonus: { coins: 100, type: 'chance' },
  },
  {
    id: 'athlete',
    name: '运动员',
    emoji: '🏃',
    description: '体能充沛，起点奖励增加50%',
    bonus: { coins: 0, type: 'start' },
  },
];

export const BOARD_CELLS: BoardCell[] = Array.from({ length: BOARD_SIZE }, (_, i) => {
  const typeMap: Record<number, BoardCell['type']> = {
    0: 'start',
    8: 'chance',
    17: 'chance',
    26: 'chance',
    35: 'chance',
    4: 'tax',
    12: 'tax',
    20: 'tax',
    28: 'tax',
    9: 'parking',
    18: 'jail',
    32: 'shop',
  };
  const type = typeMap[i] || 'property';
  const names: Record<string, string> = {
    start: '起点',
    chance: '机会卡',
    tax: '过路费',
    parking: '休息站',
    jail: '监狱',
    shop: '商店',
    property: `地产 ${i + 1}`,
  };
  const descriptions: Record<string, string> = {
    start: '经过起点可获得奖励金币',
    chance: '抽取一张神秘的机会卡',
    tax: '缴纳过路费用',
    parking: '免费停车休息一回合',
    jail: '不幸入狱，支付保释金',
    shop: '进入商店，可购买道具',
    property: '可购买的优质地产',
  };
  const colors: Record<string, string> = {
    start: '#f7c948',
    chance: '#4a6cf7',
    tax: '#e74c3c',
    parking: '#2ecc71',
    jail: '#6c5ce7',
    shop: '#fd79a8',
    property: '#00b894',
  };
  const costs: Record<string, number> = {
    start: 0,
    chance: 0,
    tax: 100 + i * 5,
    parking: 0,
    jail: 300,
    shop: 0,
    property: 200 + (i % 6) * 50,
  };
  return {
    index: i,
    type,
    name: names[type],
    description: descriptions[type],
    cost: costs[type],
    color: colors[type],
  };
});

const CHANCE_EVENTS: GameEvent[] = [
  { id: 'c1', type: 'bonus', title: '股票涨停', description: '投资的股票涨了！获得金币', amount: 300 },
  { id: 'c2', type: 'bonus', title: '彩票中奖', description: '幸运数字，小赚一笔', amount: 150 },
  { id: 'c3', type: 'bonus', title: '奖金发放', description: '公司发年终奖啦', amount: 500 },
  { id: 'c4', type: 'bonus', title: '捡到钱包', description: '路边捡到钱包（上交？不存在的）', amount: 80 },
  { id: 'c5', type: 'fine', title: '违章停车', description: '乱停车被贴罚单', amount: 120 },
  { id: 'c6', type: 'fine', title: '医疗支出', description: '感冒去了趟医院', amount: 200 },
  { id: 'c7', type: 'fine', title: '修理家电', description: '家里冰箱坏了要修', amount: 80 },
  { id: 'c8', type: 'fine', title: '请客吃饭', description: '朋友聚餐被迫买单', amount: 150 },
  { id: 'c9', type: 'teleport', title: '传送门', description: '被传送到起点！', amount: 0, targetPosition: 0 },
  { id: 'c10', type: 'teleport', title: '时空穿梭', description: '传送到第18格', amount: 0, targetPosition: 18 },
  { id: 'c11', type: 'random_coins', title: '神秘宝箱', description: '金币在-200到+400之间随机', amount: 0 },
  { id: 'c12', type: 'bonus', title: '投资回报', description: '之前的投资获得了丰厚回报', amount: 250 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function rollDice(seed?: number): DiceResult {
  const actualSeed = seed ?? Date.now() + Math.floor(Math.random() * 1000000);
  const rand = seededRandom(actualSeed);
  const value = Math.floor(rand() * 6) + 1;
  const animationFrames: number[] = [];
  const frameCount = 15;
  for (let i = 0; i < frameCount; i++) {
    if (i === frameCount - 1) {
      animationFrames.push(value);
    } else {
      animationFrames.push(Math.floor(rand() * 6) + 1);
    }
  }
  return { value, seed: actualSeed, animationFrames };
}

export function rollDiceDeterministic(): DiceResult {
  const value = Math.floor(Math.random() * 6) + 1;
  const animationFrames: number[] = [];
  for (let i = 0; i < 15; i++) {
    animationFrames.push(i === 14 ? value : Math.floor(Math.random() * 6) + 1);
  }
  return { value, seed: Date.now(), animationFrames };
}

export function calculateNewPosition(currentPos: number, steps: number, boardSize: number = BOARD_SIZE): MoveResult {
  const cellsPassed: number[] = [];
  let passedStart = false;
  for (let i = 1; i <= steps; i++) {
    const nextPos = (currentPos + i) % boardSize;
    cellsPassed.push(nextPos);
    if (nextPos === 0 && currentPos + i >= boardSize) {
      passedStart = true;
    }
  }
  const newPosition = (currentPos + steps) % boardSize;
  return {
    newPosition,
    cellsPassed,
    passedStart,
    landedCell: BOARD_CELLS[newPosition],
  };
}

export function triggerRandomEvent(cellType: BoardCell['type'], seed?: number): GameEvent | null {
  if (cellType !== 'chance') return null;
  const actualSeed = seed ?? Date.now();
  const rand = seededRandom(actualSeed);
  const event = CHANCE_EVENTS[Math.floor(rand() * CHANCE_EVENTS.length)];
  if (event.type === 'random_coins') {
    const amount = Math.floor(rand() * 601) - 200;
    return { ...event, amount };
  }
  return { ...event };
}

export function calculateToll(cell: BoardCell, roleType: string = ''): number {
  if (cell.type !== 'tax') return 0;
  let toll = cell.cost;
  if (roleType === 'merchant') {
    toll = Math.floor(toll * 0.8);
  }
  return toll;
}

export function calculateJailBail(roleType: string = ''): number {
  const base = 300;
  if (roleType === 'banker') return Math.floor(base * 0.7);
  return base;
}

export function calculateStartBonus(roleType: string = ''): number {
  let bonus = PASS_START_REWARD;
  if (roleType === 'athlete') {
    bonus = Math.floor(bonus * 1.5);
  }
  return bonus;
}

export function updateAssets(currentCoins: number, delta: number, reason: string): AssetUpdate {
  const newCoins = Math.max(0, currentCoins + delta);
  return {
    oldCoins: currentCoins,
    newCoins,
    delta: newCoins - currentCoins,
    reason,
  };
}

export function calculateInitialCoins(role: RoleCard): number {
  return INITIAL_COINS + (role.bonus.type === 'start' ? role.bonus.coins : 0);
}

export function getRandomRole(excludeIds: string[] = []): RoleCard {
  const available = ROLE_CARDS.filter((r) => !excludeIds.includes(r.id));
  if (available.length === 0) {
    return ROLE_CARDS[Math.floor(Math.random() * ROLE_CARDS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export function getPlayerAvatar(index: number): string {
  const avatars = ['🎩', '🦊', '🐱', '🐶', '🦁', '🐸', '🐼', '🐵'];
  return avatars[index % avatars.length];
}

export function calculateWinner(players: { id: string; coins: number }[]) {
  return [...players].sort((a, b) => b.coins - a.coins);
}

export function getRankInfo(rank: number): { medal: string; color: string; name: string } {
  const ranks = [
    { medal: '🥇', color: '#f7c948', name: '冠军' },
    { medal: '🥈', color: '#bdc3c7', name: '亚军' },
    { medal: '🥉', color: '#e67e22', name: '季军' },
  ];
  if (rank <= 3 && rank >= 1) return ranks[rank - 1];
  return { medal: '🏅', color: '#95a5a6', name: `第${rank}名` };
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function applyEventToCoins(currentCoins: number, event: GameEvent, roleType: string = ''): AssetUpdate {
  let delta = 0;
  let reason = event.title;
  switch (event.type) {
    case 'bonus':
      delta = roleType === 'magician' ? event.amount * 2 : event.amount;
      reason = `${event.title} +${delta}`;
      break;
    case 'fine':
      delta = -event.amount;
      reason = `${event.title} -${event.amount}`;
      break;
    case 'toll':
      delta = -event.amount;
      reason = `${event.title} -${event.amount}`;
      break;
    case 'random_coins':
      delta = event.amount;
      reason = `${event.title} ${delta >= 0 ? '+' : ''}${delta}`;
      break;
    default:
      delta = 0;
      reason = event.title;
  }
  return updateAssets(currentCoins, delta, reason);
}

export function getPerTurnBonus(roleType: string): number {
  const role = ROLE_CARDS.find((r) => r.id === roleType);
  if (role && role.bonus.type === 'per_turn' && Math.random() < 0.4) {
    return role.bonus.coins;
  }
  return 0;
}
