export type ElementType = 'fire' | 'water' | 'wood' | 'earth' | 'thunder';

export interface ElementInfo {
  type: ElementType;
  name: string;
  icon: string;
  color: string;
  glowColor: string;
}

export interface ReactionResult {
  mainElement: ElementType;
  reactions: Array<{
    type: 'overcome' | 'generate';
    from: ElementType;
    to: ElementType;
    index: number;
  }>;
  overcomeCount: number;
  generateCount: number;
  consecutiveOvercomes: number;
}

export const ELEMENTS: Record<ElementType, ElementInfo> = {
  fire: { type: 'fire', name: '火', icon: '🔥', color: '#FF4500', glowColor: 'rgba(255,69,0,0.6)' },
  water: { type: 'water', name: '水', icon: '💧', color: '#4A90D9', glowColor: 'rgba(74,144,217,0.6)' },
  wood: { type: 'wood', name: '木', icon: '🍃', color: '#228B22', glowColor: 'rgba(34,139,34,0.6)' },
  earth: { type: 'earth', name: '土', icon: '🪨', color: '#8B4513', glowColor: 'rgba(139,69,19,0.6)' },
  thunder: { type: 'thunder', name: '雷', icon: '⚡', color: '#FFD700', glowColor: 'rgba(255,215,0,0.6)' },
};

const OVERCOME_MAP: Record<ElementType, ElementType> = {
  fire: 'wood',
  wood: 'water',
  water: 'fire',
  earth: 'thunder',
  thunder: 'earth',
};

const GENERATE_MAP: Record<ElementType, ElementType> = {
  water: 'wood',
  wood: 'fire',
  fire: 'earth',
  earth: 'thunder',
  thunder: 'water',
};

export function isOvercome(from: ElementType, to: ElementType): boolean {
  return OVERCOME_MAP[from] === to;
}

export function isGenerate(from: ElementType, to: ElementType): boolean {
  return GENERATE_MAP[from] === to;
}

export function analyzeChain(chain: ElementType[]): ReactionResult {
  const reactions: ReactionResult['reactions'] = [];
  let overcomeCount = 0;
  let generateCount = 0;
  let consecutiveOvercomes = 0;
  let currentConsecutive = 0;
  let maxConsecutive = 0;

  for (let i = 0; i < chain.length - 1; i++) {
    const from = chain[i];
    const to = chain[i + 1];

    if (isOvercome(from, to)) {
      reactions.push({ type: 'overcome', from, to, index: i });
      overcomeCount++;
      currentConsecutive++;
      if (currentConsecutive >= 2) {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      }
    } else if (isGenerate(from, to)) {
      reactions.push({ type: 'generate', from, to, index: i });
      generateCount++;
      currentConsecutive = 0;
    } else {
      currentConsecutive = 0;
    }
  }

  consecutiveOvercomes = maxConsecutive;

  return {
    mainElement: chain[0],
    reactions,
    overcomeCount,
    generateCount,
    consecutiveOvercomes,
  };
}

export const GESTURE_LAYOUT: (ElementType | null)[][] = [
  ['fire', 'water', 'wood'],
  ['earth', 'thunder', null],
  [null, null, null],
];
