import type { BookCategory, Excerpt } from '../types';

const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '那', '这个', '那个', '什么', '怎么', '为什么',
  '可以', '就是', '但是', '因为', '所以', '如果', '虽然', '不过', '然后', '而且',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so',
  'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own',
  'same', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'this',
  'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what',
  'which', 'who', 'whom', 'it', 'its', 'if', 'because', 'about', 'up',
]);

export const CATEGORY_COLORS: Record<BookCategory, string[]> = {
  '文学': ['#F5E6D3', '#E8D5C4', '#D4C4B0'],
  '科技': ['#D6E8F5', '#C4D8E8', '#B0C4D4'],
  '历史': ['#E8D6C4', '#DCC4B0', '#CCAF9A'],
  '哲学': ['#D6E4D6', '#C4D4C4', '#B0C4B0'],
  '心理': ['#E8D6E8', '#D8C4D8', '#C4B0C4'],
};

export function extractKeywords(text: string, maxCount: number = 5): string[] {
  const cleaned = text.toLowerCase().replace(/[\s\n\r\t，。！？、；：""''（）《》【】,.!?;:"'()\[\]<>-]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  const chineseChars = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  const allTokens = [...tokens, ...chineseChars];
  const freqMap = new Map<string, number>();
  for (const token of allTokens) {
    if (!STOP_WORDS.has(token.toLowerCase())) {
      freqMap.set(token, (freqMap.get(token) || 0) + 1);
    }
  }
  const sorted = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word);
  return sorted;
}

export function calculateSimilarity(a: Excerpt, b: Excerpt): number {
  const setA = new Set(a.tags);
  const setB = new Set(b.tags);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((tag) => {
    if (setB.has(tag)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  if (union === 0) return 0;
  return Math.round((intersection / union) * 100);
}

export function getRandomColor(category: BookCategory): string {
  const colors = CATEGORY_COLORS[category];
  return colors[Math.floor(Math.random() * colors.length)];
}
