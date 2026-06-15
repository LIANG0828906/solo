export interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  image?: string;
  timeMinutes: number;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  tags: string[];
  totalTime: number;
  author: string;
  ingredients: Ingredient[];
  steps: Step[];
}

export interface Substitution {
  id: string;
  original: string;
  substitute: string;
  amount: string;
  textureChange: string;
  timeAdjustment: number;
}

export interface AppliedSubstitution {
  ingredientId: string;
  originalName: string;
  substituteName: string;
  substituteAmount: string;
  timeAdjustment: number;
}
