import type { EmotionConfig, EmotionRecord, EmotionType, ValidationResult } from '../shared/types';
import { storageService, formatDate } from '../shared/storageService';

export const emotionConfigs: Record<EmotionType, EmotionConfig> = {
  happy: { emoji: '😊', color: '#FFD93D', label: '快乐', intensity: 9 },
  sad: { emoji: '😢', color: '#6B8EFC', label: '悲伤', intensity: 3 },
  angry: { emoji: '😠', color: '#FF6B6B', label: '愤怒', intensity: 2 },
  calm: { emoji: '😌', color: '#6BCB77', label: '平静', intensity: 7 },
  anxious: { emoji: '😰', color: '#9B59B6', label: '焦虑', intensity: 3 },
  surprised: { emoji: '😮', color: '#FF9F43', label: '惊喜', intensity: 8 }
};

export const availableTags = ['工作', '家庭', '健康', '社交', '学习', '运动', '娱乐', '其他'];

export function validateInput(emotion: EmotionType | null, tags: string[], note: string): ValidationResult {
  const errors: string[] = [];
  
  if (!emotion) {
    errors.push('请选择一种情绪');
  }
  
  if (tags.length === 0) {
    errors.push('请至少选择1个标签');
  }
  
  if (tags.length > 3) {
    errors.push('最多只能选择3个标签');
  }
  
  if (note.length > 200) {
    errors.push(`备注文字不能超过200字，当前已输入${note.length}字`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function isNoteOverLimit(note: string): boolean {
  return note.length > 200;
}

export function getNoteWarningLevel(note: string): 'normal' | 'warning' | 'danger' {
  const len = note.length;
  if (len <= 150) return 'normal';
  if (len <= 200) return 'warning';
  return 'danger';
}

export async function submitRecord(
  emotion: EmotionType,
  tags: string[],
  note: string
): Promise<EmotionRecord> {
  const now = new Date();
  const record: Omit<EmotionRecord, 'id'> = {
    emotion,
    tags,
    note: note.trim(),
    timestamp: now.getTime(),
    date: formatDate(now)
  };
  
  const id = await storageService.addRecord(record);
  return { ...record, id };
}

export function getEmotionConfig(emotion: EmotionType): EmotionConfig {
  return emotionConfigs[emotion];
}

export function getAllEmotionConfigs(): Record<EmotionType, EmotionConfig> {
  return emotionConfigs;
}

export const trackerModule = {
  validateInput,
  submitRecord,
  getEmotionConfig,
  getAllEmotionConfigs
};
