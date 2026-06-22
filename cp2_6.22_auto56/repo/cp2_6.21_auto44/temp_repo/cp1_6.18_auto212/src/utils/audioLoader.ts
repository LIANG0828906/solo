const MAX_CACHE_BYTES = 30 * 1024 * 1024;

interface CacheEntry {
  el: HTMLAudioElement;
  size: number;
  lastUsed: number;
}

class AudioLoader {
  private cache: Map<string, CacheEntry> = new Map();
  private totalBytes = 0;
  private loading: Map<string, Promise<HTMLAudioElement>> = new Map();

  private evictIfNeeded(extra: number): void {
    while (this.totalBytes + extra > MAX_CACHE_BYTES && this.cache.size > 0) {
      let oldestKey: string | null = null;
      let oldestTs = Number.POSITIVE_INFINITY;
      for (const [key, entry] of this.cache) {
        if (entry.lastUsed < oldestTs) {
          oldestTs = entry.lastUsed;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        const entry = this.cache.get(oldestKey)!;
        try {
          entry.el.pause();
          entry.el.src = '';
        } catch {
          /* noop */
        }
        this.totalBytes -= entry.size;
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  load(src: string): Promise<HTMLAudioElement> {
    const cached = this.cache.get(src);
    if (cached) {
      cached.lastUsed = Date.now();
      return Promise.resolve(cached.el);
    }
    const inFlight = this.loading.get(src);
    if (inFlight) return inFlight;

    const promise = new Promise<HTMLAudioElement>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      let resolved = false;
      const done = (err?: Error) => {
        if (resolved) return;
        resolved = true;
        this.loading.delete(src);
        if (err) reject(err);
        else resolve(audio);
      };
      audio.addEventListener('canplaythrough', () => {
        this.evictIfNeeded(256 * 1024);
        this.cache.set(src, {
          el: audio,
          size: 256 * 1024,
          lastUsed: Date.now(),
        });
        this.totalBytes += 256 * 1024;
        done();
      });
      audio.addEventListener('error', () => done(new Error(`加载失败: ${src}`)));
      audio.src = src;
      audio.load();
    });
    this.loading.set(src, promise);
    return promise;
  }

  evict(src: string): void {
    const entry = this.cache.get(src);
    if (entry) {
      try {
        entry.el.pause();
        entry.el.src = '';
      } catch {
        /* noop */
      }
      this.totalBytes -= entry.size;
      this.cache.delete(src);
    }
  }

  clear(): void {
    for (const [src, entry] of this.cache) {
      try {
        entry.el.pause();
        entry.el.src = '';
      } catch {
        /* noop */
      }
      this.cache.delete(src);
    }
    this.totalBytes = 0;
  }
}

export const audioLoader = new AudioLoader();
