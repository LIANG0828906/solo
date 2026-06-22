import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { PhysicsBodyConfig, BodyType, HSLColor, EffectState, RecordingFrame, BodyPhysicsData } from '@/types';
import { generateRandomColor } from '@/utils/hsl';

interface PhysicsStore {
  bodies: PhysicsBodyConfig[];
  selectedBodyId: string | null;
  physicsData: Map<string, BodyPhysicsData>;
  effectState: EffectState;
  isRecording: boolean;
  isReplaying: boolean;
  recordingFrames: RecordingFrame[];
  replayIndex: number;
  explosionTrigger: number;
  addBody: (type: BodyType, position: [number, number, number], mass: number, restitution: number, color: HSLColor) => void;
  removeBody: (id: string) => void;
  setSelectedBodyId: (id: string | null) => void;
  updatePhysicsData: (id: string, data: BodyPhysicsData) => void;
  setEffectState: (state: Partial<EffectState>) => void;
  toggleEffect: (effect: keyof EffectState) => void;
  resetScene: () => void;
  triggerExplosion: (center: [number, number, number], force: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  addRecordingFrame: (frame: RecordingFrame) => void;
  startReplay: () => void;
  stopReplay: () => void;
  setReplayIndex: (index: number) => void;
  clearRecording: () => void;
}

export const usePhysicsStore = create<PhysicsStore>((set, get) => ({
  bodies: [],
  selectedBodyId: null,
  physicsData: new Map(),
  effectState: {
    collision: true,
    explosion: false,
    fluid: false,
  },
  isRecording: false,
  isReplaying: false,
  recordingFrames: [],
  replayIndex: 0,
  explosionTrigger: 0,

  addBody: (type, position, mass, restitution, color) => {
    const newBody: PhysicsBodyConfig = {
      id: uuidv4(),
      type,
      position: [...position] as [number, number, number],
      initialPosition: [...position] as [number, number, number],
      mass,
      restitution,
      color: color || generateRandomColor(),
    };
    set((state) => ({
      bodies: [...state.bodies, newBody],
    }));
  },

  removeBody: (id) => {
    set((state) => ({
      bodies: state.bodies.filter((b) => b.id !== id),
      selectedBodyId: state.selectedBodyId === id ? null : state.selectedBodyId,
    }));
    get().physicsData.delete(id);
  },

  setSelectedBodyId: (id) => set({ selectedBodyId: id }),

  updatePhysicsData: (id, data) => {
    get().physicsData.set(id, data);
  },

  setEffectState: (state) =>
    set((prev) => ({
      effectState: { ...prev.effectState, ...state },
    })),

  toggleEffect: (effect) =>
    set((prev) => ({
      effectState: {
        ...prev.effectState,
        [effect]: !prev.effectState[effect],
      },
    })),

  resetScene: () => {
    set({
      bodies: [],
      selectedBodyId: null,
      effectState: {
        collision: true,
        explosion: false,
        fluid: false,
      },
      isRecording: false,
      isReplaying: false,
      recordingFrames: [],
      replayIndex: 0,
    });
    get().physicsData.clear();
  },

  triggerExplosion: (center, force) => {
    set((state) => ({
      explosionTrigger: state.explosionTrigger + 1,
      effectState: {
        ...state.effectState,
        explosionCenter: center,
        explosionForce: force,
      },
    }));
  },

  startRecording: () => {
    set({
      isRecording: true,
      recordingFrames: [],
      isReplaying: false,
    });
  },

  stopRecording: () => set({ isRecording: false }),

  addRecordingFrame: (frame) => {
    set((state) => {
      const MAX_FRAMES = 1800;
      const newFrames = [...state.recordingFrames, frame];
      if (newFrames.length > MAX_FRAMES) {
        newFrames.shift();
      }
      return { recordingFrames: newFrames };
    });
  },

  startReplay: () => {
    if (get().recordingFrames.length > 0) {
      set({
        isReplaying: true,
        replayIndex: 0,
        isRecording: false,
      });
    }
  },

  stopReplay: () => set({ isReplaying: false, replayIndex: 0 }),

  setReplayIndex: (index) => set({ replayIndex: index }),

  clearRecording: () => set({ recordingFrames: [] }),
}));
