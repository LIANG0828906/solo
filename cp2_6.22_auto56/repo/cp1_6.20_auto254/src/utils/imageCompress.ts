const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const MIN_QUALITY = 0.1;
const QUALITY_STEP = 0.1;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
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
          reject(new Error('图片转换失败'));
        }
      },
      type,
      quality
    );
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('DataURL 转换失败'));
      }
    };
    reader.onerror = () => reject(new Error('DataURL 转换失败'));
    reader.readAsDataURL(blob);
  });
}

function drawImageToCanvas(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  let { width, height } = img;
  const ratio = width / height;

  if (width > maxWidth || height > maxHeight) {
    if (width / maxWidth > height / maxHeight) {
      width = maxWidth;
      height = Math.round(width / ratio);
    } else {
      height = maxHeight;
      width = Math.round(height * ratio);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 上下文创建失败');
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  if (file.size <= MAX_SIZE_BYTES) {
    return blobToDataURL(file);
  }

  const img = await loadImage(file);
  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

  let maxWidth = img.width;
  let maxHeight = img.height;
  let quality = 0.9;

  while (quality >= MIN_QUALITY) {
    const canvas = drawImageToCanvas(img, maxWidth, maxHeight);
    const blob = await canvasToBlob(canvas, mimeType, quality);

    if (blob.size <= MAX_SIZE_BYTES) {
      return blobToDataURL(blob);
    }

    if (quality > MIN_QUALITY + QUALITY_STEP) {
      quality -= QUALITY_STEP;
    } else {
      maxWidth = Math.round(maxWidth * 0.85);
      maxHeight = Math.round(maxHeight * 0.85);
      quality = 0.9;
    }
  }

  const canvas = drawImageToCanvas(img, maxWidth, maxHeight);
  const blob = await canvasToBlob(canvas, mimeType, MIN_QUALITY);
  return blobToDataURL(blob);
}
