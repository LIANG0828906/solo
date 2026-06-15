import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface UserInfo {
  id: string;
  username: string;
}

export interface Song {
  id: string;
  name: string;
  artist: string;
  cover: string;
  duration: number;
}

export interface MoodResponse {
  mood: string;
  label: string;
  color: string;
  description: string;
  tags: string[];
  songs: Song[];
}

export const loginUser = async (username: string, password: string): Promise<UserInfo> => {
  const res = await api.post('/login', { username, password });
  return res.data;
};

export const registerUser = async (username: string, password: string): Promise<UserInfo> => {
  const res = await api.post('/register', { username, password });
  return res.data;
};

export const getMoodSongs = async (mood: string): Promise<MoodResponse> => {
  const res = await api.get(`/moods/${mood}/songs`);
  return res.data;
};

export const submitLike = async (userId: string, songId: string, action: 'like' | 'dislike') => {
  await api.post('/songs/like', { userId, songId, action });
};

export const getUserHistory = async (userId: string) => {
  const res = await api.get(`/user/${userId}/history`);
  return res.data;
};

export const saveMoodHistory = async (userId: string, mood: string) => {
  await api.post(`/user/${userId}/history`, { mood });
};
