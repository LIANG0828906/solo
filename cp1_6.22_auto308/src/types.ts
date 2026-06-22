export interface Recipe {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  cookTime: number;
  category: Category;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  nickname: string;
  avatar: string;
  text: string;
  rating: number;
  createdAt: number;
}

export type Category = '早餐' | '午餐' | '晚餐' | '甜点' | '饮品';

export const CATEGORIES: Category[] = ['早餐', '午餐', '晚餐', '甜点', '饮品'];

export const DEFAULT_AVATARS = [
  '#FF7043', '#66BB6A', '#42A5F5', '#AB47BC', '#FFA726',
  '#EF5350', '#26A69A', '#5C6BC0', '#EC407A', '#8D6E63',
];
