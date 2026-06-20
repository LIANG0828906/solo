const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `${file.name} 不是JPG或PNG格式` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `${file.name} 超过15MB限制` };
  }
  return { valid: true };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function addWatermark(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#E74C3C';
  ctx.font = `${Math.max(16, Math.floor(img.width / 20))}px Inter, sans-serif`;
  ctx.rotate((-30 * Math.PI) / 180);

  const text = '草稿 - 仅供预览';
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const stepX = textWidth + 80;
  const stepY = Math.max(16, Math.floor(img.width / 20)) * 3;

  const diagonal = Math.sqrt(img.width * img.width + img.height * img.height);

  for (let y = -diagonal; y < diagonal * 2; y += stepY) {
    for (let x = -diagonal; x < diagonal * 2; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
      1
    );
  });
}

export async function generateThumbnail(file: File, maxSize = 300): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const w = Math.floor(img.width * ratio);
  const h = Math.floor(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Thumbnail generation failed'));
      },
      'image/jpeg',
      0.7
    );
  });
}

const DB_NAME = 'IllustrationApp';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBlob(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlob(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function createZip(
  files: { blob: Blob; name: string }[]
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.blob);
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function blobToObjectUrl(blob: Blob | null): string {
  if (!blob) return '';
  return URL.createObjectURL(blob);
}
