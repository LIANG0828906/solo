import { v4 as uuidv4 } from 'uuid';
import type { AudioItem, UserInfo, EmotionType } from '@/types';
import { generateThumbnail } from '@/modules/canvasRenderer';

const STORAGE_KEY = 'sound-gallery-data';
const USER_KEY = 'sound-gallery-user';

export async function fetchAudioList(): Promise<AudioItem[]> {
  await delay(300);

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const mockData = generateMockData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
  return mockData;
}

export async function fetchUserInfo(): Promise<UserInfo> {
  await delay(200);

  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const user: UserInfo = {
    id: 'user-001',
    nickname: '音乐旅人',
    avatar: generateAvatarDataUrl(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function uploadAudio(
  file: File,
  emotion: EmotionType,
  intensity: number,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<AudioItem> {
  const audioUrl = URL.createObjectURL(file);
  const duration = await getAudioDuration(audioUrl);

  for (let i = 0; i <= 100; i += 10) {
    await delay(50);
    onProgress?.(i);
  }

  const thumbnailData = generateThumbnail(emotion, intensity, 260, 180);

  const audio: AudioItem = {
    id: uuidv4(),
    title: file.name.replace(/\.[^/.]+$/, ''),
    emotion,
    intensity,
    duration,
    playCount: 0,
    createdAt: Date.now(),
    userId,
    audioUrl,
    thumbnailData,
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  const list: AudioItem[] = stored ? JSON.parse(stored) : [];
  list.unshift(audio);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  return audio;
}

export async function deleteAudio(audioId: string): Promise<void> {
  await delay(200);

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const list: AudioItem[] = JSON.parse(stored);
    const filtered = list.filter((a) => a.id !== audioId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      resolve(15);
    });
  });
}

function generateMockData(): AudioItem[] {
  const emotions: EmotionType[] = ['happy', 'sad', 'angry', 'calm'];
  const titles = [
    '清晨的阳光',
    '雨中漫步',
    '心灵火花',
    '星空下的梦',
    '海浪声声',
    '夏日回忆',
  ];

  const items: AudioItem[] = [];

  for (let i = 0; i < 6; i++) {
    const emotion = emotions[i % 4];
    const intensity = 0.4 + Math.random() * 0.5;

    items.push({
      id: uuidv4(),
      title: titles[i],
      emotion,
      intensity,
      duration: 15 + Math.random() * 15,
      playCount: Math.floor(Math.random() * 100),
      createdAt: Date.now() - i * 86400000,
      userId: 'user-001',
      audioUrl: '',
      thumbnailData: generateThumbnail(emotion, intensity, 260, 180),
    });
  }

  return items;
}

function generateAvatarDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const gradient = ctx.createRadialGradient(40, 40, 0, 40, 40, 40);
  gradient.addColorStop(0, '#6C63FF');
  gradient.addColorStop(1, '#4A42D1');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(40, 40, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('音', 40, 40);

  return canvas.toDataURL('image/png');
}
