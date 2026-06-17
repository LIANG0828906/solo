export interface Zone {
  id: string;
  name: string;
  order: number;
}

export interface Exhibit {
  id: string;
  name: string;
  era: string;
  description: string;
  svgIcon: string;
  zoneId: string;
}

export interface QuizQuestion {
  id: string;
  exhibitId: string;
  question: string;
  options: string[];
  correctIndex: number;
}
