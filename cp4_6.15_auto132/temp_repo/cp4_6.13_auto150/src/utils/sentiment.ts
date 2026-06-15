import { SENTIMENT_KEYWORDS } from '@/types';

export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  SENTIMENT_KEYWORDS.positive.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      positiveCount++;
    }
  });
  
  SENTIMENT_KEYWORDS.negative.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      negativeCount++;
    }
  });
  
  if (positiveCount > negativeCount) {
    return 'positive';
  } else if (negativeCount > positiveCount) {
    return 'negative';
  }
  return 'neutral';
}

export function getSentimentWeight(text: string): number {
  const lowerText = text.toLowerCase();
  let weight = 0;
  
  SENTIMENT_KEYWORDS.positive.forEach((keyword) => {
    const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    weight += count * 1;
  });
  
  SENTIMENT_KEYWORDS.negative.forEach((keyword) => {
    const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    weight -= count * 1;
  });
  
  return weight;
}