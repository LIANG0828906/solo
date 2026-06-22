import { create } from 'zustand';

export interface Position {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  type: 'rock' | 'driftwood';
  position: Position;
  rotation: number;
}

export interface Coin {
  id: string;
  position: Position;
  rotation: number;
  scale: number;
  collected: boolean;
}

export interface RiverSegment {
  startPoint: Position;
  controlPoint1: Position;
  controlPoint2: Position;
  endPoint: Position;
  width: number;
}

export interface GameState {
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver';
  score: number;
  lives: number;
  speedMultiplier: number;
  bendOffset: number;
  gameTime: number;
  playerPosition: Position;
  playerTilt: number;
  targetTilt: number;
  isHit: boolean;
  hitTime: number;
  isPaused: boolean;
  showScoreFlash: boolean;
  scoreFlashTime: number;
  riverSegments: RiverSegment[];
  currentSegmentIndex: number;
  segmentTransition: number;
  obstacles: Obstacle[];
  coins: Coin[];
  waterPhase: number;
  scrollOffset: number;
  lastScoreMilestone: number;
  gameOverOpacity: number;

  setGameStatus: (status: GameState['gameStatus']) => void;
  setScore: (score: number) => void;
  setLives: (lives: number) => void;
  setSpeedMultiplier: (speed: number) => void;
  setBendOffset: (offset: number) => void;
  setGameTime: (time: number) => void;
  setPlayerPosition: (pos: Position) => void;
  setPlayerTilt: (tilt: number) => void;
  setTargetTilt: (tilt: number) => void;
  setIsHit: (hit: boolean, time?: number) => void;
  setIsPaused: (paused: boolean) => void;
  setShowScoreFlash: (show: boolean, time?: number) => void;
  setRiverSegments: (segments: RiverSegment[]) => void;
  setCurrentSegmentIndex: (index: number) => void;
  setSegmentTransition: (transition: number) => void;
  setObstacles: (obstacles: Obstacle[]) => void;
  setCoins: (coins: Coin[]) => void;
  setWaterPhase: (phase: number) => void;
  setScrollOffset: (offset: number) => void;
  setLastScoreMilestone: (milestone: number) => void;
  setGameOverOpacity: (opacity: number) => void;
  resetGame: () => void;
}

const initialPlayerPosition: Position = { x: 0, y: 300 };

const initialState = {
  gameStatus: 'idle' as GameState['gameStatus'],
  score: 0,
  lives: 3,
  speedMultiplier: 1,
  bendOffset: 80,
  gameTime: 0,
  playerPosition: initialPlayerPosition,
  playerTilt: 0,
  targetTilt: 0,
  isHit: false,
  hitTime: 0,
  isPaused: false,
  showScoreFlash: false,
  scoreFlashTime: 0,
  riverSegments: [] as RiverSegment[],
  currentSegmentIndex: 0,
  segmentTransition: 0,
  obstacles: [] as Obstacle[],
  coins: [] as Coin[],
  waterPhase: 0,
  scrollOffset: 0,
  lastScoreMilestone: 0,
  gameOverOpacity: 0,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGameStatus: (status) => set({ gameStatus: status }),
  setScore: (score) => set({ score }),
  setLives: (lives) => set({ lives }),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
  setBendOffset: (bendOffset) => set({ bendOffset }),
  setGameTime: (gameTime) => set({ gameTime }),
  setPlayerPosition: (playerPosition) => set({ playerPosition }),
  setPlayerTilt: (playerTilt) => set({ playerTilt }),
  setTargetTilt: (targetTilt) => set({ targetTilt }),
  setIsHit: (isHit, hitTime = 0) => set({ isHit, hitTime }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setShowScoreFlash: (showScoreFlash, scoreFlashTime = 0) => set({ showScoreFlash, scoreFlashTime }),
  setRiverSegments: (riverSegments) => set({ riverSegments }),
  setCurrentSegmentIndex: (currentSegmentIndex) => set({ currentSegmentIndex }),
  setSegmentTransition: (segmentTransition) => set({ segmentTransition }),
  setObstacles: (obstacles) => set({ obstacles }),
  setCoins: (coins) => set({ coins }),
  setWaterPhase: (waterPhase) => set({ waterPhase }),
  setScrollOffset: (scrollOffset) => set({ scrollOffset }),
  setLastScoreMilestone: (lastScoreMilestone) => set({ lastScoreMilestone }),
  setGameOverOpacity: (gameOverOpacity) => set({ gameOverOpacity }),

  resetGame: () => set({
    ...initialState,
    gameStatus: 'playing',
    playerPosition: { ...initialPlayerPosition },
  }),
}));
