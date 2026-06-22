export interface WordDetail {
  word: string;
  lemma: string;
  phonetic: string;
  partOfSpeech: string;
  contextDefinition: string;
  dictionaryDefinition: string;
  inflections: {
    pastTense?: string;
    presentParticiple?: string;
    pastParticiple?: string;
    plural?: string;
    comparative?: string;
    superlative?: string;
  };
  examples: Example[];
}

export interface Example {
  english: string;
  chinese: string;
  difficulty: 'easy' | 'complex';
  highlightStart: number;
  highlightEnd: number;
}

export interface CollectionWord {
  id: string;
  word: string;
  lemma: string;
  contextSentence: string;
  collectedAt: number;
  reviewCount: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: number;
  lastReviewedAt?: number;
}

export interface LearningStats {
  todayLearned: number;
  totalCollected: number;
  dueForReview: number;
}

export interface LookupWordRequest {
  word: string;
  context: string;
  paragraph: string;
}

export interface LookupWordResponse {
  success: boolean;
  data?: WordDetail;
  error?: string;
}

export interface CollectionRequest {
  word: string;
  lemma: string;
  contextSentence: string;
}

export interface ReviewResultRequest {
  quality: number;
}

export interface WordPosition {
  x: number;
  y: number;
  word: string;
  context: string;
  paragraph: string;
}
