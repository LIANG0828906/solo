export interface Question {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  status: 'pending' | 'answered' | 'resolved';
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  parentId: string | null;
  upvotes: number;
  downvotes: number;
  isBest: boolean;
  createdAt: string;
  replies?: Answer[];
}

export interface KnowledgeCard {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  content: string;
  isFavorited: boolean;
  createdAt: string;
}

export interface Draft {
  title: string;
  description: string;
  tags: string[];
  savedAt: string;
}

export interface AppState {
  questions: Question[];
  answers: Record<string, Answer[]>;
  cards: KnowledgeCard[];
  draft: Draft | null;
  favorites: string[];
}

export interface AppActions {
  addQuestion: (question: Question) => void;
  getQuestion: (id: string) => Question | undefined;
  getSimilarQuestions: (tags: string[]) => Question[];
  addAnswer: (questionId: string, answer: Answer) => void;
  getAnswers: (questionId: string) => Answer[];
  voteAnswer: (questionId: string, answerId: string, type: 'up' | 'down') => void;
  setBestAnswer: (questionId: string, answerId: string) => void;
  addCard: (card: KnowledgeCard) => void;
  toggleFavorite: (cardId: string) => void;
  saveDraft: (draft: Draft) => void;
  loadDraft: () => Draft | null;
  clearDraft: () => void;
}
