export interface CountryInfo {
  name: string;
  code: string;
  lat: number;
  lng: number;
}

export interface QuizQuestion {
  id: string;
  country: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: 'culture' | 'history' | 'geography';
}

export interface LeaderboardEntry {
  id: string;
  score: number;
  streak: number;
  duration: number;
  timestamp: number;
  countriesAnswered: string[];
}

export interface QuizResult {
  isCorrect: boolean;
  scoreGained: number;
  streak: number;
  correctAnswer: string;
  explanation: string;
}
