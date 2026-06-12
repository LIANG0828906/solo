export interface Recipe {
  id: string;
  title: string;
  image: string;
  totalTime: string;
  difficulty: "简单" | "中等" | "困难";
  servings: number;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Step {
  number: number;
  description: string;
}

export interface RecipeDetail extends Recipe {
  ingredients: Ingredient[];
  steps: Step[];
  moldSize?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface CalculateRequest {
  ingredients: Ingredient[];
  originalServings: number;
  targetServings: number;
}

export interface CalculateResponse {
  ingredients: Ingredient[];
}
