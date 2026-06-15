import { create } from 'zustand';
import { BellState, GameState, ParticleData, PlayedNote, ScaleNote } from '@/types';
import {
  MAX_BELLS,
  MIN_BELLS,
  DEFAULT_VELOCITY,
  MAX_PLAYED_NOTES,
  BELL_SIZE_RANGE,
  HARMONY_DISTANCE_THRESHOLD,
  ADJACENT_SCALES,
} from '@/utils/constants';
import { playBellSound, playHarmonySound, playRandomMelody } from '@/utils/audio';

const generateBellId = () => `bell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateNoteId = () => `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

let particleIdCounter = 0;

const createInitialBell = (index: number, total: number): BellState => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 5 + Math.random() * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = 3 + Math.random() * 2;
  const size = BELL_SIZE_RANGE[0] + Math.random() * (BELL_SIZE_RANGE[1] - BELL_SIZE_RANGE[0]);

  return {
    id: generateBellId(),
    position: [x, y, z],
    targetPosition: null,
    scaleNote: null,
    size,
    isDragging: false,
    isRinging: false,
    isHarmonizing: false,
    ringIntensity: 0,
    floatOffset: Math.random() * Math.PI * 2,
  };
};

const createInitialBells = (count: number): BellState[] => {
  return Array.from({ length: count }, (_, i) => createInitialBell(i, count));
};

