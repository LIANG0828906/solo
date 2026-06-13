export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Step {
  id: string;
  description: string;
  duration: number;
  ingredients: Ingredient[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Recipe {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  prepTime: number;
  cookTime: number;
  steps: Step[];
  reviews: Review[];
  createdAt: number;
  averageRating: number;
}

export interface TimerState {
  recipeId: string;
  currentStepIndex: number;
  remainingTime: number;
  isRunning: boolean;
  completedSteps: string[];
  lastUpdated: number;
}

export interface CreateRecipeRequest {
  title: string;
  coverImage: string;
  description: string;
  prepTime: number;
  cookTime: number;
  steps: Omit<Step, 'id'>[];
}

export interface AddReviewRequest {
  userName: string;
  rating: number;
  comment: string;
}
