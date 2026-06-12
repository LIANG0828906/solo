export interface Meme {
  id: string;
  name: string;
  tags: string[];
  imageUrl: string;
  author: string;
  likes: number;
  liked: boolean;
  downloads: number;
  createdAt: string;
}

export interface BubbleStyle {
  id: string;
  name: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shape: 'rounded' | 'lightning' | 'cloud';
}

export interface TextBubble {
  id: string;
  text: string;
  styleId: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
}

export interface PlacedSticker {
  id: string;
  stickerEmoji: string;
  x: number;
  y: number;
  scale: number;
}

export const BUBBLE_STYLES: BubbleStyle[] = [
  { id: 'white', name: '白色圆角', backgroundColor: '#ffffff', borderColor: '#cccccc', borderWidth: 1, borderRadius: 12, shape: 'rounded' },
  { id: 'yellow', name: '黄色圆角', backgroundColor: '#fff3cd', borderColor: '#ff9f43', borderWidth: 1, borderRadius: 12, shape: 'rounded' },
  { id: 'red', name: '红色闪电', backgroundColor: '#f8d7da', borderColor: '#ff4757', borderWidth: 2, borderRadius: 4, shape: 'lightning' },
  { id: 'blue', name: '蓝色圆角', backgroundColor: '#d6eaf8', borderColor: '#54a0ff', borderWidth: 1, borderRadius: 12, shape: 'rounded' },
  { id: 'green', name: '绿色云朵', backgroundColor: '#d5f5e3', borderColor: '#2ed573', borderWidth: 1, borderRadius: 20, shape: 'cloud' },
  { id: 'purple', name: '紫色圆角', backgroundColor: '#e8daef', borderColor: '#a55eea', borderWidth: 1, borderRadius: 12, shape: 'rounded' },
];

export const STICKER_LIST: Sticker[] = [
  { id: 's1', emoji: '🐱', name: '猫咪' },
  { id: 's2', emoji: '🐶', name: '小狗' },
  { id: 's3', emoji: '😂', name: '笑哭' },
  { id: 's4', emoji: '❤️', name: '爱心' },
  { id: 's5', emoji: '⚡', name: '闪电' },
  { id: 's6', emoji: '⭐', name: '星星' },
  { id: 's7', emoji: '🔥', name: '火焰' },
  { id: 's8', emoji: '🎉', name: '庆祝' },
  { id: 's9', emoji: '🤣', name: '爆笑' },
  { id: 's10', emoji: '💪', name: '加油' },
];
