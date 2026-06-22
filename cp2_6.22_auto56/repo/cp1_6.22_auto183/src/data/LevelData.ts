import type { ElementType } from '../utils/helpers';

export interface RuneShape {
  id: string;
  element: ElementType;
  path: string;
}

export interface GroovePosition {
  id: string;
  element: ElementType;
  x: number;
  y: number;
}

export interface Level {
  id: number;
  name: string;
  difficulty: number;
  shapes: RuneShape[];
  sequence: ElementType[];
  positions: GroovePosition[];
  // Background music hint (reserved for HTML5 Audio)
  bgmHint: string;
  // Sound effect hints (reserved)
  sfxHints: {
    place: string;
    success: string;
    fail: string;
    shuffle: string;
    complete: string;
  };
}

const FIRE_PATH = 'M0,-30 C10,-20 15,-10 15,0 C15,10 10,20 0,25 C-10,20 -15,10 -15,0 C-15,-10 -10,-20 0,-30 M-5,-5 L5,-5 L5,10 L-5,10 Z';
const WATER_PATH = 'M0,-25 Q15,-10 15,5 Q15,20 0,25 Q-15,20 -15,5 Q-15,-10 0,-25 M-8,0 L8,0 M-6,8 L6,8';
const WIND_PATH = 'M-20,0 Q-10,-15 0,0 Q10,15 20,0 M-20,10 Q-10,-5 0,10 Q10,25 20,10 M-20,-10 Q-10,-25 0,-10 Q10,5 20,-10';
const EARTH_PATH = 'M-25,-20 L25,-20 L20,20 L-20,20 Z M-15,-10 L15,-10 M-10,0 L10,0 M-5,10 L5,10';
const STEAM_PATH = 'M0,-30 C10,-25 15,-15 12,-5 C8,5 0,10 0,15 C0,10 -8,5 -12,-5 C-15,-15 -10,-25 0,-30 M-10,-10 Q0,-5 10,-10 M-8,0 Q0,5 8,0';
const LAVA_PATH = 'M-20,-15 C-10,-25 0,-20 5,-10 C10,0 15,10 10,20 C5,25 -5,25 -10,20 C-15,10 -10,0 -15,-10 C-18,-13 -18,-14 -20,-15 M-5,0 L5,-5 L5,5 Z';

const createPositions = (count: number, radius: number = 180): GroovePosition[] => {
  const positions: GroovePosition[] = [];
  const elements: ElementType[] = ['fire', 'water', 'wind', 'earth', 'steam', 'lava'];
  const angleStep = (Math.PI * 2) / count;
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * angleStep;
    positions.push({
      id: `groove-${i}`,
      element: elements[i],
      x: 250 + Math.cos(angle) * radius,
      y: 250 + Math.sin(angle) * radius
    });
  }
  return positions;
};

const createShapes = (elements: ElementType[]): RuneShape[] => {
  const paths: Record<ElementType, string> = {
    fire: FIRE_PATH,
    water: WATER_PATH,
    wind: WIND_PATH,
    earth: EARTH_PATH,
    steam: STEAM_PATH,
    lava: LAVA_PATH
  };

  return elements.map((element, index) => ({
    id: `rune-${element}-${index}`,
    element,
    path: paths[element]
  }));
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '元素初醒',
    difficulty: 1,
    shapes: createShapes(['fire', 'water', 'wind', 'earth']),
    sequence: ['fire', 'water', 'wind', 'earth'],
    positions: createPositions(4, 160),
    bgmHint: 'mystical-ambient.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 2,
    name: '双重考验',
    difficulty: 2,
    shapes: createShapes(['fire', 'water', 'wind', 'earth']),
    sequence: ['fire', 'fire', 'water', 'water', 'wind', 'earth'],
    positions: createPositions(4, 160),
    bgmHint: 'mysterious-pulse.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 3,
    name: '交错之阵',
    difficulty: 3,
    shapes: createShapes(['fire', 'water', 'wind', 'earth']),
    sequence: ['water', 'fire', 'earth', 'wind', 'water', 'fire'],
    positions: createPositions(4, 160),
    bgmHint: 'ancient-chant.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 4,
    name: '蒸汽之门',
    difficulty: 4,
    shapes: createShapes(['fire', 'water', 'wind', 'earth', 'steam']),
    sequence: ['water', 'fire', 'steam', 'water', 'steam', 'fire'],
    positions: createPositions(5, 170),
    bgmHint: 'ethereal-steam.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 5,
    name: '熔岩之怒',
    difficulty: 5,
    shapes: createShapes(['fire', 'water', 'wind', 'earth', 'lava']),
    sequence: ['earth', 'fire', 'lava', 'earth', 'fire', 'lava'],
    positions: createPositions(5, 170),
    bgmHint: 'rumbling-lava.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 6,
    name: '六芒封印',
    difficulty: 6,
    shapes: createShapes(['fire', 'water', 'wind', 'earth', 'steam', 'lava']),
    sequence: ['fire', 'water', 'wind', 'earth', 'steam', 'lava'],
    positions: createPositions(6, 180),
    bgmHint: 'hexagram-seal.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 7,
    name: '混沌序列',
    difficulty: 7,
    shapes: createShapes(['fire', 'water', 'wind', 'earth', 'steam', 'lava']),
    sequence: ['lava', 'steam', 'fire', 'water', 'earth', 'wind'],
    positions: createPositions(6, 180),
    bgmHint: 'chaos-order.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 8,
    name: '元素共鸣',
    difficulty: 8,
    shapes: createShapes(['fire', 'water', 'wind', 'earth', 'steam', 'lava']),
    sequence: ['steam', 'lava', 'steam', 'lava', 'fire', 'water'],
    positions: createPositions(6, 180),
    bgmHint: 'element-resonance.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 9,
    name: '轮回之环',
    difficulty: 9,
    shapes: createShapes(['fire', 'water', 'wind', 'earth', 'steam', 'lava']),
    sequence: ['fire', 'steam', 'water', 'wind', 'earth', 'lava'],
    positions: createPositions(6, 180),
    bgmHint: 'reincarnation-cycle.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  },
  {
    id: 10,
    name: '终极解封',
    difficulty: 10,
    shapes: createShapes(['fire', 'water', 'wind', 'earth', 'steam', 'lava']),
    sequence: ['lava', 'fire', 'earth', 'wind', 'water', 'steam'],
    positions: createPositions(6, 180),
    bgmHint: 'ultimate-unseal.mp3',
    sfxHints: {
      place: 'rune-place.mp3',
      success: 'element-activate.mp3',
      fail: 'error-buzz.mp3',
      shuffle: 'magic-whoosh.mp3',
      complete: 'level-complete.mp3'
    }
  }
];
