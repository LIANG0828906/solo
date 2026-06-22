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
  battleEvents: Set<string>;
  recentlyDamaged: Set<string>;

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
  clearBattleEvents: () => void;

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
  battleEvents: new Set(),
  recentlyDamaged: new Set(),

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
    set({
      gameState: initialState,
      battleEvents: new Set(),
      recentlyDamaged: new Set(),
    });
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
      const newEvents = new Set<string>();
      const lastLog = result.state.logs[result.state.logs.length - 1];
      if (lastLog) newEvents.add(`summon_${Date.now()}`);
      set({
        gameState: result.state,
        selectedCardIndex: null,
        isDragging: false,
        dragCard: null,
        battleEvents: newEvents,
      });
      setTimeout(() => get().clearBattleEvents(), 600);
    }
    return result.success;
  },

  attackCard: (attackerId, targetId) => {
    const { gameState } = get();
    const prevState = gameState;
    const result = attack(gameState, attackerId, targetId, 'player');
    if (result.success) {
      const newEvents = new Set<string>();
      const newDamaged = new Set<string>();

      newEvents.add(`attack_${attackerId}`);
      if (targetId) newDamaged.add(targetId);

      const prevPlayerCards = prevState.player.board.map(c => ({ id: c.instanceId, def: c.currentDefense }));
      const prevAICards = prevState.ai.board.map(c => ({ id: c.instanceId, def: c.currentDefense }));

      [...prevPlayerCards, ...prevAICards].forEach(pc => {
        const newPlayerCards = result.state.player.board.find(c => c.instanceId === pc.id);
        const newAICards = result.state.ai.board.find(c => c.instanceId === pc.id);
        const newCard = newPlayerCards || newAICards;
        if (newCard && newCard.currentDefense < pc.def) {
          newDamaged.add(pc.id);
        }
        if (!newCard) {
          newDamaged.add(pc.id);
        }
      });

      set({
        gameState: result.state,
        selectedBoardCardId: null,
        battleEvents: newEvents,
        recentlyDamaged: newDamaged,
      });
      setTimeout(() => get().clearBattleEvents(), 700);
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

  clearBattleEvents: () => set({
    battleEvents: new Set(),
    recentlyDamaged: new Set(),
  }),

  executeAIActions: async () => {
    const { gameState } = get();
    
    if (gameState.phase !== GamePhase.PLAYING) return;
    if (gameState.turn !== TurnPlayer.AI) return;

    const { states, actions } = executeAITurn(gameState);
    
    for (let i = 0; i < states.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const action = actions[i];
      const prevState = i === 0 ? gameState : states[i - 1];
      const newState = states[i];
      const newEvents = new Set<string>();
      const newDamaged = new Set<string>();

      if (action?.type === 'attack' && action.attackerId) {
        newEvents.add(`attack_${action.attackerId}`);
        if (action.targetId) newDamaged.add(action.targetId);

        const prevPlayerCards = prevState.player.board.map(c => ({ id: c.instanceId, def: c.currentDefense }));
        const prevAICards = prevState.ai.board.map(c => ({ id: c.instanceId, def: c.currentDefense }));

        [...prevPlayerCards, ...prevAICards].forEach(pc => {
          const np = newState.player.board.find(c => c.instanceId === pc.id);
          const na = newState.ai.board.find(c => c.instanceId === pc.id);
          const nc = np || na;
          if (nc && nc.currentDefense < pc.def) {
            newDamaged.add(pc.id);
          }
          if (!nc) {
            newDamaged.add(pc.id);
          }
        });
      }

      if (action?.type === 'play_card') {
        newEvents.add(`summon_${Date.now() + i}`);
      }

      set({
        gameState: newState,
        battleEvents: newEvents,
        recentlyDamaged: newDamaged,
      });

      if (action?.type === 'attack' || action?.type === 'play_card') {
        setTimeout(() => get().clearBattleEvents(), 700);
      }
    }
  },
}));
