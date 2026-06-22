// 用户信息接口
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

// 食谱步骤接口
export interface RecipeStep {
  id: number;
  order: number;
  description: string;
  image?: string;
}

// 食谱接口
export interface Recipe {
  id: number;
  title: string;
  description: string;
  coverImage?: string;
  ingredients: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookTime: number;
  servings: number;
  author: User;
  steps: RecipeStep[];
  isFavorite: boolean;
  favoriteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// 评论接口
export interface Comment {
  id: number;
  content: string;
  user: User;
  recipeId: number;
  createdAt: string;
}

// 认证响应接口
export interface AuthResponse {
  user: User;
  token: string;
}

// 食谱表单数据接口
export interface RecipeFormData {
  title: string;
  description: string;
  coverImage?: File | string;
  ingredients: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookTime: number;
  servings: number;
  steps: StepFormData[];
}

// 步骤表单数据接口
export interface StepFormData {
  id?: number;
  order: number;
  description: string;
  image?: File | string;
}
