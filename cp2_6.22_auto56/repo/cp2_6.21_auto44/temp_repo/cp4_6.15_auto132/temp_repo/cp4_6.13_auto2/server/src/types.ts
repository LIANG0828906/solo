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

export interface SM2Metrics {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface WordBankEntry {
  word: string;
  phonetic: string;
  definitions: {
    [key: string]: {
      pos: string;
      meaning: string;
      examples: {
        english: string;
        chinese: string;
        difficulty: 'easy' | 'complex';
      }[];
    };
  };
  inflections?: {
    pastTense?: string;
    presentParticiple?: string;
    pastParticiple?: string;
    plural?: string;
    comparative?: string;
    superlative?: string;
  };
}
