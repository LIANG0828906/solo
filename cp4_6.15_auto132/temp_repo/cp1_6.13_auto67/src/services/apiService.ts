import axios from 'axios';
import { Exhibit, Booth, Comment } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const apiService = {
  getExhibits: (): Promise<Exhibit[]> =>
    api.get('/exhibits').then((r) => r.data),

  createExhibit: (data: Omit<Exhibit, 'id' | 'likes' | 'boothId'>): Promise<Exhibit> =>
    api.post('/exhibits', data).then((r) => r.data),

  updateExhibit: (id: string, data: Partial<Omit<Exhibit, 'id'>>): Promise<Exhibit> =>
    api.put(`/exhibits/${id}`, data).then((r) => r.data),

  deleteExhibit: (id: string): Promise<void> =>
    api.delete(`/exhibits/${id}`).then((r) => r.data),

  likeExhibit: (id: string): Promise<{ likes: number }> =>
    api.post(`/exhibits/${id}/like`).then((r) => r.data),

  getBooths: (): Promise<Booth[]> =>
    api.get('/booths').then((r) => r.data),

  createBooth: (data: { name: string }): Promise<Booth> =>
    api.post('/booths', data).then((r) => r.data),

  assignExhibitsToBooth: (boothId: string, exhibitIds: string[]): Promise<Booth> =>
    api.put(`/booths/${boothId}/assign`, { exhibitIds }).then((r) => r.data),

  getBoothQRCode: (boothId: string): Promise<{ qrCode: string; boothNumber: number; boothName: string; visitorUrl: string }> =>
    api.get(`/booths/${boothId}/qrcode`).then((r) => r.data),

  getBoothExhibits: (boothId: string): Promise<{ booth: Booth; exhibits: Exhibit[] }> =>
    api.get(`/booths/${boothId}/exhibits`).then((r) => r.data),

  getExhibitComments: (exhibitId: string): Promise<Comment[]> =>
    api.get(`/exhibits/${exhibitId}/comments`).then((r) => r.data),

  createComment: (exhibitId: string, data: { author: string; content: string }): Promise<Comment> =>
    api.post(`/exhibits/${exhibitId}/comments`, data).then((r) => r.data),

  pollBooth: (boothId: string): Promise<{ exhibits: Exhibit[]; comments: Comment[] }> =>
    api.get(`/booths/${boothId}/poll`).then((r) => r.data),

  downloadQRCode: (boothId: string): Promise<Blob> =>
    api.get(`/booths/${boothId}/qrcode/download`, { responseType: 'blob' }).then((r) => r.data),
};

export default apiService;
