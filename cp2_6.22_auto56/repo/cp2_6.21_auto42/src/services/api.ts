import axios from 'axios';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export type PlantVariety = 'pothos' | 'cactus' | 'sunflower' | 'succulent';
export type PlantStage = 'sprout' | 'growing' | 'flowering' | 'wilting';

export interface Plant {
  id: number;
  user_id: number;
  variety: PlantVariety;
  name: string;
  stage: PlantStage;
  days: number;
  water: number;
  fertilizer: number;
  sunlight: number;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  plant_id: number;
  image_url: string;
  variety: string;
  likes: number;
  liked_by_me: boolean;
  username: string;
  comments: Comment[];
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }),
  
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }),
};

export const plantAPI = {
  getPlants: () => api.get<Plant[]>('/plants'),
  
  getPlant: (id: number) => api.get<Plant>(`/plants/${id}`),
  
  createPlant: (variety: PlantVariety, name: string) =>
    api.post<Plant>('/plants', { variety, name }),
  
  updatePlant: (id: number, data: Partial<Plant>) =>
    api.put<Plant>(`/plants/${id}`, data),
  
  water: (id: number) => api.post<Plant>(`/plants/${id}/water`),
  
  fertilize: (id: number) => api.post<Plant>(`/plants/${id}/fertilize`),
  
  sunlight: (id: number) => api.post<Plant>(`/plants/${id}/sunlight`),
};

export const postAPI = {
  getPosts: (page: number = 1, variety?: string, sortBy?: string) =>
    api.get<Post[]>('/posts', { params: { page, variety, sortBy } }),
  
  createPost: (plantId: number, imageUrl: string, variety: string) =>
    api.post<Post>('/posts', { plant_id: plantId, image_url: imageUrl, variety }),
  
  likePost: (id: number) => api.post<{ likes: number; liked: boolean }>(`/posts/${id}/like`),
  
  addComment: (id: number, content: string) =>
    api.post<Comment>(`/posts/${id}/comment`, { content }),
};

export const varietyNames: Record<PlantVariety, string> = {
  pothos: '绿萝',
  cactus: '仙人掌',
  sunflower: '向日葵',
  succulent: '多肉',
};

export const stageNames: Record<PlantStage, string> = {
  sprout: '小芽',
  growing: '生长',
  flowering: '开花',
  wilting: '蔫萎',
};

export const varietyColors: Record<PlantVariety, string> = {
  pothos: '#4caf50',
  cactus: '#8bc34a',
  sunflower: '#ffc107',
  succulent: '#9c27b0',
};

export default api;
