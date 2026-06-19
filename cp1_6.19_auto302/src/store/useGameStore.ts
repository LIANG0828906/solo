import { create } from 'zustand';
import { GameState, GameActions, JudgeResult, RippleEffect, MissEffect, ComboParticle, SCORE_MAP, TRACK_COLORS } from '../types/game';

let noteIdCounter = 0;
let effectIdCounter = 0;

const initialState: Omit<GameState, keyof GameActions> = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfectCount: 0,
  goodCount: 0,
  missCount: 0,
  notes: [],
  startTime: 0,
  isPlaying: false,
  isEnded: false,
  currentTime: 0,
  ripples: [],
  missEffects: [],
  comboParticles: [],
  comboShake: 0,
  missFlash: 0,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: () => {
    noteIdCounter = 0;
    effectIdCounter = 0;
    set({
      ...initialState,
      isPlaying: true,
      startTime: performance.now(),
      currentTime: 0,
    });
  },

  endGame: () => set({ isPlaying: false, isEnded: true }),

  resetGame: () => {
    noteIdCounter = 0;
    effectIdCounter = 0;
    set({ ...initialState });
  },

  setCurrentTime: (t: number) => set({ currentTime: t }),

  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),

  removeNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  applyJudge: (result: JudgeResult) => {
    const state = get();
    const { grade, track } = result;
    const noteHitTime = state.notes.find((n) => n.id === result.noteId)?.hitTime ?? result.timestamp;

    let newCombo = state.combo;
    let newMaxCombo = state.maxCombo;
    let newPerfect = state.perfectCount;
    let newGood = state.goodCount;
    let newMiss = state.missCount;
    let newShake = 0;
    let newFlash = 0;

    if (grade === 'perfect' || grade === 'good') {
      newCombo = state.combo + 1;
      newMaxCombo = Math.max(newMaxCombo, newCombo);
      newPerfect += grade === 'perfect' ? 1 : 0;
      newGood += grade === 'good' ? 1 : 0;
      if ([10, 25, 50, 100].includes(newCombo)) {
        newShake = performance.now();
      }
    } else {
      newCombo = 0;
      newMiss += 1;
      newFlash = performance.now();
    }

    if (grade === 'perfect' || grade === 'good') {
      const ripple: RippleEffect = {
        id: ++effectIdCounter,
        x: 0,
        y: 0,
        startTime: performance.now(),
        grade,
      };
      set((s) => ({ ripples: [...s.ripples, ripple] }));
    } else {
      const miss: MissEffect = {
        id: ++effectIdCounter,
        x: 0,
        y: 0,
        startTime: performance.now(),
      };
      set((s) => ({ missEffects: [...s.missEffects, miss] }));
    }

    set({
      score: state.score + SCORE_MAP[grade],
      combo: newCombo,
      maxCombo: newMaxCombo,
      perfectCount: newPerfect,
      goodCount: newGood,
      missCount: newMiss,
      comboShake: newShake || state.comboShake,
      missFlash: newFlash || state.missFlash,
    });

    void track;
    void noteHitTime;
  },

  addRipple: (r) => set((s) => ({ ripples: [...s.ripples, r] })),

  addMissEffect: (m) => set((s) => ({ missEffects: [...s.missEffects, m] })),

  triggerComboMilestone: () => {
    const now = performance.now();
    const particles: ComboParticle[] = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 120 + Math.random() * 180;
      const t = (i % 10) / 10;
      const r1 = parseInt('F1C40F', 16);
      const r2 = parseInt('E67E22', 16);
      const cr = Math.round(((r1 >> 16) & 255) * (1 - t) + ((r2 >> 16) & 255) * t);
      const cg = Math.round(((r1 >> 8) & 255) * (1 - t) + ((r2 >> 8) & 255) * t);
      const cb = Math.round((r1 & 255) * (1 - t) + (r2 & 255) * t);
      particles.push({
        id: ++effectIdCounter,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        startTime: now,
        color: `rgb(${cr},${cg},${cb})`,
        size: 4 + Math.random() * 6,
      });
    }
    void TRACK_COLORS;
    set((s) => ({ comboParticles: [...s.comboParticles, ...particles] }));
  },

  cleanupEffects: (now: number) => {
    set((s) => ({
      ripples: s.ripples.filter((r) => now - r.startTime < 300),
      missEffects: s.missEffects.filter((m) => now - m.startTime < 500),
      comboParticles: s.comboParticles.filter((p) => now - p.startTime < 800),
      comboShake: now - s.comboShake < 400 ? s.comboShake : 0,
      missFlash: now - s.missFlash < 300 ? s.missFlash : 0,
    }));
  },
}));

export { noteIdCounter, effectIdCounter };
export const getNextNoteId = () => ++noteIdCounter;
