import { STOP_WORDS } from '@/types';

export function generateWordCloud(texts: string[], maxWords: number = 30): { word: string; count: number }[] {
  const wordCount: Record<string, number> = {};
  
  texts.forEach((text) => {
    const words = tokenize(text);
    words.forEach((word) => {
      const lowerWord = word.toLowerCase();
      if (lowerWord.length >= 2 && !STOP_WORDS.has(lowerWord)) {
        wordCount[lowerWord] = (wordCount[lowerWord] || 0) + 1;
      }
    });
  });
  
  return Object.entries(wordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxWords);
}

function tokenize(text: string): string[] {
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  
  const chineseChars = text.match(/[\u4e00-\u9fa5]+/g) || [];
  const chineseWords: string[] = [];
  chineseChars.forEach((str) => {
    for (let i = 0; i < str.length - 1; i++) {
      chineseWords.push(str.slice(i, i + 2));
    }
    for (let i = 0; i < str.length - 2; i++) {
      chineseWords.push(str.slice(i, i + 3));
    }
  });
  
  return [...englishWords, ...chineseWords];
}

export function getWordCloudSize(count: number, maxCount: number, minSize: number = 12, maxSize: number = 36): number {
  if (maxCount === 0) return minSize;
  const ratio = count / maxCount;
  return Math.round(minSize + ratio * (maxSize - minSize));
}
