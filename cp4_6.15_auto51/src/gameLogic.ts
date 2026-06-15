import { v4 as uuidv4 } from 'uuid';
import type {
  CardType,
  Suit,
  GameState,
  GameMode,
  MoveResult,
  MoveHint,
  PileType,
  HistoryEntry,
} from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'spades', 'clubs'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const RED_SUITS: Suit[] = ['hearts', 'diamonds'];
const MAX_HISTORY = 50;
const TIME_LIMIT_MS = 30 * 60 * 1000;

export const isRed = (suit: Suit): boolean => RED_SUITS.includes(suit);

export const getSuitSymbol = (suit: Suit): string => {
  const symbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    spades: '♠',
    clubs: '♣',
  };
  return symbols[suit];
};

export const getRankDisplay = (rank: number): string => {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return rank.toString();
};

export const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: uuidv4(),
        suit,
        rank,
        faceUp: false,
        playerId: 0,
      });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: CardType[]): CardType[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createEmptyTableau = (): CardType[][] => {
  return Array.from({ length: 7 }, () => []);
};

const createEmptyFoundation = (): CardType[][] => {
  return Array.from({ length: 4 }, () => []);
};

export const initGame = (mode: GameMode): GameState => {
  const deckCount = mode === 'dual' ? [...createDeck(), ...createDeck()] : createDeck();
  const deck = shuffleDeck(deckCount);
  const state: GameState = {
    mode,
    currentPlayer: 0,
    stock: [],
    waste: [],
    tableau: createEmptyTableau(),
    foundation: createEmptyFoundation(),
    tableauP2: createEmptyTableau(),
    foundationP2: createEmptyFoundation(),
    scores: [0, 0],
    comboCounts: [0, 0],
    startTime: Date.now(),
    elapsedTime: 0,
    moveCount: 0,
    isGameOver: false,
    winner: null,
    history: [],
    lastMoveToFoundation: false,
  };

  return dealCards(state, deck);
};

export const dealCards = (state: GameState, deck: CardType[]): GameState => {
  const newState = { ...state };
  const deckCopy = [...deck];

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deckCopy.pop()!;
      card.faceUp = row === col;
      card.playerId = 0;
      newState.tableau[col].push(card);
    }
  }

  if (state.mode === 'dual') {
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deckCopy.pop()!;
        card.faceUp = row === col;
        card.playerId = 1;
        newState.tableauP2[col].push(card);
      }
    }
  }

  newState.stock = deckCopy.map(card => ({ ...card, faceUp: false }));

  return newState;
};

export const drawFromStock = (state: GameState): GameState => {
  if (state.stock.length === 0 && state.waste.length > 0) {
    return {
      ...state,
      stock: state.waste.reverse().map(card => ({ ...card, faceUp: false })),
      waste: [],
    };
  }

  const drawCount = Math.min(3, state.stock.length);
  if (drawCount === 0) return state;

  const drawnCards = state.stock
    .slice(-drawCount)
    .map(card => ({ ...card, faceUp: true }));

  const historyEntry: HistoryEntry = {
    state: JSON.parse(JSON.stringify(state)),
    moveDescription: '翻牌',
  };

  return {
    ...state,
    stock: state.stock.slice(0, -drawCount),
    waste: [...state.waste, ...drawnCards],
    history: [...state.history.slice(-(MAX_HISTORY - 1)), historyEntry],
    comboCounts: [0, 0],
    lastMoveToFoundation: false,
  };
};

