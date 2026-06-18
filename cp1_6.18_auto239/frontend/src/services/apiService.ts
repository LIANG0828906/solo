import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export interface EmotionRecord {
  id: number;
  emotion_type: string;
  note: string;
  timestamp: string;
  anonymous_id: string;
  hugs: number;
  comments: Comment[];
}

export interface Comment {
  id: number;
  emotion_id: number;
  content: string;
  anonymous_id: string;
  timestamp: string;
  is_hug: boolean;
}

export interface TimelineData {
  day: string;
  开心: number;
  平静: number;
  焦虑: number;
  烦躁: number;
  疲惫: number;
}

export interface WeeklyReport {
  peak_emotion: string;
  avg_score: number;
  tips: string;
  distribution: Record<string, number>;
}

export interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
  dominant_emotion: string;
  score: number;
}

export const submitEmotion = async (emotionType: string, note: string) => {
  const res = await api.post<EmotionRecord>('/emotion', { emotion_type: emotionType, note });
  return res.data;
};

export const fetchTimeline = async () => {
  const res = await api.get<TimelineData[]>('/timeline');
  return res.data;
};

export const fetchRecords = async () => {
  const res = await api.get<EmotionRecord[]>('/records');
  return res.data;
};

export const postComment = async (emotionId: number, content: string) => {
  const res = await api.post<Comment>('/comment', { emotion_id: emotionId, content, is_hug: false });
  return res.data;
};

export const postHug = async (emotionId: number) => {
  const res = await api.post<Comment>('/comment', { emotion_id: emotionId, content: '', is_hug: true });
  return res.data;
};

export const fetchComments = async (emotionId: number) => {
  const res = await api.get<Comment[]>(`/comments/${emotionId}`);
  return res.data;
};

export const fetchReport = async () => {
  const res = await api.get<WeeklyReport>('/report');
  return res.data;
};

export const fetchHeatmap = async () => {
  const res = await api.get<HeatmapCell[]>('/team-heatmap');
  return res.data;
};
