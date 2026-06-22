export interface ProcessResult {
  weibo: string;
  officialAccount: string;
  seo: string;
  keywords: string[];
}

export function extractKeywords(text: string, limit: number = 8): string[] {
  if (!text.trim()) return [];

  const stopWords = new Set([
    '的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '那', '他', '她', '它', '们', '这个', '那个', '什么', '怎么',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'of', 'in', 'to', 'for',
    'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but',
    'or', 'if', 'because', 'until', 'while', 'although', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const sentences = cleaned.split(/(?<=[。！？.!?;；])\s*/);
  return sentences.filter(s => s.trim().length > 0);
}

function scoreSentence(sentence: string, keywords: string[]): number {
  let score = 0;
  const lower = sentence.toLowerCase();
  keywords.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) {
      score += 2;
    }
  });
  if (/^[#【\["'“‘]/.test(sentence)) score += 1;
  if (sentence.length > 20 && sentence.length < 80) score += 1;
  return score;
}

export function generateSummary(text: string, maxChars: number = 300): string {
  if (!text.trim()) return '';

  const sentences = splitSentences(text);
  if (sentences.length === 0) return text.slice(0, maxChars);

  const keywords = extractKeywords(text, 10);
  const scored = sentences.map((s, idx) => ({
    text: s,
    idx,
    score: scoreSentence(s, keywords) + (sentences.length - idx) * 0.1
  }));

  scored.sort((a, b) => b.score - a.score);

  const selected: { text: string; idx: number }[] = [];
  let currentLength = 0;

  for (const item of scored) {
    if (currentLength + item.text.length <= maxChars) {
      selected.push(item);
      currentLength += item.text.length;
    }
  }

  selected.sort((a, b) => a.idx - b.idx);

  let result = selected.map(s => s.text).join(' ');
  if (result.length > maxChars) {
    result = result.slice(0, maxChars - 1) + '…';
  }
  return result;
}

export function generateWeiboPost(text: string): string {
  if (!text.trim()) return '';

  const keywords = extractKeywords(text, 5);
  const base = generateSummary(text, 120);
  const hashtagStr = keywords.map(k => `#${k}#`).join('');

  let result = base + (hashtagStr ? ' ' + hashtagStr : '');
  if (result.length > 140) {
    const available = 140 - hashtagStr.length - 1;
    result = base.slice(0, Math.max(0, available)) + '…' + (hashtagStr ? ' ' + hashtagStr : '');
  }
  return result;
}

export function generateSeoDescription(text: string): string {
  if (!text.trim()) return '';

  const sentences = splitSentences(text);
  if (sentences.length === 0) return text.slice(0, 80);

  const keywords = extractKeywords(text, 4);
  let result = sentences[0];

  if (result.length > 80) {
    result = result.slice(0, 79) + '…';
  } else if (result.length < 50 && sentences.length > 1) {
    result = result + sentences[1];
    if (result.length > 80) {
      result = result.slice(0, 79) + '…';
    }
  }

  if (keywords.length > 0 && !result.toLowerCase().includes(keywords[0].toLowerCase())) {
    const kwPrefix = keywords.slice(0, 2).join('，') + '：';
    const available = 80 - kwPrefix.length;
    result = kwPrefix + result.slice(0, Math.max(0, available - 1)) + (result.length > available ? '…' : '');
  }

  return result;
}

export function processText(text: string): ProcessResult {
  return {
    weibo: generateWeiboPost(text),
    officialAccount: generateSummary(text, 300),
    seo: generateSeoDescription(text),
    keywords: extractKeywords(text)
  };
}
