import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import type { Language } from './types';

export function generateId(): string {
  return uuidv4();
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
}

export function getLineCount(code: string): number {
  if (!code) return 0;
  return code.split('\n').length;
}

export function getLines(code: string): string[] {
  if (!code) return [];
  return code.split('\n');
}

export function detectLanguage(code: string): Language {
  if (!code) return 'plaintext';
  const jsPatterns = [
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /function\s+\w*\s*\(/,
    /=>\s*[{(]/,
    /class\s+\w+/,
    /import\s+.*\s+from/,
    /export\s+(default\s+)?(function|class|const|let)/,
  ];
  const pyPatterns = [
    /def\s+\w+\s*\(/,
    /class\s+\w+(\s*\(\w+\))?:/,
    /^if\s+.*:\s*$/,
    /^for\s+.*:\s*$/,
    /^while\s+.*:\s*$/,
    /print\s*\(/,
    /import\s+\w+(\s+as\s+\w+)?/,
    /from\s+\w+\s+import/,
  ];
  let jsScore = 0;
  let pyScore = 0;
  for (const pattern of jsPatterns) {
    if (pattern.test(code)) jsScore++;
  }
  for (const pattern of pyPatterns) {
    if (pattern.test(code)) pyScore++;
  }
  if (jsScore > pyScore) return 'javascript';
  if (pyScore > jsScore) return 'python';
  return 'plaintext';
}

export function highlightCode(code: string, language: Language): string {
  if (language === 'plaintext') {
    return escapeHtml(code);
  }
  const grammar = Prism.languages[language];
  if (!grammar) {
    return escapeHtml(code);
  }
  return Prism.highlight(code, grammar, language);
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
