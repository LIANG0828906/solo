import { v4 as uuidv4 } from 'uuid';
import type { Concept, Edge } from '@/types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'not', 'no', 'nor', 'if',
  'then', 'else', 'when', 'where', 'why', 'how', 'all', 'any', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'now', 'here', 'there', 'about', 'after', 'before', 'between',
  'during', 'through', 'while', 'above', 'below', 'up', 'down', 'out',
  'off', 'over', 'under', 'again', 'further', 'once',
  '的', '了', '和', '是', '在', '我', '有', '也', '不', '人', '都', '一',
  '一个', '上', '他', '她', '它', '们', '这', '那', '你', '会', '能',
  '就', '要', '去', '来', '说', '看', '好', '很', '还', '与', '及',
  '等', '把', '被', '让', '给', '对', '为', '以', '于', '中', '为了',
]);

const MIN_WORD_LENGTH = 2;

export interface ExtractResult {
  concepts: Concept[];
  edges: Edge[];
}

function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(token => {
    if (token.length < MIN_WORD_LENGTH) return false;
    if (STOP_WORDS.has(token)) return false;
    if (/^\d+$/.test(token)) return false;
    return true;
  });
  return tokens;
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
}

function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function calculateIDF(paragraphs: string[], allTerms: Set<string>): Map<string, number> {
  const idf = new Map<string, number>();
  const docCount = paragraphs.length;

  for (const term of allTerms) {
    let containingDocs = 0;
    for (const para of paragraphs) {
      const paraTokens = tokenize(para);
      if (paraTokens.includes(term)) {
        containingDocs++;
      }
    }
    idf.set(term, Math.log((docCount + 1) / (containingDocs + 1)) + 1);
  }

  return idf;
}

function calculateTFIDF(
  tf: Map<string, number>,
  idf: Map<string, number>
): Map<string, number> {
  const tfidf = new Map<string, number>();
  for (const [term, termFreq] of tf) {
    const termIdf = idf.get(term) || 1;
    tfidf.set(term, termFreq * termIdf);
  }
  return tfidf;
}

function getNGrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

export function extractConcepts(text: string, noteId: string): ExtractResult {
  if (!text || text.trim().length === 0) {
    return { concepts: [], edges: [] };
  }

  const paragraphs = getParagraphs(text);
  const allTokens = tokenize(text);
  const allTerms = new Set(allTokens);

  const tf = calculateTF(allTokens);
  const idf = calculateIDF(paragraphs, allTerms);
  const tfidf = calculateTFIDF(tf, idf);

  const unigrams = allTokens.filter(t => t.length >= MIN_WORD_LENGTH);
  const bigrams = getNGrams(allTokens, 2);
  const trigrams = getNGrams(allTokens, 3);

  const allPhrases = [...new Set([...unigrams, ...bigrams, ...trigrams])];

  const phraseScores: Map<string, { score: number; frequency: number; firstOccurrence: number }> = new Map();

  for (const phrase of allPhrases) {
    const phraseTokens = phrase.split(' ');
    let score = 0;
    let frequency = 0;

    for (const token of phraseTokens) {
      score += tfidf.get(token) || 0;
    }
    score = score / phraseTokens.length;

    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    if (matches) {
      frequency = matches.length;
    }

    if (frequency >= 2 || (phraseTokens.length > 1 && frequency >= 1)) {
      const firstOccurrence = text.toLowerCase().indexOf(phrase.toLowerCase());
      phraseScores.set(phrase, { score, frequency, firstOccurrence });
    }
  }

  const sortedPhrases = Array.from(phraseScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 15);

  const minConcepts = 5;
  const finalConcepts = sortedPhrases.length >= minConcepts
    ? sortedPhrases
    : Array.from(phraseScores.entries())
        .sort((a, b) => b[1].frequency - a[1].frequency)
        .slice(0, Math.max(minConcepts, sortedPhrases.length));

  const concepts: Concept[] = finalConcepts.map(([name, data]) => ({
    id: uuidv4(),
    name,
    frequency: data.frequency,
    noteId,
    firstOccurrence: data.firstOccurrence,
  }));

  const conceptNameToId = new Map(concepts.map(c => [c.name.toLowerCase(), c.id]));

  const coOccurrence: Map<string, number> = new Map();

  for (const para of paragraphs) {
    const paraLower = para.toLowerCase();
    const paraConcepts: string[] = [];

    for (const concept of concepts) {
      if (paraLower.includes(concept.name.toLowerCase())) {
        paraConcepts.push(concept.id);
      }
    }

    for (let i = 0; i < paraConcepts.length; i++) {
      for (let j = i + 1; j < paraConcepts.length; j++) {
        const key = [paraConcepts[i], paraConcepts[j]].sort().join('|');
        coOccurrence.set(key, (coOccurrence.get(key) || 0) + 1);
      }
    }
  }

  const edges: Edge[] = Array.from(coOccurrence.entries())
    .map(([key, weight]) => {
      const [source, target] = key.split('|');
      return {
        id: uuidv4(),
        source,
        target,
        weight,
        noteId,
      };
    })
    .filter(e => e.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 50);

  return { concepts, edges };
}

