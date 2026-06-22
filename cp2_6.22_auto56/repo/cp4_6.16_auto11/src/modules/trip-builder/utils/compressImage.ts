export async function compressImage(
  file: File,
  maxSizeKB: number = 200
): Promise<{ compressedFile: Blob; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const quality = 0.9;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        let width = img.width;
        let height = img.height;
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compress = (attemptQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              const sizeKB = blob.size / 1024;
              if (sizeKB > maxSizeKB && attemptQuality > 0.1) {
                compress(attemptQuality - 0.1);
              } else {
                const thumbCanvas = document.createElement('canvas');
                const thumbCtx = thumbCanvas.getContext('2d');
                if (!thumbCtx) {
                  resolve({ compressedFile: blob, thumbnailUrl: '' });
                  return;
                }
                const thumbDim = 40;
                thumbCanvas.width = thumbDim;
                thumbCanvas.height = thumbDim;
                thumbCtx.fillStyle = '#e5e7eb';
                thumbCtx.fillRect(0, 0, thumbDim, thumbDim);
                const scale = Math.max(thumbDim / img.width, thumbDim / img.height);
                const scaledW = img.width * scale;
                const scaledH = img.height * scale;
                thumbCtx.drawImage(
                  img,
                  (thumbDim - scaledW) / 2,
                  (thumbDim - scaledH) / 2,
                  scaledW,
                  scaledH
                );
                const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.5);
                resolve({ compressedFile: blob, thumbnailUrl });
              }
            },
            'image/jpeg',
            attemptQuality
          );
        };

        compress(quality);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}