export const validateMove = (
  cards: CardType[],
  targetType: PileType,
  targetColumn: number,
  gameState: GameState,
  playerId: number
): MoveResult => {
  if (cards.length === 0) {
    return { valid: false, errorMessage: '没有选择卡片', scoreGain: 0, isCombo: false };
  }

  const movingCard = cards[0];

  const tableau = playerId === 0 ? gameState.tableau : gameState.tableauP2;
  const foundation = playerId === 0 ? gameState.foundation : gameState.foundationP2;

  if (targetType === 'tableau') {
    const targetPile = tableau[targetColumn];

    if (targetPile.length === 0) {
      if (movingCard.rank === 13) {
        return { valid: true, scoreGain: 0, isCombo: false };
      }
      return { valid: false, errorMessage: '只能将K移到空列', scoreGain: 0, isCombo: false };
    }

    const targetCard = targetPile[targetPile.length - 1];
    if (!targetCard.faceUp) {
      return { valid: false, errorMessage: '目标卡片未翻开', scoreGain: 0, isCombo: false };
    }

    if (targetCard.rank !== movingCard.rank + 1) {
      return { valid: false, errorMessage: '点数必须递减', scoreGain: 0, isCombo: false };
    }

    if (isRed(targetCard.suit) === isRed(movingCard.suit)) {
      return { valid: false, errorMessage: '颜色必须交替', scoreGain: 0, isCombo: false };
    }

    return { valid: true, scoreGain: 0, isCombo: false };
  }

  if (targetType === 'foundation') {
    if (cards.length !== 1) {
      return { valid: false, errorMessage: '只能移动单张牌到回收堆', scoreGain: 0, isCombo: false };
    }

    const targetPile = foundation[targetColumn];

    const suitIndex = SUITS.indexOf(movingCard.suit);
    if (suitIndex !== targetColumn) {
      return { valid: false, errorMessage: '花色不匹配', scoreGain: 0, isCombo: false };
    }

    if (targetPile.length === 0) {
      if (movingCard.rank === 1) {
        const isCombo = gameState.lastMoveToFoundation;
        const scoreGain = calculateScore(1, isCombo, gameState.comboCounts[playerId]);
        return { valid: true, scoreGain, isCombo };
      }
      return { valid: false, errorMessage: '回收堆必须从A开始', scoreGain: 0, isCombo: false };
    }

    const topCard = targetPile[targetPile.length - 1];
    const isSequential = topCard.rank === movingCard.rank - 1;
    const isWrapAround = gameState.mode === 'dual' && topCard.rank === 13 && movingCard.rank === 1;
    if ((isSequential || isWrapAround) && topCard.suit === movingCard.suit) {
      const isCombo = gameState.lastMoveToFoundation;
      const scoreGain = calculateScore(1, isCombo, gameState.comboCounts[playerId]);
      return { valid: true, scoreGain, isCombo };
    }

    return { valid: false, errorMessage: '必须按顺序递增', scoreGain: 0, isCombo: false };
  }

  return { valid: false, errorMessage: '无效的目标位置', scoreGain: 0, isCombo: false };
};

export const calculateScore = (
  cardsMoved: number,
  isCombo: boolean,
  currentCombo: number
): number => {
  let score = cardsMoved * 10;
  if (isCombo) {
    const newCombo = currentCombo + 1;
    score += newCombo * 5;
  }
  return score;
};

