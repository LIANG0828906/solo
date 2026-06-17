import { create } from 'zustand';
import {
  GameState,
  Sprite,
  GamePhase,
  Owner,
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
  ensureHandSize,
  updateParticles,
} from '../gameLogic';

interface GameStore extends GameState {
  placeCard: (cardId: string, x: number, y: number) => void;
  triggerBattle: () => void;
  endTurn: () => void;
  startPlacingPhase: () => void;
  startEnemyTurn: () => void;
  startBattlePhase: () => void;
  finalizeBattle: () => void;
  resetGame: () => void;
  updateTurnTimer: (seconds: number) => void;
  tickParticles: () => void;
}

const createInitialState = (): Omit<
  GameStore,
  | 'placeCard'
  | 'triggerBattle'
  | 'endTurn'
  | 'startPlacingPhase'
  | 'startEnemyTurn'
  | 'startBattlePhase'
  | 'finalizeBattle'
  | 'resetGame'
  | 'updateTurnTimer'
  | 'tickParticles'
> => ({
  hand: createInitialHand(3),
  grid: createEmptyGrid(),
  sprites: [] as Sprite[],
  playerGold: 6,
  enemyGold: 6,
  phase: 'placing' as GamePhase,
  turnCount: 1,
  turnTimer: 30,
  winner: null as Owner | null,
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  placeCard: (cardId: string, x: number, y: number) => {
    const state = get();
    if (state.phase !== 'placing') return;

    const newState = placeCardOnBoard(state, cardId, x, y);
    if (newState) {
      set(newState);
    }
  },

  triggerBattle: () => {
    const state = get();
    if (state.phase !== 'placing') return;

    set({ phase: 'battling', turnTimer: 5 });

    setTimeout(() => {
      get().startBattlePhase();
    }, 100);
  },

  endTurn: () => {
    const state = get();
    if (state.phase !== 'placing') return;
    set({ phase: 'battling', turnTimer: 5 });
    setTimeout(() => get().startBattlePhase(), 100);
  },

  startPlacingPhase: () => {
    const state = get();
    const winner = checkWinner(state.sprites);
    if (winner) {
      set({ winner, phase: 'gameOver' });
      return;
    }

    set({
      phase: 'placing',
      turnTimer: 30,
      turnCount: state.turnCount + 1,
      playerGold: state.playerGold + 2,
      enemyGold: state.enemyGold + 2,
      hand: ensureHandSize(state.hand, 3),
    });
  },

  startEnemyTurn: () => {
    const state = get();
    const winner = checkWinner(state.sprites);
    if (winner) {
      set({ winner, phase: 'gameOver' });
      return;
    }

    let newState = placeEnemyCards(state);
    set({ ...newState, phase: 'enemyTurn' });

    setTimeout(() => {
      get().startBattlePhase();
    }, 800);
  },

  startBattlePhase: () => {
    const state = get();
    if (state.phase === 'gameOver') return;

    set({ phase: 'battling' });

    let battleRounds = 0;
    const maxRounds = 5;

    const executeRound = () => {
      battleRounds++;
      const currentState = get();

      if (currentState.phase === 'gameOver') return;

      const { sprites, grid } = moveAllSprites(
        resetSpriteAnimations(currentState.sprites),
        currentState.grid
      );

      set({ sprites, grid });

      const winner = checkWinner(sprites);
      if (winner || battleRounds >= maxRounds) {
        setTimeout(() => {
          get().finalizeBattle();
        }, 600);
        return;
      }

      setTimeout(executeRound, 700);
    };

    setTimeout(executeRound, 300);
  },

  finalizeBattle: () => {
    const state = get();
    const { sprites, grid } = clearFadedSprites(state.sprites, state.grid);
    const winner = checkWinner(sprites);

    if (winner) {
      set({ sprites, grid, winner, phase: 'gameOver' });
      return;
    }

    set({
      sprites: resetSpriteAnimations(sprites),
      grid,
    });

    setTimeout(() => {
      get().startEnemyTurn();
    }, 500);
  },

  resetGame: () => {
    set(createInitialState());
  },

  updateTurnTimer: (seconds: number) => {
    set({ turnTimer: seconds });
  },

  tickParticles: () => {
    const state = get();
    const hasParticles = state.sprites.some((s) => s.particles.length > 0);
    if (hasParticles) {
      set({ sprites: updateParticles(state.sprites) });
    }
  },
}));
