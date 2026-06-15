export interface Rating {
  userId: string;
  score: number;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  favorites: string[];
  token?: string;
}

export interface HeritageItem {
  id: string;
  name: string;
  region: string;
  category: string;
  images: string[];
  videoUrl?: string;
  story: string;
  ratings: Rating[];
  averageRating: number;
  createdAt: string;
  createdBy: string;
}

export interface HeritageListResponse {
  items: HeritageItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface HeritageListParams {
  page?: number;
  limit?: number;
  category?: string;
  region?: string;
  keyword?: string;
  sort?: 'newest' | 'rating' | 'popular';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
