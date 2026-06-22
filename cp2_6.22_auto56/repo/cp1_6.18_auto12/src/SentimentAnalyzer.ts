import { Emotion } from './types';

interface KeywordSet {
  words: string[];
  weight: number;
}

const joyKeywords: KeywordSet[] = [
  { words: ['开心', '快乐', '高兴', '喜悦', '愉快', '幸福'], weight: 1.2 },
  { words: ['兴奋', '激动', '愉悦', '满足', '欣慰', '畅快'], weight: 1.0 },
  { words: ['喜欢', '爱', '热爱', '暖心', '甜蜜', '美好'], weight: 1.1 },
  { words: ['哈哈', '笑', '嘻嘻', '棒', '赞', '好极了'], weight: 0.9 },
  { words: ['成功', '胜利', '顺利', '希望', '光明', '阳光'], weight: 0.8 },
];

const anxietyKeywords: KeywordSet[] = [
  { words: ['焦虑', '紧张', '不安', '担心', '害怕', '恐惧'], weight: 1.2 },
  { words: ['烦躁', '郁闷', '烦恼', '苦恼', '痛苦', '难受'], weight: 1.1 },
  { words: ['压力', '疲惫', '累', '心累', '厌倦', '压抑'], weight: 1.0 },
  { words: ['迷茫', '困惑', '无助', '绝望', '崩溃', '想哭'], weight: 1.2 },
  { words: ['失败', '糟糕', '糟糕透', '烦', '讨厌', '生气'], weight: 0.9 },
];

const calmKeywords: KeywordSet[] = [
  { words: ['平静', '安静', '宁静', '安宁', '祥和', '静谧'], weight: 1.2 },
  { words: ['放松', '舒适', '惬意', '悠然', '自在', '安心'], weight: 1.1 },
  { words: ['淡定', '从容', '沉稳', '平和', '温和', '淡然'], weight: 1.0 },
  { words: ['休息', '睡眠', '冥想', '放空', '舒展', '沉静'], weight: 0.9 },
  { words: ['自然', '风景', '大海', '森林', '星空', '月光'], weight: 0.8 },
];

function calculateEmotionScore(text: string, keywordSets: KeywordSet[]): number {
  let score = 0;
  for (const set of keywordSets) {
    for (const word of set.words) {
      const regex = new RegExp(word, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * set.weight;
      }
    }
  }
  const textLength = Math.max(text.length, 10);
  const normalized = (score / textLength) * 15;
  return Math.min(5, Math.max(0, Math.round(normalized * 10) / 10));
}

export function analyzeSentiment(text: string): Emotion[] {
  if (!text || text.trim().length === 0) {
    return [
      { name: '喜悦', color: '#FF8C00', intensity: 1.0 },
      { name: '焦虑', color: '#8B7DA6', intensity: 1.0 },
      { name: '平静', color: '#40E0D0', intensity: 1.0 },
    ];
  }

  const lowerText = text.toLowerCase();

  const joyScore = calculateEmotionScore(lowerText, joyKeywords);
  const anxietyScore = calculateEmotionScore(lowerText, anxietyKeywords);
  const calmScore = calculateEmotionScore(lowerText, calmKeywords);

  const total = joyScore + anxietyScore + calmScore;

  let joy = joyScore;
  let anxiety = anxietyScore;
  let calm = calmScore;

  if (total < 1.5) {
    const base = (1.5 - total) / 3;
    joy += base;
    anxiety += base;
    calm += base;
  }

  return [
    { name: '喜悦', color: '#FF8C00', intensity: Math.round(joy * 10) / 10 },
    { name: '焦虑', color: '#8B7DA6', intensity: Math.round(anxiety * 10) / 10 },
    { name: '平静', color: '#40E0D0', intensity: Math.round(calm * 10) / 10 },
  ];
}

export function getDominantEmotion(emotions: Emotion[]): Emotion {
  return emotions.reduce((prev, curr) =>
    curr.intensity > prev.intensity ? curr : prev
  );
}

export function getSecondaryEmotion(emotions: Emotion[]): Emotion {
  const sorted = [...emotions].sort((a, b) => b.intensity - a.intensity);
  return sorted[1];
}

export function generateThumbnail(emotions: Emotion[], size: number = 60): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  ctx.clearRect(0, 0, size, size);

  const total = emotions.reduce((sum, e) => sum + e.intensity, 0) || 1;
  let startAngle = -Math.PI / 2;

  for (const emotion of emotions) {
    const sliceAngle = (emotion.intensity / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = emotion.color;
    ctx.fill();
    startAngle += sliceAngle;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#1A1A22';
  ctx.fill();

  return canvas.toDataURL();
}
