export type Priority = 'high' | 'medium' | 'low';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  labels: string[];
  dueDate: string | null;
  subtasks: Subtask[];
  comments: Comment[];
  columnId: string;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface BoardState {
  columns: Column[];
  cards: Record<string, Card>;
  labels: Label[];
  projectName: string;
  projectDescription: string;
}

export interface BoardContextType extends BoardState {
  moveCard: (cardId: string, sourceColId: string, destColId: string, destIndex: number) => void;
  addCard: (columnId: string, card: Omit<Card, 'id' | 'columnId' | 'subtasks' | 'comments'>) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  addSubtask: (cardId: string, title: string) => void;
  toggleSubtask: (cardId: string, subtaskId: string) => void;
  addComment: (cardId: string, author: string, content: string) => void;
  updateColumnTitle: (columnId: string, title: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  activeLabelId: string | null;
  setActiveLabelId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