export const executeMove = (
  state: GameState,
  cards: CardType[],
  sourceType: PileType,
  _sourceIndex: number,
  sourceColumn: number,
  targetType: PileType,
  _targetIndex: number,
  targetColumn: number,
  playerId: number
): GameState => {
  const historyEntry: HistoryEntry = {
    state: JSON.parse(JSON.stringify(state)),
    moveDescription: `移动 ${cards.length} 张牌`,
  };

  const newState = { ...state };
  const tableau = playerId === 0 ? 'tableau' : 'tableauP2';
  const foundation = playerId === 0 ? 'foundation' : 'foundationP2';

  let sourcePile: CardType[];
  if (sourceType === 'stock') {
    sourcePile = newState.stock;
  } else if (sourceType === 'waste') {
    sourcePile = newState.waste;
  } else if (sourceType === 'tableau') {
    sourcePile = newState[tableau][sourceColumn];
  } else {
    sourcePile = newState[foundation][sourceColumn];
  }

  const removeCount = cards.length;
  const newSourcePile = sourcePile.slice(0, -removeCount);

  if (sourceType === 'stock') {
    newState.stock = newSourcePile;
  } else if (sourceType === 'waste') {
    newState.waste = newSourcePile;
  } else if (sourceType === 'tableau') {
    newState[tableau][sourceColumn] = newSourcePile;
  } else {
    newState[foundation][sourceColumn] = newSourcePile;
  }

  let targetPile: CardType[];
  if (targetType === 'tableau') {
    targetPile = [...newState[tableau][targetColumn], ...cards];
    newState[tableau][targetColumn] = targetPile;
  } else if (targetType === 'foundation') {
    targetPile = [...newState[foundation][targetColumn], ...cards];
    newState[foundation][targetColumn] = targetPile;
  }

  if (sourceType === 'tableau') {
    const col = sourceColumn;
    const pile = newState[tableau][col];
    if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
      newState[tableau][col] = [
        ...pile.slice(0, -1),
        { ...pile[pile.length - 1], faceUp: true },
      ];
    }
  }

  const validation = validateMove(cards, targetType, targetColumn, state, playerId);

  if (targetType === 'foundation') {
    newState.scores = [...newState.scores];
    newState.scores[playerId] += validation.scoreGain;

    if (validation.isCombo) {
      newState.comboCounts = [...newState.comboCounts];
      newState.comboCounts[playerId] += 1;
    } else {
      newState.comboCounts = [...newState.comboCounts];
      newState.comboCounts[playerId] = 1;
    }
    newState.lastMoveToFoundation = true;
  } else {
    newState.comboCounts = [0, 0];
    newState.lastMoveToFoundation = false;
  }

  newState.moveCount += 1;
  newState.history = [...state.history.slice(-(MAX_HISTORY - 1)), historyEntry];

  if (state.mode === 'dual') {
    newState.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
  }

  const timePenalty = Math.max(0, Math.floor((state.elapsedTime - TIME_LIMIT_MS) / 60000) * 5);
  if (timePenalty > 0) {
    newState.scores[playerId] = Math.max(0, newState.scores[playerId] - timePenalty);
  }

  if (checkWinCondition(newState)) {
    newState.isGameOver = true;
    newState.winner = determineWinner(newState);
  }

  return newState;
};

export const autoFlipCard = (
  state: GameState,
  columnIndex: number,
  playerId: number
): GameState => {
  const tableau = playerId === 0 ? state.tableau : state.tableauP2;
  const pile = tableau[columnIndex];

  if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
    const newTableau = [...tableau];
    newTableau[columnIndex] = [
      ...pile.slice(0, -1),
      { ...pile[pile.length - 1], faceUp: true },
    ];

    if (playerId === 0) {
      return { ...state, tableau: newTableau };
    } else {
      return { ...state, tableauP2: newTableau };
    }
  }

  return state;
};

export const checkWinCondition = (state: GameState): boolean => {
  const cardsPerFoundation = state.mode === 'dual' ? 26 : 13;
  const checkFoundation = (foundation: CardType[][]): boolean => {
    return foundation.every(pile => pile.length === cardsPerFoundation);
  };

  if (state.mode === 'single') {
    return checkFoundation(state.foundation);
  } else {
    const p1Done = checkFoundation(state.foundation);
    const p2Done = checkFoundation(state.foundationP2);
    const allCardsUsed =
      state.stock.length === 0 &&
      state.waste.length === 0 &&
      state.tableau.every(col => col.length === 0) &&
      state.tableauP2.every(col => col.length === 0);
    return p1Done || p2Done || allCardsUsed || state.elapsedTime >= TIME_LIMIT_MS;
  }
};

export const determineWinner = (state: GameState): number | null => {
  const totalCards = state.mode === 'dual' ? 104 : 52;
  if (state.mode === 'single') {
    const p1Total = state.foundation.reduce((sum, pile) => sum + pile.length, 0);
    return p1Total === totalCards ? 0 : null;
  }

  const p1Score = state.scores[0] + state.foundation.reduce((sum, pile) => sum + pile.length, 0) * 10;
  const p2Score = state.scores[1] + state.foundationP2.reduce((sum, pile) => sum + pile.length, 0) * 10;

  if (p1Score > p2Score) return 0;
  if (p2Score > p1Score) return 1;
  return null;
};

