export interface DragOption {
  id: string;
  content: string;
  type: 'text' | 'image';
}

export interface DropZone {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  title: string;
  options: DragOption[];
  dropZones: DropZone[];
  correctMapping: Record<string, string>;
}

export interface Exam {
  id: string;
  title: string;
  questions: Question[];
  createdAt: number;
}

export interface StudentAnswer {
  questionId: string;
  placements: Record<string, string>;
}

export interface SubmitRequest {
  answers: StudentAnswer[];
}

export interface QuestionResult {
  questionId: string;
  score: number;
  total: number;
  correctPlacements: string[];
  wrongPlacements: string[];
  correctMapping: Record<string, string>;
}

export interface SubmitResponse {
  totalScore: number;
  maxScore: number;
  results: QuestionResult[];
}
