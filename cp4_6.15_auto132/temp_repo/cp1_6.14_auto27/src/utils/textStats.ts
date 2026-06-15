export function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getPast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

export function todayStr(): string {
  return formatDate(new Date());
}

export function stripHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  const cnMatches = text.match(/[\u4e00-\u9fa5]/g) || [];
  const clean = text.replace(/[\u4e00-\u9fa5]/g, ' ');
  const enWords = clean.split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w));
  return cnMatches.length + enWords.length;
}

export function countParagraphs(text: string): number {
  if (!text) return 0;
  const paragraphs = text.split(/\n\s*\n|\n+/).filter(p => p.trim().length > 0);
  return paragraphs.length;
}

export function countSentences(text: string): number {
  if (!text) return 0;
  const matches = text.match(/[.!?。！？]+/g) || [];
  return matches.length;
}

export function estimateReadingTime(text: string): number {
  const words = countWords(text);
  return Math.ceil(words / 300);
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase();
  if (w.length <= 3) return 1;
  const vowels = 'aeiouy';
  let count = 0;
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (w.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

export function fleschKincaid(text: string): number {
  if (!text || !text.trim()) return 0;
  const cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const enText = text.replace(/[\u4e00-\u9fa5]/g, ' ').trim();
  const enWords = enText.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  const wordCount = cnChars + enWords.length;
  const sentenceCount = Math.max(1, countSentences(text));
  if (wordCount === 0) return 0;
  let totalSyllables = cnChars;
  for (const w of enWords) {
    totalSyllables += countSyllables(w);
  }
  const avgSentenceLen = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / Math.max(1, wordCount);
  let score = 206.835 - 1.015 * avgSentenceLen - 84.6 * avgSyllablesPerWord;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return score;
}

export function recordDailyWords(projectId: string, words: number, snippet: string): void {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const key = `${projectId}_${date}`;
    const raw = localStorage.getItem('daily_word_log');
    const log = raw ? JSON.parse(raw) : {};
    log[key] = (log[key] || 0) + words;
    localStorage.setItem('daily_word_log', JSON.stringify(log));
    const snippetsKey = `snippets_${key}`;
    const rawSnippets = localStorage.getItem(snippetsKey);
    const snippets: string[] = rawSnippets ? JSON.parse(rawSnippets) : [];
    if (snippet && snippet.trim()) {
      snippets.push(snippet.trim().slice(0, 200));
      if (snippets.length > 20) snippets.splice(0, snippets.length - 20);
      localStorage.setItem(snippetsKey, JSON.stringify(snippets));
    }
  } catch {
    /* ignore */
  }
}

export function getSnippetsByDate(projectId: string, date: string): string[] {
  try {
    const key = `snippets_${projectId}_${date}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getProjectWordCount(projectId: string): number {
  try {
    const total = localStorage.getItem(`wc_total_${projectId}`);
    return total ? parseInt(total, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setProjectWordCount(projectId: string, count: number): void {
  try {
    localStorage.setItem(`wc_total_${projectId}`, String(count));
  } catch {
    /* ignore */
  }
}
