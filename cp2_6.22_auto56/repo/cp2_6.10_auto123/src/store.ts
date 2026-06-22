import { create } from 'zustand';

export type GamePhase = 'ready' | 'pouring' | 'whisking' | 'drawing' | 'judging' | 'finished';

export type BrushType = 'line' | 'dot' | 'circle';

export interface PathPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface TeaArtPath {
  points: PathPoint[];
  brushType: BrushType;
  lineWidth: number;
  color: string;
}

export interface FoamLayer {
  fineBubbles: number;
  mediumBubbles: number;
  largeBubbles: number;
  expansionRate: number;
}

export interface PlayerState {
  foam: FoamLayer;
  teaArt: TeaArtPath[];
  biteTime: number;
  scores: {
    foam: number;
    bite: number;
    artFinesse: number;
    artComplexity: number;
    total: number;
  };
}

export interface HistoryRecord {
  id: number;
  playerScore: number;
  aiScore: number;
  winner: 'player' | 'ai' | 'draw';
  thumbnail: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  ai: PlayerState;
  currentBrush: BrushType;
  brushSize: number;
  isPouring: boolean;
  isWhisking: boolean;
  isDrawing: boolean;
  whiskSpeed: number;
  history: HistoryRecord[];
  winRate: number;
  showJudgement: boolean;
  
  setPhase: (phase: GamePhase) => void;
  setCurrentBrush: (brush: BrushType) => void;
  setBrushSize: (size: number) => void;
  setIsPouring: (pouring: boolean) => void;
  setIsWhisking: (whisking: boolean) => void;
  setIsDrawing: (drawing: boolean) => void;
  setWhiskSpeed: (speed: number) => void;
  setShowJudgement: (show: boolean) => void;
  
  updatePlayerFoam: (foam: Partial<FoamLayer>) => void;
  updateAiFoam: (foam: Partial<FoamLayer>) => void;
  addPlayerTeaArt: (path: TeaArtPath) => void;
  addAiTeaArt: (path: TeaArtPath) => void;
  setPlayerBiteTime: (time: number) => void;
  setAiBiteTime: (time: number) => void;
  
  calculateScores: () => void;
  addHistoryRecord: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void;
  resetGame: () => void;
  calculateWinRate: () => void;
}

