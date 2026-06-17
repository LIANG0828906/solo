export type Emotion = 'happy' | 'sad' | 'angry' | 'calm' | 'anxious';

export const emotionColors: Record<Emotion, string> = {
  happy: '#FFD93D',
  sad: '#4D96FF',
  angry: '#FF6B6B',
  calm: '#6BCB77',
  anxious: '#9B59B6',
};

export const emotionLabels: Record<Emotion, string> = {
  happy: '快乐',
  sad: '悲伤',
  angry: '愤怒',
  calm: '平静',
  anxious: '焦虑',
};

export const emotionIcons: Record<Emotion, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  calm: '😌',
  anxious: '😰',
};

export const emotionGradientEnds: Record<Emotion, string> = {
  happy: '#FFA500',
  sad: '#8B5CF6',
  angry: '#FF3E3E',
  calm: '#34D399',
  anxious: '#C084FC',
};

export const allEmotions: Emotion[] = ['happy', 'sad', 'angry', 'calm', 'anxious'];

export function formatDateString(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
}

export function getGradientBackground(emotion: Emotion): string {
  const primary = emotionColors[emotion];
  const secondary = emotionGradientEnds[emotion];
  return `linear-gradient(135deg, ${primary}, ${secondary}, ${primary})`;
}

export function getAverageEmotionColor(emotions: Emotion[]): string {
  if (emotions.length === 0) return '#3A3A5C';
  const counts: Partial<Record<Emotion, number>> = {};
  emotions.forEach((e) => {
    counts[e] = (counts[e] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return emotionColors[sorted[0][0] as Emotion];
}

export function getDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
