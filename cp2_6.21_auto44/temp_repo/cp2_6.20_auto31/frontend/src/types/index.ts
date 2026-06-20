export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

export interface Vinyl {
  id: string;
  title: string;
  artist: string;
  release_year: number;
  genre: string;
  rating: number;
  notes: string;
  cover_url: string;
  owner_id: string;
  created_at: string;
}

export interface PlayRecord {
  id: string;
  user_id: string;
  vinyl_id: string;
  played_at: string;
  duration_seconds: number;
  vinyl?: Vinyl;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Post {
  id: string;
  user_id: string;
  vinyl_id: string;
  content: string;
  created_at: string;
  user?: User;
  vinyl?: Vinyl;
  likes_count?: number;
  comments?: Comment[];
  is_liked?: boolean;
}

export interface CommunityFeed {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface LoginResponse {
  token: string;
  refresh_token?: string;
  user: User;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface VinylSearchParams extends PaginationParams {
  search?: string;
  genre?: string;
}
