import nodejieba from 'nodejieba';

export interface WordItem {
  text: string;
  frequency: number;
  indices: number[];
}

export interface AnalyzeResult {
  words: WordItem[];
  totalWords: number;
}

const STOPWORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '但是', '因为', '所以', '如果', '可以', '这个', '那个',
  '什么', '怎么', '为什么', '然后', '现在', '还是', '只是', '不过', '而且',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
  'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
  'about', 'against', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
  'further', 'here', 'there', 's', 't'
]);

function isChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

function tokenizeChinese(text: string): string[] {
  try {
    return nodejieba.cut(text);
  } catch {
    const result: string[] = [];
    const regex = /[\u4e00-\u9fa5]+|[a-zA-Z]+|\d+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      result.push(match[0]);
    }
    return result;
  }
}

function tokenizeEnglish(text: string): string[] {
  return text.toLowerCase().match(/[a-zA-Z']+|\d+/g) || [];
}

function findIndices(text: string, word: string, isZh: boolean): number[] {
  const indices: number[] = [];
  if (isZh) {
    let pos = 0;
    while ((pos = text.indexOf(word, pos)) !== -1) {
      indices.push(pos);
      pos += word.length;
      if (indices.length >= 10) break;
    }
  } else {
    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(lowerWord)}\\b`, 'gi');
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      indices.push(match.index);
      if (indices.length >= 10) break;
    }
  }
  return indices;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function analyzeText(text: string): AnalyzeResult {
  const hasChinese = isChinese(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  
  let tokens: string[] = [];
  
  if (hasChinese) {
    tokens = tokenizeChinese(text);
  }
  if (hasEnglish || (!hasChinese && !hasEnglish)) {
    const engTokens = tokenizeEnglish(text);
    tokens = [...tokens, ...engTokens];
  }
  
  const freqMap = new Map<string, number>();
  
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed || trimmed.length < 2) continue;
    if (STOPWORDS.has(trimmed.toLowerCase())) continue;
    if (/^[\d\s]+$/.test(trimmed)) continue;
    
    const key = hasChinese && isChinese(trimmed) ? trimmed : trimmed.toLowerCase();
    freqMap.set(key, (freqMap.get(key) || 0) + 1);
  }
  
  const sortedWords = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([word, frequency]) => ({
      text: word,
      frequency,
      indices: findIndices(text, word, hasChinese && isChinese(word))
    }));
  
  return {
    words: sortedWords,
    totalWords: tokens.length
  };
}
