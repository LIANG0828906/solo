import type { LanguageCode, TranslationResult } from '../../types';
import { languageDetector } from './LanguageDetector';

const MOCK_TRANSLATIONS: Record<string, Partial<Record<LanguageCode, string>>> = {
  hello: { zh: '你好', en: 'hello', ja: 'こんにちは', ko: '안녕하세요', fr: 'bonjour' },
  world: { zh: '世界', en: 'world', ja: '世界', ko: '세계', fr: 'monde' },
  你好: { zh: '你好', en: 'hello', ja: 'こんにちは', ko: '안녕하세요', fr: 'bonjour' },
  世界: { zh: '世界', en: 'world', ja: '世界', ko: '세계', fr: 'monde' },
  直播: { zh: '直播', en: 'live stream', ja: '生放送', ko: '생방송', fr: 'diffusion en direct' },
  加油: { zh: '加油', en: 'go for it', ja: '頑張れ', ko: '화이팅', fr: 'allez' },
  厉害: { zh: '厉害', en: 'amazing', ja: 'すごい', ko: '대박', fr: 'génial' },
  谢谢: { zh: '谢谢', en: 'thank you', ja: 'ありがとう', ko: '감사합니다', fr: 'merci' },
  amazing: { zh: '厉害', en: 'amazing', ja: 'すごい', ko: '대박', fr: 'génial' },
  thank: { zh: '谢谢', en: 'thank you', ja: 'ありがとう', ko: '감사합니다', fr: 'merci' },
  こんにちは: { zh: '你好', en: 'hello', ja: 'こんにちは', ko: '안녕하세요', fr: 'bonjour' },
  すごい: { zh: '厉害', en: 'amazing', ja: 'すごい', ko: '대박', fr: 'génial' },
  안녕하세요: { zh: '你好', en: 'hello', ja: 'こんにちは', ko: '안녕하세요', fr: 'bonjour' },
  화이팅: { zh: '加油', en: 'go for it', ja: '頑張れ', ko: '화이팅', fr: 'allez' },
  bonjour: { zh: '你好', en: 'hello', ja: 'こんにちは', ko: '안녕하세요', fr: 'bonjour' },
  merci: { zh: '谢谢', en: 'thank you', ja: 'ありがとう', ko: '감사합니다', fr: 'merci' }
};

const TRANSLATE_SUFFIX: Record<LanguageCode, string> = {
  zh: ' [译]',
  en: ' [tr]',
  ja: ' [訳]',
  ko: ' [번역]',
  fr: ' [tr]'
};

class TranslatorEngine {
  private cache: Map<string, TranslationResult> = new Map();
  private throttleTimer: number | null = null;
  private pendingCallback: (() => void) | null = null;
  private requestCount = 0;

  async translate(
    sourceText: string,
    targetLang: LanguageCode,
    sourceLang?: LanguageCode
  ): Promise<TranslationResult> {
    const detected = sourceLang ?? languageDetector.detect(sourceText);
    const cacheKey = `${sourceText.toLowerCase()}|${detected}|${targetLang}`;

    if (this.cache.has(cacheKey)) {
      return { ...this.cache.get(cacheKey)!, timestamp: Date.now() };
    }

    if (detected === targetLang) {
      const result: TranslationResult = {
        sourceText,
        translatedText: sourceText,
        sourceLang: detected,
        targetLang,
        timestamp: Date.now()
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    const translated = this.mockTranslate(sourceText, detected, targetLang);
    const delay = 100 + Math.random() * 300;

    return new Promise((resolve) => {
      window.setTimeout(() => {
        this.requestCount++;
        const result: TranslationResult = {
          sourceText,
          translatedText: translated,
          sourceLang: detected,
          targetLang,
          timestamp: Date.now()
        };
        if (this.cache.size > 50) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(cacheKey, result);
        resolve(result);
      }, delay);
    });
  }

  private mockTranslate(text: string, src: LanguageCode, tgt: LanguageCode): string {
    const lower = text.toLowerCase();
    for (const key of Object.keys(MOCK_TRANSLATIONS)) {
      if (lower.includes(key) && MOCK_TRANSLATIONS[key][tgt]) {
        return MOCK_TRANSLATIONS[key][tgt]!;
      }
    }
    return `${text}${TRANSLATE_SUFFIX[tgt]}`;
  }

  throttle<P extends unknown[], R>(
    fn: (...args: P) => Promise<R>,
    wait: number
  ): (...args: P) => Promise<R | undefined> {
    let lastArgs: P | null = null;
    let timerId: number | null = null;
    let lastInvoke = 0;

    return (...args: P): Promise<R | undefined> => {
      const now = Date.now();
      const remaining = wait - (now - lastInvoke);

      if (remaining <= 0) {
        if (timerId !== null) {
          window.clearTimeout(timerId);
          timerId = null;
        }
        lastInvoke = now;
        return fn(...args);
      } else {
        lastArgs = args;
        if (timerId === null) {
          return new Promise((resolve) => {
            timerId = window.setTimeout(() => {
              lastInvoke = Date.now();
              timerId = null;
              const currentArgs = lastArgs;
              lastArgs = null;
              if (currentArgs) {
                fn(...currentArgs).then(resolve);
              } else {
                resolve(undefined);
              }
            }, remaining);
          });
        }
        return Promise.resolve(undefined);
      }
    };
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  reset(): void {
    if (this.throttleTimer !== null) {
      window.clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
    this.pendingCallback = null;
  }
}

export const translatorEngine = new TranslatorEngine();
