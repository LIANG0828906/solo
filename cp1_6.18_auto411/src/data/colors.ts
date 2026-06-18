import { v4 as uuidv4 } from 'uuid';

export type EmotionType = '快乐' | '平静' | '兴奋' | '忧伤' | '焦虑' | '疲惫';

export interface ColorEmotion {
  id: string;
  color: string;
  name: string;
  emotions: { type: EmotionType; weight: number }[];
}

export const EMOTION_COLORS: Record<EmotionType, string> = {
  快乐: '#FFD700',
  平静: '#4ECDC4',
  兴奋: '#FF6B6B',
  忧伤: '#98D8C8',
  焦虑: '#87CEEB',
  疲惫: '#B0C4DE',
};

export const SUGGESTION_ACTIVITIES: Record<EmotionType, { emoji: string; text: string }[]> = {
  快乐: [
    { emoji: '🎉', text: '与朋友分享快乐时刻' },
    { emoji: '📸', text: '记录当下美好瞬间' },
  ],
  平静: [
    { emoji: '🌲', text: '森林散步' },
    { emoji: '🍵', text: '品茶静心' },
  ],
  兴奋: [
    { emoji: '💃', text: '随音乐舞动身体' },
    { emoji: '🎨', text: '创作一幅画' },
  ],
  忧伤: [
    { emoji: '📖', text: '阅读温暖的故事' },
    { emoji: '🐶', text: '与宠物相伴' },
  ],
  焦虑: [
    { emoji: '🧘', text: '5分钟深呼吸冥想' },
    { emoji: '🌊', text: '聆听白噪音放松' },
  ],
  疲惫: [
    { emoji: '😴', text: '小睡20分钟充电' },
    { emoji: '🛁', text: '泡一个舒缓的澡' },
  ],
};

export const COLORS_DATA: ColorEmotion[] = [
  {
    id: uuidv4(),
    color: '#FF6B6B',
    name: '珊瑚红',
    emotions: [
      { type: '兴奋', weight: 2 },
      { type: '快乐', weight: 0.5 },
    ],
  },
  {
    id: uuidv4(),
    color: '#4ECDC4',
    name: '薄荷青',
    emotions: [
      { type: '平静', weight: 1.5 },
      { type: '快乐', weight: 0.8 },
    ],
  },
  {
    id: uuidv4(),
    color: '#45B7D1',
    name: '天空蓝',
    emotions: [
      { type: '平静', weight: 1.2 },
      { type: '焦虑', weight: 0.6 },
    ],
  },
  {
    id: uuidv4(),
    color: '#96CEB4',
    name: '抹茶绿',
    emotions: [
      { type: '平静', weight: 1.8 },
      { type: '疲惫', weight: 0.4 },
    ],
  },
  {
    id: uuidv4(),
    color: '#FFEAA7',
    name: '奶油黄',
    emotions: [
      { type: '快乐', weight: 1.6 },
      { type: '平静', weight: 0.7 },
    ],
  },
  {
    id: uuidv4(),
    color: '#DDA0DD',
    name: '藕荷紫',
    emotions: [
      { type: '兴奋', weight: 0.8 },
      { type: '忧伤', weight: 1.3 },
    ],
  },
  {
    id: uuidv4(),
    color: '#98D8C8',
    name: '迷雾绿',
    emotions: [
      { type: '忧伤', weight: 1.7 },
      { type: '平静', weight: 0.9 },
    ],
  },
  {
    id: uuidv4(),
    color: '#FFA07A',
    name: '珊瑚橙',
    emotions: [
      { type: '兴奋', weight: 1.4 },
      { type: '快乐', weight: 1.1 },
    ],
  },
  {
    id: uuidv4(),
    color: '#87CEEB',
    name: '淡天蓝',
    emotions: [
      { type: '焦虑', weight: 1.5 },
      { type: '平静', weight: 0.8 },
    ],
  },
  {
    id: uuidv4(),
    color: '#FFD700',
    name: '向日葵黄',
    emotions: [
      { type: '快乐', weight: 2 },
      { type: '兴奋', weight: 0.9 },
    ],
  },
  {
    id: uuidv4(),
    color: '#B0C4DE',
    name: '雾霾蓝',
    emotions: [
      { type: '疲惫', weight: 1.6 },
      { type: '忧伤', weight: 0.7 },
    ],
  },
  {
    id: uuidv4(),
    color: '#FFDAB9',
    name: '蜜桃粉',
    emotions: [
      { type: '疲惫', weight: 1.1 },
      { type: '快乐', weight: 0.9 },
    ],
  },
];

export type EmotionWeights = Record<EmotionType, number>;

export const createEmptyWeights = (): EmotionWeights => ({
  快乐: 0,
  平静: 0,
  兴奋: 0,
  忧伤: 0,
  焦虑: 0,
  疲惫: 0,
});

export const ALL_EMOTIONS: EmotionType[] = ['快乐', '平静', '兴奋', '忧伤', '焦虑', '疲惫'];