const initialPlayerState: PlayerState = {
  foam: { fineBubbles: 0, mediumBubbles: 0, largeBubbles: 0, expansionRate: 0 },
  teaArt: [],
  biteTime: 0,
  scores: { foam: 0, bite: 0, artFinesse: 0, artComplexity: 0, total: 0 },
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'ready',
  player: { ...initialPlayerState },
  ai: { ...initialPlayerState },
  currentBrush: 'line',
  brushSize: 3,
  isPouring: false,
  isWhisking: false,
  isDrawing: false,
  whiskSpeed: 0,
  history: [],
  winRate: 0,
  showJudgement: false,

  setPhase: (phase) => set({ phase }),
  setCurrentBrush: (brush) => set({ currentBrush: brush }),
  setBrushSize: (size) => set({ brushSize: size }),
  setIsPouring: (pouring) => set({ isPouring: pouring }),
  setIsWhisking: (whisking) => set({ isWhisking: whisking }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setWhiskSpeed: (speed) => set({ whiskSpeed: speed }),
  setShowJudgement: (show) => set({ showJudgement: show }),

  updatePlayerFoam: (foam) =>
    set((state) => ({
      player: { ...state.player, foam: { ...state.player.foam, ...foam } },
    })),

  updateAiFoam: (foam) =>
    set((state) => ({
      ai: { ...state.ai, foam: { ...state.ai.foam, ...foam } },
    })),

  addPlayerTeaArt: (path) =>
    set((state) => ({
      player: { ...state.player, teaArt: [...state.player.teaArt, path] },
    })),

  addAiTeaArt: (path) =>
    set((state) => ({
      ai: { ...state.ai, teaArt: [...state.ai.teaArt, path] },
    })),

  setPlayerBiteTime: (time) =>
    set((state) => ({
      player: { ...state.player, biteTime: time },
    })),

  setAiBiteTime: (time) =>
    set((state) => ({
      ai: { ...state.ai, biteTime: time },
    })),

  calculateScores: () => {
    const state = get();
    
    const calculateFoamScore = (foam: FoamLayer): number => {
      const total = foam.fineBubbles + foam.mediumBubbles + foam.largeBubbles;
      if (total === 0) return 0;
      
      const fineRatio = foam.fineBubbles / total;
      const mediumRatio = foam.mediumBubbles / total;
      const largeRatio = foam.largeBubbles / total;
      
      return Math.round(fineRatio * 30 + mediumRatio * 20 + largeRatio * 10);
    };

    const calculateBiteScore = (time: number): number => {
      return Math.min(Math.round((time / 30) * 50), 50);
    };

    const calculateArtFinesse = (paths: TeaArtPath[]): number => {
      if (paths.length === 0) return 0;
      
      let totalCurvature = 0;
      let totalPoints = 0;
      
      paths.forEach((path) => {
        const points = path.points;
        if (points.length < 3) return;
        
        for (let i = 1; i < points.length - 1; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const p2 = points[i + 1];
          
          const dx1 = p1.x - p0.x;
          const dy1 = p1.y - p0.y;
          const dx2 = p2.x - p1.x;
          const dy2 = p2.y - p1.y;
          
          const cross = dx1 * dy2 - dy1 * dx2;
          const dot = dx1 * dx2 + dy1 * dy2;
          const curvature = Math.abs(cross) / (Math.sqrt(dx1 * dx1 + dy1 * dy1) * Math.sqrt(dx2 * dx2 + dy2 * dy2) + 0.001);
          
          totalCurvature += curvature;
          totalPoints++;
        }
      });
      
      const avgCurvature = totalPoints > 0 ? totalCurvature / totalPoints : 0;
      const smoothnessScore = Math.max(0, 100 - avgCurvature * 50);
      
      return Math.round(smoothnessScore * 0.3);
    };

    const calculateArtComplexity = (paths: TeaArtPath[]): number => {
      return Math.min(paths.length * 20, 40);
    };

    const playerFoamScore = calculateFoamScore(state.player.foam);
    const playerBiteScore = calculateBiteScore(state.player.biteTime);
    const playerFinesseScore = calculateArtFinesse(state.player.teaArt);
    const playerComplexityScore = calculateArtComplexity(state.player.teaArt);
    const playerTotal = playerFoamScore + playerBiteScore + playerFinesseScore + playerComplexityScore;

    const aiFoamScore = calculateFoamScore(state.ai.foam);
    const aiBiteScore = calculateBiteScore(state.ai.biteTime);
    const aiFinesseScore = calculateArtFinesse(state.ai.teaArt);
    const aiComplexityScore = calculateArtComplexity(state.ai.teaArt);
    const aiTotal = aiFoamScore + aiBiteScore + aiFinesseScore + aiComplexityScore;

    set({
      player: {
        ...state.player,
        scores: {
          foam: playerFoamScore,
          bite: playerBiteScore,
          artFinesse: playerFinesseScore,
          artComplexity: playerComplexityScore,
          total: playerTotal,
        },
      },
      ai: {
        ...state.ai,
        scores: {
          foam: aiFoamScore,
          bite: aiBiteScore,
          artFinesse: aiFinesseScore,
          artComplexity: aiComplexityScore,
          total: aiTotal,
        },
      },
    });
  },

  addHistoryRecord: (record) => {
    const newRecord: HistoryRecord = {
      ...record,
      id: Date.now(),
      timestamp: Date.now(),
    };
    
    set((state) => {
      const newHistory = [newRecord, ...state.history].slice(0, 10);
      return { history: newHistory };
    });
    
    get().calculateWinRate();
  },

  calculateWinRate: () => {
    const history = get().history;
    if (history.length === 0) {
      set({ winRate: 0 });
      return;
    }
    
    const wins = history.filter((r) => r.winner === 'player').length;
    set({ winRate: Math.round((wins / history.length) * 100) });
  },

  resetGame: () =>
    set({
      phase: 'ready',
      player: { ...initialPlayerState, foam: { fineBubbles: 0, mediumBubbles: 0, largeBubbles: 0, expansionRate: 0 } },
      ai: { ...initialPlayerState, foam: { fineBubbles: 0, mediumBubbles: 0, largeBubbles: 0, expansionRate: 0 } },
      currentBrush: 'line',
      brushSize: 3,
      isPouring: false,
      isWhisking: false,
      isDrawing: false,
      whiskSpeed: 0,
      showJudgement: false,
    }),
}));
