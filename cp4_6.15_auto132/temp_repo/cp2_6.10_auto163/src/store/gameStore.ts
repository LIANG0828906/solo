import { create } from 'zustand';
import type { GameState, DiceValue, Bet, GameHistory } from '../types/game';
import { INITIAL_CHIPS } from '../types/game';
import { rollDice, calculateResult, calculatePayout, generateId, generateAIPlayers, generateAIBets } from '../utils/gameLogic';

const MAX_HISTORY = 5;

export const useGameStore = create<GameState>((set, get) => ({
  currentPlayer: {
    id: 'player-1',
    name: '客官',
    avatar: '🎎',
    chips: INITIAL_CHIPS,
    isBanker: false,
    isAI: false,
  },
  aiPlayers: generateAIPlayers(),
  banker: null,
  phase: 'betting',
  dice: [1, 1, 1],
  bets: [],
  history: [],
  selectedBetAmount: 10,

  setSelectedBetAmount: (amount: number) => {
    set({ selectedBetAmount: amount });
  },

  placeBet: (option, amount) => {
    const state = get();
    if (state.phase !== 'betting') return;
    if (state.currentPlayer.chips < amount) return;
    if (amount < 1 || amount > 100) return;

    const existingBet = state.bets.find(
      (b) => b.option === option && b.playerId === state.currentPlayer.id
    );

    let newBets: Bet[];
    if (existingBet) {
      newBets = state.bets.map((b) =>
        b.id === existingBet.id
          ? { ...b, amount: b.amount + amount }
          : b
      );
    } else {
      newBets = [
        ...state.bets,
        {
          id: generateId(),
          option,
          amount,
          playerId: state.currentPlayer.id,
        },
      ];
    }

    set({
      bets: newBets,
      currentPlayer: {
        ...state.currentPlayer,
        chips: state.currentPlayer.chips - amount,
      },
    });
  },

  rollDice: () => {
    const state = get();
    if (state.phase !== 'betting') return;

    const newDice = rollDice();
    set({ phase: 'rolling', dice: newDice });

    setTimeout(() => {
      set({ phase: 'revealing' });
      
      setTimeout(() => {
        set({ phase: 'settling' });
        
        const result = calculateResult(get().dice);
        const currentState = get();
        const playerBets = currentState.bets.filter(
          (b) => b.playerId === currentState.currentPlayer.id
        );
        
        let playerPayout = 0;
        playerBets.forEach((bet) => {
          playerPayout += calculatePayout(bet, result);
        });
        
        let aiPayout = 0;
        const aiBets = currentState.bets.filter(
          (b) => b.playerId !== currentState.currentPlayer.id
        );
        aiBets.forEach((bet) => {
          aiPayout += calculatePayout(bet, result);
        });

        const totalBetAmount = currentState.bets.reduce((sum, b) => sum + b.amount, 0);
        let playerProfit = playerPayout - playerBets.reduce((sum, b) => sum + b.amount, 0);
        let bankerProfit = totalBetAmount - playerPayout - aiPayout;

        const historyEntry: GameHistory = {
          id: generateId(),
          dice: get().dice as [DiceValue, DiceValue, DiceValue],
          result,
          bets: currentState.bets,
          timestamp: Date.now(),
          playerProfit,
        };

        const updatedAIPlayers = currentState.aiPlayers.map((ai) => {
          const aiBetsForPlayer = aiBets.filter((b) => b.playerId === ai.id);
          const aiBetAmount = aiBetsForPlayer.reduce((sum, b) => sum + b.amount, 0);
          const aiPayoutForPlayer = aiBetsForPlayer.reduce(
            (sum, b) => sum + calculatePayout(b, result),
            0
          );
          return {
            ...ai,
            chips: ai.chips - aiBetAmount + aiPayoutForPlayer,
          };
        });

        let newCurrentPlayer = {
          ...currentState.currentPlayer,
          chips: currentState.currentPlayer.chips + playerPayout,
        };

        let newBanker = currentState.banker;
        if (currentState.banker) {
          if (currentState.banker.id === currentState.currentPlayer.id) {
            newCurrentPlayer = {
              ...newCurrentPlayer,
              chips: newCurrentPlayer.chips + bankerProfit,
            };
            newBanker = newCurrentPlayer;
          } else {
            const updatedBanker = updatedAIPlayers.find(
              (ai) => ai.id === currentState.banker!.id
            );
            if (updatedBanker) {
              newBanker = {
                ...updatedBanker,
                chips: updatedBanker.chips + bankerProfit,
                isBanker: true,
              };
            }
          }
        }

        const newHistory = [historyEntry, ...currentState.history].slice(0, MAX_HISTORY);

        set({
          currentPlayer: newCurrentPlayer,
          aiPlayers: updatedAIPlayers,
          banker: newBanker,
          history: newHistory,
        });
      }, 2000);
    }, 3000);
  },

  becomeBanker: () => {
    const state = get();
    if (state.banker || state.phase !== 'betting') return;
    if (state.currentPlayer.chips < 500) return;

    const aiBets = generateAIBets(state.aiPlayers);
    
    const updatedAIPlayers = state.aiPlayers.map((ai) => {
      const aiBetAmount = aiBets
        .filter((b) => b.playerId === ai.id)
        .reduce((sum, b) => sum + b.amount, 0);
      return {
        ...ai,
        chips: ai.chips - aiBetAmount,
      };
    });

    set({
      banker: {
        ...state.currentPlayer,
        isBanker: true,
      },
      currentPlayer: {
        ...state.currentPlayer,
        isBanker: true,
      },
      bets: [...state.bets, ...aiBets],
      aiPlayers: updatedAIPlayers,
    });
  },

  leaveBanker: () => {
    const state = get();
    if (!state.banker || state.phase !== 'betting') return;

    set({
      banker: null,
      currentPlayer: {
        ...state.currentPlayer,
        isBanker: false,
      },
    });
  },

  startNewRound: () => {
    const state = get();
    if (state.phase !== 'settling') return;

    if (state.banker && state.banker.id === state.currentPlayer.id) {
      const aiBets = generateAIBets(state.aiPlayers);
      const updatedAIPlayers = state.aiPlayers.map((ai) => {
        const aiBetAmount = aiBets
          .filter((b) => b.playerId === ai.id)
          .reduce((sum, b) => sum + b.amount, 0);
        return {
          ...ai,
          chips: ai.chips - aiBetAmount,
        };
      });

      set({
        phase: 'betting',
        bets: aiBets,
        aiPlayers: updatedAIPlayers,
        dice: [1, 1, 1],
      });
    } else {
      set({
        phase: 'betting',
        bets: [],
        dice: [1, 1, 1],
      });
    }
  },
}));
