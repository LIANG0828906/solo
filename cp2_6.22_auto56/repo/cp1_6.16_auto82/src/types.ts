export interface Message {
  id: string;
  content: string;
  color: string;
  timestamp: number;
  likes: number;
  floatOffset: number;
  floatDuration: number;
  isNew?: boolean;
}

export type SortType = 'latest' | 'hottest';

export const COLOR_PALETTE: string[] = [
  '#a8d8ea',
  '#aae6c6',
  '#ffb7c5',
  '#fff3b0',
  '#d4b3ff',
  '#ffccb3',
  '#b3e0e6',
  '#ff99cc',
  '#c5e8a8',
  '#b3d9ff',
  '#ffb3b3',
  '#fff099',
];
