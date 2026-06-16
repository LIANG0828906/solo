/**
 * 游戏阶段类型
 * - playing: 游戏进行中
 * - victory: 游戏胜利
 */
export type GamePhase = 'playing' | 'victory';

/**
 * 游戏状态接口
 * 包含游戏的核心状态数据
 */
export interface GameState {
  /** 当前波次 */
  wave: number;
  /** 总击杀数 */
  kills: number;
  /** 最大连击数 */
  maxCombo: number;
  /** 当前连击数 */
  currentCombo: number;
  /** 游戏阶段 */
  phase: GamePhase;
  /** 玩家最大生命值 */
  playerMaxHealth: number;
  /** 玩家当前生命值 */
  playerHealth: number;
}

/**
 * 游戏初始状态
 * 波次1, 击杀0, 连击0, 最大连击0, 血量100, 阶段playing
 */
export const initialGameState: GameState = {
  wave: 1,
  kills: 0,
  maxCombo: 0,
  currentCombo: 0,
  phase: 'playing',
  playerMaxHealth: 100,
  playerHealth: 100,
};

/**
 * 更新游戏状态
 * @param prev - 之前的游戏状态
 * @param updates - 要更新的状态字段（部分更新）
 * @returns 返回合并后的新游戏状态
 */
export function updateGameState(
  prev: GameState,
  updates: Partial<GameState>
): GameState {
  return {
    ...prev,
    ...updates,
  };
}

/**
 * 重置游戏状态到初始状态
 * @returns 返回初始游戏状态的副本
 */
export function resetGameState(): GameState {
  return {
    ...initialGameState,
  };
}
