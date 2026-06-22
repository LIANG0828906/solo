import { Router } from 'express';
import sharp from 'sharp';
import { store, calculateMaterialCost } from '../store/memoryStore';
import type { GenerateShareRequest, ApiResponse, GenerateShareResponse, Work } from '../types';

const generateRouter = Router();

const CARD_WIDTH = 800;
const CARD_HEIGHT = 1000;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function createGradientBuffer(
  width: number,
  height: number,
  fromHex: string,
  toHex: string,
): Buffer {
  const [r1, g1, b1] = hexToRgb(fromHex);
  const [r2, g2, b2] = hexToRgb(toHex);
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  try {
    if (!dataUrl.startsWith('data:image')) return null;
    const base64 = dataUrl.split(',')[1];
    return Buffer.from(base64, 'base64');
  } catch {
    return null;
  }
}

generateRouter.post('/', async (req, res) => {
  try {
    const body = req.body as GenerateShareRequest;
    const { workId, brandSettings } = body;

    const work = store.get(workId) as Work | undefined;
    if (!work) {
      return res.status(404).json({ code: 404, data: null, message: '作品不存在' } as ApiResponse<null>);
    }

    const logoText = brandSettings?.logoText || '艺匠工坊';
    const gradientFrom = brandSettings?.gradientFrom || '#1E293B';
    const gradientTo = brandSettings?.gradientTo || '#334155';

    const gradientBuf = createGradientBuffer(CARD_WIDTH, CARD_HEIGHT, gradientFrom, gradientTo);
    let pipeline = sharp(gradientBuf, {
      raw: { width: CARD_WIDTH, height: CARD_HEIGHT, channels: 4 },
    });

    const svgOverlays: string[] = [];

    const mainImage = work.images?.[0];
    if (mainImage) {
      const buf = dataUrlToBuffer(mainImage.url);
      if (buf) {
        try {
          const imgWidth = 640;
          const imgHeight = 640;
          const resized = await sharp(buf)
            .resize(imgWidth, imgHeight, { fit: 'cover', position: 'center' })
            .png()
            .toBuffer();
          const top = 100;
          const left = (CARD_WIDTH - imgWidth) / 2;
          pipeline = pipeline.composite([
            {
              input: resized,
              top,
              left,
            },
          ]);
        } catch {
          // 图片处理失败跳过
        }
      }
    }

    const priceText = work.price ? `¥${work.price.toFixed(0)}` : '';
    const cost = calculateMaterialCost(work.materials || []);
    const materialNames = work.materials?.slice(0, 3).map((m) => m.name).join(' · ') || work.texture || '';
    const infoLines: string[] = [];
    if (priceText) infoLines.push(priceText);
    if (materialNames) infoLines.push(materialNames);
    if (work.size) infoLines.push(work.size);

    const lineHeight = 40;
    const bottomY = CARD_HEIGHT - 80 - (infoLines.length - 1) * lineHeight;

    const svgHeight = CARD_HEIGHT;
    const infoSvg = `
      <svg width="${CARD_WIDTH}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#A78BFA" stop-opacity="1" />
            <stop offset="100%" stop-color="#8B5CF6" stop-opacity="1" />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.5"/>
          </filter>
        </defs>
        <rect x="40" y="36" width="8" height="40" fill="url(#logoGrad)" rx="4"/>
        <text x="60" y="68" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="28" font-weight="700" fill="#F1F5F9" filter="url(#dropShadow)">
          ${logoText}
        </text>
        ${infoLines.map((line, idx) => `
          <text x="${CARD_WIDTH - 40}" y="${bottomY + idx * lineHeight}" 
            font-family="PingFang SC, Microsoft YaHei, sans-serif" 
            font-size="${idx === 0 && line.startsWith('¥') ? '40' : '24'}" 
            font-weight="${idx === 0 && line.startsWith('¥') ? '700' : '500'}" 
            fill="${idx === 0 && line.startsWith('¥') ? '#10B981' : '#CBD5E1'}"
            text-anchor="end"
            filter="url(#dropShadow)">
            ${line}
          </text>
        `).join('')}
        <text x="40" y="${CARD_HEIGHT - 40}" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="400" fill="#94A3B8">
          成本 ¥${cost.toFixed(2)} · 共 ${work.materials?.length || 0} 种物料
        </text>
      </svg>
    `;
    svgOverlays.push(infoSvg);

    const svgBuffer = Buffer.from(infoSvg);
    pipeline = pipeline.composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0,
      },
    ]);

    const pngBuf = await pipeline.png().toBuffer();
    const base64 = 'data:image/png;base64,' + pngBuf.toString('base64');

    res.json({
      code: 0,
      data: {
        imageBase64: base64,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      },
    } as ApiResponse<GenerateShareResponse>);
  } catch (e: unknown) {
    console.error('Generate share card error:', e);
    const message = e instanceof Error ? e.message : '生成失败';
    res.status(500).json({ code: 500, data: null, message } as ApiResponse<null>);
  }
});

export default generateRouter;
