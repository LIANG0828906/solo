import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  FrameData,
  RecordingStatus,
  TrainingRecord,
  DeviationMap,
  FrameComparisonResult,
  ActionType,
} from '@/types';

interface TrainingState {
  recordingStatus: RecordingStatus;
  currentFrame: FrameData | null;
  recordedFrames: FrameData[];
  currentAction: ActionType;
  startTime: number | null;
  history: TrainingRecord[];
  currentReport: TrainingRecord | null;

  setRecordingStatus: (status: RecordingStatus) => void;
  setCurrentFrame: (frame: FrameData) => void;
  startRecording: () => void;
  stopRecording: () => void;
  setCurrentAction: (action: ActionType) => void;
  saveRecord: (
    actionName: string,
    frames: FrameData[],
    frameResults: FrameComparisonResult[],
    deviationMap: DeviationMap,
    totalScore: number,
    duration: number
  ) => void;
  deleteRecord: (id: string) => void;
  setCurrentReport: (record: TrainingRecord | null) => void;
  clearRecordedFrames: () => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      recordingStatus: 'idle',
      currentFrame: null,
      recordedFrames: [],
      currentAction: 'squat',
      startTime: null,
      history: [],
      currentReport: null,

      setRecordingStatus: (status) => set({ recordingStatus: status }),

      setCurrentFrame: (frame) => {
        const { recordingStatus, recordedFrames } = get();
        if (recordingStatus === 'recording') {
          set({
            currentFrame: frame,
            recordedFrames: [...recordedFrames, frame],
          });
        } else {
          set({ currentFrame: frame });
        }
      },

      startRecording: () => {
        set({
          recordingStatus: 'recording',
          recordedFrames: [],
          startTime: Date.now(),
        });
      },

      stopRecording: () => {
        set({ recordingStatus: 'idle' });
      },

      setCurrentAction: (action) => set({ currentAction: action }),

      saveRecord: (actionName, frames, frameResults, deviationMap, totalScore, duration) => {
        const newRecord: TrainingRecord = {
          id: uuidv4(),
          actionName,
          duration,
          totalScore,
          frames,
          frameResults,
          deviationMap,
          createdAt: Date.now(),
        };
        set((state) => ({
          history: [newRecord, ...state.history],
          currentReport: newRecord,
        }));
      },

      deleteRecord: (id) => {
        set((state) => ({
          history: state.history.filter((r) => r.id !== id),
        }));
      },

      setCurrentReport: (record) => set({ currentReport: record }),

      clearRecordedFrames: () => set({ recordedFrames: [] }),
    }),
    {
      name: 'fitpose-storage',
      partialize: (state) => ({ history: state.history }),
    }
  )
);
