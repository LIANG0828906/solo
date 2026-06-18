export type Emotion = 'happy' | 'sad' | 'psychedelic' | 'cool';

export interface AudioItem {
  id: string;
  title: string;
  emotion: Emotion;
  duration: number;
  likes: number;
  filePath: string;
  createdAt: string;
  audioData?: number[];
}

const API_BASE = '/api';

export async function uploadAudio(
  file: Blob,
  title: string,
  emotion: Emotion,
  duration: number,
  audioData: number[]
): Promise<AudioItem> {
  const formData = new FormData();
  formData.append('file', file, 'recording.webm');
  formData.append('title', title);
  formData.append('emotion', emotion);
  formData.append('duration', String(duration));
  formData.append('audioData', JSON.stringify(audioData));

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('上传失败');
  }

  return response.json();
}

export async function getAudios(emotion?: Emotion): Promise<AudioItem[]> {
  const url = emotion
    ? `${API_BASE}/audios?emotion=${emotion}`
    : `${API_BASE}/audios`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('获取音频列表失败');
  }

  return response.json();
}

export async function likeAudio(id: string): Promise<AudioItem> {
  const response = await fetch(`${API_BASE}/audios/${id}/like`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('点赞失败');
  }

  return response.json();
}

export const EMOTION_COLORS: Record<Emotion, string> = {
  happy: '#FF6B6B',
  sad: '#6C5CE7',
  psychedelic: '#A29BFE',
  cool: '#00CEC9',
};

export const EMOTION_LABELS: Record<Emotion, string> = {
  happy: '欢快',
  sad: '忧伤',
  psychedelic: '迷幻',
  cool: '冷峻',
};
