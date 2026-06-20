import { v4 as uuidv4 } from 'uuid';

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateId = (): string => {
  return uuidv4();
};

export const generateAnonymousName = (): string => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `书友#${num}`;
};

const loremIpsumWords = [
  '读书', '思考', '人生', '智慧', '时光', '心灵', '成长', '故事',
  '温暖', '记忆', '旅程', '探索', '发现', '感悟', '岁月', '文字',
  '世界', '梦想', '勇气', '希望', '光明', '黑暗', '孤独', '陪伴',
  '理解', '包容', '自由', '平静', '热爱', '坚持', '信念', '力量',
  '美好', '纯真', '快乐', '忧伤', '思念', '感恩', '珍惜', '当下',
  '春天', '夏日', '秋叶', '冬雪', '清晨', '黄昏', '星空', '月光',
  '山川', '河流', '森林', '大海', '城市', '乡村', '远方', '归途',
  '咖啡', '茶香', '书香', '音乐', '绘画', '诗歌', '小说', '散文',
  '历史', '哲学', '科学', '艺术', '文学', '人性', '社会', '自然',
  '呼吸', '心跳', '微笑', '泪水', '拥抱', '告别', '重逢', '初见'
];

export const generateChapterContent = (chapterNum: number, seed: number): string => {
  const paragraphs: string[] = [];
  const numParagraphs = 3 + (seed % 3);
  
  for (let p = 0; p < numParagraphs; p++) {
    const paragraphLength = 80 + ((seed + p * 17) % 120);
    const words: string[] = [];
    let currentSeed = seed + p * 31 + chapterNum * 7;
    
    for (let i = 0; i < paragraphLength; i++) {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      const idx = currentSeed % loremIpsumWords.length;
      words.push(loremIpsumWords[idx]);
    }
    
    paragraphs.push(words.join(''));
  }
  
  return paragraphs.join('\n\n');
};

export const generateChapterTitle = (chapterNum: number): string => {
  const titles = [
    '序章', '初见', '相遇', '启程', '探索', '发现', '转折', '成长',
    '领悟', '蜕变', '觉醒', '光明', '回响', '永恒', '终章', '后记'
  ];
  if (chapterNum <= titles.length) {
    return `第${chapterNum}章 ${titles[chapterNum - 1]}`;
  }
  return `第${chapterNum}章`;
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayStr = (): string => {
  return formatDate(new Date());
};

export const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const getLastNDays = (n: number): string[] => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - n + 1);
  return getDatesInRange(start, end);
};

export const colorMap: Record<string, string> = {
  yellow: '#fef08a',
  green: '#bbf7d0',
  pink: '#fbcfe8',
};

export const pollColors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
];

export const getPollColor = (index: number): string => {
  return pollColors[index % pollColors.length];
};
