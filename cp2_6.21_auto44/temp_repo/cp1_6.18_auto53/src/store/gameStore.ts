import { create } from 'zustand';
import type { GameState, Card, Player, BattlefieldCard } from '../types';
import { createDeck, MAX_HAND_SIZE, MAX_ENERGY, TURN_DURATION, MAX_HEALTH } from '../utils/cards';
import { aiSelectCard } from '../ai/opponent';

const BATTLEFIELD_DURATION = 2000;

function createPlayer(id: string, name: string, avatar: string): Player {
  const deck = createDeck();
  const hand = deck.splice(0, 4);
  return {
    id,
    name,
    avatar,
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    armor: 0,
    energy: MAX_ENERGY,
    maxEnergy: MAX_ENERGY,
    hand,
    deck,
    graveyard: [],
  };
}

const initialState: GameState = {
  phase: 'playerTurn',
  turn: 1,
  timeRemaining: TURN_DURATION,
  player: createPlayer('player', '玩家', '🧙'),
  opponent: createPlayer('opponent', 'AI对手', '🤖'),
  battlefield: [],
  winner: null,
  transitionCountdown: 0,
  transitionMessage: '',
  shakingCardId: null,
};

function drawCards(player: Player, count: number): Player {
  const newHand = [...player.hand];
  const newDeck = [...player.deck];
  const newGraveyard = [...player.graveyard];

  for (let i = 0; i < count; i++) {
    if (newHand.length >= MAX_HAND_SIZE) break;
    if (newDeck.length === 0) {
      if (newGraveyard.length === 0) break;
      newDeck.push(...newGraveyard.splice(0));
      for (let j = newDeck.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [newDeck[j], newDeck[k]] = [newDeck[k], newDeck[j]];
      }
    }
    const card = newDeck.shift();
    if (card) newHand.push(card);
  }

  return { ...player, hand: newHand, deck: newDeck, graveyard: newGraveyard };
}

function discardRandom(player: Player, count: number): Player {
  const newHand = [...player.hand];
  const newGraveyard = [...player.graveyard];

  for (let i = 0; i < count; i++) {
    if (newHand.length === 0) break;
    const idx = Math.floor(Math.random() * newHand.length);
    const discarded = newHand.splice(idx, 1)[0];
    newGraveyard.push(discarded);
  }

  return { ...player, hand: newHand, graveyard: newGraveyard };
}

function applyCardEffect(
  card: Card,
  caster: Player,
  target: Player,
): { caster: Player; target: Player } {
  let newCaster = { ...caster };
  let newTarget = { ...target };

  if (card.type === 'attack') {
    const damage = card.value;
    if (newTarget.armor >= damage) {
      newTarget.armor -= damage;
    } else {
      const remaining = damage - newTarget.armor;
      newTarget.armor = 0;
      newTarget.health = Math.max(0, newTarget.health - remaining);
    }
  } else if (card.type === 'defense') {
    newCaster.armor += card.value;
  } else if (card.type === 'special' && card.effect === 'draw') {
    newCaster = drawCards(newCaster, card.value);
  } else if (card.type === 'special' && card.effect === 'discard') {
    newTarget = discardRandom(newTarget, card.value);
  }

  newCaster.energy -= card.cost;
  const cardIndex = newCaster.hand.findIndex((c) => c.id === card.id);
  if (cardIndex !== -1) {
    const [playedCard] = newCaster.hand.splice(cardIndex, 1);
    newCaster.graveyard.push(playedCard);
  }

  return { caster: newCaster, target: newTarget };
}

