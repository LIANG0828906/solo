import type { SentimentType } from './sentiment';

export interface BubbleData {
  id: string;
  text: string;
  sentiment: SentimentType;
  position: { x: number; y: number; z: number };
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomPosition(): { x: number; y: number; z: number } {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = randomInRange(3, 6);
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  };
}

export const initialMessages: { text: string; sentiment: SentimentType }[] = [
  { text: '今天的阳光真好，心情无比愉快', sentiment: 'positive' },
  { text: '生活就像一盒巧克力，充满惊喜', sentiment: 'positive' },
  { text: '平凡的一天，没有什么特别的事', sentiment: 'neutral' },
  { text: '窗外的雨还在下，一切都很安静', sentiment: 'neutral' },
  { text: '希望明天会更好，继续努力', sentiment: 'positive' },
  { text: '夜晚的星空总是让人感到孤独', sentiment: 'negative' },
  { text: '城市的灯火，掩盖了多少疲惫与迷茫', sentiment: 'negative' },
  { text: '咖啡的温度刚刚好，喜欢这样的午后', sentiment: 'positive' },
  { text: '时间在指尖悄悄溜走，无能为力', sentiment: 'negative' },
  { text: '风起的时候，世界变得好安静', sentiment: 'neutral' },
];

export function createInitialBubbles(): BubbleData[] {
  return initialMessages.map((msg, i) => ({
    id: `bubble-${Date.now()}-${i}`,
    text: msg.text,
    sentiment: msg.sentiment,
    position: randomPosition(),
  }));
}

export function createBubbleData(text: string, sentiment: SentimentType): BubbleData {
  return {
    id: `bubble-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    sentiment,
    position: randomPosition(),
  };
}

export function computeSimilarity(a: BubbleData, b: BubbleData): number {
  let score = 0;

  if (a.sentiment === b.sentiment) {
    score += 0.4;
  } else {
    const sentimentDist = Math.abs(
      (a.sentiment === 'positive' ? 1 : a.sentiment === 'neutral' ? 0 : -1) -
      (b.sentiment === 'positive' ? 1 : b.sentiment === 'neutral' ? 0 : -1)
    );
    score += Math.max(0, 0.2 - sentimentDist * 0.1);
  }

  const wordsA = a.text.split('');
  const wordsB = b.text.split('');
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let overlap = 0;
  for (const w of setA) {
    if (setB.has(w)) overlap++;
  }
  const jaccard = overlap / (setA.size + setB.size - overlap);
  score += jaccard * 0.6;

  return Math.min(1, score);
}
