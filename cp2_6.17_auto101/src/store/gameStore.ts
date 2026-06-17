import { create } from 'zustand';
import {
  GameState,
  Sprite,
  GamePhase,
  Owner,
  MAX_BATTLE_ROUNDS,
} from '../types';
import {
  createEmptyGrid,
  createInitialHand,
  placeCardOnBoard,
  moveAllSprites,
  clearFadedSprites,
  resetSpriteAnimations,
  placeEnemyCards,
  checkWinner,
  updateParticles,
} from '../gameLogic';

interface GameStore extends GameState {
  battleRound: number;
  maxBattleRounds: number;
  battleStartTime: number;
  lastUpdateTime: number;
  placeCard: (cardId: string, x: number, y: number) => boolean;
  startBattle: () => boolean;
  resetGame: () => void;
  tickParticles: () => void;
  stopBattleLoop: () => void;
}

let battleIntervalId: ReturnType<typeof setInterval> | null = null;

const createInitialState = (): Omit<
  GameStore,
  | 'placeCard'
  | 'startBattle'
  | 'resetGame'
  | 'tickParticles'
  | 'stopBattleLoop'
> => ({
  hand: createInitialHand(3),
  grid: createEmptyGrid(),
  sprites: [] as Sprite[],
  playerGold: 6,
  enemyGold: 6,
  phase: 'preparation' as GamePhase,
  gamePhase: 'preparation' as GamePhase,
  turnCount: 1,
  turnTimer: 0,
  winner: null as Owner | null,
  battleRound: 0,
  maxBattleRounds: MAX_BATTLE_ROUNDS,
  battleStartTime: 0,
  lastUpdateTime: 0,
});

const clearBattleInterval = () => {
  if (battleIntervalId !== null) {
    clearInterval(battleIntervalId);
    battleIntervalId = null;
  }
};

const syncPhaseFields = (state: Partial<GameStore>): Partial<GameStore> => {
  if (state.phase !== undefined && state.gamePhase === undefined) {
    return { ...state, gamePhase: state.phase };
  }
  if (state.gamePhase !== undefined && state.phase === undefined) {
    return { ...state, phase: state.gamePhase };
  }
  if (state.phase !== undefined && state.gamePhase !== undefined) {
    return state;
  }
  return state;
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  placeCard: (cardId: string, x: number, y: number): boolean => {
    const state = get();
    if (state.phase !== 'preparation' || state.gamePhase !== 'preparation') {
      return false;
    }

    const newState = placeCardOnBoard(state, cardId, x, y);
    if (newState) {
      set({
        ...newState,
        gamePhase: newState.phase,
      });
      return true;
    }
    return false;
  },

  startBattle: (): boolean => {
    const state = get();

    if (state.phase !== 'preparation' || state.gamePhase !== 'preparation') {
      console.warn('⚠️ 只能在准备阶段开始战斗');
      return false;
    }

    const playerSprites = state.sprites.filter(
      (s) => s.owner === 'player' && s.currentHealth > 0 && !s.isFading
    );
    if (playerSprites.length === 0) {
      console.warn('⚠️ 无法开始战斗：棋盘上没有己方精灵，请先放置至少一张卡牌');
      return false;
    }

    clearBattleInterval();

    let stateWithEnemies = placeEnemyCards(state);
    const now = performance.now();

    set(
      syncPhaseFields({
        ...stateWithEnemies,
        phase: 'battling' as GamePhase,
        gamePhase: 'battling' as GamePhase,
        battleRound: 0,
        battleStartTime: now,
        lastUpdateTime: now,
      })
    );

    let currentRound = 0;
    const FRAME_INTERVAL = 1000;

    battleIntervalId = setInterval(() => {
      const currentState = get();

      if (
        currentState.phase !== 'battling' ||
        currentState.gamePhase !== 'battling'
      ) {
        clearBattleInterval();
        return;
      }

      const nowTime = performance.now();
      const deltaTime = nowTime - currentState.lastUpdateTime;

      if (deltaTime < FRAME_INTERVAL * 0.8) {
        return;
      }

      const _timeScale = Math.min(deltaTime / FRAME_INTERVAL, 2);
      void _timeScale;

      currentRound++;

      const { sprites, grid } = moveAllSprites(
        resetSpriteAnimations(currentState.sprites),
        currentState.grid
      );

      const winner = checkWinner(sprites);

      set(
        syncPhaseFields({
          sprites,
          grid,
          battleRound: currentRound,
          lastUpdateTime: nowTime,
        })
      );

      if (winner || currentRound >= MAX_BATTLE_ROUNDS) {
        clearBattleInterval();

        setTimeout(() => {
          const fadeState = get();
          const {
            sprites: finalSprites,
            grid: finalGrid,
          } = clearFadedSprites(fadeState.sprites, fadeState.grid);
          const finalWinner = checkWinner(finalSprites) ?? winner;

          set(
            syncPhaseFields({
              sprites: resetSpriteAnimations(finalSprites),
              grid: finalGrid,
              winner: finalWinner,
              phase: 'finished' as GamePhase,
              gamePhase: 'finished' as GamePhase,
              battleRound: currentRound,
            })
          );
        }, 700);
        return;
      }
    }, FRAME_INTERVAL);

    return true;
  },

  resetGame: () => {
    clearBattleInterval();

    const emptyGrid = createEmptyGrid();
    const emptySprites: Sprite[] = [];
    const initialHand = createInitialHand(3);

    const newState: Omit<
      GameStore,
      | 'placeCard'
      | 'startBattle'
      | 'resetGame'
      | 'tickParticles'
      | 'stopBattleLoop'
    > = {
      hand: initialHand,
      grid: emptyGrid,
      sprites: emptySprites,
      playerGold: 6,
      enemyGold: 6,
      phase: 'preparation' as GamePhase,
      gamePhase: 'preparation' as GamePhase,
      turnCount: 1,
      turnTimer: 0,
      winner: null as Owner | null,
      battleRound: 0,
      maxBattleRounds: MAX_BATTLE_ROUNDS,
      battleStartTime: 0,
      lastUpdateTime: 0,
    };

    set(newState);
  },

  tickParticles: () => {
    const state = get();
    const hasParticles = state.sprites.some((s) => s.particles.length > 0);
    if (hasParticles) {
      set({ sprites: updateParticles(state.sprites) });
    }
  },

  stopBattleLoop: () => {
    clearBattleInterval();
  },
}));