const getDistance = (pos1: [number, number, number], pos2: [number, number, number]): number => {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const useGameStore = create<GameState>((set, get) => ({
  bells: createInitialBells(5),
  playedNotes: [],
  velocity: DEFAULT_VELOCITY,
  bellCount: 5,
  particles: [],
  harmonyPairs: new Set<string>(),

  setVelocity: (v: number) => set({ velocity: Math.max(0, Math.min(100, v)) }),

  setBellCount: (n: number) => {
    const count = Math.max(MIN_BELLS, Math.min(MAX_BELLS, n));
    const { bells } = get();
    const currentCount = bells.length;

    if (count > currentCount) {
      const newBells = Array.from({ length: count - currentCount }, (_, i) =>
        createInitialBell(currentCount + i, count)
      );
      set({ bells: [...bells, ...newBells], bellCount: count });
    } else if (count < currentCount) {
      set({
        bells: bells.slice(0, count),
        bellCount: count,
      });
    } else {
      set({ bellCount: count });
    }
  },

  addBell: () => {
    const { bells, bellCount } = get();
    if (bellCount >= MAX_BELLS) return;
    const newBell = createInitialBell(bells.length, bells.length + 1);
    set({ bells: [...bells, newBell], bellCount: bellCount + 1 });
  },

  removeBell: () => {
    const { bells, bellCount } = get();
    if (bellCount <= MIN_BELLS) return;
    const nonPlacedBells = bells.filter((b) => !b.scaleNote);
    if (nonPlacedBells.length === 0) return;
    const bellToRemove = nonPlacedBells[nonPlacedBells.length - 1];
    set({
      bells: bells.filter((b) => b.id !== bellToRemove.id),
      bellCount: bellCount - 1,
    });
  },

  updateBellPosition: (id: string, pos: [number, number, number], isDragging: boolean) => {
    set((state) => ({
      bells: state.bells.map((bell) =>
        bell.id === id ? { ...bell, position: pos, isDragging } : bell
      ),
    }));
  },

  placeBellOnScale: (id: string, note: ScaleNote, pos: [number, number, number]) => {
    const { velocity, bells, harmonyPairs } = get();

    set((state) => ({
      bells: state.bells.map((bell) =>
        bell.id === id
          ? {
              ...bell,
              position: pos,
              targetPosition: pos,
              scaleNote: note,
              isDragging: false,
              isRinging: true,
              ringIntensity: 1,
            }
          : bell
      ),
    }));

    playBellSound(note, velocity);

    const playedNote: PlayedNote = {
      id: generateNoteId(),
      note,
      octave: 4,
      velocity,
      timestamp: Date.now(),
      duration: 3,
    };

    set((state) => ({
      playedNotes: [...state.playedNotes, playedNote].slice(-MAX_PLAYED_NOTES),
    }));

    const currentBell = get().bells.find((b) => b.id === id);
    if (currentBell) {
      const placedBells = get().bells.filter(
        (b) => b.scaleNote && b.id !== id
      );

      for (const otherBell of placedBells) {
        if (!otherBell.scaleNote || !currentBell.scaleNote) continue;

        const distance = getDistance(currentBell.position, otherBell.position);
        const adjacent = ADJACENT_SCALES[currentBell.scaleNote].includes(otherBell.scaleNote);

        if (distance < HARMONY_DISTANCE_THRESHOLD && adjacent) {
          const pairKey = [id, otherBell.id].sort().join('-');
          if (!harmonyPairs.has(pairKey)) {
            get().triggerHarmony(id, otherBell.id);
          }
        }
      }
    }

    setTimeout(() => {
      set((state) => ({
        bells: state.bells.map((bell) =>
          bell.id === id ? { ...bell, isRinging: false, ringIntensity: 0 } : bell
        ),
      }));
    }, 2000);
  },

  triggerBellRing: (id: string, intensity: number) => {
    const { velocity } = get();
    set((state) => ({
      bells: state.bells.map((bell) =>
        bell.id === id ? { ...bell, isRinging: true, ringIntensity: intensity } : bell
      ),
    }));

    const bell = get().bells.find((b) => b.id === id);
    if (bell?.scaleNote) {
      playBellSound(bell.scaleNote, velocity * intensity);
    }

    setTimeout(() => {
      set((state) => ({
        bells: state.bells.map((bell) =>
          bell.id === id ? { ...bell, isRinging: false, ringIntensity: 0 } : bell
        ),
      }));
    }, 2000);
  },

  triggerHarmony: (id1: string, id2: string) => {
    const { velocity, harmonyPairs } = get();
    const pairKey = [id1, id2].sort().join('-');

    if (harmonyPairs.has(pairKey)) return;

    const newHarmonyPairs = new Set(harmonyPairs);
    newHarmonyPairs.add(pairKey);
    set({ harmonyPairs: newHarmonyPairs });

    set((state) => ({
      bells: state.bells.map((bell) =>
        bell.id === id1 || bell.id === id2
          ? { ...bell, isHarmonizing: true, isRinging: true, ringIntensity: 0.8 }
          : bell
      ),
    }));

    const bell1 = get().bells.find((b) => b.id === id1);
    const bell2 = get().bells.find((b) => b.id === id2);

    if (bell1?.scaleNote && bell2?.scaleNote) {
      playHarmonySound(bell1.scaleNote, bell2.scaleNote, velocity);
      playRandomMelody();
    }

    setTimeout(() => {
      set((state) => ({
        bells: state.bells.map((bell) =>
          bell.id === id1 || bell.id === id2
            ? { ...bell, isHarmonizing: false, isRinging: false, ringIntensity: 0 }
            : bell
        ),
      }));

      const updatedPairs = new Set(get().harmonyPairs);
      updatedPairs.delete(pairKey);
      set({ harmonyPairs: updatedPairs });
    }, 3000);
  },

  addPlayedNote: (note: Omit<PlayedNote, 'id' | 'timestamp'>) => {
    const playedNote: PlayedNote = {
      ...note,
      id: generateNoteId(),
      timestamp: Date.now(),
    };
    set((state) => ({
      playedNotes: [...state.playedNotes, playedNote].slice(-MAX_PLAYED_NOTES),
    }));
  },

  addParticles: (position: [number, number, number], color: string, count: number) => {
    const newParticles: ParticleData[] = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.5 + Math.random() * 1.5;

      newParticles.push({
        id: particleIdCounter++,
        position: [...position],
        velocity: [
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 0.5,
          Math.sin(phi) * Math.sin(theta) * speed,
        ],
        color,
        life: 1,
        maxLife: 1.5 + Math.random(),
        size: 0.05 + Math.random() * 0.1,
      });
    }

    set((state) => ({
      particles: [...state.particles, ...newParticles],
    }));
  },

  updateParticles: (delta: number) => {
    set((state) => ({
      particles: state.particles
        .map((p) => ({
          ...p,
          position: [
            p.position[0] + p.velocity[0] * delta,
            p.position[1] + p.velocity[1] * delta,
            p.position[2] + p.velocity[2] * delta,
          ],
          velocity: [
            p.velocity[0] * 0.98,
            p.velocity[1] - 0.5 * delta,
            p.velocity[2] * 0.98,
          ],
          life: p.life - delta / p.maxLife,
        }))
        .filter((p) => p.life > 0),
    }));
  },

  resetBells: () => {
    set({
      bells: createInitialBells(get().bellCount),
      playedNotes: [],
      particles: [],
      harmonyPairs: new Set<string>(),
    });
  },

  clearHarmonyPairs: () => {
    set({ harmonyPairs: new Set<string>() });
  },
}));
