import type { TextStyle, Sticker } from '@/types';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export const exportMemeImage = async (
  imageSrc: string | null,
  topText: TextStyle,
  bottomText: TextStyle,
  stickers: Sticker[],
  canvasWidth: number,
  canvasHeight: number
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文');
  }

  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2
  );
  gradient.addColorStop(0, '#3a3a5a');
  gradient.addColorStop(0.4, '#2a2a4a');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (imageSrc) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = imageSrc;
    });

    const imgAspect = img.width / img.height;
    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

    if (imgAspect > canvasAspect) {
      drawHeight = CANVAS_HEIGHT;
      drawWidth = drawHeight * imgAspect;
      drawX = (CANVAS_WIDTH - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = CANVAS_WIDTH;
      drawHeight = drawWidth / imgAspect;
      drawX = 0;
      drawY = (CANVAS_HEIGHT - drawHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  const scaleX = CANVAS_WIDTH / canvasWidth;
  const scaleY = CANVAS_HEIGHT / canvasHeight;

  const sortedStickers = [...stickers].sort((a, b) => a.zIndex - b.zIndex);
  sortedStickers.forEach(sticker => {
    const x = sticker.x * scaleX;
    const y = sticker.y * scaleY;
    const baseSize = 60 * Math.max(scaleX, scaleY);
    const size = baseSize * sticker.scale;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.content, 0, 0);
    ctx.restore();
  });

  const drawText = (textStyle: TextStyle, isTop: boolean) => {
    if (!textStyle.text) return;
    
    const x = CANVAS_WIDTH / 2 + (textStyle.x - canvasWidth / 2) * scaleX;
    const y = isTop 
      ? 60 * scaleY + textStyle.y * scaleY
      : CANVAS_HEIGHT - 60 * scaleY + textStyle.y * scaleY;
    
    const fontSize = textStyle.fontSize * Math.max(scaleX, scaleY);
    
    ctx.save();
    ctx.font = `900 ${fontSize}px ${textStyle.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (textStyle.strokeWidth > 0) {
      ctx.strokeStyle = textStyle.strokeColor;
      ctx.lineWidth = textStyle.strokeWidth * 2 * Math.max(scaleX, scaleY);
      ctx.lineJoin = 'round';
      ctx.strokeText(textStyle.text.toUpperCase(), x, y);
    }
    
    ctx.fillStyle = textStyle.color;
    ctx.fillText(textStyle.text.toUpperCase(), x, y);
    ctx.restore();
  };

  drawText(topText, true);
  drawText(bottomText, false);

  return canvas.toDataURL('image/png');
};

export const downloadImage = (dataUrl: string, filename: string = 'meme.png') => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateShortLink = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `meme://${result}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};
