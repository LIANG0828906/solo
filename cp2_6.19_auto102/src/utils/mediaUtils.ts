import type { VideoClip, ClipTitle, Sticker, StickerType } from '../types';

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeMs(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function getClipEffectiveDuration(clip: VideoClip): number {
  return Math.max(0, clip.duration - clip.trimIn - clip.trimOut);
}

export function getClipEndTime(clip: VideoClip): number {
  return clip.startTime + getClipEffectiveDuration(clip);
}

export function isClipActiveAtTime(clip: VideoClip, time: number): boolean {
  return time >= clip.startTime && time < getClipEndTime(clip);
}

export function isStickerActiveAtTime(sticker: Sticker, time: number): boolean {
  return time >= sticker.startTime && time < sticker.startTime + sticker.duration;
}

export function getTotalDuration(clips: VideoClip[]): number {
  if (clips.length === 0) return 0;
  return Math.max(...clips.map(getClipEndTime));
}

export function renderClipToCanvas(
  ctx: CanvasRenderingContext2D,
  clip: VideoClip,
  width: number,
  height: number
): void {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#e94560');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (let i = 0; i < width; i += 40) {
    ctx.fillRect(i, 0, 1, height);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clip.name, width / 2, height / 2 - 20);

  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(
    `${formatTime(getClipEffectiveDuration(clip))}`,
    width / 2,
    height / 2 + 20
  );
}

export function renderTitleToCanvas(
  ctx: CanvasRenderingContext2D,
  title: ClipTitle,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.font = `bold ${title.fontSize}px sans-serif`;
  ctx.fillStyle = title.color;
  ctx.textBaseline = 'top';

  const padding = 40;
  let x: number;
  switch (title.align) {
    case 'left':
      ctx.textAlign = 'left';
      x = padding;
      break;
    case 'right':
      ctx.textAlign = 'right';
      x = width - padding;
      break;
    case 'center':
    default:
      ctx.textAlign = 'center';
      x = width / 2;
      break;
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(title.text, x, height - padding - title.fontSize);
  ctx.restore();
}

export function getStickerSVG(type: StickerType): string {
  const svgs: Record<StickerType, string> = {
    star: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 61,38 97,38 68,59 79,93 50,72 21,93 32,59 3,38 39,38" fill="#f5c518" stroke="#ffffff" stroke-width="2"/></svg>`,
    heart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,88 C20,65 5,45 5,28 C5,13 17,3 30,3 C40,3 47,10 50,18 C53,10 60,3 70,3 C83,3 95,13 95,28 C95,45 80,65 50,88 Z" fill="#e94560" stroke="#ffffff" stroke-width="2"/></svg>`,
    arrow: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="75,50 35,20 35,42 10,42 10,58 35,58 35,80" fill="#00d2ff" stroke="#ffffff" stroke-width="2"/></svg>`,
    explosion: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,2 58,35 92,20 68,50 98,60 65,62 78,95 50,70 22,95 35,62 2,60 32,50 8,20 42,35" fill="#ff6b35" stroke="#ffffff" stroke-width="2"/></svg>`,
    cloud: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M25,65 C10,65 5,52 12,42 C15,30 30,28 38,35 C42,22 62,20 68,32 C85,30 92,50 80,60 C88,72 72,82 62,72 L30,72 C22,82 8,78 8,68 C8,66 10,65 12,65 Z" fill="#87ceeb" stroke="#ffffff" stroke-width="2"/></svg>`,
  };
  return svgs[type];
}

export function renderStickerToCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: Sticker
): void {
  ctx.save();
  ctx.translate(sticker.x, sticker.y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);
  ctx.scale(sticker.scale, sticker.scale);

  const size = 50;
  const svgStr = getStickerSVG(sticker.type);
  const img = new Image();
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.src = url;
  if (img.complete) {
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    URL.revokeObjectURL(url);
  } else {
    img.onload = () => {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      URL.revokeObjectURL(url);
    };
  }
  ctx.restore();
}

export const PRESET_CLIPS: Omit<VideoClip, 'id' | 'startTime' | 'trimIn' | 'trimOut'>[] = [
  { name: '开场片段', color: '#e94560', duration: 5 },
  { name: '主镜头A', color: '#0f3460', duration: 8 },
  { name: '主镜头B', color: '#533483', duration: 6 },
  { name: '转场特效', color: '#e94560', duration: 3 },
  { name: '结尾画面', color: '#0f3460', duration: 4 },
];

export const STICKER_TYPES: StickerType[] = ['star', 'heart', 'arrow', 'explosion', 'cloud'];

export const STICKER_LABELS: Record<StickerType, string> = {
  star: '星形',
  heart: '心形',
  arrow: '箭头',
  explosion: '爆炸',
  cloud: '云朵',
};
