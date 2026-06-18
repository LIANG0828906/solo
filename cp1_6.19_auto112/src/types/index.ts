export type MoodType = 'happy' | 'thinking' | 'moved' | 'shocked' | 'calm';

export interface ReadingRecord {
  id: string;
  bookName: string;
  page: number;
  mood: MoodType;
  thought: string;
  timestamp: number;
  keywords: string[];
}

export interface StarNode extends ReadingRecord {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
  size: number;
  color: string;
}

export interface ResonanceLink {
  source: string | StarNode;
  target: string | StarNode;
  keywordCount: number;
  width: number;
}

export interface ReadingContextValue {
  records: ReadingRecord[];
  addRecord: (record: Omit<ReadingRecord, 'id' | 'timestamp' | 'keywords'>) => void;
  highlightId: string | null;
  setHighlightId: (id: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  pinnedId: string | null;
  setPinnedId: (id: string | null) => void;
}

export const MOOD_CONFIG: Record<MoodType, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '😊', color: '#FFD700', label: '开心' },
  thinking: { emoji: '🤔', color: '#9B59B6', label: '沉思' },
  moved: { emoji: '😢', color: '#E91E63', label: '感动' },
  shocked: { emoji: '😲', color: '#FF7043', label: '震撼' },
  calm: { emoji: '😌', color: '#42A5F5', label: '平静' },
};

const STOPWORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '这个', '那个', '他', '她', '它', '们', '被', '从', '把',
  '让', '给', '对', '而', '与', '及', '或', '但', '然而', '所以', '因为', '如果',
  '虽然', '但是', '可以', '可能', '应该', '需要', '什么', '怎么', '为什么',
  'which', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'if', 'or', 'because', 'so', 'than', 'then', 'that', 'this',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'we', 'they', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why'
]);

export function extractKeywords(text: string): string[] {
  const textLower = text.toLowerCase();
  const words = new Set<string>();

  const chineseMatches = textLower.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  chineseMatches.forEach((word) => {
    if (!STOPWORDS.has(word)) {
      words.add(word);
    }
  });

  const englishMatches = textLower.match(/[a-zA-Z]{3,}/g) || [];
  englishMatches.forEach((word) => {
    if (!STOPWORDS.has(word)) {
      words.add(word);
    }
  });

  if (words.size === 0) {
    const ngrams: string[] = [];
    for (let len = 2; len <= Math.min(4, text.length); len++) {
      for (let i = 0; i <= text.length - len + 1; i++) {
        const gram = text.slice(i, i + len);
        if (STOPWORDS.has(gram)) continue;
        if (/[\u4e00-\u9fa5a-zA-Z]/.test(gram)) {
          ngrams.push(gram);
        }
      }
    }
    ngrams.slice(0, 8).forEach((g) => words.add(g));
  }

  return Array.from(words).slice(0, 5);
}

export function buildResonanceLinks(records: ReadingRecord[]): ResonanceLink[] {
  const links: ResonanceLink[] = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      const setA = new Set(a.keywords);
      let count = 0;
      for (const kw of b.keywords) {
        if (setA.has(kw)) count++;
      }
      if (count >= 1) {
        links.push({
          source: a.id,
          target: b.id,
          keywordCount: count,
          width: Math.min(count, 3),
        });
      }
    }
  }
  return links;
}

export function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
