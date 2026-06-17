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
  placeCard: (cardId: string, x: number, y: number) => void;
  startBattle: () => void;
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
  turnCount: 1,
  turnTimer: 0,
  winner: null as Owner | null,
  battleRound: 0,
  maxBattleRounds: MAX_BATTLE_ROUNDS,
});

const clearBattleInterval = () => {
  if (battleIntervalId !== null) {
    clearInterval(battleIntervalId);
    battleIntervalId = null;
  }
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  placeCard: (cardId: string, x: number, y: number) => {
    const state = get();
    if (state.phase !== 'preparation') return;

    const newState = placeCardOnBoard(state, cardId, x, y);
    if (newState) {
      set(newState);
    }
  },

  startBattle: () => {
    const state = get();
    if (state.phase !== 'preparation') return;

    clearBattleInterval();

    let stateWithEnemies = placeEnemyCards(state);
    set({
      ...stateWithEnemies,
      phase: 'battling' as GamePhase,
      battleRound: 0,
    });

    let currentRound = 0;

    battleIntervalId = setInterval(() => {
      currentRound++;
      const currentState = get();

      if (currentState.phase !== 'battling') {
        clearBattleInterval();
        return;
      }

      const { sprites, grid } = moveAllSprites(
        resetSpriteAnimations(currentState.sprites),
        currentState.grid
      );

      const winner = checkWinner(sprites);

      if (winner || currentRound >= MAX_BATTLE_ROUNDS) {
        clearBattleInterval();

        setTimeout(() => {
          const fadeState = get();
          const { sprites: finalSprites, grid: finalGrid } = clearFadedSprites(
            fadeState.sprites,
            fadeState.grid
          );
          const finalWinner = checkWinner(finalSprites) ?? winner;

          set({
            sprites: resetSpriteAnimations(finalSprites),
            grid: finalGrid,
            winner: finalWinner,
            phase: 'finished' as GamePhase,
            battleRound: currentRound,
          });
        }, 700);

        set({
          sprites,
          grid,
          battleRound: currentRound,
        });
        return;
      }

      set({
        sprites,
        grid,
        battleRound: currentRound,
      });
    }, 1000);
  },

  resetGame: () => {
    clearBattleInterval();
    set({ ...createInitialState() });
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
