export type Importance = 1 | 2 | 3;
export type CookingMethod = '炒' | '煎' | '炖' | '蒸' | '炸' | '烤' | '焗' | '焖';

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  origin: string;
  seasonMonths: number[];
  importance: Importance;
  rating: number;
}

export interface CookingRelation {
  from: string;
  to: string;
  method: CookingMethod;
}

export interface TopologyNode {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  label: string;
  emoji: string;
  origin: string;
  seasonMonths: number[];
  importance: Importance;
  rating: number;
  radius: number;
  color: string;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  method: CookingMethod;
  color: string;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface Dish {
  id: string;
  userId: string;
  author: string;
  name: string;
  coverImage: string;
  rating: number;
  ingredients: Ingredient[];
  methods: CookingMethod[];
  relations: CookingRelation[];
  topology: Topology;
  tags: string[];
  createdAt: number;
}

export interface Comment {
  id: string;
  dishId: string;
  userId: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  date: string;
  text: string;
  likes: number;
  replies: number;
  liked?: boolean;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  size: number;
  total: number;
}

export interface ApiError {
  code: number;
  message: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
