export interface User {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

export interface EditEvent {
  id: string;
  userId: string;
  type: 'insert' | 'delete';
  position: number;
  text: string;
  deletedText?: string;
  timestamp: string;
}

export interface CursorPosition {
  userId: string;
  position: number;
}

export interface EditorHandle {
  scrollToPosition: (position: number, length: number) => void;
  getQuill: () => any;
}