export function mapFrequencyToSize(frequency: number, minFreq: number, maxFreq: number): number {
  const minSize = 36;
  const maxSize = 72;
  if (frequency === undefined || frequency === null || isNaN(frequency) || frequency <= 0) {
    return minSize;
  }
  if (minFreq === undefined || minFreq === null || isNaN(minFreq)) {
    minFreq = 0;
  }
  if (maxFreq === undefined || maxFreq === null || isNaN(maxFreq)) {
    maxFreq = Math.max(frequency, 1);
  }
  if (maxFreq === minFreq) return (minSize + maxSize) / 2;
  const normalized = (frequency - minFreq) / (maxFreq - minFreq);
  const result = minSize + normalized * (maxSize - minSize);
  if (isNaN(result) || result <= 0) return minSize;
  return Math.max(minSize, Math.min(maxSize, result));
}

export function mapFrequencyToColor(frequency: number, minFreq: number, maxFreq: number): string {
  const startColor = { r: 52, g: 152, b: 219 };
  const endColor = { r: 231, g: 76, b: 60 };

  if (frequency === undefined || frequency === null || isNaN(frequency)) {
    return `rgb(${startColor.r}, ${startColor.g}, ${startColor.b})`;
  }
  if (minFreq === undefined || minFreq === null || isNaN(minFreq)) {
    minFreq = 0;
  }
  if (maxFreq === undefined || maxFreq === null || isNaN(maxFreq)) {
    maxFreq = Math.max(frequency, 1);
  }

  if (maxFreq === minFreq) {
    const mid = {
      r: Math.round((startColor.r + endColor.r) / 2),
      g: Math.round((startColor.g + endColor.g) / 2),
      b: Math.round((startColor.b + endColor.b) / 2),
    };
    return `rgb(${mid.r}, ${mid.g}, ${mid.b})`;
  }

  const normalized = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
  const r = Math.round(startColor.r + normalized * (endColor.r - startColor.r));
  const g = Math.round(startColor.g + normalized * (endColor.g - startColor.g));
  const b = Math.round(startColor.b + normalized * (endColor.b - startColor.b));

  return `rgb(${r}, ${g}, ${b})`;
}

export function mapWeightToWidth(weight: number, maxWeight: number): number {
  const minWidth = 1;
  const maxWidth = 3;
  if (weight === undefined || weight === null || isNaN(weight) || weight <= 0) {
    return minWidth;
  }
  if (maxWeight === undefined || maxWeight === null || isNaN(maxWeight) || maxWeight === 0) {
    return minWidth;
  }
  const normalized = Math.max(0, Math.min(1, weight / maxWeight));
  return minWidth + normalized * (maxWidth - minWidth);
}
