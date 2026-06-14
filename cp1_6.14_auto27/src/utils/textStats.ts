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

export function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
