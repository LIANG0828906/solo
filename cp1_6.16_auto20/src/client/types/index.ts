export interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  createdAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: Date;
}

export interface Recipe {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  title: string;
  description: string;
  imageUrl: string;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  steps: Step[];
  likes: number;
  comments: Comment[];
  createdAt: Date;
}

export interface FeedItem extends Recipe {
  isLiked: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface CreateRecipeRequest {
  title: string;
  description: string;
  imageUrl: string;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Omit<Ingredient, 'id'>[];
  steps: Omit<Step, 'id'>[];
}

export interface RecipeListResponse {
  recipes: FeedItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecipeListState {
  recipes: FeedItem[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface AppContextType {
  user: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string, email: string) => Promise<void>;
}
