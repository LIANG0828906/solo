import type { Card, CardTag, ComboChain, GameState } from '../types';

export const calculateDamage = (baseAttack: number, comboCount: number): number => {
  if (comboCount <= 1) return baseAttack;
  const multiplier = 1 + (comboCount - 1) * 0.5;
  return Math.floor(baseAttack * multiplier);
};

export const detectCombo = (lastTag: CardTag | null, currentTag: CardTag): ComboChain => {
  if (lastTag === currentTag) {
    return { tag: currentTag, count: 2 };
  }
  return { tag: currentTag, count: 1 };
};

export const updateComboChain = (
  currentChain: ComboChain,
  newCardTag: CardTag
): ComboChain => {
  if (currentChain.tag === newCardTag) {
    return {
      tag: newCardTag,
      count: Math.min(currentChain.count + 1, 3),
    };
  }
  return {
    tag: newCardTag,
    count: 1,
  };
};

export const processCardPlay = (state: GameState, card: Card): GameState => {
  const newChain = updateComboChain(state.comboChain, card.tag);
  const damage = calculateDamage(card.attack, newChain.count);
  const newEnemyHp = Math.max(0, state.enemy.hp - damage);

  return {
    ...state,
    enemy: {
      ...state.enemy,
      hp: newEnemyHp,
    },
    comboChain: newChain,
    cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
    placedCards: [...state.placedCards, card],
    player: {
      ...state.player,
      hand: state.player.hand.filter((c) => c.id !== card.id),
    },
  };
};

export const processEnemyAttack = (state: GameState): GameState => {
  const damage = state.enemy.attack;
  const newPlayerHp = Math.max(0, state.player.hp - damage);

  return {
    ...state,
    player: {
      ...state.player,
      hp: newPlayerHp,
    },
  };
};

export const checkGameEnd = (state: GameState): 'win' | 'lose' | null => {
  if (state.enemy.hp <= 0) return 'win';
  if (state.player.hp <= 0) return 'lose';
  return null;
};

export const canDrawCard = (state: GameState): boolean => {
  return (
    state.phase !== 'ended' &&
    state.phase !== 'enemy' &&
    state.player.gold >= 2 &&
    state.player.hand.length < 7
  );
};

export const canPlayCard = (state: GameState): boolean => {
  return (
    state.phase === 'play' &&
    state.cardsPlayedThisTurn < 3 &&
    state.player.hand.length > 0
  );
};

export const startNewTurn = (state: GameState): GameState => {
  return {
    ...state,
    turn: state.turn + 1,
    phase: 'draw',
    cardsPlayedThisTurn: 0,
    comboChain: { tag: null, count: 0 },
    placedCards: [],
  };
};
