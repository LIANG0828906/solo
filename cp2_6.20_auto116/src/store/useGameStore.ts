import { create } from 'zustand';
import { GameState, Card, Position, GamePhase, TurnPlayer, LogType } from '../modules/card/CardTypes';
import { cardPool } from '../modules/card/CardData';
import {
  createInitialGameState,
  playCard,
  attack,
  endTurn,
  startGame,
} from '../modules/battle/BattleEngine';
import { executeAITurn } from '../modules/ai/AIDecision';

interface GameStore {
  gameState: GameState;
  playerDeck: Card[];
  aiDeck: Card[];
  selectedCardIndex: number | null;
  selectedBoardCardId: string | null;
  isDragging: boolean;
  dragCard: Card | null;
  hoveredPosition: Position | null;
  skillEffectPlaying: string | null;

  setPlayerDeck: (deck: Card[]) => void;
  addCardToDeck: (card: Card) => void;
  removeCardFromDeck: (cardId: string) => void;
  clearDeck: () => void;

  initGame: () => void;
  startGame: () => void;

  playCard: (cardIndex: number, position: Position) => boolean;
  attackCard: (attackerId: string, targetId: string | null) => boolean;
  endTurn: () => void;

  setSelectedCardIndex: (index: number | null) => void;
  setSelectedBoardCardId: (id: string | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragCard: (card: Card | null) => void;
  setHoveredPosition: (pos: Position | null) => void;
  setSkillEffectPlaying: (effect: string | null) => void;

  executeAIActions: () => Promise<void>;
}

const initialPlayerDeck = cardPool.slice(0, 20);
const initialAIDeck = cardPool.slice(10, 30);

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialGameState(initialPlayerDeck, initialAIDeck),
  playerDeck: initialPlayerDeck,
  aiDeck: initialAIDeck,
  selectedCardIndex: null,
  selectedBoardCardId: null,
  isDragging: false,
  dragCard: null,
  hoveredPosition: null,
  skillEffectPlaying: null,

  setPlayerDeck: (deck) => set({ playerDeck: deck }),

  addCardToDeck: (card) => {
    const { playerDeck } = get();
    if (playerDeck.length < 40) {
      set({ playerDeck: [...playerDeck, card] });
    }
  },

  removeCardFromDeck: (cardId) => {
    const { playerDeck } = get();
    const index = playerDeck.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      const newDeck = [...playerDeck];
      newDeck.splice(index, 1);
      set({ playerDeck: newDeck });
    }
  },

  clearDeck: () => set({ playerDeck: [] }),

  initGame: () => {
    const { playerDeck, aiDeck } = get();
    const initialState = createInitialGameState(playerDeck, aiDeck);
    set({ gameState: initialState });
  },

  startGame: () => {
    const { gameState } = get();
    const newState = startGame(gameState);
    set({ gameState: newState });
  },

  playCard: (cardIndex, position) => {
    const { gameState } = get();
    const result = playCard(gameState, cardIndex, position, 'player');
    if (result.success) {
      set({
        gameState: result.state,
        selectedCardIndex: null,
        isDragging: false,
        dragCard: null,
      });
    }
    return result.success;
  },

  attackCard: (attackerId, targetId) => {
    const { gameState } = get();
    const result = attack(gameState, attackerId, targetId, 'player');
    if (result.success) {
      set({
        gameState: result.state,
        selectedBoardCardId: null,
      });
    }
    return result.success;
  },

  endTurn: () => {
    const { gameState } = get();
    const newState = endTurn(gameState);
    set({ gameState: newState, selectedCardIndex: null, selectedBoardCardId: null });
  },

  setSelectedCardIndex: (index) => set({ selectedCardIndex: index }),
  setSelectedBoardCardId: (id) => set({ selectedBoardCardId: id }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDragCard: (card) => set({ dragCard: card }),
  setHoveredPosition: (pos) => set({ hoveredPosition: pos }),
  setSkillEffectPlaying: (effect) => set({ skillEffectPlaying: effect }),

  executeAIActions: async () => {
    const { gameState } = get();
    
    if (gameState.phase !== GamePhase.PLAYING) return;
    if (gameState.turn !== TurnPlayer.AI) return;

    const { states } = executeAITurn(gameState);
    
    for (let i = 0; i < states.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      set({ gameState: states[i] });
    }
  },
}));
