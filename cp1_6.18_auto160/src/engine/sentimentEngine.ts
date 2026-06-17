import { v4 as uuidv4 } from 'uuid';
import type {
  EmotionType,
  EmotionSegment,
  EmotionAnalysisResult
} from '../types';
import { DEFAULT_EMOTION_WEIGHTS, EMOTION_COLORS } from '../types';

interface DictEntry {
  word: string;
  emotion: EmotionType;
  weight: number;
}

const EMOTION_DICTIONARY: DictEntry[] = [
  { word: '开心', emotion: 'joy', weight: 1.0 },
  { word: '快乐', emotion: 'joy', weight: 1.0 },
  { word: '喜悦', emotion: 'joy', weight: 1.2 },
  { word: '高兴', emotion: 'joy', weight: 0.9 },
  { word: '欢乐', emotion: 'joy', weight: 1.1 },
  { word: '幸福', emotion: 'joy', weight: 1.3 },
  { word: '愉悦', emotion: 'joy', weight: 0.9 },
  { word: '欣喜', emotion: 'joy', weight: 1.0 },
  { word: '满足', emotion: 'joy', weight: 0.8 },
  { word: '愉快', emotion: 'joy', weight: 0.9 },
  { word: '微笑', emotion: 'joy', weight: 0.7 },
  { word: '喜欢', emotion: 'joy', weight: 0.8 },
  { word: '热爱', emotion: 'joy', weight: 1.1 },
  { word: '兴奋', emotion: 'joy', weight: 1.0 },
  { word: '惊喜', emotion: 'joy', weight: 1.1 },
  { word: '阳光', emotion: 'joy', weight: 0.6 },
  { word: '灿烂', emotion: 'joy', weight: 0.7 },
  { word: '甜蜜', emotion: 'joy', weight: 0.9 },
  { word: 'sad', emotion: 'sadness', weight: 1.0 },
  { word: '悲伤', emotion: 'sadness', weight: 1.2 },
  { word: '难过', emotion: 'sadness', weight: 1.0 },
  { word: '伤心', emotion: 'sadness', weight: 1.1 },
  { word: '失落', emotion: 'sadness', weight: 0.9 },
  { word: '痛苦', emotion: 'sadness', weight: 1.3 },
  { word: '哭泣', emotion: 'sadness', weight: 1.1 },
  { word: '流泪', emotion: 'sadness', weight: 1.0 },
  { word: '遗憾', emotion: 'sadness', weight: 0.8 },
  { word: '忧郁', emotion: 'sadness', weight: 0.9 },
  { word: '忧伤', emotion: 'sadness', weight: 1.0 },
  { word: '心碎', emotion: 'sadness', weight: 1.4 },
  { word: '绝望', emotion: 'sadness', weight: 1.3 },
  { word: '孤独', emotion: 'sadness', weight: 0.9 },
  { word: '寂寞', emotion: 'sadness', weight: 0.8 },
  { word: 'angry', emotion: 'anger', weight: 1.0 },
  { word: '愤怒', emotion: 'anger', weight: 1.3 },
  { word: '生气', emotion: 'anger', weight: 1.0 },
  { word: '恼火', emotion: 'anger', weight: 1.1 },
  { word: '烦躁', emotion: 'anger', weight: 0.8 },
  { word: '暴怒', emotion: 'anger', weight: 1.4 },
  { word: '怨恨', emotion: 'anger', weight: 1.1 },
  { word: '憎恨', emotion: 'anger', weight: 1.3 },
  { word: '不满', emotion: 'anger', weight: 0.7 },
  { word: '气愤', emotion: 'anger', weight: 1.0 },
  { word: '暴躁', emotion: 'anger', weight: 1.0 },
  { word: '怒火', emotion: 'anger', weight: 1.2 },
  { word: 'calm', emotion: 'calm', weight: 1.0 },
  { word: '宁静', emotion: 'calm', weight: 1.2 },
  { word: '平静', emotion: 'calm', weight: 1.0 },
  { word: '安宁', emotion: 'calm', weight: 1.1 },
  { word: '放松', emotion: 'calm', weight: 0.9 },
  { word: '安心', emotion: 'calm', weight: 0.9 },
  { word: '舒缓', emotion: 'calm', weight: 0.8 },
  { word: '淡然', emotion: 'calm', weight: 1.0 },
  { word: '静谧', emotion: 'calm', weight: 1.1 },
  { word: '和谐', emotion: 'calm', weight: 0.9 },
  { word: '温柔', emotion: 'calm', weight: 0.8 },
  { word: '安详', emotion: 'calm', weight: 1.0 },
  { word: '悠闲', emotion: 'calm', weight: 0.8 },
  { word: '自在', emotion: 'calm', weight: 0.7 }
];

