export interface Fragment {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  requiredFragments: string[];
  reward: number;
  timeLimit: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalScore: number;
  challengesCompleted: number;
  fragmentsCollected: number;
  dailyScores: { date: string; score: number }[];
  topFragments: Fragment[];
}

export interface GameState {
  score: number;
  fragments: Fragment[];
  challenges: Challenge[];
  currentChallengeIndex: number;
  completedChallenges: string[];
  timeRemaining: number;
  isTimerRunning: boolean;
  placedFragments: Fragment[];
  showReport: boolean;
  weeklyReport: WeeklyReport | null;
  isAnimating: boolean;
  animationType: 'success' | 'fail' | null;
}

export interface GameActions {
  setScore: (score: number) => void;
  setFragments: (fragments: Fragment[]) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setCurrentChallengeIndex: (index: number) => void;
  addCompletedChallenge: (id: string) => void;
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: (seconds: number) => void;
  addPlacedFragment: (fragment: Fragment) => void;
  removePlacedFragment: (id: string) => void;
  clearPlacedFragments: () => void;
  setShowReport: (show: boolean) => void;
  setWeeklyReport: (report: WeeklyReport | null) => void;
  setIsAnimating: (animating: boolean, type: 'success' | 'fail' | null) => void;
  loadGameState: () => void;
  saveGameState: () => void;
}

export type GameStore = GameState & GameActions;
