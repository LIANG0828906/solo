import type { CrystalType, GameState } from '../../store/gameStore';

export interface CrystalCard {
  type: CrystalType;
  name: string;
  frequency: number;
  cost: number;
  color: string;
  icon: string;
  bonusText: string;
}

export const CRYSTAL_CARDS: CrystalCard[] = [
  {
    type: 'high',
    name: '高频水晶',
    frequency: 880,
    cost: 80,
    color: '#FF6B35',
    icon: '⚡',
    bonusText: '对高速怪物伤害 +50%',
  },
  {
    type: 'low',
    name: '低频水晶',
    frequency: 220,
    cost: 40,
    color: '#3A0CA3',
    icon: '〰',
    bonusText: '对厚重怪物伤害 +50%',
  },
];

export const UPGRADE_COSTS = {
  high: 60,
  low: 30,
};

export function canAfford(state: GameState, type: CrystalType): boolean {
  const card = CRYSTAL_CARDS.find((c) => c.type === type);
  return card !== undefined && state.resources >= card.cost;
}

export function canUpgrade(state: GameState, crystalType: CrystalType): boolean {
  return state.resources >= UPGRADE_COSTS[crystalType];
}

export function formatResources(amount: number): string {
  return `资源: ${amount}`;
}

export function formatWaveInfo(state: GameState): string {
  const wi = state.waveInfo;
  if (state.gamePhase === 'idle') return '准备开始';
  if (state.gamePhase === 'won') return '胜利！';
  if (state.gamePhase === 'lost') return '失败';
  if (state.gamePhase === 'waveBreak') {
    return `下一波: ${Math.ceil(wi.nextWaveTimer)}s`;
  }
  return `波次 ${wi.current}/${wi.total} · 剩余 ${wi.monstersAlive}`;
}

export function getUpgradeOptions() {
  return [
    { type: 'frequency' as const, label: '频率偏移 ±50Hz', cost: 60 },
    { type: 'radius' as const, label: '效果半径 +20%', cost: 30 },
  ];
}
