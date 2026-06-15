export interface CompressResult {
  blob: Blob;
  sizeBefore: number;
  sizeAfter: number;
}

export async function compressImage(file: File, quality: number): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const sizeBefore = file.size;
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              sizeBefore,
              sizeAfter: blob.size,
            });
          } else {
            reject(new Error('压缩失败'));
          }
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + 'B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + 'KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
  }
}

export function calculateCompressionRatio(sizeBefore: number, sizeAfter: number): number {
  if (sizeBefore === 0) return 0;
  return ((sizeBefore - sizeAfter) / sizeBefore) * 100;
}
