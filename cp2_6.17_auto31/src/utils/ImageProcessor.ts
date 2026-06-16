import { v4 as uuidv4 } from 'uuid';

export interface PieceImageData {
  id: string;
  imgData: ImageData;
  correctX: number;
  correctY: number;
  width: number;
  height: number;
}

export async function splitImage(
  file: File,
  gridSize: number,
  canvasSize: number
): Promise<{ pieces: PieceImageData[]; imageDataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvasSize;
        offCanvas.height = canvasSize;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        const imgAspect = img.width / img.height;
        let drawWidth = canvasSize;
        let drawHeight = canvasSize;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > 1) {
          drawHeight = canvasSize;
          drawWidth = canvasSize * imgAspect;
          offsetX = (canvasSize - drawWidth) / 2;
        } else if (imgAspect < 1) {
          drawWidth = canvasSize;
          drawHeight = canvasSize / imgAspect;
          offsetY = (canvasSize - drawHeight) / 2;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const imageDataUrl = offCanvas.toDataURL('image/png');

        const pieceWidth = Math.floor(canvasSize / gridSize);
        const pieceHeight = Math.floor(canvasSize / gridSize);
        const pieces: PieceImageData[] = [];

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const sx = col * pieceWidth;
            const sy = row * pieceHeight;
            let sw = pieceWidth;
            let sh = pieceHeight;

            if (col === gridSize - 1) {
              sw = canvasSize - sx;
            }
            if (row === gridSize - 1) {
              sh = canvasSize - sy;
            }

            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = sw;
            pieceCanvas.height = sh;
            const pieceCtx = pieceCanvas.getContext('2d');
            if (!pieceCtx) continue;

            const imgData = ctx.getImageData(sx, sy, sw, sh);
            pieceCtx.putImageData(imgData, 0, 0);

            pieces.push({
              id: uuidv4(),
              imgData: pieceCtx.getImageData(0, 0, sw, sh),
              correctX: sx,
              correctY: sy,
              width: sw,
              height: sh,
            });
          }
        }

        resolve({ pieces, imageDataUrl });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

export function imageDataToDataUrl(imgData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });
}
