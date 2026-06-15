export enum QuestionType {
  CHOICE = 'choice',
  SORT = 'sort',
  BLANK = 'blank',
}

export interface ChoiceOption {
  id: string;
  label: string;
  content: string;
}

export interface ChoiceQuestion {
  id: string;
  type: QuestionType.CHOICE;
  stem: string;
  options: ChoiceOption[];
  correctAnswers: string[];
  isMultiple: boolean;
}

export interface SortItem {
  id: string;
  content: string;
}

export interface SortQuestion {
  id: string;
  type: QuestionType.SORT;
  stem: string;
  items: SortItem[];
  correctOrder: string[];
}

export interface BlankItem {
  id: string;
  correctAnswers: string[];
}

export interface BlankQuestion {
  id: string;
  type: QuestionType.BLANK;
  stem: string;
  blanks: BlankItem[];
}

export type Question = ChoiceQuestion | SortQuestion | BlankQuestion;

export type FontSize = 'small' | 'medium' | 'large';
