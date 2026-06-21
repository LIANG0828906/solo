import { create } from 'zustand';
import {
  GameMode,
  GamePhase,
  CushionFlash,
  ShotRecord,
  BallTrajectory,
  SnapshotBall,
  HistoryFrame,
  TrajectoryPoint,
  FOUL_FLASH_DURATION,
} from './types';

interface GameStore {
  mode: GameMode;
  phase: GamePhase;
  score: number;
  pocketedBallIds: number[];
  currentTarget: number;
  foul: boolean;
  foulTime: number;
  cushionFlashes: CushionFlash[];
  shotHistory: ShotRecord[];
  currentShotFrames: HistoryFrame[];
  currentTrajectories: BallTrajectory[];
  replayFrameIndex: number;
  isReplaying: boolean;
  power: number;

  setMode: (mode: GameMode) => void;
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number) => void;
  addPocketedBall: (id: number) => void;
  setCurrentTarget: (target: number) => void;
  triggerFoul: () => void;
  clearFoul: () => boolean;
  addCushionFlash: (flash: CushionFlash) => void;
  cleanCushionFlashes: () => void;
  startShot: () => void;
  addFrameToShot: (frame: HistoryFrame) => void;
  setTrajectories: (traj: BallTrajectory[]) => void;
  endShot: () => void;
  startReplay: () => void;
  advanceReplay: () => void;
  endReplay: () => void;
  setPower: (power: number) => void;
  resetGame: () => void;
}

function buildTrajectories(frames: HistoryFrame[]): BallTrajectory[] {
  const map = new Map<number, TrajectoryPoint[]>();
  for (const frame of frames) {
    for (const sb of frame.balls) {
      let points = map.get(sb.id);
      if (!points) {
        points = [];
        map.set(sb.id, points);
      }
      points.push({ x: sb.x, y: sb.y });
    }
  }
  const result: BallTrajectory[] = [];
  for (const [ballId, points] of map.entries()) {
    result.push({ ballId, points });
  }
  return result;
}

export const useGameStore = create<GameStore>((set, get) => ({
  mode: 'free',
  phase: 'idle',
  score: 0,
  pocketedBallIds: [],
  currentTarget: 1,
  foul: false,
  foulTime: 0,
  cushionFlashes: [],
  shotHistory: [],
  currentShotFrames: [],
  currentTrajectories: [],
  replayFrameIndex: 0,
  isReplaying: false,
  power: 0,

  setMode: (mode) =>
    set({
      mode,
      score: 0,
      pocketedBallIds: [],
      currentTarget: 1,
      foul: false,
      foulTime: 0,
    }),

  setPhase: (phase) => set({ phase }),

  setScore: (score) => set({ score }),

  addPocketedBall: (id) =>
    set((s) => ({ pocketedBallIds: [...s.pocketedBallIds, id] })),

  setCurrentTarget: (target) => set({ currentTarget: target }),

  triggerFoul: () => set({ foul: true, foulTime: Date.now() }),

  clearFoul: () => {
    const s = get();
    if (s.foul && Date.now() - s.foulTime > FOUL_FLASH_DURATION) {
      set({ foul: false, foulTime: 0 });
      return true;
    }
    return false;
  },

  addCushionFlash: (flash) =>
    set((s) => ({ cushionFlashes: [...s.cushionFlashes, flash] })),

  cleanCushionFlashes: () =>
    set((s) => ({
      cushionFlashes: s.cushionFlashes.filter(
        (f) => Date.now() - f.time < FOUL_FLASH_DURATION
      ),
    })),

  startShot: () => {
    set({ currentShotFrames: [], currentTrajectories: [] });
  },

  addFrameToShot: (frame) =>
    set((s) => ({ currentShotFrames: [...s.currentShotFrames, frame] })),

  setTrajectories: (traj) => set({ currentTrajectories: traj }),

  endShot: () => {
    const s = get();
    const trajectories = buildTrajectories(s.currentShotFrames);
    set((s) => ({
      shotHistory: [
        ...s.shotHistory,
        {
          frames: s.currentShotFrames,
          trajectories,
        },
      ],
      currentShotFrames: [],
      currentTrajectories: [],
    }));
  },

  startReplay: () =>
    set({
      isReplaying: true,
      replayFrameIndex: 0,
      phase: 'replay',
    }),

  advanceReplay: () => {
    const s = get();
    const lastShot = s.shotHistory[s.shotHistory.length - 1];
    if (!lastShot) {
      set({ isReplaying: false, phase: 'idle' });
      return;
    }
    const nextIndex = s.replayFrameIndex + 2;
    if (nextIndex >= lastShot.frames.length) {
      set({ isReplaying: false, phase: 'idle' });
    } else {
      set({ replayFrameIndex: nextIndex });
    }
  },

  endReplay: () => set({ isReplaying: false, phase: 'idle' }),

  setPower: (power) => set({ power }),

  resetGame: () =>
    set({
      score: 0,
      pocketedBallIds: [],
      currentTarget: 1,
      foul: false,
      foulTime: 0,
      shotHistory: [],
      currentShotFrames: [],
      currentTrajectories: [],
      replayFrameIndex: 0,
      isReplaying: false,
      phase: 'idle',
      power: 0,
    }),
}));