interface GameStore extends GameState {
  playCard: (cardId: string, isPlayer: boolean) => boolean;
  endTurn: () => void;
  startGame: () => void;
  resetGame: () => void;
  decrementTime: () => void;
  aiPlayStep: () => boolean;
  cleanupBattlefield: () => void;
  decrementTransition: () => void;
  clearShaking: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  playCard: (cardId: string, isPlayer: boolean) => {
    const state = get();
    if (state.phase === 'gameOver' || state.phase === 'transitioning') return false;

    const casterKey = isPlayer ? 'player' : 'opponent';
    const targetKey = isPlayer ? 'opponent' : 'player';
    const correctPhase = isPlayer ? 'playerTurn' : 'opponentTurn';

    if (state.phase !== correctPhase) return false;

    const caster = state[casterKey];
    const card = caster.hand.find((c) => c.id === cardId);
    if (!card || card.cost > caster.energy) {
      if (isPlayer && card) {
        set({ shakingCardId: cardId });
        setTimeout(() => get().clearShaking(), 500);
      }
      return false;
    }

    const { caster: newCaster, target: newTarget } = applyCardEffect(
      card,
      caster,
      state[targetKey],
    );

    const battlefieldCard: BattlefieldCard = {
      card,
      timestamp: Date.now(),
      ownerId: caster.id,
    };

    let winner: string | null = null;
    let phase: GameState['phase'] = state.phase;
    if (newTarget.health <= 0) {
      winner = newCaster.name;
      phase = 'gameOver';
    }

    set({
      [casterKey]: newCaster,
      [targetKey]: newTarget,
      battlefield: [...state.battlefield, battlefieldCard],
      winner,
      phase,
    } as Partial<GameState>);

    return true;
  },

  endTurn: () => {
    const state = get();
    if (state.phase === 'gameOver' || state.phase === 'transitioning') return;

    const isPlayerTurn = state.phase === 'playerTurn';
    const nextPhase = isPlayerTurn ? 'opponentTurn' : 'playerTurn';
    const nextMessage = isPlayerTurn ? '对手回合' : '玩家回合';

    set({
      phase: 'transitioning',
      transitionCountdown: 3,
      transitionMessage: nextMessage,
      timeRemaining: TURN_DURATION,
    });
  },

  startGame: () => {
    get().resetGame();
  },

  resetGame: () => {
    set({
      ...initialState,
      player: createPlayer('player', '玩家', '🧙'),
      opponent: createPlayer('opponent', 'AI对手', '🤖'),
    });
  },

  decrementTime: () => {
    const state = get();
    if (state.phase === 'playerTurn' || state.phase === 'opponentTurn') {
      const newTime = state.timeRemaining - 1;
      if (newTime <= 0) {
        get().endTurn();
      } else {
        set({ timeRemaining: newTime });
      }
    }
  },

  aiPlayStep: () => {
    const state = get();
    if (state.phase !== 'opponentTurn') return false;

    const card = aiSelectCard(state.opponent, state.player.hand.length);
    if (!card) {
      get().endTurn();
      return false;
    }

    const success = get().playCard(card.id, false);
    return success;
  },

  cleanupBattlefield: () => {
    const state = get();
    const now = Date.now();
    const filtered = state.battlefield.filter(
      (bc) => now - bc.timestamp < BATTLEFIELD_DURATION,
    );
    if (filtered.length !== state.battlefield.length) {
      set({ battlefield: filtered });
    }
  },

  decrementTransition: () => {
    const state = get();
    if (state.phase !== 'transitioning') return;

    const newCount = state.transitionCountdown - 1;
    if (newCount <= 0) {
      const isGoingToOpponent = state.transitionMessage === '对手回合';
      let nextPlayer: Player;
      let nextOpponent: Player;

      if (isGoingToOpponent) {
        nextPlayer = { ...state.opponent, energy: MAX_ENERGY };
        nextPlayer = drawCards(nextPlayer, 1);
        nextOpponent = state.player;
        set({
          phase: 'opponentTurn',
          opponent: nextPlayer,
          player: nextOpponent,
          turn: state.turn,
          transitionCountdown: 0,
          transitionMessage: '',
        });
      } else {
        nextPlayer = { ...state.player, energy: MAX_ENERGY };
        nextPlayer = drawCards(nextPlayer, 1);
        nextOpponent = state.opponent;
        set({
          phase: 'playerTurn',
          player: nextPlayer,
          opponent: nextOpponent,
          turn: state.turn + 1,
          transitionCountdown: 0,
          transitionMessage: '',
        });
      }
    } else {
      set({ transitionCountdown: newCount });
    }
  },

  clearShaking: () => {
    set({ shakingCardId: null });
  },
}));
