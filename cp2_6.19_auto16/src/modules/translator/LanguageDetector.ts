import type { LanguageCode } from '../../types';

export class LanguageDetector {
  private frequencyMap: Map<LanguageCode, number> = new Map();

  constructor() {
    const langs: LanguageCode[] = ['zh', 'en', 'ja', 'ko', 'fr'];
    langs.forEach(l => this.frequencyMap.set(l, 0));
  }

  detect(text: string): LanguageCode {
    const trimmed = text.trim();
    if (!trimmed) return 'en';

    if (/[\u3131-\u318E\uAC00-\uD7A3]/.test(trimmed)) {
      return this.record('ko');
    }
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
      return this.record('ja');
    }
    if (/[\u4e00-\u9fa5]/.test(trimmed)) {
      return this.record('zh');
    }
    if (/[àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/.test(trimmed)) {
      return this.record('fr');
    }
    return this.record('en');
  }

  private record(lang: LanguageCode): LanguageCode {
    const current = this.frequencyMap.get(lang) ?? 0;
    this.frequencyMap.set(lang, current + 1);
    return lang;
  }

  getFrequency(): Record<LanguageCode, number> {
    return {
      zh: this.frequencyMap.get('zh') ?? 0,
      en: this.frequencyMap.get('en') ?? 0,
      ja: this.frequencyMap.get('ja') ?? 0,
      ko: this.frequencyMap.get('ko') ?? 0,
      fr: this.frequencyMap.get('fr') ?? 0
    };
  }
}

export const languageDetector = new LanguageDetector();
