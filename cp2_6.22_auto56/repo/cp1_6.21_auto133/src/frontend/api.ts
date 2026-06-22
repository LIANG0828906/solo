import axios from 'axios';
import { Flashcard, ApiResponse, Rating } from './types';

const API_BASE = '/api';

export const api = {
  async getAllCards(): Promise<Flashcard[]> {
    const response = await axios.get<ApiResponse<Flashcard[]>>(`${API_BASE}/cards`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch cards');
  },

  async getCard(id: string): Promise<Flashcard> {
    const response = await axios.get<ApiResponse<Flashcard>>(`${API_BASE}/cards/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch card');
  },

  async createCard(title: string, content: string, tags: string[]): Promise<Flashcard> {
    const response = await axios.post<ApiResponse<Flashcard>>(`${API_BASE}/cards`, {
      title,
      content,
      tags
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create card');
  },

  async updateCard(id: string, title: string, content: string, tags: string[]): Promise<Flashcard> {
    const response = await axios.put<ApiResponse<Flashcard>>(`${API_BASE}/cards/${id}`, {
      title,
      content,
      tags
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update card');
  },

  async deleteCard(id: string): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`${API_BASE}/cards/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete card');
    }
  },

  async getDueCards(): Promise<Flashcard[]> {
    const response = await axios.get<ApiResponse<Flashcard[]>>(`${API_BASE}/review/due`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch due cards');
  },

  async rateCard(cardId: string, rating: Rating): Promise<Flashcard> {
    const response = await axios.post<ApiResponse<Flashcard>>(`${API_BASE}/review/rate`, {
      cardId,
      rating
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to rate card');
  }
};
