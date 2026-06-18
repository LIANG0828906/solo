import { create } from 'zustand';
import type { DiaryEntry, EmotionCoords, EmotionType, Comment, User } from '../types';

interface DiaryState {
  diaries: DiaryEntry[];
  currentDiary: DiaryEntry | null;
  currentUser: User | null;
  comments: Comment[];
  emotionFilter: EmotionType | null;
  setCurrentDiary: (diary: DiaryEntry | null) => void;
  setEmotionFilter: (filter: EmotionType | null) => void;
  addDiary: (diary: DiaryEntry) => void;
  setDiaries: (diaries: DiaryEntry[]) => void;
  setComments: (comments: Comment[]) => void;
  setCurrentUser: (user: User | null) => void;
  addComment: (comment: Comment) => void;
  getFilteredDiaries: () => DiaryEntry[];
}

const mockUser: User = {
  id: 'user-1',
  name: '匿名用户',
};

const generateMockDiaries = (): DiaryEntry[] => {
  const emotions: { type: EmotionType; keyword: string; arousal: number; valence: number }[] = [
    { type: 'happy', keyword: '开心', arousal: 80, valence: 85 },
    { type: 'calm', keyword: '平静', arousal: 30, valence: 60 },
    { type: 'sad', keyword: '忧伤', arousal: 25, valence: 20 },
    { type: 'anxious', keyword: '焦虑', arousal: 75, valence: 30 },
    { type: 'angry', keyword: '愤怒', arousal: 90, valence: 15 },
    { type: 'happy', keyword: '喜悦', arousal: 70, valence: 90 },
    { type: 'calm', keyword: '安宁', arousal: 20, valence: 70 },
    { type: 'sad', keyword: '惆怅', arousal: 35, valence: 25 },
    { type: 'anxious', keyword: '紧张', arousal: 85, valence: 25 },
  ];

  return emotions.map((em, index) => ({
    id: `diary-${index + 1}`,
    emotionCoords: { arousal: em.arousal, valence: em.valence },
    emotionType: em.type,
    emotionKeyword: em.keyword,
    textContent: `今天的心情记录 #${index + 1}：${index % 2 === 0 ? '阳光明媚的一天，心情很好。' : '有些事情需要慢慢消化。'}`,
    isPublic: true,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    userId: mockUser.id,
    commentCount: Math.floor(Math.random() * 10),
  }));
};

export const useDiaryStore = create<DiaryState>((set, get) => ({
  diaries: generateMockDiaries(),
  currentDiary: null,
  currentUser: mockUser,
  comments: [],
  emotionFilter: null,

  setCurrentDiary: (diary) => set({ currentDiary: diary }),
  setEmotionFilter: (filter) => set({ emotionFilter: filter }),
  addDiary: (diary) => set((state) => ({ diaries: [diary, ...state.diaries] })),
  setDiaries: (diaries) => set({ diaries }),
  setComments: (comments) => set({ comments }),
  setCurrentUser: (user) => set({ currentUser: user }),
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
  getFilteredDiaries: () => {
    const { diaries, emotionFilter } = get();
    if (!emotionFilter) return diaries.filter((d) => d.isPublic);
    return diaries.filter((d) => d.isPublic && d.emotionType === emotionFilter);
  },
}));

export function coordsToEmotion(coords: EmotionCoords): { type: EmotionType; keyword: string } {
  const { arousal, valence } = coords;

  if (arousal > 70 && valence > 60) return { type: 'happy', keyword: '开心' };
  if (arousal > 70 && valence < 40) return { type: 'anxious', keyword: '焦虑' };
  if (arousal > 60 && valence < 30) return { type: 'angry', keyword: '愤怒' };
  if (arousal < 40 && valence > 50) return { type: 'calm', keyword: '平静' };
  if (arousal < 50 && valence < 40) return { type: 'sad', keyword: '忧伤' };
  if (valence > 55) return { type: 'happy', keyword: '愉悦' };
  if (valence < 45) return { type: 'sad', keyword: '低落' };
  return { type: 'calm', keyword: '平和' };
}

export function emotionToColor(type: EmotionType): string {
  const colors: Record<EmotionType, string> = {
    happy: '#FFD54F',
    calm: '#81C784',
    sad: '#64B5F6',
    anxious: '#FF8A65',
    angry: '#E57373',
  };
  return colors[type];
}

export function emotionToBgGradient(type: EmotionType): string {
  const gradients: Record<EmotionType, string> = {
    happy: '#FFF3E0',
    calm: '#E8F5E9',
    sad: '#E3F2FD',
    anxious: '#FBE9E7',
    angry: '#FFEBEE',
  };
  return gradients[type];
}
