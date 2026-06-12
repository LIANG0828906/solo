export interface Emotion {
  id: string;
  label: string;
  hsl: string;
  hue: number;
  hint: string;
}

export interface DiaryEntry {
  date: string;
  emotionId: string;
  note: string;
  createdAt: number;
}

export const EMOTIONS: Emotion[] = [
  { id: 'joy', label: '快乐', hue: 0, hsl: 'hsl(0, 85%, 65%)', hint: '今天有什么让你心花怒放的事呢？' },
  { id: 'passion', label: '热情', hue: 30, hsl: 'hsl(30, 90%, 60%)', hint: '什么事情点燃了你的热情之火？' },
  { id: 'content', label: '满足', hue: 60, hsl: 'hsl(50, 85%, 60%)', hint: '此刻内心充满了怎样的满足感？' },
  { id: 'calm', label: '平静', hue: 90, hsl: 'hsl(120, 50%, 60%)', hint: '愿这份宁静陪伴你度过每一天。' },
  { id: 'energy', label: '活力', hue: 120, hsl: 'hsl(150, 70%, 55%)', hint: '充沛的精力让你想做些什么？' },
  { id: 'secure', label: '安心', hue: 150, hsl: 'hsl(180, 65%, 55%)', hint: '是什么让你感到如此踏实安心？' },
  { id: 'hope', label: '希望', hue: 180, hsl: 'hsl(200, 80%, 60%)', hint: '你对明天有哪些美好的期待？' },
  { id: 'expect', label: '期待', hue: 210, hsl: 'hsl(230, 80%, 68%)', hint: '有什么好事即将发生吗？' },
  { id: 'melancholy', label: '忧郁', hue: 240, hsl: 'hsl(250, 50%, 65%)', hint: '淡淡的忧伤也是生活的一部分。' },
  { id: 'anxiety', label: '焦虑', hue: 270, hsl: 'hsl(280, 55%, 65%)', hint: '深呼吸，把担心的事写下来吧。' },
  { id: 'anger', label: '愤怒', hue: 300, hsl: 'hsl(330, 75%, 65%)', hint: '是什么触动了你的情绪边界？' },
  { id: 'tired', label: '疲惫', hue: 330, hsl: 'hsl(20, 35%, 65%)', hint: '辛苦了，今天好好休息一下吧。' }
];

export function getEmotionById(id: string): Emotion | undefined {
  return EMOTIONS.find(e => e.id === id);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
