import axios from 'axios';
import type {
  RoomInfo,
  RoomState,
  SemanticNodeInput,
  SemanticGroupResult,
  SemanticSimilarityResult,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const apiService = {
  async createRoom(roomName: string): Promise<RoomInfo> {
    const response = await apiClient.post<RoomInfo>('/rooms', { roomName });
    return response.data;
  },

  async getRoomState(roomId: string): Promise<RoomState> {
    const response = await apiClient.get<RoomState>(`/rooms/${roomId}`);
    return response.data;
  },

  async exportRoom(roomId: string): Promise<void> {
    const response = await apiClient.post(`/rooms/${roomId}/export`, null, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
    link.setAttribute('download', fileNameMatch?.[1] || `brainstorm_${roomId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async importRoom(roomId: string, file: File): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ success: boolean }>(
      `/rooms/${roomId}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async semanticGroup(
    nodes: SemanticNodeInput[]
  ): Promise<{ groups: SemanticGroupResult[] }> {
    const response = await apiClient.post<{ groups: SemanticGroupResult[] }>(
      '/semantic/group',
      { nodes }
    );
    return response.data;
  },

  async semanticSimilarity(
    nodes: SemanticNodeInput[]
  ): Promise<{ similarities: SemanticSimilarityResult[] }> {
    const response = await apiClient.post<{ similarities: SemanticSimilarityResult[] }>(
      '/semantic/similarity',
      { nodes }
    );
    return response.data;
  },

  async clearRoom(roomId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/rooms/${roomId}/clear`);
    return response.data;
  },
};

export default apiService;
