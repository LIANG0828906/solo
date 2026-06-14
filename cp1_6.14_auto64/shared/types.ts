export type Mood = 'happy' | 'sad' | 'romantic' | 'passionate';

export interface Comment {
  id: string;
  content: string;
  createdAt: number;
}

export interface Lyric {
  id: string;
  content: string[];
  mood: Mood;
  keyword: string;
  createdAt: number;
  favorites: number;
  likes: number;
  comments: Comment[];
  isFavorite?: boolean;
  rhymeWords?: string[];
}

export interface GenerateRequest {
  keyword: string;
  mood: Mood;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

export interface MoodConfig {
  key: Mood;
  label: string;
  emoji: string;
  gradient: string;
  shadowColor: string;
  presetScenes: string[];
  placeholderTexts: string[];
}

export const MOOD_CONFIGS: MoodConfig[] = [
  {
    key: 'happy',
    label: '快乐',
    emoji: '☀️',
    gradient: 'from-[#F97316] to-[#EC4899]',
    shadowColor: 'rgba(249, 115, 22, 0.4)',
    presetScenes: [
      '夏日海滩，阳光洒在金色沙滩上',
      '和朋友在天台看烟火',
      '清晨的第一杯咖啡和鸟鸣',
      '游乐园里旋转木马的笑声',
    ],
    placeholderTexts: [
      '今天的心情是...',
      '阳光正好，想写一首轻快的歌',
      '分享一件让你开心的小事...',
      '那个灿烂的午后...',
    ],
  },
  {
    key: 'sad',
    label: '忧郁',
    emoji: '🌧️',
    gradient: 'from-[#6366F1] to-[#A855F7]',
    shadowColor: 'rgba(99, 102, 241, 0.4)',
    presetScenes: [
      '雨夜，窗外的霓虹灯模糊成一片',
      '分手后独自走过熟悉的街角',
      '凌晨三点的空房间',
      '秋天最后一片落叶离开枝头',
    ],
    placeholderTexts: [
      '说不出的话，写进歌里吧...',
      '走在黄昏的街道上...',
      '那些没说出口的再见...',
      '雨一直下，像此刻的心情...',
    ],
  },
  {
    key: 'romantic',
    label: '浪漫',
    emoji: '🌹',
    gradient: 'from-[#EC4899] to-[#F472B6]',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
    presetScenes: [
      '黄昏海边，两个人的剪影',
      '巷口老书店的初次相遇',
      '天台看星星，你靠在我肩膀',
      '情人节街角那家花店',
    ],
    placeholderTexts: [
      '关于爱的故事...',
      '那个让你心动的瞬间...',
      '想把温柔写进每一句...',
      '如果风会说话...',
    ],
  },
  {
    key: 'passionate',
    label: '热血',
    emoji: '🔥',
    gradient: 'from-[#EF4444] to-[#F97316]',
    shadowColor: 'rgba(239, 68, 68, 0.4)',
    presetScenes: [
      '赛道引擎轰鸣，终点就在前方',
      '追梦路上永不言弃的少年',
      '演唱会聚光灯下的呐喊',
      '篮球场上最后一秒的绝杀',
    ],
    placeholderTexts: [
      '燃烧吧！写一首燃爆的歌！',
      '那些不服输的日子...',
      '为梦想呐喊的时刻...',
      '热血沸腾的青春...',
    ],
  },
];
