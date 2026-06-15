export type BookStatus = 'pending' | 'drifting' | 'arrived';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  status: BookStatus;
  currentLocation: string;
  currentLat: number;
  currentLng: number;
  createdAt: number;
  updatedAt: number;
  creatorName: string;
}

export interface DriftRecord {
  id: string;
  bookId: string;
  fromLocation: string;
  toLocation: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  statusChange: BookStatus | null;
  note: string;
  operatorName: string;
  timestamp: number;
}

export interface User {
  name: string;
  avatarColor: string;
}

export type FilterStatus = 'all' | BookStatus;

export interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  initialLocation: string;
  initialLat: number;
  initialLng: number;
}

export interface DriftRecordFormData {
  toLocation: string;
  toLat: number;
  toLng: number;
  note: string;
}

export const STATUS_LABELS: Record<BookStatus, string> = {
  pending: '待漂',
  drifting: '在漂',
  arrived: '已到',
};

export const STATUS_COLORS: Record<BookStatus, string> = {
  pending: '#FF9800',
  drifting: '#4CAF50',
  arrived: '#2196F3',
};
