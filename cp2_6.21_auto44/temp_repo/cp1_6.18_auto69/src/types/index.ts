export interface PoemLine {
  id: string;
  text: string;
  fragments: string[];
  characterCount: 5 | 7;
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  lines: PoemLine[];
}

export interface Fragment {
  id: string;
  text: string;
  x: number;
  y: number;
  isUsed: boolean;
}

export interface MatchResult {
  isMatch: boolean;
  matchedLineIndex: number | null;
  matchedText: string | null;
}

export interface GameState {
  currentPoemId: string;
  currentLineIndex: number;
  placedFragments: (string | null)[];
  availableFragments: Fragment[];
  completedLines: string[];
  score: number;
  combo: number;
  hintsRemaining: number;
  elapsedTime: number;
  lastActionTime: number;
  isComplete: boolean;
  highlightedFragmentId: string | null;
  showParticles: boolean;
  particlePosition: { x: number; y: number } | null;
  matchedGridIndices: number[];
}

export interface GameActions {
  placeFragment: (gridIndex: number, fragmentId: string) => void;
  removeFragment: (gridIndex: number) => void;
  updateFragmentPosition: (fragmentId: string, x: number, y: number) => void;
  shuffleFragments: () => void;
  useHint: () => void;
  resetCombo: () => void;
  nextLine: () => void;
  updateTime: () => void;
  resetGame: () => void;
  hideParticles: () => void;
  clearMatchedGrid: () => void;
}
