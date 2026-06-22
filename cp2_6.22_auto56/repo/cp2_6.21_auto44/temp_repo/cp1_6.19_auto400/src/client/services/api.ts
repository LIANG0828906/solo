import axios from 'axios';
import { Song, SongListItem, ChordOp, LyricOp } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
});

export const songAPI = {
  getSongs: async (): Promise<SongListItem[]> => {
    const response = await api.get('/songs');
    return response.data.songs;
  },

  createSong: async (name: string, timeSignature: '4/4' | '3/4'): Promise<Song> => {
    const response = await api.post('/songs', { name, timeSignature });
    return response.data.song;
  },

  getSong: async (id: string): Promise<Song> => {
    const response = await api.get(`/songs/${id}`);
    return response.data.song;
  },

  updateSong: async (id: string, updates: { name?: string; bpm?: number; key?: string }): Promise<Song> => {
    const response = await api.put(`/songs/${id}`, updates);
    return response.data.song;
  },

  addChord: async (songId: string, op: ChordOp): Promise<void> => {
    await api.post(`/songs/${songId}/chords`, op);
  },

  removeChord: async (songId: string, op: Omit<ChordOp, 'chord'>): Promise<void> => {
    await api.delete(`/songs/${songId}/chords`, { data: op });
  },

  updateLyric: async (songId: string, op: LyricOp): Promise<void> => {
    await api.put(`/songs/${songId}/lyrics`, op);
  },

  getRecommendation: async (songId: string, measure?: number): Promise<{ recommended: string; alternatives: string[]; score: number }> => {
    const params = measure ? { measure } : {};
    const response = await api.get(`/songs/${songId}/recommend`, { params });
    return response.data;
  },

  getCommonChords: async (): Promise<string[]> => {
    const response = await api.get('/chords/common');
    return response.data.chords;
  },

  getChordNotes: async (chord: string): Promise<number[]> => {
    const response = await api.post('/chords/notes', { chord });
    return response.data.notes;
  }
};

export default api;