export const undoMove = (state: GameState): GameState => {
  if (state.history.length === 0) return state;

  const lastEntry = state.history[state.history.length - 1];
  return {
    ...lastEntry.state,
    history: state.history.slice(0, -1),
  };
};

export const findValidMoves = (state: GameState, playerId: number): MoveHint[] => {
  const hints: MoveHint[] = [];
  const tableau = playerId === 0 ? state.tableau : state.tableauP2;
  const foundation = playerId === 0 ? state.foundation : state.foundationP2;

  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    for (let col = 0; col < 7; col++) {
      if (validateMove([card], 'tableau', col, state, playerId).valid) {
        hints.push({
          cards: [card],
          sourceType: 'waste',
          sourceIndex: state.waste.length - 1,
          targetType: 'tableau',
          targetIndex: col,
          targetColumn: col,
        });
      }
    }
    for (let col = 0; col < 4; col++) {
      if (validateMove([card], 'foundation', col, state, playerId).valid) {
        hints.push({
          cards: [card],
          sourceType: 'waste',
          sourceIndex: state.waste.length - 1,
          targetType: 'foundation',
          targetIndex: col,
          targetColumn: col,
        });
      }
    }
  }

  for (let srcCol = 0; srcCol < 7; srcCol++) {
    const pile = tableau[srcCol];
    for (let i = 0; i < pile.length; i++) {
      if (!pile[i].faceUp) continue;

      const cards = pile.slice(i);

      for (let tgtCol = 0; tgtCol < 7; tgtCol++) {
        if (srcCol === tgtCol) continue;
        if (validateMove(cards, 'tableau', tgtCol, state, playerId).valid) {
          hints.push({
            cards,
            sourceType: 'tableau',
            sourceIndex: i,
            sourceColumn: srcCol,
            targetType: 'tableau',
            targetIndex: tgtCol,
            targetColumn: tgtCol,
          });
        }
      }

      if (cards.length === 1) {
        for (let tgtCol = 0; tgtCol < 4; tgtCol++) {
          if (validateMove(cards, 'foundation', tgtCol, state, playerId).valid) {
            hints.push({
              cards,
              sourceType: 'tableau',
              sourceIndex: i,
              sourceColumn: srcCol,
              targetType: 'foundation',
              targetIndex: tgtCol,
              targetColumn: tgtCol,
            });
          }
        }
      }
    }
  }

  for (let srcCol = 0; srcCol < 4; srcCol++) {
    const pile = foundation[srcCol];
    if (pile.length === 0) continue;

    const card = pile[pile.length - 1];
    for (let tgtCol = 0; tgtCol < 7; tgtCol++) {
      if (validateMove([card], 'tableau', tgtCol, state, playerId).valid) {
        hints.push({
          cards: [card],
          sourceType: 'foundation',
          sourceIndex: srcCol,
          sourceColumn: srcCol,
          targetType: 'tableau',
          targetIndex: tgtCol,
          targetColumn: tgtCol,
        });
      }
    }
  }

  return hints;
};

export const updateElapsedTime = (state: GameState): GameState => {
  const elapsed = Date.now() - state.startTime;
  const newState = { ...state, elapsedTime: elapsed };

  if (elapsed >= TIME_LIMIT_MS && !state.isGameOver) {
    newState.isGameOver = true;
    newState.winner = determineWinner(newState);
  }

  return newState;
};

export const getTotalFoundationCards = (state: GameState, playerId: number): number => {
  const foundation = playerId === 0 ? state.foundation : state.foundationP2;
  return foundation.reduce((sum, pile) => sum + pile.length, 0);
};

export const getRemainingCards = (state: GameState): number => {
  return state.stock.length + state.waste.length;
};