const SENTENCE_SPLIT_REGEX = /[。！？!?\n;；]+|(?<=[，,、])(?=\s*[\u4e00-\u9fa5a-zA-Z])/g;
const MAX_SEGMENT_LENGTH = 140;

function splitIntoSegments(text: string): Array<{ text: string; startIndex: number; endIndex: number }> {
  const segments: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  if (!text) return segments;

  const sentences: Array<{ text: string; start: number }> = [];
  let lastIndex = 0;
  const regex = new RegExp(SENTENCE_SPLIT_REGEX.source, SENTENCE_SPLIT_REGEX.flags.includes('g') ? SENTENCE_SPLIT_REGEX.flags : SENTENCE_SPLIT_REGEX.flags + 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const sentenceText = text.slice(lastIndex, match.index + 1).trim();
    if (sentenceText) {
      sentences.push({ text: sentenceText, start: lastIndex });
    }
    lastIndex = match.index + 1;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    sentences.push({ text: remaining, start: lastIndex });
  }

  if (sentences.length === 0) {
    const trimmed = text.trim();
    if (trimmed) {
      segments.push({
        text: trimmed.slice(0, MAX_SEGMENT_LENGTH),
        startIndex: 0,
        endIndex: Math.min(trimmed.length, MAX_SEGMENT_LENGTH)
      });
    }
    return segments;
  }

  for (const s of sentences) {
    const t = s.text;
    if (t.length <= MAX_SEGMENT_LENGTH) {
      segments.push({
        text: t,
        startIndex: s.start,
        endIndex: s.start + t.length
      });
    } else {
      let cursor = 0;
      while (cursor < t.length) {
        const chunk = t.slice(cursor, cursor + MAX_SEGMENT_LENGTH);
        segments.push({
          text: chunk,
          startIndex: s.start + cursor,
          endIndex: s.start + cursor + chunk.length
        });
        cursor += MAX_SEGMENT_LENGTH;
      }
    }
  }

  return segments;
}

function analyzeSegmentEmotion(segmentText: string): { emotion: EmotionType; weight: number } | null {
  const lowerText = segmentText.toLowerCase();
  const scores: Record<EmotionType, number> = { ...DEFAULT_EMOTION_WEIGHTS };
  let totalMatches = 0;

  for (const entry of EMOTION_DICTIONARY) {
    const keyword = entry.word.toLowerCase();
    if (keyword.length === 0) continue;

    let searchStart = 0;
    let count = 0;
    while (true) {
      const idx = lowerText.indexOf(keyword, searchStart);
      if (idx === -1) break;
      count++;
      totalMatches++;
      searchStart = idx + keyword.length;
      if (count > 20) break;
    }

    if (count > 0) {
      scores[entry.emotion] += count * entry.weight;
    }
  }

  if (totalMatches === 0) {
    return null;
  }

  let bestEmotion: EmotionType = 'joy';
  let bestScore = -1;
  for (const e of ['joy', 'sadness', 'anger', 'calm'] as EmotionType[]) {
    if (scores[e] > bestScore) {
      bestScore = scores[e];
      bestEmotion = e;
    }
  }

  const totalScore = scores.joy + scores.sadness + scores.anger + scores.calm;
  if (totalScore === 0) return null;

  const normalized = bestScore / totalScore;

  return {
    emotion: bestEmotion,
    weight: Math.min(1.5, 0.3 + normalized * 1.2)
  };
}

export function analyzeText(text: string): EmotionAnalysisResult {
  const weights: Record<EmotionType, number> = { ...DEFAULT_EMOTION_WEIGHTS };
  const segments: EmotionSegment[] = [];

  const rawSegments = splitIntoSegments(text);

  for (const seg of rawSegments) {
    const result = analyzeSegmentEmotion(seg.text);
    const emotion = result?.emotion ?? pickDefaultEmotion(seg.text);
    const weight = result?.weight ?? 0.3;

    weights[emotion] += weight;

    segments.push({
      id: uuidv4(),
      text: seg.text,
      startIndex: seg.startIndex,
      endIndex: seg.endIndex,
      emotion,
      weight
    });
  }

  return {
    weights,
    segments,
    rawText: text
  };
}

function pickDefaultEmotion(text: string): EmotionType {
  const hash = [...text].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const emotions: EmotionType[] = ['joy', 'sadness', 'anger', 'calm'];
  return emotions[hash % 4];
}

export function getEmotionHex(emotion: EmotionType): string {
  return EMOTION_COLORS[emotion].hex;
}

export function getEmotionLabel(emotion: EmotionType): string {
  return EMOTION_COLORS[emotion].label;
}
