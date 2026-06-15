export interface CompressedImage {
  original: File;
  compressed: string;
  thumbnail: string;
  size: number;
  width: number;
  height: number;
}

const MAX_SIZE = 500 * 1024;
const MAX_WIDTH = 1200;
const THUMBNAIL_SIZE = 120;

export const compressImage = (file: File): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height;
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        const adjustQuality = () => {
          let iterations = 0;
          const maxIterations = 10;
          
          while (compressedDataUrl.length > MAX_SIZE && iterations < maxIterations) {
            quality -= 0.1;
            if (quality <= 0.1) quality = 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            iterations++;
          }

          if (compressedDataUrl.length > MAX_SIZE && width > 800) {
            const newWidth = width * 0.8;
            const newHeight = height * 0.8;
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            quality = 0.8;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            width = newWidth;
            height = newHeight;
            adjustQuality();
          }
        };

        adjustQuality();

        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          const thumbSize = THUMBNAIL_SIZE;
          let thumbWidth = thumbSize;
          let thumbHeight = thumbSize;
          
          if (img.width > img.height) {
            thumbHeight = (thumbSize / img.width) * img.height;
          } else {
            thumbWidth = (thumbSize / img.height) * img.width;
          }
          
          thumbCanvas.width = thumbSize;
          thumbCanvas.height = thumbSize;
          
          thumbCtx.fillStyle = '#1a1040';
          thumbCtx.fillRect(0, 0, thumbSize, thumbSize);
          
          const offsetX = (thumbSize - thumbWidth) / 2;
          const offsetY = (thumbSize - thumbHeight) / 2;
          thumbCtx.drawImage(img, offsetX, offsetY, thumbWidth, thumbHeight);
          
          const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

          const byteString = atob(compressedDataUrl.split(',')[1]);
          const compressedSize = byteString.length;

          resolve({
            original: file,
            compressed: compressedDataUrl,
            thumbnail,
            size: compressedSize,
            width: Math.round(width),
            height: Math.round(height),
          });
        } else {
          reject(new Error('Thumbnail canvas not supported'));
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
