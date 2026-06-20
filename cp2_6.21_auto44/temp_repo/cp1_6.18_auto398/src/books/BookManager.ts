import { BookMetadata, Book } from '@/types';
import { useStore } from '@/store';

interface FetchProgress {
  percent: number;
  message: string;
}

type ProgressCallback = (progress: FetchProgress) => void;

let workerInstance: Worker | null = null;

const getWorker = (): Worker | null => {
  if (typeof window === 'undefined') return null;
  if (workerInstance) return workerInstance;
  try {
    workerInstance = new Worker(new URL('@/workers/bookWorker.ts', import.meta.url), {
      type: 'module',
    });
    return workerInstance;
  } catch (e) {
    return null;
  }
};

export const BookManager = {
  async fetchMetadataByISBN(
    isbn: string,
    onProgress?: ProgressCallback
  ): Promise<BookMetadata> {
    const cleanIsbn = isbn.replace(/[-\s]/g, '').trim();
    if (!cleanIsbn) {
      throw new Error('请输入有效的ISBN号');
    }

    const worker = getWorker();
    if (worker) {
      return new Promise((resolve, reject) => {
        const msgId = `fetch-${Date.now()}`;
        const handler = (event: MessageEvent) => {
          const { type, payload, id } = event.data;
          if (id !== 'fetch' && id !== msgId) return;
          if (type === 'PROGRESS' && onProgress) {
            onProgress(payload);
          } else if (type === 'SUCCESS') {
            worker.removeEventListener('message', handler);
            resolve(payload);
          } else if (type === 'ERROR') {
            worker.removeEventListener('message', handler);
            reject(new Error(payload.message));
          }
        };
        worker.addEventListener('message', handler);
        worker.postMessage({
          type: 'FETCH_METADATA',
          payload: { isbn: cleanIsbn },
          id: msgId,
        });
        setTimeout(() => {
          worker.removeEventListener('message', handler);
        }, 20000);
      });
    }

    if (onProgress) onProgress({ percent: 25, message: '正在连接书籍数据库...' });
    await new Promise((r) => setTimeout(r, 200));

    const store = useStore.getState();
    if (onProgress) onProgress({ percent: 60, message: '正在解析书籍信息...' });
    const metadata = await store.fetchBookMetadata(cleanIsbn);

    if (onProgress) onProgress({ percent: 90, message: '加载封面资源...' });
    await new Promise((r) => setTimeout(r, 150));

    if (onProgress) onProgress({ percent: 100, message: '获取成功！' });
    return metadata;
  },

  async detectBarcode(imageData: ImageData): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const BarcodeDetector = (window as any).BarcodeDetector;
    if (!BarcodeDetector) {
      return null;
    }
    try {
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'isbn'] });
      const barcodes = await detector.detect(imageData);
      if (barcodes && barcodes.length > 0) {
        const raw = barcodes[0].rawValue || '';
        if (/^[0-9-]{10,15}$/.test(raw)) {
          return raw.replace(/[-\s]/g, '');
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  isBarcodeDetectorSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof (window as any).BarcodeDetector !== 'undefined';
  },

  async scanFromCamera(): Promise<{ stop: () => Promise<string | null> }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      throw new Error('当前浏览器不支持摄像头功能');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    await video.play();

    let scanning = true;
    let foundIsbn: string | null = null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const scanLoop = async (): Promise<string | null> => {
      while (scanning && !foundIsbn) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = await this.detectBarcode(imageData);
          if (result) {
            foundIsbn = result;
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      stream.getTracks().forEach((t) => t.stop());
      return foundIsbn;
    };

    const promise = scanLoop();

    return {
      stop: async () => {
        scanning = false;
        stream.getTracks().forEach((t) => t.stop());
        return promise;
      },
    };
  },

  validateISBN(isbn: string): boolean {
    const cleaned = isbn.replace(/[-\s]/g, '').trim();
    if (/^\d{13}$/.test(cleaned)) {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(cleaned[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
      }
      const check = (10 - (sum % 10)) % 10;
      return check === parseInt(cleaned[12]);
    }
    if (/^\d{9}[\dX]$/.test(cleaned)) {
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * (10 - i);
      }
      const last = cleaned[9];
      const checkVal = last === 'X' ? 10 : parseInt(last);
      sum += checkVal;
      return sum % 11 === 0;
    }
    return /^\d{8,15}$/.test(cleaned);
  },

  addBookToShelf(metadata: BookMetadata & { tags?: string[]; rating?: number; status?: string }): Promise<Book> {
    const store = useStore.getState();
    return store.addBook({
      isbn: metadata.isbn,
      title: metadata.title,
      authors: metadata.authors,
      coverUrl: metadata.coverUrl,
      description: metadata.description,
      tags: metadata.tags || [],
      rating: metadata.rating,
      status: metadata.status || 'wishlist',
      totalPages: metadata.pageCount || 0,
      pagesRead: 0,
    });
  },

  getCachedCover(isbn: string): string | null {
    try {
      const cache = sessionStorage.getItem(`cover_${isbn}`);
      return cache || null;
    } catch {
      return null;
    }
  },

  setCachedCover(isbn: string, url: string) {
    try {
      sessionStorage.setItem(`cover_${isbn}`, url);
    } catch {}
  },
};

export default BookManager;
