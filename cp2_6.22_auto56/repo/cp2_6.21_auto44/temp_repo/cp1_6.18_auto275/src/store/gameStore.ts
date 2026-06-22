import { create } from 'zustand';
import {
  ColorHex,
  SequenceHash,
  buildColorPool,
  computePenaltyPerFail,
  generateCode,
  matchSequence,
  pickLevelTimeLimit,
} from '../utils/cryptoEngine';

export type GameStatus = 'idle' | 'playing' | 'timeout';
export type VerifyState = 'idle' | 'checking' | 'success' | 'fail';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: ColorHex;
  alpha: number;
  life: number;
}

export interface HintInfo {
  slotIndex: number;
  color: ColorHex;
}

export interface GameState {
  level: number;
  score: number;
  timeLeft: number;
  totalTime: number;
  status: GameStatus;
  colorPool: ColorHex[];
  targetSequence: ColorHex[];
  targetHash: SequenceHash;
  selectedSequence: ColorHex[];
  failCount: number;
  hintCount: number;
  particles: Particle[];
  showHint: HintInfo | null;
  verifyState: VerifyState;
  _particleId: number;
}

export interface GameActions {
  initGame: () => void;
  restartGame: () => void;
  nextLevel: () => void;
  selectColor: (color: ColorHex) => void;
  clearSelection: () => void;
  decrementTime: () => void;
  triggerParticleBurst: (centerX: number, centerY: number) => void;
  updateParticles: () => void;
  clearHint: () => void;
  setVerifyState: (s: VerifyState) => void;
}

function buildInitialLevel(level: number): Pick<
  GameState,
  | 'level'
  | 'totalTime'
  | 'timeLeft'
  | 'status'
  | 'colorPool'
  | 'targetSequence'
  | 'targetHash'
  | 'selectedSequence'
  | 'failCount'
  | 'hintCount'
  | 'verifyState'
  | 'showHint'
> {
  const colorPool = buildColorPool(level);
  const { sequence, hash } = generateCode(colorPool);
  const totalTime = pickLevelTimeLimit(level);
  return {
    level,
    totalTime,
    timeLeft: totalTime,
    status: 'playing',
    colorPool,
    targetSequence: sequence,
    targetHash: hash,
    selectedSequence: [],
    failCount: 0,
    hintCount: 0,
    verifyState: 'idle',
    showHint: null,
  };
}

let particleSeq = 0;

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  level: 1,
  score: 0,
  totalTime: 60,
  timeLeft: 60,
  status: 'idle',
  colorPool: [],
  targetSequence: [],
  targetHash: '',
  selectedSequence: [],
  failCount: 0,
  hintCount: 0,
  particles: [],
  showHint: null,
  verifyState: 'idle',
  _particleId: 0,

  initGame: () => {
    const initial = buildInitialLevel(1);
    set({ ...initial, score: 0, particles: [], _particleId: 0 });
  },

  restartGame: () => {
    const initial = buildInitialLevel(1);
    set({ ...initial, score: 0, particles: [] });
  },

  nextLevel: () => {
    const { level } = get();
    const next = level + 1;
    const initial = buildInitialLevel(next);
    set({ ...initial });
  },

  selectColor: (color: ColorHex) => {
    const state = get();
    if (state.status !== 'playing') return;
    if (state.verifyState !== 'idle') return;
    if (state.selectedSequence.length >= 5) return;
    const nextSeq = [...state.selectedSequence, color];
    if (nextSeq.length < 5) {
      set({ selectedSequence: nextSeq });
      return;
    }
    set({ selectedSequence: nextSeq, verifyState: 'checking' });
    const matched = matchSequence(nextSeq, state.targetHash);
    window.setTimeout(() => {
      const cur = get();
      if (matched) {
        set({
          verifyState: 'success',
          score: cur.score + 10,
        });
      } else {
        const penalty = computePenaltyPerFail(cur.level);
        const newFail = cur.failCount + 1;
        set({
          verifyState: 'fail',
          score: Math.max(0, cur.score - penalty),
          failCount: newFail,
        });
      }
    }, 300);
  },

  clearSelection: () => {
    const cur = get();
    const newFail = cur.failCount;
    let showHint: HintInfo | null = null;
    let hintCount = cur.hintCount;
    if (cur.verifyState === 'fail' && newFail > 0 && newFail % 3 === 0 && cur.hintCount < 3) {
      const emptySlots: number[] = [];
      for (let i = 0; i < 5; i++) emptySlots.push(i);
      if (emptySlots.length > 0) {
        const slotIndex = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        showHint = { slotIndex, color: cur.targetSequence[slotIndex] };
        hintCount = cur.hintCount + 1;
      }
    }
    set({
      selectedSequence: [],
      verifyState: 'idle',
      showHint,
      hintCount,
    });
    if (showHint !== null) {
      window.setTimeout(() => {
        set({ showHint: null });
      }, 500);
    }
  },

  decrementTime: () => {
    const cur = get();
    if (cur.status !== 'playing') return;
    const next = cur.timeLeft - 1;
    if (next <= 0) {
      set({ timeLeft: 0, status: 'timeout' });
    } else {
      set({ timeLeft: next });
    }
  },

  triggerParticleBurst: (centerX: number, centerY: number) => {
    const cur = get();
    const palette = cur.colorPool.length > 0 ? cur.colorPool : ['#FF5733', '#33FF57', '#3357FF'];
    const count = 50;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particleSeq += 1;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 3 + Math.random() * 5;
      newParticles.push({
        id: particleSeq,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        life: 1,
      });
    }
    set({ particles: [...cur.particles, ...newParticles].slice(-100) });
  },

  updateParticles: () => {
    const cur = get();
    if (cur.particles.length === 0) return;
    const decay = 1 / (60 * 2);
    const next: Particle[] = [];
    for (const p of cur.particles) {
      const newLife = p.life - decay;
      if (newLife <= 0) continue;
      next.push({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy + 0.1,
        vx: p.vx * 0.98,
        vy: p.vy * 0.98 + 0.05,
        life: newLife,
        alpha: Math.max(0, newLife),
      });
    }
    set({ particles: next });
  },

  clearHint: () => set({ showHint: null }),

  setVerifyState: (s: VerifyState) => set({ verifyState: s }),
}));
