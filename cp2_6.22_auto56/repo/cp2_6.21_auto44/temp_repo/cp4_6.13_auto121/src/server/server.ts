import express, { Request, Response } from 'express';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  PosterConfig,
  GenerateResponse,
  ShareResponse,
  SharedPosterPayload,
  SHARE_TTL_MS,
  EXPORT_DPI,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const sharedStoragePath = path.resolve(__dirname, '../../shared-posters.json');

interface SharedStoreEntry {
  hash: string;
  config: PosterConfig;
  imageData: string;
  createdAt: number;
  expiresAt: number;
}

const sharedStore = new Map<string, SharedStoreEntry>();

function loadSharedStore(): void {
  try {
    if (fs.existsSync(sharedStoragePath)) {
      const raw = fs.readFileSync(sharedStoragePath, 'utf-8');
      const data: SharedStoreEntry[] = JSON.parse(raw);
      const now = Date.now();
      data.forEach((entry) => {
        if (entry.expiresAt > now) {
          sharedStore.set(entry.hash, entry);
        }
      });
      persistSharedStore();
    }
  } catch (err) {
    console.error('[SharedStore] Failed to load:', err);
  }
}

function persistSharedStore(): void {
  try {
    const entries = Array.from(sharedStore.values());
    fs.mkdirSync(path.dirname(sharedStoragePath), { recursive: true });
    fs.writeFileSync(sharedStoragePath, JSON.stringify(entries), 'utf-8');
  } catch (err) {
    console.error('[SharedStore] Failed to persist:', err);
  }
}

function cleanupExpiredShared(): void {
  const now = Date.now();
  let removed = 0;
  for (const [hash, entry] of sharedStore.entries()) {
    if (entry.expiresAt <= now) {
      sharedStore.delete(hash);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`[Cleanup] Removed ${removed} expired shared posters`);
    persistSharedStore();
  }
}

function hashConfig(config: PosterConfig, salt: string): string {
  const payload = JSON.stringify(config) + '::' + salt + '::' + Date.now().toString(36);
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 8);
}

function base64ToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

async function processImageWithDpi(
  imageBuffer: Buffer,
  width: number,
  height: number,
  dpi: number = EXPORT_DPI
): Promise<Buffer> {
  return sharp(imageBuffer, {
    raw: { width, height, channels: 4 },
  })
    .resize(width, height, { fit: 'fill' })
    .png({
      compressionLevel: 6,
      progressive: true,
    })
    .withMetadata({
      density: dpi,
      resolutionUnit: 'inch',
      exif: {
        IFD0: {
          XResolution: [dpi, 1],
          YResolution: [dpi, 1],
          ResolutionUnit: 2,
          Software: 'CalligraphyPosterGenerator',
        },
      },
    })
    .toBuffer();
}

