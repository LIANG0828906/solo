export type Difficulty = 'easy' | 'normal' | 'hard';

export interface LetterPosition {
  letter: string;
  row: number;
  col: number;
}

export interface WordHistoryItem {
  word: string;
  score: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export const WORD_DATABASE: string[] = [
  'cat', 'dog', 'run', 'sun', 'hat', 'bat', 'cup', 'pen', 'red', 'bed',
  'box', 'fox', 'jar', 'car', 'bus', 'map', 'bag', 'fan', 'can', 'pan',
  'mat', 'rat', 'sat', 'fat', 'pat', 'tap', 'cap', 'lap', 'nap', 'gap',
  'hot', 'pot', 'dot', 'got', 'lot', 'not', 'rot', 'top', 'pop', 'hop',
  'big', 'pig', 'dig', 'fig', 'wig', 'jig', 'bit', 'fit', 'hit', 'sit',

  'book', 'tree', 'fish', 'bird', 'moon', 'star', 'rain', 'snow', 'wind', 'fire',
  'home', 'door', 'room', 'desk', 'lamp', 'chair', 'table', 'couch', 'glass', 'plate',
  'cake', 'milk', 'bread', 'apple', 'grape', 'lemon', 'peach', 'melon', 'berry', 'mango',
  'blue', 'pink', 'gold', 'gray', 'teal', 'navy', 'cyan', 'lime', 'olive', 'plum',
  'jump', 'walk', 'talk', 'sing', 'play', 'read', 'write', 'draw', 'cook', 'clean',
  'swim', 'ride', 'drive', 'climb', 'dance', 'sleep', 'dream', 'think', 'learn', 'teach',
  'happy', 'brave', 'smart', 'kind', 'funny', 'lucky', 'proud', 'calm', 'cool', 'warm',
  'city', 'park', 'lake', 'river', 'ocean', 'beach', 'mountain', 'forest', 'island', 'desert',

  'water', 'music', 'happy', 'house', 'apple', 'table', 'chair', 'phone', 'clock', 'light',
  'paper', 'pencil', 'flower', 'garden', 'window', 'basket', 'pillow', 'blanket', 'bottle', 'camera',
  'planet', 'galaxy', 'meteor', 'rocket', 'castle', 'palace', 'temple', 'market', 'school', 'church',
  'winter', 'summer', 'spring', 'autumn', 'season', 'weather', 'thunder', 'rainbow', 'sunrise', 'sunset',
  'family', 'friend', 'sister', 'brother', 'mother', 'father', 'cousin', 'neighbor', 'teacher', 'student',

  'school', 'friend', 'window', 'summer', 'winter', 'spring', 'garden', 'kitchen', 'bedroom', 'bathroom',
  'orange', 'yellow', 'purple', 'silver', 'bronze', 'coffee', 'butter', 'cheese', 'yogurt', 'cookie',
  'monkey', 'dragon', 'turtle', 'rabbit', 'dolphin', 'penguin', 'elephant', 'giraffe', 'butterfly', 'squirrel',
  'dancing', 'running', 'swimming', 'climbing', 'painting', 'writing', 'reading', 'singing', 'fishing', 'hiking',
  'beautiful', 'wonderful', 'fantastic', 'brilliant', 'excellent', 'powerful', 'peaceful', 'cheerful', 'grateful', 'helpful',

  'computer', 'sunshine', 'birthday', 'keyboard', 'children', 'mountain', 'umbrella', 'sandwich', 'chocolate', 'adventure',
  'knowledge', 'happiness', 'friendship', 'important', 'different', 'wonderful', 'beautiful', 'dangerous', 'expensive', 'excellent',
  'telephone', 'television', 'basketball', 'baseball', 'football', 'swimming', 'volleyball', 'badminton', 'gymnastics', 'wrestling',

  'keyboard', 'internet', 'children', 'computer', 'birthday', 'chocolate', 'adventure', 'beautiful', 'wonderful', 'excellent',
  'important', 'different', 'dangerous', 'expensive', 'fantastic', 'brilliant', 'powerful', 'peaceful', 'cheerful', 'grateful'
];

export const DIFFICULTY_CONFIG: Record<Difficulty, {
  time: number;
  gridSize: number;
  highFreqRatio: number;
  midFreqRatio: number;
  lowFreqRatio: number;
}> = {
  easy: { time: 300, gridSize: 16, highFreqRatio: 0.7, midFreqRatio: 0.2, lowFreqRatio: 0.1 },
  normal: { time: 180, gridSize: 16, highFreqRatio: 0.55, midFreqRatio: 0.25, lowFreqRatio: 0.2 },
  hard: { time: 90, gridSize: 16, highFreqRatio: 0.4, midFreqRatio: 0.25, lowFreqRatio: 0.35 }
};

export const MOBILE_GRID_SIZE = 12;

const HIGH_FREQ_LETTERS = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C'];
const MID_FREQ_LETTERS = ['U', 'D', 'P', 'M', 'H', 'G', 'B', 'F', 'Y', 'W'];
const LOW_FREQ_LETTERS = ['K', 'V', 'X', 'Z', 'J', 'Q'];

const PARTICLE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const SCORE_TABLE: Record<number, number> = {
  3: 3,
  4: 4,
  5: 6,
  6: 9,
  7: 13,
  8: 18
};

export function getRandomLetter(difficulty: Difficulty): string {
  const config = DIFFICULTY_CONFIG[difficulty];
  const rand = Math.random();
  
  if (rand < config.highFreqRatio) {
    return HIGH_FREQ_LETTERS[Math.floor(Math.random() * HIGH_FREQ_LETTERS.length)];
  } else if (rand < config.highFreqRatio + config.midFreqRatio) {
    return MID_FREQ_LETTERS[Math.floor(Math.random() * MID_FREQ_LETTERS.length)];
  } else {
    return LOW_FREQ_LETTERS[Math.floor(Math.random() * LOW_FREQ_LETTERS.length)];
  }
}

export function generateLetterPool(difficulty: Difficulty, isMobile: boolean): string[][] {
  const gridSize = isMobile ? MOBILE_GRID_SIZE : DIFFICULTY_CONFIG[difficulty].gridSize;
  const pool: string[][] = [];
  
  for (let row = 0; row < gridSize; row++) {
    pool[row] = [];
    for (let col = 0; col < gridSize; col++) {
      pool[row][col] = getRandomLetter(difficulty);
    }
  }
  
  return pool;
}

export function isValidWord(word: string): boolean {
  return WORD_DATABASE.includes(word.toLowerCase());
}

export function calculateScore(wordLength: number, comboMultiplier: number): number {
  const baseScore = SCORE_TABLE[wordLength] || wordLength;
  return Math.max(0, baseScore * comboMultiplier);
}

export function getComboMultiplierColor(multiplier: number): string {
  const clampedMultiplier = Math.max(1, Math.min(10, multiplier));
  const ratio = (clampedMultiplier - 1) / 9;
  
  const r = Math.round(16 + ratio * (239 - 16));
  const g = Math.round(185 + ratio * (68 - 185));
  const b = Math.round(129 + ratio * (68 - 129));
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function createParticles(centerX: number, centerY: number, count: number = 20): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      life: 1,
      maxLife: 1,
      size: 4 + Math.random() * 4
    });
  }
  
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - 0.016
    }))
    .filter(p => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getGridSize(isMobile: boolean): number {
  return isMobile ? MOBILE_GRID_SIZE : 16;
}

export function checkIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 600;
}
