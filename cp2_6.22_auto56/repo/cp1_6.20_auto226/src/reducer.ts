import { Score, Comment, ViewMode, Note } from './types';

export interface AppState {
  score: Score;
  comments: Comment[];
  isPlaying: boolean;
  currentBeat: number;
  bpm: number;
  selectedVoiceId: string;
  viewMode: ViewMode;
  selectedMeasureIndex: number;
  activeNoteId: string | null;
}

export type AppAction =
  | { type: 'LOAD_SCORE'; payload: Score }
  | { type: 'LOAD_COMMENTS'; payload: Comment[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: { measureId: string; noteId: string } }
  | { type: 'MOVE_NOTE'; payload: { measureId: string; noteId: string; pitch: number; startBeat: number } }
  | { type: 'ADD_VOICE_TO_MEASURE'; payload: { measureId: string; voiceId: string } }
  | { type: 'REMOVE_VOICE_FROM_MEASURE'; payload: { measureId: string; voiceId: string } }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'REPLY_TO_COMMENT'; payload: Comment }
  | { type: 'MARK_COMMENT_READ'; payload: string }
  | { type: 'MOVE_COMMENT_BUBBLE'; payload: { id: string; x: number; y: number } }
  | { type: 'SET_BPM'; payload: number }
  | { type: 'START_PLAYBACK' }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'UPDATE_PLAYBACK_POSITION'; payload: number }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SELECTED_VOICE'; payload: string }
  | { type: 'SET_SELECTED_MEASURE'; payload: number }
  | { type: 'SET_ACTIVE_NOTE'; payload: string | null };

export const defaultVoices = [
  { id: 'vocal', name: '主唱', color: '#4fc3f7' },
  { id: 'guitar', name: '吉他', color: '#81c784' },
  { id: 'bass', name: '贝斯', color: '#ffb74d' },
  { id: 'drums', name: '鼓', color: '#e57373' },
];

export const initialState: AppState = {
  score: {
    id: '',
    title: '新乐谱',
    bpm: 120,
    voices: defaultVoices,
    measures: [
      { id: 'm1', number: 1, voiceIds: [], notes: [] },
      { id: 'm2', number: 2, voiceIds: [], notes: [] },
      { id: 'm3', number: 3, voiceIds: [], notes: [] },
      { id: 'm4', number: 4, voiceIds: [], notes: [] },
    ],
    createdAt: '',
    updatedAt: '',
  },
  comments: [],
  isPlaying: false,
  currentBeat: 0,
  bpm: 120,
  selectedVoiceId: 'vocal',
  viewMode: 'staff',
  selectedMeasureIndex: 0,
  activeNoteId: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_SCORE':
      return { ...state, score: action.payload, bpm: action.payload.bpm };

    case 'LOAD_COMMENTS':
      return { ...state, comments: action.payload };

    case 'ADD_NOTE': {
      const measures = state.score.measures.map(m =>
        m.id === action.payload.measureId ? { ...m, notes: [...m.notes, action.payload] } : m
      );
      return { ...state, score: { ...state.score, measures } };
    }

    case 'DELETE_NOTE': {
      const measures = state.score.measures.map(m =>
        m.id === action.payload.measureId
          ? { ...m, notes: m.notes.filter(n => n.id !== action.payload.noteId) }
          : m
      );
      return { ...state, score: { ...state.score, measures } };
    }

    case 'MOVE_NOTE': {
      const measures = state.score.measures.map(m =>
        m.id === action.payload.measureId
          ? {
              ...m,
              notes: m.notes.map(n =>
                n.id === action.payload.noteId
                  ? { ...n, pitch: action.payload.pitch, startBeat: action.payload.startBeat }
                  : n
              ),
            }
          : m
      );
      return { ...state, score: { ...state.score, measures } };
    }

    case 'ADD_VOICE_TO_MEASURE': {
      const measures = state.score.measures.map(m =>
        m.id === action.payload.measureId && !m.voiceIds.includes(action.payload.voiceId)
          ? { ...m, voiceIds: [...m.voiceIds, action.payload.voiceId] }
          : m
      );
      return { ...state, score: { ...state.score, measures } };
    }

    case 'REMOVE_VOICE_FROM_MEASURE': {
      const measures = state.score.measures.map(m =>
        m.id === action.payload.measureId
          ? {
              ...m,
              voiceIds: m.voiceIds.filter(v => v !== action.payload.voiceId),
              notes: m.notes.filter(n => n.voiceId !== action.payload.voiceId),
            }
          : m
      );
      return { ...state, score: { ...state.score, measures } };
    }

    case 'ADD_COMMENT':
      return { ...state, comments: [...state.comments, action.payload] };

    case 'REPLY_TO_COMMENT':
      return { ...state, comments: [...state.comments, action.payload] };

    case 'MARK_COMMENT_READ': {
      const comments = state.comments.map(c =>
        c.id === action.payload ? { ...c, read: true } : c
      );
      return { ...state, comments };
    }

    case 'MOVE_COMMENT_BUBBLE': {
      const comments = state.comments.map(c =>
        c.id === action.payload.id ? { ...c, x: action.payload.x, y: action.payload.y } : c
      );
      return { ...state, comments };
    }

    case 'SET_BPM':
      return { ...state, bpm: action.payload, score: { ...state.score, bpm: action.payload } };

    case 'START_PLAYBACK':
      return { ...state, isPlaying: true, currentBeat: 0 };

    case 'STOP_PLAYBACK':
      return { ...state, isPlaying: false, currentBeat: 0 };

    case 'UPDATE_PLAYBACK_POSITION':
      return { ...state, currentBeat: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'SET_SELECTED_VOICE':
      return { ...state, selectedVoiceId: action.payload };

    case 'SET_SELECTED_MEASURE':
      return { ...state, selectedMeasureIndex: action.payload };

    case 'SET_ACTIVE_NOTE':
      return { ...state, activeNoteId: action.payload };

    default:
      return state;
  }
}
