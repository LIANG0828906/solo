import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface PhotoItem {
  id: string;
  file: File;
  url: string;
  order: number;
}

export type TransitionType = 'fade' | 'slideLeft' | 'zoom' | 'rotate' | 'checkerboard';

export interface MediaState {
  photos: PhotoItem[];
  audioFile: File | null;
  audioUrl: string | null;
  transitionType: TransitionType;
  photoDuration: number;
  overlayColor: string | null;
  volume: number;
  fadeInOut: boolean;
  isExporting: boolean;
  exportProgress: number;
  isPreviewPlaying: boolean;
}

export type MediaAction =
  | { type: 'ADD_PHOTOS'; payload: File[] }
  | { type: 'REMOVE_PHOTO'; payload: string }
  | { type: 'REORDER_PHOTOS'; payload: PhotoItem[] }
  | { type: 'SET_AUDIO'; payload: { file: File; url: string } | null }
  | { type: 'SET_TRANSITION'; payload: TransitionType }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_OVERLAY_COLOR'; payload: string | null }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_FADE_IN_OUT'; payload: boolean }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'SET_EXPORT_PROGRESS'; payload: number }
  | { type: 'SET_PREVIEW_PLAYING'; payload: boolean };

const initialState: MediaState = {
  photos: [],
  audioFile: null,
  audioUrl: null,
  transitionType: 'fade',
  photoDuration: 3,
  overlayColor: null,
  volume: 80,
  fadeInOut: false,
  isExporting: false,
  exportProgress: 0,
  isPreviewPlaying: false,
};

function mediaReducer(state: MediaState, action: MediaAction): MediaState {
  switch (action.type) {
    case 'ADD_PHOTOS': {
      const newPhotos = action.payload.map((file, index) => ({
        id: uuidv4(),
        file,
        url: URL.createObjectURL(file),
        order: state.photos.length + index,
      }));
      return { ...state, photos: [...state.photos, ...newPhotos] };
    }
    case 'REMOVE_PHOTO': {
      const photo = state.photos.find((p) => p.id === action.payload);
      if (photo) URL.revokeObjectURL(photo.url);
      const remaining = state.photos
        .filter((p) => p.id !== action.payload)
        .map((p, i) => ({ ...p, order: i }));
      return { ...state, photos: remaining };
    }
    case 'REORDER_PHOTOS':
      return {
        ...state,
        photos: action.payload.map((p, i) => ({ ...p, order: i })),
      };
    case 'SET_AUDIO': {
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
      return {
        ...state,
        audioFile: action.payload?.file ?? null,
        audioUrl: action.payload?.url ?? null,
      };
    }
    case 'SET_TRANSITION':
      return { ...state, transitionType: action.payload };
    case 'SET_DURATION':
      return { ...state, photoDuration: action.payload };
    case 'SET_OVERLAY_COLOR':
      return { ...state, overlayColor: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_FADE_IN_OUT':
      return { ...state, fadeInOut: action.payload };
    case 'SET_EXPORTING':
      return { ...state, isExporting: action.payload };
    case 'SET_EXPORT_PROGRESS':
      return { ...state, exportProgress: action.payload };
    case 'SET_PREVIEW_PLAYING':
      return { ...state, isPreviewPlaying: action.payload };
    default:
      return state;
  }
}

interface MediaContextValue {
  state: MediaState;
  dispatch: Dispatch<MediaAction>;
}

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mediaReducer, initialState);
  return (
    <MediaContext.Provider value={{ state, dispatch }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMediaContext(): MediaContextValue {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMediaContext must be used within MediaProvider');
  return ctx;
}
