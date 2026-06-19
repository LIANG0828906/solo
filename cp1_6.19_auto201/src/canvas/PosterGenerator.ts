import type { CanvasCover } from './store';
import type { Track } from '../track/store';
import { COVER_BASE_SIZE, CANVAS_WIDTH_MM, CANVAS_HEIGHT_MM } from './store';
import { averageColors, pickTextColor, complementaryColor } from '../utils/colorAnalysis';

export interface PosterInput {
  covers: CanvasCover[];
  backgroundColor: string;
  tracks: Track[];
}

export const POSTER_WIDTH = 1200;
export const POSTER_HEIGHT = 1600;

const CANVAS_RATIO = CANVAS_WIDTH_MM / CANVAS_HEIGHT_MM;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCoverArt(
  ctx: CanvasRenderingContext2D,
  cover: CanvasCover,
  originX: number,
  originY: number,
  scaleFactor: number
) {
  const size = COVER_BASE_SIZE * cover.scale * scaleFactor;
  const cx = originX + cover.x * scaleFactor + size / 2;
  const cy = originY + cover.y * scaleFactor + size / 2;
  const rot = (cover.rotation * Math.PI) / 180;
  const corner = 8 * scaleFactor;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.translate(-size / 2, -size / 2);

  const [c1, c2, c3] = cover.album.coverColors;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c3);
  roundRect(ctx, 0, 0, size, size, corner);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2 * scaleFactor;
  ctx.stroke();

  const vinylR = size * 0.38;
  const vinylX = size / 2;
  const vinylY = size / 2;
  ctx.beginPath();
  ctx.arc(vinylX, vinylY, vinylR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20,20,20,0.9)';
  ctx.fill();
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(vinylX, vinylY, vinylR - i * (vinylR / 5), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(vinylX, vinylY, vinylR * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = cover.album.primaryColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(vinylX, vinylY, vinylR * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = '#1A1A1A';
  ctx.fill();

  const titleText = cover.album.title;
  ctx.fillStyle = pickTextColor(c1);
  ctx.font = `bold ${Math.max(10, size * 0.08)}px Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const pad = size * 0.06;
  ctx.fillText(titleText.length > 18 ? titleText.slice(0, 16) + '…' : titleText, pad, pad);

  ctx.font = `${Math.max(8, size * 0.06)}px Arial`;
  ctx.fillText(cover.album.artist.length > 20 ? cover.album.artist.slice(0, 18) + '…' : cover.album.artist, pad, pad + size * 0.1);

  ctx.restore();
}

export function generatePoster(input: PosterInput): string {
  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = input.backgroundColor;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const posterPadding = 60;
  const collageAreaW = POSTER_WIDTH - posterPadding * 2;
  const collageAreaH = Math.floor(POSTER_HEIGHT * 0.55);

  const scaleByW = collageAreaW / CANVAS_WIDTH_MM;
  const scaleByH = collageAreaH / CANVAS_HEIGHT_MM;
  const scaleFactor = Math.min(scaleByW, scaleByH);

  const renderedCanvasW = CANVAS_WIDTH_MM * scaleFactor;
  const renderedCanvasH = CANVAS_HEIGHT_MM * scaleFactor;
  const originX = posterPadding + (collageAreaW - renderedCanvasW) / 2;
  const originY = posterPadding + (collageAreaH - renderedCanvasH) / 2;

  const sorted = [...input.covers].sort((a, b) => a.zIndex - b.zIndex);
  sorted.forEach(cover => drawCoverArt(ctx, cover, originX, originY, scaleFactor));

  ctx.strokeStyle = 'rgba(93,64,55,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, originX, originY, renderedCanvasW, renderedCanvasH, 12);
  ctx.stroke();

  const listY = originY + renderedCanvasH + 60;
  const listX = posterPadding + 40;
  const listW = POSTER_WIDTH - posterPadding * 2 - 80;

  const headerText = 'VINYL PLAYLIST';
  ctx.fillStyle = pickTextColor(input.backgroundColor);
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(headerText, listX, listY);

  const accent = complementaryColor(input.backgroundColor);
  ctx.fillStyle = accent;
  ctx.fillRect(listX, listY + 44, 120, 3);

  let y = listY + 80;
  const tracksToShow = input.tracks.slice(0, 18);
  tracksToShow.forEach((track, idx) => {
    const rowH = 44;

    ctx.beginPath();
    ctx.arc(listX + 16, y + rowH / 2, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#5D4037';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(idx + 1), listX + 16, y + rowH / 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = pickTextColor(input.backgroundColor);
    ctx.font = 'bold 18px Arial';
    const t = track.title.length > 40 ? track.title.slice(0, 38) + '…' : track.title;
    ctx.fillText(t, listX + 48, y + 4);

    ctx.font = '13px Arial';
    ctx.globalAlpha = 0.7;
    const sub = `${track.artist} · ${track.albumTitle}`;
    ctx.fillText(sub.length > 50 ? sub.slice(0, 48) + '…' : sub, listX + 48, y + 26);
    ctx.globalAlpha = 1;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Arial';
    const m = Math.floor(track.durationSec / 60);
    const s = track.durationSec % 60;
    ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, listX + listW, y + rowH / 2);

    y += rowH + 6;
  });

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = pickTextColor(input.backgroundColor);
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('黑胶拼贴海报工坊 · Vinyl Collage Studio', POSTER_WIDTH / 2, POSTER_HEIGHT - 24);
  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/png');
}
