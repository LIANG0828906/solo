import type { LayoutConfig, Photo, Portfolio } from '@/types';
import { loadImage, blobToObjectURL, fileToDataURL } from './helpers';

const THUMB_SIZE = 200;

export async function generateThumbnail(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, {
    resizeWidth: THUMB_SIZE * 2,
    resizeHeight: THUMB_SIZE * 2,
    resizeQuality: 'high',
  });

  const ratio = bitmap.width / bitmap.height;
  let tw = THUMB_SIZE;
  let th = THUMB_SIZE;
  let sx = 0;
  let sy = 0;

  if (ratio > 1) {
    const cropW = bitmap.height;
    sx = (bitmap.width - cropW) / 2;
  } else {
    const cropH = bitmap.width;
    sy = (bitmap.height - cropH) / 2;
  }
  const side = Math.min(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, tw, th);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Thumbnail blob empty'))),
      'image/webp',
      0.85,
    );
  });

  bitmap.close();
  return { blob, width: bitmap.width, height: bitmap.height };
}

export function canvasToDataURL(canvas: HTMLCanvasElement, type = 'image/webp', quality = 0.9): string {
  return canvas.toDataURL(type, quality);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/webp', quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Empty canvas blob'))),
      type,
      quality,
    );
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

interface RenderTarget {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

function createCanvas(w: number, h: number): RenderTarget {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

export async function renderLayoutPreview(
  imageSrc: string,
  config: LayoutConfig,
  targetWidth = 1200,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(imageSrc);
  const imgRatio = img.width / img.height;
  const m = config.margin;

  if (config.templateType === 'full') {
    let cw = targetWidth;
    let ch: number;
    switch (config.subStyle) {
      case 1:
        ch = cw * (9 / 16);
        break;
      case 2:
        ch = cw * (2 / 3);
        break;
      case 0:
      default:
        ch = cw / imgRatio;
    }
    const { canvas, ctx } = createCanvas(cw, ch);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, cw, ch);

    const availW = cw - m * 2;
    const availH = ch - m * 2;
    drawCoverImage(ctx, img, m, m, availW, availH, config.borderRadius);
    return canvas;
  }

  if (config.templateType === 'border') {
    let cw = targetWidth;
    let ch = cw / imgRatio + m * 2;
    let topM = m;
    let bottomM = m;
    let leftM = m;
    let rightM = m;
    switch (config.subStyle) {
      case 1:
        bottomM = m * 2.2;
        ch = targetWidth / imgRatio + topM + bottomM;
        break;
      case 2:
        topM = m * 1.6;
        bottomM = m * 1.6;
        ch = targetWidth / imgRatio + topM + bottomM;
        break;
      default:
        cw = targetWidth + m * 2;
        ch = targetWidth / imgRatio + m * 2;
    }
    const { canvas, ctx } = createCanvas(cw, ch);
    ctx.fillStyle = config.borderColor;
    ctx.fillRect(0, 0, cw, ch);

    const availW = cw - leftM - rightM;
    const availH = ch - topM - bottomM;
    drawCoverImage(ctx, img, leftM, topM, availW, availH, config.borderRadius);
    return canvas;
  }

  const cw = targetWidth * 2;
  const ch = targetWidth;
  const { canvas, ctx } = createCanvas(cw, ch);
  ctx.fillStyle = config.borderColor;
  ctx.fillRect(0, 0, cw, ch);

  const half = cw / 2;
  const pageW = half - m - m / 2;
  const pageH = ch - m * 2;

  if (config.subStyle === 2) {
    const cx = cw / 2;
    const cy = ch / 2;
    const fullW = cw - m * 2;
    const fullH = ch - m * 2;
    drawCoverImage(ctx, img, m, m, fullW, fullH, config.borderRadius, cx, cy);
  } else {
    const ratio = pageW / pageH;
    let srcLw: number;
    let srcLh: number;
    let srcLx: number;
    let srcLy: number;
    let srcRw: number;
    let srcRh: number;
    let srcRx: number;
    let srcRy: number;

    if (imgRatio >= ratio * 2) {
      srcLw = img.width / 2;
      srcLh = srcLw / ratio;
      srcLy = (img.height - srcLh) / 2;
      srcLx = 0;
      srcRw = srcLw;
      srcRh = srcLh;
      srcRy = srcLy;
      srcRx = img.width / 2;
    } else {
      srcLh = img.height;
      srcLw = srcLh * ratio;
      srcLx = 0;
      srcLy = 0;
      srcRh = img.height;
      srcRw = srcRh * ratio;
      srcRx = img.width - srcRw;
      srcRy = 0;
    }

    ctx.save();
    roundRect(ctx, m, m, pageW, pageH, config.borderRadius);
    ctx.clip();
    ctx.drawImage(img, srcLx, srcLy, srcLw, srcLh, m, m, pageW, pageH);
    ctx.restore();

    ctx.save();
    roundRect(ctx, half + m / 2, m, pageW, pageH, config.borderRadius);
    ctx.clip();
    ctx.drawImage(img, srcRx, srcRy, srcRw, srcRh, half + m / 2, m, pageW, pageH);
    ctx.restore();

    if (config.subStyle === 0) {
      ctx.strokeStyle = 'rgba(100,100,100,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(half, m);
      ctx.lineTo(half, ch - m);
      ctx.stroke();
    } else {
      const grad = ctx.createLinearGradient(half - 60, 0, half + 60, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(half - 60, m, 120, ch - m * 2);
    }
  }

  return canvas;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  cx = x + w / 2,
  cy = y + h / 2,
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW: number;
  let drawH: number;
  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = h * imgRatio;
  } else {
    drawW = w;
    drawH = w / imgRatio;
  }
  const drawX = cx - drawW / 2;
  const drawY = cy - drawH / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

export async function imageToBase64(src: string): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/webp', 0.9);
}

export async function exportPortfolioHTML(
  portfolio: Portfolio,
  photosMap: Map<string, Photo>,
): Promise<Blob> {
  const pages: string[] = [];

  const coverImgId = portfolio.coverImageId;
  let coverB64 = '';
  if (coverImgId && photosMap.has(coverImgId)) {
    coverB64 = await imageToBase64(photosMap.get(coverImgId)!.originalUrl);
  }

  pages.push(`
    <section class="page cover" style="background:${portfolio.coverColor};">
      <div class="cover-inner">
        ${coverB64 ? `<div class="cover-art"><img src="${coverB64}" alt=""></div>` : ''}
        <div class="cover-title">${escapeHTML(portfolio.coverTitle || portfolio.title)}</div>
        <div class="cover-meta">LUMEN · Portfolio</div>
      </div>
    </section>
  `);

  const perPage = portfolio.layoutPerPage;
  for (let i = 0; i < portfolio.items.length; i += perPage) {
    const chunk = portfolio.items.slice(i, i + perPage);
    const isTwoCol = perPage === 2 && chunk.length === 2;
    const inner = await Promise.all(
      chunk.map(async (item) => {
        const photo = photosMap.get(item.photoId);
        if (!photo) return '';
        const canvas = await renderLayoutPreview(photo.originalUrl, item.layout, 1200);
        const b64 = canvasToDataURL(canvas, 'image/jpeg', 0.9);
        return `<div class="spread-cell ${isTwoCol ? 'col' : ''}">
          <img src="${b64}" alt="${escapeHTML(photo.title)}" />
        </div>`;
      }),
    );

    pages.push(`
      <section class="page">
        <div class="spread ${isTwoCol ? 'two-col' : 'single'}">
          ${inner.join('')}
        </div>
      </section>
    `);
  }

  pages.push(`
    <section class="page back-cover" style="background:${portfolio.backCoverColor};">
      <div class="back-inner">
        <div class="back-brand">LUMEN</div>
        <div class="back-line"></div>
        <div class="back-date">${new Date().getFullYear()}</div>
      </div>
    </section>
  `);

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHTML(portfolio.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=IBM+Plex+Sans:wght@300;400&display=swap" rel="stylesheet" />
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#1a1a1a;color:#fff;font-family:'IBM Plex Sans',sans-serif;-webkit-font-smoothing:antialiased}
body{padding:40px 24px;min-height:100vh}
.title-bar{max-width:1200px;margin:0 auto 32px;display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.title-bar h1{font-family:'Playfair Display',serif;font-size:1.75rem;font-weight:600}
.title-bar span{color:#8a8a8a;font-size:.85rem;letter-spacing:.08em;text-transform:uppercase}
.book{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:32px}
.page{background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.25);aspect-ratio:3/2;position:relative}
.page.single{aspect-ratio:3/2}
.cover{aspect-ratio:3/2}
.cover-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px;color:#fff}
.cover-art{width:62%;max-height:55%;margin-bottom:36px;border-radius:4px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.35)}
.cover-art img{width:100%;height:100%;object-fit:cover;display:block}
.cover-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,4.5vw,3.6rem);font-weight:600;letter-spacing:.02em;line-height:1.1;text-shadow:0 2px 18px rgba(0,0,0,.35);margin-bottom:16px}
.cover-meta{font-size:.75rem;letter-spacing:.3em;text-transform:uppercase;opacity:.85}
.spread{position:absolute;inset:24px;display:grid;gap:24px}
.spread.single{grid-template-columns:1fr}
.spread.two-col{grid-template-columns:1fr 1fr}
.spread-cell{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:2px}
.spread-cell img{width:100%;height:100%;object-fit:contain;display:block}
.back-cover{aspect-ratio:3/2;display:flex;align-items:center;justify-content:center;color:#fff}
.back-inner{text-align:center}
.back-brand{font-family:'Playfair Display',serif;font-size:2.5rem;letter-spacing:.15em;font-weight:600}
.back-line{width:48px;height:1px;background:rgba(255,255,255,.35);margin:16px auto}
.back-date{font-size:.8rem;letter-spacing:.2em;opacity:.85}
@media (max-width:768px){
  body{padding:20px 12px}
  .page{aspect-ratio:auto;min-height:360px}
  .cover,.back-cover{min-height:480px}
  .spread{inset:12px;gap:12px}
  .spread.two-col{grid-template-columns:1fr;grid-auto-rows:minmax(240px,1fr)}
}
</style>
</head>
<body>
  <header class="title-bar">
    <h1>${escapeHTML(portfolio.title)}</h1>
    <span>${portfolio.items.length} Photos · Lumen Export</span>
  </header>
  <main class="book">
    ${pages.join('\n')}
  </main>
</body>
</html>`;

  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

export async function exportSingleImageHTML(
  photo: Photo,
  layout: LayoutConfig,
): Promise<string> {
  const canvas = await renderLayoutPreview(photo.originalUrl, layout, 1600);
  const b64 = canvasToDataURL(canvas, 'image/jpeg', 0.92);

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>${escapeHTML(photo.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=IBM+Plex+Sans:wght@300;400&display=swap" rel="stylesheet" />
<style>
html,body{margin:0;padding:0;background:#1a1a1a;min-height:100vh;color:#fff;font-family:'IBM Plex Sans',sans-serif;display:flex;align-items:center;justify-content:center}
.frame{max-width:92vw;max-height:92vh;display:flex;flex-direction:column;gap:20px;align-items:center;padding:32px 0}
.frame img{max-width:100%;max-height:80vh;box-shadow:0 24px 64px rgba(0,0,0,.5);border-radius:4px;display:block}
.meta{text-align:center}
.meta h1{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:600;margin-bottom:6px}
.meta p{color:#9a9a9a;font-size:.8rem;letter-spacing:.08em}
</style>
</head>
<body>
  <div class="frame">
    <img src="${b64}" alt="${escapeHTML(photo.title)}" />
    <div class="meta">
      <h1>${escapeHTML(photo.title)}</h1>
      <p>${photo.captureDate ? new Date(photo.captureDate).toLocaleDateString() : ''} · ${photo.tags.join(' / ')}</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { blobToObjectURL, fileToDataURL };
