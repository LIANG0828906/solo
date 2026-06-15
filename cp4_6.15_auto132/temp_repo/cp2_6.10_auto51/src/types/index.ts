export interface CharacterData {
  char: string;
  pinyin: string;
  rhyme: string;
  isDistractor: boolean;
}

export interface Level {
  id: number;
  title: string;
  content: string;
  targetChars: string[];
  distractorChars: string[];
  randomize: boolean;
}

export interface TrayCell {
  char: string | null;
  isError: boolean;
  isCorrect: boolean;
  showStain: boolean;
}

export type GamePhase = 'menu' | 'typesetting' | 'inking' | 'printing' | 'result';

export interface Score {
  errors: number;
  inkCoverage: number;
  totalScore: number;
  grade: '甲' | '乙' | '丙' | '丁';
}

export interface GameState {
  currentLevel: number;
  trayContent: TrayCell[];
  errorCount: number;
  maxErrors: number;
  inkCoverage: number;
  isInking: boolean;
  isPrinting: boolean;
  gamePhase: GamePhase;
  score: Score | null;
  highlightIndex: number;
}

export interface GameStore extends GameState {
  setLevel: (level: number) => void;
  placeCharacter: (index: number, char: string) => boolean;
  incrementError: (index: number) => void;
  setInkCoverage: (coverage: number) => void;
  setIsInking: (inking: boolean) => void;
  startPrinting: () => void;
  finishPrinting: (score: Score) => void;
  resetTray: () => void;
  resetGame: () => void;
  clearStain: (index: number) => void;
  goToMenu: () => void;
  startGame: () => void;
}

export const TRAY_ROWS = 10;
export const TRAY_COLS = 15;
export const TRAY_SIZE = TRAY_ROWS * TRAY_COLS;
