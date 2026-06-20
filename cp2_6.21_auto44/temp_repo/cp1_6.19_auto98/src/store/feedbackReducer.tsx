import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type FeedbackType = 'image' | 'audio' | 'video' | 'text';
export type FeedbackStatus = 'pending' | 'processed';

export interface Tag {
  name: string;
  color: string;
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  fileName: string;
  content: string;
  tags: Tag[];
  status: FeedbackStatus;
  fileSize: number;
  createdAt: Date;
}

export interface FeedbackState {
  feedbacks: Feedback[];
}

export type Action =
  | { type: 'ADD_FEEDBACK'; payload: Feedback }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: FeedbackStatus } }
  | { type: 'DELETE_FEEDBACK'; payload: { id: string } };

export const TAG_COLORS: readonly string[] = [
  '#F1C40F',
  '#E74C3C',
  '#2ECC71',
  '#3498DB',
  '#9B59B6',
  '#95A5A6',
];

export const FILE_LIMITS: Record<FeedbackType, number> = {
  image: 5 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  video: 30 * 1024 * 1024,
  text: 2000,
};

export const PROGRESS_GRADIENT = {
  start: '#2C3E50',
  end: '#1ABC9C',
} as const;

export const STATUS_COLORS = {
  processed: '#27AE60',
  pending: '#E67E22',
} as const;

const initialState: FeedbackState = {
  feedbacks: [],
};

function feedbackReducer(state: FeedbackState, action: Action): FeedbackState {
  switch (action.type) {
    case 'ADD_FEEDBACK':
      return {
        ...state,
        feedbacks: [action.payload, ...state.feedbacks],
      };
    case 'UPDATE_STATUS':
      return {
        ...state,
        feedbacks: state.feedbacks.map((fb) =>
          fb.id === action.payload.id
            ? { ...fb, status: action.payload.status }
            : fb
        ),
      };
    case 'DELETE_FEEDBACK':
      return {
        ...state,
        feedbacks: state.feedbacks.filter((fb) => fb.id !== action.payload.id),
      };
    default:
      return state;
  }
}

interface FeedbackContextValue {
  state: FeedbackState;
  dispatch: React.Dispatch<Action>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined
);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);
  return (
    <FeedbackContext.Provider value={{ state, dispatch }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getRandomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`;
  return `${Math.floor(diffDay / 365)}年前`;
}

export function detectFileType(file: File): FeedbackType | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
