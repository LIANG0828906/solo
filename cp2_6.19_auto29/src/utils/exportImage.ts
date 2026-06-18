import { Layer, MemeCard } from '../store/editorStore';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_SIZE = 300;

export const exportCanvasImage = async (layers: Layer[]): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 canvas 上下文');

  ctx.fillStyle = 'rgba(40, 40, 55, 1)';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.save();
  ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);

  for (const layer of layers) {
    if (!layer.visible) continue;

    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);

    if (layer.type === 'image') {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(
            img,
            -layer.width / 2,
            -layer.height / 2,
            layer.width,
            layer.height
          );
          resolve();
        };
        img.onerror = () => resolve();
        img.src = layer.src;
      });
    } else if (layer.type === 'text') {
      ctx.font = `bold ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText(layer.text || '文字', 0, 0);

      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text || '文字', 0, 0);
    } else if (layer.type === 'draw') {
      if (layer.points.length >= 2) {
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(layer.points[0].x, layer.points[0].y);
        for (let i = 1; i < layer.points.length; i++) {
          ctx.lineTo(layer.points[i].x, layer.points[i].y);
        }
        ctx.stroke();
      }
    } else if (layer.type === 'sticker') {
      ctx.font = `${layer.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(layer.emoji, 0, 0);
    }

    ctx.restore();
  }

  ctx.restore();

  return canvas.toDataURL('image/png');
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const createMemeCard = (imageUrl: string, creatorName: string): MemeCard => {
  return {
    id: uuidv4(),
    imageUrl,
    creatorName,
    createdAt: Date.now(),
    isFavorite: false,
  };
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
};
