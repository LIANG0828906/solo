export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  createdAt: string;
}

export interface RecipeStep {
  description: string;
  waterAmount: number;
  time: number;
}

export interface Recipe {
  id: string;
  userId: string;
  username: string;
  name: string;
  beanType: string;
  grindLevel: string;
  waterTemp: number;
  pourMethod: string;
  steps: string | RecipeStep[];
  image: string;
  averageRating: number;
  voteCount: number;
  createdAt: string;
}

export interface RecipeWithDetails extends Recipe {
  steps: RecipeStep[];
  comments: Comment[];
  voteHistory: Vote[];
}

export interface Vote {
  id: string;
  recipeId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  date: string;
  beanType: string;
  tool: string;
  description: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  username: string;
  recipeId: string;
  totalRating: number;
  submittedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  recipeCount: number;
  totalRating: number;
  averageRating: number;
  challengeHistory: ChallengeSubmission[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface CreateRecipeData {
  name: string;
  beanType: string;
  grindLevel: string;
  waterTemp: number;
  pourMethod: string;
  steps: RecipeStep[];
  image: string;
}

export interface SubmitVoteData {
  recipeId: string;
  rating: number;
  comment?: string;
}

export interface SubmitChallengeData {
  challengeId: string;
  recipeId: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
