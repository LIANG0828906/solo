import type { Mood } from '@/types';

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getMoodColor = (mood: Mood): string => {
  const colors: Record<Mood, string> = {
    happy: '#2ECC71',
    calm: '#457B9D',
    sad: '#A8DADC',
    angry: '#E63946',
  };
  return colors[mood];
};

export const getMoodEmoji = (mood: Mood): string => {
  const emojis: Record<Mood, string> = {
    happy: '😊',
    calm: '😌',
    sad: '😢',
    angry: '😠',
  };
  return emojis[mood];
};

export const getWeatherEmoji = (mood: Mood): string => {
  const weathers: Record<Mood, string> = {
    happy: '☀️',
    calm: '⛅',
    sad: '🌧️',
    angry: '⛈️',
  };
  return weathers[mood];
};

export const determineMoodFromAudio = (amplitude: number, baseFrequency: number): Mood => {
  const normalizedAmp = Math.min(1, amplitude / 128);
  const normalizedFreq = Math.min(1, baseFrequency / 1000);
  if (normalizedAmp > 0.7 && normalizedFreq > 0.6) return 'angry';
  if (normalizedAmp > 0.4 && normalizedFreq > 0.5) return 'happy';
  if (normalizedAmp < 0.3 && normalizedFreq < 0.4) return 'sad';
  return 'calm';
};

export const getConsecutiveDays = (dates: string[]): number => {
  if (dates.length === 0) return 0;
  const sortedDates = [...new Set(dates.map(d => new Date(d).toDateString())]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let count = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(sortedDates[i]);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() === expectedDate.getTime()) {
      count++;
    } else {
      if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        if (checkDate.getTime() === yesterday.getTime()) {
          count++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }
  return count;
};

export const generateMockWaveformData = (length: number = 100): number[] => {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    const base = Math.sin(i * 0.1) * 0.3;
    const noise = (Math.random() - 0.5) * 0.4;
    data.push(Math.max(0.1, Math.min(1, 0.5 + base + noise));
  }
  return data;
};
