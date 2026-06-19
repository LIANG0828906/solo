import type { Flower, Bouquet, EmotionTagType } from './types';

export const FLOWERS: Flower[] = [
  {
    id: 'rose-red',
    name: '红玫瑰',
    color: '#E91E63',
    meaning: '热情真爱，我心永恒',
    icon: '🌹',
    tags: ['浪漫', '温暖']
  },
  {
    id: 'rose-pink',
    name: '粉玫瑰',
    color: '#FF6B81',
    meaning: '初恋心动，温柔告白',
    icon: '🌸',
    tags: ['浪漫', '清新']
  },
  {
    id: 'rose-white',
    name: '白玫瑰',
    color: '#F5F5F5',
    meaning: '纯洁无瑕，纯真之爱',
    icon: '🤍',
    tags: ['祝福', '优雅']
  },
  {
    id: 'lily',
    name: '百合',
    color: '#FFFFFF',
    meaning: '百年好合，纯洁高雅',
    icon: '🌷',
    tags: ['祝福', '优雅', '治愈']
  },
  {
    id: 'tulip-red',
    name: '红色郁金香',
    color: '#FF4444',
    meaning: '热烈的爱，喜悦祝福',
    icon: '🌺',
    tags: ['浪漫', '惊喜']
  },
  {
    id: 'tulip-yellow',
    name: '黄色郁金香',
    color: '#FFD93D',
    meaning: '阳光开朗，友谊长存',
    icon: '🌻',
    tags: ['温暖', '鼓励', '祝福']
  },
  {
    id: 'sunflower',
    name: '向日葵',
    color: '#FFB347',
    meaning: '阳光自信，追逐梦想',
    icon: '🌼',
    tags: ['温暖', '鼓励', '清新']
  },
  {
    id: 'eucalyptus',
    name: '尤加利叶',
    color: '#A8C686',
    meaning: '清新自然，恩赐回忆',
    icon: '🌿',
    tags: ['清新', '治愈']
  },
  {
    id: 'hydrangea',
    name: '绣球花',
    color: '#87CEEB',
    meaning: '美满团圆，希望永恒',
    icon: '💐',
    tags: ['祝福', '治愈', '惊喜']
  },
  {
    id: 'carnation-pink',
    name: '粉康乃馨',
    color: '#FFB6C1',
    meaning: '感恩母爱，温馨祝福',
    icon: '🌷',
    tags: ['温暖', '祝福']
  },
  {
    id: 'carnation-red',
    name: '红康乃馨',
    color: '#DC143C',
    meaning: '敬爱关怀，热烈的心',
    icon: '🌹',
    tags: ['温暖', '鼓励']
  },
  {
    id: 'lavender',
    name: '薰衣草',
    color: '#9B59B6',
    meaning: '等待爱情，浪漫芬芳',
    icon: '💜',
    tags: ['浪漫', '治愈', '优雅']
  },
  {
    id: 'baby-breath',
    name: '满天星',
    color: '#E8E8E8',
    meaning: '真心喜欢，配角也美',
    icon: '✨',
    tags: ['浪漫', '清新', '祝福']
  },
  {
    id: 'daisy',
    name: '小雏菊',
    color: '#FFFACD',
    meaning: '天真无邪，深藏的爱',
    icon: '🌼',
    tags: ['清新', '治愈', '鼓励']
  },
  {
    id: 'orchid',
    name: '兰花',
    color: '#DA70D6',
    meaning: '高雅淡泊，君子之风',
    icon: '🌸',
    tags: ['优雅', '祝福']
  },
  {
    id: 'peony',
    name: '牡丹',
    color: '#FF69B4',
    meaning: '富贵吉祥，国色天香',
    icon: '🌺',
    tags: ['祝福', '惊喜', '优雅']
  },
  {
    id: 'chrysanthemum-white',
    name: '白菊',
    color: '#FFFAFA',
    meaning: '高洁真实，缅怀追思',
    icon: '🌼',
    tags: ['治愈', '祝福']
  },
  {
    id: 'ranunculus',
    name: '洋牡丹',
    color: '#FF85A2',
    meaning: '幸福美满，迷人魅力',
    icon: '🌸',
    tags: ['浪漫', '惊喜', '温暖']
  }
];

const EMOTION_COLORS: Record<EmotionTagType, string> = {
  '浪漫': '#FF6B81',
  '温暖': '#FFB347',
  '治愈': '#87CEEB',
  '祝福': '#A8C686',
  '惊喜': '#9B59B6',
  '清新': '#7BED9F',
  '优雅': '#DA70D6',
  '鼓励': '#FFD93D'
};

export const getEmotionColor = (tag: EmotionTagType): string => EMOTION_COLORS[tag];

export const PRESET_BOUQUETS: Bouquet[] = [
  {
    id: 'b1',
    name: '永恒之恋',
    flowerIds: ['rose-red', 'rose-red', 'baby-breath', 'eucalyptus'],
    thumbnailColors: ['#E91E63', '#E8E8E8', '#A8C686'],
    tags: ['浪漫', '温暖']
  },
  {
    id: 'b2',
    name: '初恋时光',
    flowerIds: ['rose-pink', 'baby-breath', 'daisy'],
    thumbnailColors: ['#FF6B81', '#E8E8E8', '#FFFACD'],
    tags: ['浪漫', '清新', '治愈']
  },
  {
    id: 'b3',
    name: '阳光灿烂',
    flowerIds: ['sunflower', 'sunflower', 'tulip-yellow', 'eucalyptus'],
    thumbnailColors: ['#FFB347', '#FFD93D', '#A8C686'],
    tags: ['温暖', '鼓励', '清新']
  },
  {
    id: 'b4',
    name: '静谧时光',
    flowerIds: ['hydrangea', 'lily', 'baby-breath', 'lavender'],
    thumbnailColors: ['#87CEEB', '#FFFFFF', '#9B59B6', '#E8E8E8'],
    tags: ['治愈', '优雅', '祝福']
  },
  {
    id: 'b5',
    name: '典雅风华',
    flowerIds: ['orchid', 'lily', 'peony'],
    thumbnailColors: ['#DA70D6', '#FFFFFF', '#FF69B4'],
    tags: ['优雅', '祝福', '惊喜']
  },
  {
    id: 'b6',
    name: '浪漫紫梦',
    flowerIds: ['lavender', 'rose-pink', 'ranunculus', 'baby-breath'],
    thumbnailColors: ['#9B59B6', '#FF6B81', '#FF85A2'],
    tags: ['浪漫', '治愈', '惊喜']
  },
  {
    id: 'b7',
    name: '温馨祝福',
    flowerIds: ['carnation-pink', 'lily', 'hydrangea'],
    thumbnailColors: ['#FFB6C1', '#FFFFFF', '#87CEEB'],
    tags: ['温暖', '祝福', '治愈']
  },
  {
    id: 'b8',
    name: '鼓励之光',
    flowerIds: ['sunflower', 'tulip-yellow', 'daisy', 'carnation-red'],
    thumbnailColors: ['#FFB347', '#FFD93D', '#FFFACD', '#DC143C'],
    tags: ['鼓励', '温暖', '祝福']
  }
];
