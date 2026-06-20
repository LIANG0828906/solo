export interface Exhibit {
  id: string;
  title: string;
  era: string;
  artist: string;
  description: string;
  fullDescription: string;
  images: string[];
  audioUrl?: string;
  position: [number, number, number];
  modelType: 'sculpture' | 'painting' | 'artifact';
}

export interface QuizQuestion {
  id: string;
  exhibitId: string;
  question: string;
  options: string[];
  correctIndex: number;
  position: [number, number, number];
}

export interface QuizState {
  questionId: string;
  answered: boolean;
  correct?: boolean;
  cooldownUntil?: number;
}

export interface TourWaypoint {
  position: [number, number, number];
  target: [number, number, number];
  duration: number;
  pauseDuration: number;
  exhibitId?: string;
}

export interface ClientToServerEvents {
  joinQuiz: (exhibitId: string) => void;
  submitAnswer: (questionId: string, answerIndex: number) => void;
  requestTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  endTour: () => void;
  moveToPosition: (position: [number, number, number]) => void;
  interactWithExhibit: (exhibitId: string) => void;
}

export interface QuizAnswerPayload {
  questionId: string;
  answerIndex: number;
  playerId: string;
  playerName: string;
}

export interface ServerToClientEvents {
  quizQuestion: (question: QuizQuestion) => void;
  quizResult: (state: QuizState) => void;
  tourWaypoint: (waypoint: TourWaypoint, index: number, total: number) => void;
  tourPaused: () => void;
  tourResumed: () => void;
  tourEnded: () => void;
  exhibitUpdate: (exhibit: Exhibit) => void;
  playerPosition: (playerId: string, position: [number, number, number]) => void;
  error: (message: string) => void;
  'quiz:state': (data: { questionId: string; state: QuizState }) => void;
  'quiz:result': (data: { questionId: string; isCorrect: boolean; correctAnswer: number; playerName: string }) => void;
  'quiz:cooldown': (data: { questionId: string; remainingMs: number }) => void;
  'quiz:error': (data: { message: string }) => void;
  'quiz:alreadyAnswered': (data: { questionId: string }) => void;
}

export interface ClientToServerEvents {
  joinQuiz: (exhibitId: string) => void;
  submitAnswer: (questionId: string, answerIndex: number) => void;
  requestTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  endTour: () => void;
  moveToPosition: (position: [number, number, number]) => void;
  interactWithExhibit: (exhibitId: string) => void;
  'quiz:answer': (payload: QuizAnswerPayload) => void;
}
