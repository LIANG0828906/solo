import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { RecordState, RecordActions } from './types';
import { TrackPoint, Trail } from '@/shared/types';
import { saveTrail, saveTrackPointsBatch } from '@/shared/db';
import { calculateTotalDistance, calculateAvgElevation } from '@/shared/utils';

const initialState: RecordState = {
  isRecording: false,
  currentTrailId: null,
  currentTrailName: '',
  points: [],
  startTime: null,
  currentPosition: null,
  error: null,
};

export const useRecordStore = create<RecordState & RecordActions>((set, get) => ({
  ...initialState,

  startRecording: async (name: string) => {
    const trailId = uuidv4();
    set({
      isRecording: true,
      currentTrailId: trailId,
      currentTrailName: name,
      points: [],
      startTime: new Date(),
      error: null,
    });
  },

  stopRecording: async (): Promise<Trail | null> => {
    const state = get();
    if (!state.currentTrailId || state.points.length === 0) {
      set(initialState);
      return null;
    }

    const distance = calculateTotalDistance(state.points);
    const avgElevation = calculateAvgElevation(state.points);

    const trail: Omit<Trail, 'id'> & { id?: string } = {
      id: state.currentTrailId,
      name: state.currentTrailName,
      createdAt: state.startTime || new Date(),
      distance,
      avgElevation,
      isPublic: true,
      likes: 0,
    };

    try {
      const savedTrail = await saveTrail(trail);
      await saveTrackPointsBatch(state.points);
      set(initialState);
      return savedTrail;
    } catch (e) {
      set({ error: '保存轨迹失败' });
      return null;
    }
  },

  addPoint: (point: Omit<TrackPoint, 'id'>) => {
    const newPoint: TrackPoint = {
      ...point,
      id: uuidv4(),
      timestamp: new Date(point.timestamp),
    };
    set(state => ({
      points: [...state.points, newPoint],
    }));
  },

  setCurrentPosition: (pos) => set({ currentPosition: pos }),

  setError: (error) => set({ error }),

  resetRecording: () => set(initialState),

  getCurrentDuration: (): number => {
    const state = get();
    if (!state.startTime) return 0;
    return (Date.now() - new Date(state.startTime).getTime()) / 1000;
  },

  getCurrentDistance: (): number => {
    const state = get();
    return calculateTotalDistance(state.points);
  },
}));
