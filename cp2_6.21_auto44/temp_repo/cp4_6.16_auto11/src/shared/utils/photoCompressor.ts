interface CompressedResult {
  compressedFile: Blob;
  dataUrl: string;
  thumbnailUrl: string;
}

function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas conversion failed'));
        }
      },
      type,
      quality
    );
  });
}

function generateThumbnail(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const maxSize = 150;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }
    resolve(canvas.toDataURL('image/jpeg', 0.7));
  });
}

export async function compressImage(
  file: File,
  maxSizeKB: number = 200
): Promise<CompressedResult> {
  const img = await createImageFromFile(file);
  const maxSizeBytes = maxSizeKB * 1024;

  let quality = 0.8;
  let minQuality = 0.1;
  let maxQuality = 0.95;
  let resultBlob: Blob;
  let resultDataUrl: string;

  let maxWidth = 1920;
  let maxHeight = 1080;
  let width = img.width;
  let height = img.height;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  ctx.drawImage(img, 0, 0, width, height);

  for (let i = 0; i < 10; i++) {
    resultBlob = await canvasToBlob(canvas, 'image/jpeg', quality);

    if (resultBlob.size <= maxSizeBytes || quality <= minQuality) {
      resultDataUrl = canvas.toDataURL('image/jpeg', quality);
      const thumbnailUrl = await generateThumbnail(img);
      return {
        compressedFile: resultBlob,
        dataUrl: resultDataUrl,
        thumbnailUrl,
      };
    }

    if (resultBlob.size > maxSizeBytes) {
      maxQuality = quality;
    } else {
      minQuality = quality;
    }
    quality = (minQuality + maxQuality) / 2;
  }

  resultBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
  resultDataUrl = canvas.toDataURL('image/jpeg', quality);
  const thumbnailUrl = await generateThumbnail(img);

  return {
    compressedFile: resultBlob,
    dataUrl: resultDataUrl,
    thumbnailUrl,
  };
}
