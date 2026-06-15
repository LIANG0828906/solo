import { create } from 'zustand';
import type { GameState, GameActions, Flower, HandFlower } from '../types/game';
import { generateGardenFlowers, getRandomFlower } from '../data/flowers';
import { determineWinner, getRandomHandFlower } from '../utils/gameLogic';

const MAX_HAND_SIZE = 5;
const MAX_ROUNDS = 5;

const initialState: GameState = {
  phase: 'collecting',
  round: 1,
  playerScore: 0,
  aiScore: 0,
  gardenFlowers: [],
  playerHand: [],
  battleRecords: [],
  currentBattle: null,
  collectingFlowerId: null,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  initGame: () => {
    set({
      ...initialState,
      gardenFlowers: generateGardenFlowers(),
    });
  },

  collectFlower: (flowerId: string) => {
    const state = get();
    if (state.phase !== 'collecting') return;
    if (state.playerHand.length >= MAX_HAND_SIZE) return;
    if (state.collectingFlowerId !== null) return;

    const flower = state.gardenFlowers.find(f => f.id === flowerId);
    if (!flower) return;

    set({ collectingFlowerId: flowerId });

    setTimeout(() => {
      const handFlower: HandFlower = {
        ...flower,
        instanceId: `hand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        collectedAt: Date.now(),
      };

      set(state => ({
        gardenFlowers: state.gardenFlowers.filter(f => f.id !== flowerId),
        playerHand: [...state.playerHand, handFlower],
        collectingFlowerId: null,
      }));
    }, 400);
  },

  startBattle: () => {
    const state = get();
    if (state.phase !== 'collecting') return;
    if (state.playerHand.length === 0) return;

    const playerFlower = getRandomHandFlower(state.playerHand);
    if (!playerFlower) return;

    const aiFlower = getRandomFlower();

    set({
      phase: 'battling',
      currentBattle: {
        playerFlower,
        aiFlower,
        result: null,
      },
    });

    setTimeout(() => {
      get().resolveBattle();
    }, 1000);
  },

  resolveBattle: () => {
    const state = get();
    if (!state.currentBattle || !state.currentBattle.playerFlower || !state.currentBattle.aiFlower) return;

    const { playerFlower, aiFlower } = state.currentBattle;
    const result = determineWinner(playerFlower, aiFlower);

    const newRecord = {
      round: state.round,
      playerFlower,
      aiFlower,
      winner: result,
    };

    set(state => ({
      currentBattle: {
        ...state.currentBattle!,
        result,
      },
      playerScore: state.playerScore + (result === 'player' ? 1 : 0),
      aiScore: state.aiScore + (result === 'ai' ? 1 : 0),
      battleRecords: [...state.battleRecords, newRecord],
      playerHand: state.playerHand.filter(f => f.instanceId !== (playerFlower as HandFlower).instanceId),
    }));

    setTimeout(() => {
      const currentState = get();
      if (currentState.round >= MAX_ROUNDS) {
        get().showResult();
      } else {
        get().nextRound();
      }
    }, 2000);
  },

  nextRound: () => {
    set(state => ({
      round: state.round + 1,
      phase: 'collecting',
      currentBattle: null,
    }));
  },

  showResult: () => {
    set({
      phase: 'result',
    });
  },

  restartGame: () => {
    set({
      ...initialState,
      gardenFlowers: generateGardenFlowers(),
    });
  },

  setCollectingFlowerId: (id: string | null) => {
    set({ collectingFlowerId: id });
  },
}));
