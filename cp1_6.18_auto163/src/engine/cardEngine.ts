export enum Element {
  Fire = 'fire',
  Water = 'water',
  Grass = 'grass',
  Dark = 'dark'
}

export enum CardLevel {
  Normal = 1,
  Advanced = 2
}

export interface Card {
  id: string;
  name: string;
  element: Element;
  attack: number;
  level: CardLevel;
  areaEffect?: AreaEffect;
}

export interface AreaEffect {
  type: 'burn' | 'freeze' | 'poison' | 'curse';
  duration: number;
  damage: number;
}

export interface SynthesisResult {
  card: Card;
  consumedPositions: { row: number; col: number }[];
}

const ELEMENT_SYMBOLS: Record<Element, string> = {
  [Element.Fire]: '火',
  [Element.Water]: '水',
  [Element.Grass]: '草',
  [Element.Dark]: '暗'
};

const ELEMENT_COLORS: Record<Element, string> = {
  [Element.Fire]: '#FF4500',
  [Element.Water]: '#1E90FF',
  [Element.Grass]: '#32CD32',
  [Element.Dark]: '#8A2BE2'
};

const ELEMENT_NAMES: Record<Element, string[]> = {
  [Element.Fire]: ['烈焰符文', '灼热符文', '炎爆符文', '焚天符文'],
  [Element.Water]: ['寒冰符文', '激流符文', '霜冻符文', '沧海符文'],
  [Element.Grass]: ['藤蔓符文', '荆棘符文', '毒菇符文', '森罗符文'],
  [Element.Dark]: '暗影符文,幽冥符文,噬魂符文,虚空符文'.split(',')
};

const COUNTER_CHART: Record<Element, Element> = {
  [Element.Water]: Element.Fire,
  [Element.Fire]: Element.Grass,
  [Element.Grass]: Element.Water,
  [Element.Dark]: Element.Dark
};

const AREA_EFFECT_MAP: Record<Element, AreaEffect> = {
  [Element.Fire]: { type: 'burn', duration: 2, damage: 5 },
  [Element.Water]: { type: 'freeze', duration: 1, damage: 3 },
  [Element.Grass]: { type: 'poison', duration: 2, damage: 4 },
  [Element.Dark]: { type: 'curse', duration: 1, damage: 6 }
};

let cardIdCounter = 0;

function nextCardId(): string {
  return `card_${++cardIdCounter}`;
}

export function getElementSymbol(el: Element): string {
  return ELEMENT_SYMBOLS[el];
}

export function getElementColor(el: Element): string {
  return ELEMENT_COLORS[el];
}

export function getElementCounter(attacker: Element): Element {
  return COUNTER_CHART[attacker];
}

export function getElementMultiplier(attackElement: Element, defenderElement: Element): number {
  if (COUNTER_CHART[attackElement] === defenderElement) return 1.5;
  if (COUNTER_CHART[defenderElement] === attackElement) return 0.5;
  return 1.0;
}

export function createCard(element: Element, level: CardLevel = CardLevel.Normal): Card {
  const names = ELEMENT_NAMES[element];
  const baseName = names[Math.floor(Math.random() * names.length)];
  const baseAttack = level === CardLevel.Normal
    ? 10 + Math.floor(Math.random() * 20)
    : 15 + Math.floor(Math.random() * 30);

  const card: Card = {
    id: nextCardId(),
    name: level === CardLevel.Advanced ? `高级${baseName}` : baseName,
    element,
    attack: baseAttack,
    level
  };

  if (level === CardLevel.Advanced) {
    card.areaEffect = { ...AREA_EFFECT_MAP[element] };
  }

  return card;
}

export function generateRandomCard(level: CardLevel = CardLevel.Normal): Card {
  const elements = [Element.Fire, Element.Water, Element.Grass, Element.Dark];
  const element = elements[Math.floor(Math.random() * elements.length)];
  return createCard(element, level);
}

export function trySynthesis(
  grid: (Card | null)[][],
  row: number,
  col: number
): SynthesisResult | null {
  const card = grid[row][col];
  if (!card) return null;

  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];

  for (const line of lines) {
    const positions = line.map(([r, c]) => ({ row: r, col: c }));
    const inLine = positions.some(p => p.row === row && p.col === col);
    if (!inLine) continue;

    const cards = positions.map(p => grid[p.row][p.col]);
    if (cards.some(c => c === null)) continue;

    const allSameElement = cards.every(c => c!.element === card.element);
    if (!allSameElement) continue;

    const allSameLevel = cards.every(c => c!.level === card.level);
    if (!allSameLevel) continue;

    if (card.level === CardLevel.Advanced) continue;

    const advancedCard = createCard(card.element, CardLevel.Advanced);
    advancedCard.attack = Math.floor(
      cards.reduce((sum, c) => sum + c!.attack, 0) * 0.5
    );

    return {
      card: advancedCard,
      consumedPositions: positions
    };
  }

  return null;
}

export function generateStarterHand(count: number = 5): Card[] {
  const hand: Card[] = [];
  for (let i = 0; i < count; i++) {
    hand.push(generateRandomCard());
  }
  return hand;
}
