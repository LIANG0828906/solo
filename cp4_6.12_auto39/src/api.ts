import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  community: string;
  building: string;
  points: number;
}

export interface Item {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  community: string;
  building: string;
  images: string[];
  publisherId: string;
  publisherNickname: string;
  publisherAvatar: string;
  status: 'available' | 'claimed' | 'given';
  claims: Claim[];
  createdAt: number;
  distance: number;
}

export interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  claimantNickname: string;
  claimantAvatar: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  itemTitle?: string;
  itemImage?: string;
}

export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemId: string;
  type: 'positive' | 'negative';
  createdAt: number;
}

export const authApi = {
  login: (userId: string): Promise<{ user: User; token: string }> =>
    api.post('/auth/login', { userId }),
  getMe: (): Promise<{ user: User }> => api.get('/auth/me'),
  updateProfile: (data: Partial<User>): Promise<{ user: User }> =>
    api.put('/user/profile', data),
};

export const itemsApi = {
  getNearbyItems: (params?: {
    category?: string;
    sort?: string;
    community?: string;
  }): Promise<{ items: Item[] }> => api.get('/items', { params }),
  getItem: (id: string): Promise<{ item: Item }> => api.get(`/items/${id}`),
  getMyItems: (): Promise<{ items: Item[] }> => api.get('/items/mine'),
  publishItem: (formData: FormData): Promise<{ item: Item }> =>
    api.post('/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  claimItem: (id: string, reason: string): Promise<{ claim: Claim }> =>
    api.post(`/items/${id}/claim`, { reason }),
  confirmTransfer: (id: string): Promise<{ item: Item }> =>
    api.post(`/items/${id}/confirm-transfer`),
};

export const claimsApi = {
  getMyClaims: (): Promise<{ claims: Claim[] }> => api.get('/claims/mine'),
  approveClaim: (claimId: string): Promise<{ claim: Claim; item: Item }> =>
    api.post(`/claims/${claimId}/approve`),
  rejectClaim: (claimId: string): Promise<{ claim: Claim }> =>
    api.post(`/claims/${claimId}/reject`),
};

export const reviewsApi = {
  getMyReviews: (): Promise<{ reviews: Review[] }> => api.get('/reviews/mine'),
  createReview: (data: {
    toUserId: string;
    itemId: string;
    type: 'positive' | 'negative';
  }): Promise<{ review: Review; user: User }> => api.post('/reviews', data),
};

export const uploadApi = {
  uploadImage: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const usersApi = {
  getUser: (id: string): Promise<{ user: User }> => api.get(`/users/${id}`),
};

export default api;
