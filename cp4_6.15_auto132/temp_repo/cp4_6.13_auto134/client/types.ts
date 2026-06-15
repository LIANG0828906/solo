export type Option = {
  label: string;
  text: string;
};

export type PublicQuestion = {
  id: number;
  questionNumber: number;
  questionText: string;
  options: Option[];
  isActive: boolean;
  isEnded: boolean;
  correctOption?: string;
};

export type QuestionSummary = {
  id: number;
  questionNumber: number;
  questionText: string;
  correctRate: number;
  isActive: boolean;
  isEnded: boolean;
};

export type OptionStats = {
  option: string;
  count: number;
};

export type QuestionStatsData = {
  questionId: number;
  totalParticipants: number;
  correctCount: number;
  correctRate: number;
  options: OptionStats[];
};

export type StudentResult = {
  selectedOption: string | null;
  isCorrect: boolean;
  correctOption: string;
};
