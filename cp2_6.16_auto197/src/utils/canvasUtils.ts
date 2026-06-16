export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getImageDataFromImage(
  image: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): ImageData {
  const canvas = createCanvas(sw, sh);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文');
  }
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  return ctx.getImageData(0, 0, sw, sh);
}

export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = createCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文');
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function drawImageDataToCanvas(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  x: number,
  y: number,
  scale: number = 1
): void {
  if (scale === 1) {
    ctx.putImageData(imageData, x, y);
  } else {
    const tempCanvas = createCanvas(imageData.width, imageData.height);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      tempCanvas,
      x,
      y,
      imageData.width * scale,
      imageData.height * scale
    );
  }
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
