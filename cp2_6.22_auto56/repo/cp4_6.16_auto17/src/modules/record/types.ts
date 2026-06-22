import { TrackPoint, Trail } from '@/shared/types';

export interface RecordState {
  isRecording: boolean;
  currentTrailId: string | null;
  currentTrailName: string;
  points: TrackPoint[];
  startTime: Date | null;
  currentPosition: { lat: number; lng: number; elevation: number | null } | null;
  error: string | null;
}

export interface RecordActions {
  startRecording: (name: string) => Promise<void>;
  stopRecording: () => Promise<Trail | null>;
  addPoint: (point: Omit<TrackPoint, 'id'>) => void;
  setCurrentPosition: (pos: { lat: number; lng: number; elevation: number | null } | null) => void;
  setError: (error: string | null) => void;
  resetRecording: () => void;
  getCurrentDuration: () => number;
  getCurrentDistance: () => number;
}
