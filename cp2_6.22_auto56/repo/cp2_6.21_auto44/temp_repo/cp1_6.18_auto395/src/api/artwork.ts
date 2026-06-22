import axios from 'axios';
import type { Artwork, OrderItem } from './index';

const api = axios.create({
  baseURL: '/api',
});

export const artworkApi = {
  async getArtworks(galleryId: number): Promise<Artwork[]> {
    const { data } = await api.get(`/galleries/${galleryId}/artworks`);
    return data;
  },

  async uploadArtworks(galleryId: number, formData: FormData): Promise<Artwork[]> {
    const { data } = await api.post(`/galleries/${galleryId}/artworks`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteArtwork(id: number): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/artworks/${id}`);
    return data;
  },

  async updateOrder(galleryId: number, order: OrderItem[]): Promise<{ success: boolean }> {
    const { data } = await api.put('/artworks/order', {
      gallery_id: galleryId,
      order,
    });
    return data;
  },

  async likeArtwork(id: number): Promise<{ likes: number; liked: boolean }> {
    const { data } = await api.post(`/artworks/${id}/like`);
    return data;
  },
};
