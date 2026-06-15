export interface Comment {
  id: string;
  user: string;
  text: string;
  date: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  time: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  ingredients: string[];
  steps: string[];
  comments: Comment[];
}

export interface Suggestion {
  text: string;
  type: 'ingredient' | 'recipe';
}