app.post('/api/generate', async (req: Request, res: Response<GenerateResponse>) => {
  try {
    const { imageData, width, height } = req.body as {
      imageData: string;
      width: number;
      height: number;
    };

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing image data' });
    }

    const w = width || CANVAS_WIDTH;
    const h = height || CANVAS_HEIGHT;
    const rawBuffer = base64ToBuffer(imageData);

    const processedBuffer = await processImageWithDpi(rawBuffer, w, h, EXPORT_DPI);
    const outDataUrl = `data:image/png;base64,${processedBuffer.toString('base64')}`;

    return res.json({ success: true, imageUrl: outDataUrl });
  } catch (err) {
    console.error('[Generate] Error:', err);
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.post('/api/share', async (req: Request, res: Response<ShareResponse>) => {
  try {
    const { config, imageData, width, height } = req.body as {
      config: PosterConfig;
      imageData: string;
      width: number;
      height: number;
    };

    if (!config || !imageData) {
      return res.status(400).json({ success: false, error: 'Missing config or image' });
    }

    const w = width || CANVAS_WIDTH;
    const h = height || CANVAS_HEIGHT;
    const rawBuffer = base64ToBuffer(imageData);
    const processedBuffer = await processImageWithDpi(rawBuffer, w, h, EXPORT_DPI);
    const finalDataUrl = `data:image/png;base64,${processedBuffer.toString('base64')}`;

    const salt = crypto.randomBytes(4).toString('hex');
    const hash = hashConfig(config, salt);

    const now = Date.now();
    const expiresAt = now + SHARE_TTL_MS;

    const entry: SharedStoreEntry = {
      hash,
      config,
      imageData: finalDataUrl,
      createdAt: now,
      expiresAt,
    };

    sharedStore.set(hash, entry);
    persistSharedStore();

    return res.json({
      success: true,
      shortUrl: `/share/${hash}`,
      expiresAt,
    });
  } catch (err) {
    console.error('[Share] Error:', err);
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.get('/api/share/:hash', (req: Request, res: Response) => {
  const { hash } = req.params;
  const entry = sharedStore.get(hash);

  if (!entry) {
    return res.status(404).json({ success: false, error: 'Link not found or expired' });
  }

  if (entry.expiresAt <= Date.now()) {
    sharedStore.delete(hash);
    persistSharedStore();
    return res.status(410).json({ success: false, error: 'Link has expired' });
  }

  return res.json({
    success: true,
    config: entry.config,
    imageData: entry.imageData,
    expiresAt: entry.expiresAt,
  });
});

app.get('/api/s/:hash', (req: Request, res: Response) => {
  const { hash } = req.params;
  const entry = sharedStore.get(hash);

  if (!entry || entry.expiresAt <= Date.now()) {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>链接已失效</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F5E6C8;font-family:'Noto Serif SC',serif;">
      <div style="text-align:center;color:#1A1A1A;">
        <h1 style="font-size:32px;margin-bottom:16px;">🔗 链接已失效</h1>
        <p style="color:#555;font-size:16px;">该分享链接已超过24小时有效期</p>
      </div></body></html>`;
    res.type('text/html').send(html);
    return;
  }

  const configJson = JSON.stringify(entry.config).replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>墨韵 · 书法海报分享</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{background:#F5E6C8;font-family:'Noto Serif SC',serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 16px;}
      .wrap{max-width:960px;width:100%;}
      h1{color:#1A1A1A;font-size:24px;margin-bottom:24px;text-align:center;}
      .img-card{background:#fff;padding:16px;border-radius:12px;box-shadow:0 12px 40px rgba(26,26,26,.15);margin-bottom:24px;}
      img{width:100%;height:auto;display:block;border-radius:8px;}
      .actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
      button{padding:12px 28px;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s;font-family:inherit;}
      .btn-primary{background:#C23B22;color:#fff;box-shadow:0 4px 14px rgba(194,59,34,.35);}
      .btn-primary:active{transform:translateY(1px);box-shadow:0 2px 6px rgba(194,59,34,.25);}
      .btn-secondary{background:#fff;color:#1A1A1A;box-shadow:0 4px 14px rgba(26,26,26,.08);}
      .btn-secondary:active{transform:translateY(1px);box-shadow:0 2px 6px rgba(26,26,26,.05);}
      .info{text-align:center;margin-top:20px;color:#887864;font-size:13px;}
    </style></head><body>
    <div class="wrap">
      <h1>📜 墨韵 · 书法海报分享</h1>
      <div class="img-card"><img id="poster" src="${entry.imageData}" alt="书法海报"/></div>
      <div class="actions">
        <button class="btn-primary" onclick="document.getElementById('lnk').click()">⬇ 下载高清海报</button>
        <a id="lnk" href="${entry.imageData}" download="calligraphy-poster.png" style="display:none;"></a>
        <button class="btn-secondary" onclick="location.href='/'">🎨 创建自己的作品</button>
      </div>
      <p class="info">链接有效期至 ${new Date(entry.expiresAt).toLocaleString('zh-CN')}</p>
    </div>
    <script>window.__POSTER_CONFIG__ = ${configJson};</script>
  </body></html>`;

  res.type('text/html').send(html);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', dpi: EXPORT_DPI, sharedCount: sharedStore.size });
});

loadSharedStore();

setInterval(cleanupExpiredShared, 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`[Server] Calligraphy Poster API running on http://localhost:${PORT}`);
  console.log(`[Server] EXPORT DPI: ${EXPORT_DPI}, Share TTL: ${SHARE_TTL_MS / 1000 / 3600}h`);
});
