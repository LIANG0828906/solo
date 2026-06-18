import axios, { AxiosInstance } from 'axios';
import type { Artwork, Comment, OrderItem } from './types';

export { Artwork, Comment, OrderItem } from './types';

const BASE_URL = 'http://localhost:8000';

export const artworkAxios: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

artworkAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const artworkAxiosPublic: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export interface UpdateOrderRequest {
  gallery_id: number | string;
  order: OrderItem[];
}

export interface LikeResponse {
  likes_count: number;
  liked: boolean;
}

export const artworkApi = {
  axios: artworkAxios,

  getArtworks: async (galleryId: number | string): Promise<Artwork[]> => {
    const response = await artworkAxios.get<Artwork[]>(`/api/galleries/${galleryId}/artworks`);
    return response.data;
  },

  uploadArtworks: async (galleryId: number | string, formData: FormData): Promise<Artwork[]> => {
    const response = await artworkAxios.post<Artwork[]>(
      `/api/galleries/${galleryId}/artworks`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteArtwork: async (id: number | string): Promise<void> => {
    await artworkAxios.delete(`/api/artworks/${id}`);
  },

  updateOrder: async (galleryId: number | string, order: OrderItem[]): Promise<void> => {
    const data: UpdateOrderRequest = {
      gallery_id: galleryId,
      order,
    };
    await artworkAxios.put('/api/artworks/order', data);
  },

  likeArtwork: async (id: number | string): Promise<LikeResponse> => {
    const response = await artworkAxiosPublic.post<LikeResponse>(`/api/artworks/${id}/like`);
    return response.data;
  },

  getComments: async (artworkId: number | string): Promise<Comment[]> => {
    const response = await artworkAxiosPublic.get<Comment[]>(`/api/artworks/${artworkId}/comments`);
    return response.data;
  },

  addComment: async (
    artworkId: number | string,
    content: string,
    authorName: string
  ): Promise<Comment> => {
    const response = await artworkAxiosPublic.post<Comment>(
      `/api/artworks/${artworkId}/comments`,
      {
        content,
        author_name: authorName,
      }
    );
    return response.data;
  },
};
