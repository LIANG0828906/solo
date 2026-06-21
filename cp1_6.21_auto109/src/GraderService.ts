import axios from 'axios';
import type { Answer, GradeResult, GradeResultItem } from './types';

const STORAGE_KEY = 'quiz_grade_reports';

export interface StoredReport extends GradeResult {
  timestamp: number;
  id: string;
}

export async function submitGrading(answers: Answer[]): Promise<GradeResult> {
  const startTime = performance.now();
  const { data } = await axios.post<GradeResult>('/api/grade', answers);
  const elapsed = performance.now() - startTime;
  console.info(`[GraderService] API call completed in ${elapsed.toFixed(1)}ms`);
  return data;
}

export function generateErrorStats(results: GradeResultItem[]): {
  total: number;
  correctCount: number;
  errorCount: number;
  accuracy: number;
} {
  const total = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const errorCount = total - correctCount;
  const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
  return { total, correctCount, errorCount, accuracy };
}

export function saveReport(report: GradeResult): StoredReport {
  const stored: StoredReport = {
    ...report,
    timestamp: Date.now(),
    id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  try {
    const existing = getReports();
    existing.unshift(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
  } catch (e) {
    console.warn('[GraderService] Failed to save report to localStorage', e);
  }
  return stored;
}

export function getReports(): StoredReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredReport[]) : [];
  } catch {
    return [];
  }
}

export function clearReports(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatKnowledgePointText(kp: Record<string, number>): string {
  const entries = Object.entries(kp).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return '本次作答全部正确，无薄弱知识点！';
  const topKp = entries.slice(0, 3).map(([name, count]) => `${name}（${count}次）`);
  return `薄弱知识点 TOP${Math.min(3, entries.length)}：${topKp.join('、')}。建议针对以上知识点进行重点复习。`;
}
