const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const QUALITY = 0.8;

export interface CompressResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '仅支持图片文件' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `图片大小不能超过${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB` };
  }
  return { valid: true };
}

export function compressImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 50));
      }
    };

    reader.onerror = () => reject(new Error('读取文件失败'));

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (onProgress) onProgress(60);

        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas初始化失败'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        if (onProgress) onProgress(80);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            if (onProgress) onProgress(100);
            const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
            resolve({
              blob,
              dataUrl,
              width,
              height,
              originalSize: file.size,
              compressedSize: blob.size,
            });
          },
          'image/jpeg',
          QUALITY
        );
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Blob转DataURL失败'));
    reader.readAsDataURL(blob);
  });
}
