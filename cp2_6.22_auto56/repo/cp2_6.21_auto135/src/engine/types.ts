export type ResourceType = 'wood' | 'ore' | 'food' | 'gold';

export type CivilizationType = 'elf' | 'dwarf' | 'human';

export type NegotiationStrategy = 'aggressive' | 'balanced' | 'conservative';

export interface Resources {
  wood: number;
  ore: number;
  food: number;
  gold: number;
}

export interface Civilization {
  id: CivilizationType;
  name: string;
  color: string;
  resources: Resources;
  strategy: NegotiationStrategy;
  targetBase: Resources;
}

export interface TradeProposal {
  from: CivilizationType;
  to: CivilizationType;
  giveResource: ResourceType;
  giveAmount: number;
  wantResource: ResourceType;
  wantAmount: number;
}

export interface TradeRecord {
  round: number;
  civilizationA: CivilizationType;
  civilizationB: CivilizationType;
  resourceA: ResourceType;
  amountA: number;
  resourceB: ResourceType;
  amountB: number;
  resourcesAfter: Record<CivilizationType, Resources>;
}

export interface ThreeWayTradeRecord {
  round: number;
  civ1: CivilizationType;
  civ2: CivilizationType;
  civ3: CivilizationType;
  resource1to2: ResourceType;
  amount1to2: number;
  resource2to3: ResourceType;
  amount2to3: number;
  resource3to1: ResourceType;
  amount3to1: number;
  resourcesAfter: Record<CivilizationType, Resources>;
}

export interface RoundResult {
  round: number;
  trades: TradeRecord[];
  resources: Record<CivilizationType, Resources>;
}

export interface EngineState {
  civilizations: Record<CivilizationType, Civilization>;
  tradeHistory: TradeRecord[];
  threeWayTradeHistory: ThreeWayTradeRecord[];
  resourceHistory: { round: number; resources: Record<CivilizationType, Resources> }[];
  currentRound: number;
  isRunning: boolean;
  totalRounds: number;
}

export const RESOURCE_PRICES: Record<ResourceType, number> = {
  gold: 1,
  wood: 0.5,
  ore: 1 / 3,
  food: 2 / 3,
};

export const CIVILIZATION_COLORS: Record<CivilizationType, string> = {
  elf: '#27ae60',
  dwarf: '#e67e22',
  human: '#2980b9',
};

export const CIVILIZATION_NAMES: Record<CivilizationType, string> = {
  elf: '精灵',
  dwarf: '矮人',
  human: '人类',
};

export const RESOURCE_NAMES: Record<ResourceType, string> = {
  wood: '木材',
  ore: '矿石',
  food: '粮食',
  gold: '金币',
};

export const STRATEGY_NAMES: Record<NegotiationStrategy, string> = {
  aggressive: '激进',
  balanced: '平衡',
  conservative: '保守',
};

export const INITIAL_RESOURCES: Record<CivilizationType, Resources> = {
  elf: { wood: 80, ore: 20, food: 50, gold: 30 },
  dwarf: { wood: 30, ore: 90, food: 40, gold: 50 },
  human: { wood: 50, ore: 40, food: 70, gold: 80 },
};

export const TARGET_BASE: Resources = {
  wood: 50,
  ore: 50,
  food: 50,
  gold: 50,
};
