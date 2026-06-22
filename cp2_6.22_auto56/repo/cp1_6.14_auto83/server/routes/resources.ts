import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db.js';
import { verifyToken } from './auth.js';
import type { Resource, Version, ResourceType } from '../types.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbnails');
const DIFF_DIR = path.join(UPLOAD_DIR, 'diffs');

await fs.mkdir(UPLOAD_DIR, { recursive: true });
await fs.mkdir(THUMB_DIR, { recursive: true });
await fs.mkdir(DIFF_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

function authMiddleware(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, error: '令牌无效' });
    return;
  }
  (req as Request & { userId: string }).userId = payload.userId;
  next();
}

async function generateThumbnail(filePath: string, thumbnailName: string): Promise<{ width: number; height: number }> {
  const thumbPath = path.join(THUMB_DIR, thumbnailName);
  const metadata = await sharp(filePath).metadata();
  await sharp(filePath).resize(480, 320, { fit: 'cover', withoutEnlargement: false }).jpeg({ quality: 80 }).toFile(thumbPath);
  return { width: metadata.width || 0, height: metadata.height || 0 };
}

async function generateDiffImage(v1Path: string, v2Path: string, diffName: string): Promise<{ percent: number; changed: number; total: number }> {
  const img1 = await sharp(v1Path).raw().toBuffer({ resolveWithObject: true });
  const img2 = await sharp(v2Path).raw().toBuffer({ resolveWithObject: true });

  const width = Math.min(img1.info.width, img2.info.width);
  const height = Math.min(img1.info.height, img2.info.height);
  const channels = img1.info.channels;
  const total = width * height;
  let changed = 0;

  const output = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx1 = (y * img1.info.width + x) * channels;
      const idx2 = (y * img2.info.width + x) * channels;
      const idxOut = (y * width + x) * 4;

      let diff = 0;
      for (let c = 0; c < 3; c++) {
        diff += Math.abs((img1.data[idx1 + c] || 0) - (img2.data[idx2 + c] || 0));
      }
      diff /= 3;

      if (diff > 15) {
        changed++;
        output[idxOut] = 239;
        output[idxOut + 1] = 68;
        output[idxOut + 2] = 68;
        output[idxOut + 3] = 180;
      } else {
        output[idxOut] = (img2.data[idx2] || 0);
        output[idxOut + 1] = (img2.data[idx2 + 1] || 0);
        output[idxOut + 2] = (img2.data[idx2 + 2] || 0);
        output[idxOut + 3] = 80;
      }
    }
  }

  const diffPath = path.join(DIFF_DIR, diffName);
  await sharp(output, { raw: { width, height, channels: 4 } }).png().toFile(diffPath);

  return {
    percent: total > 0 ? (changed / total) * 100 : 0,
    changed,
    total,
  };
}

const resourceTypeMap: Record<string, ResourceType> = {
  sprite: 'sprite',
  background: 'background',
  ui: 'ui',
  audio: 'audio',
};

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, type, minSize, maxSize, startDate, endDate } = req.query as {
      search?: string;
      type?: string;
      minSize?: string;
      maxSize?: string;
      startDate?: string;
      endDate?: string;
    };
    const userId = (req as Request & { userId: string }).userId;
    const db = await getDb();

    let resources = db.data.resources.filter(r => r.userId === userId);

    if (type) {
      const types = type.split(',');
      resources = resources.filter(r => types.includes(r.type));
    }
    if (search) {
      const s = search.toLowerCase();
      resources = resources.filter(r => r.name.toLowerCase().includes(s));
    }
    if (minSize) resources = resources.filter(r => r.size >= parseInt(minSize, 10));
    if (maxSize) resources = resources.filter(r => r.size <= parseInt(maxSize, 10));
    if (startDate) resources = resources.filter(r => r.createdAt >= startDate);
    if (endDate) resources = resources.filter(r => r.createdAt <= endDate + 'T23:59:59');

    resources.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取资源失败' });
  }
});

router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { userId: string }).userId;
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: '缺少文件' });
      return;
    }
    const { name, type, note, projects } = req.body as {
      name: string;
      type: string;
      note?: string;
      projects?: string;
    };

    const resourceType = resourceTypeMap[type] || 'sprite';
    const resourceId = uuid();
    const thumbName = `${resourceId}.jpg`;
    const { width, height } = await generateThumbnail(file.path, thumbName);

    const resource: Resource = {
      id: resourceId,
      userId,
      name: name || file.originalname,
      type: resourceType,
      size: file.size,
      width,
      height,
      thumbnailUrl: `/uploads/thumbnails/${thumbName}`,
      fileUrl: `/uploads/${file.filename}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionCount: 1,
      projects: projects ? projects.split(',') : [],
    };

    const version: Version = {
      id: uuid(),
      resourceId,
      versionNumber: 1,
      fileUrl: `/uploads/${file.filename}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbName}`,
      size: file.size,
      width,
      height,
      note: note || '初始版本',
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    db.data.resources.push(resource);
    db.data.versions.push(version);
    if (resource.projects.length) {
      for (const projectId of resource.projects) {
        if (!db.data.resourceProjects.find(rp => rp.resourceId === resourceId && rp.projectId === projectId)) {
          db.data.resourceProjects.push({ resourceId, projectId });
        }
      }
    }
    await db.write();

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '上传失败' });
  }
});

router.get('/projects', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const db = await getDb();
  res.json({ success: true, data: db.data.projects });
});

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const resource = db.data.resources.find(r => r.id === id);
    if (!resource) {
      res.status(404).json({ success: false, error: '资源不存在' });
      return;
    }
    const versions = db.data.versions.filter(v => v.resourceId === id).sort((a, b) => b.versionNumber - a.versionNumber);
    const projectLinks = db.data.resourceProjects.filter(rp => rp.resourceId === id);
    const projectsInfo = db.data.projects.filter(p => projectLinks.some(pl => pl.projectId === p.id));

    res.json({
      success: true,
      data: { ...resource, versions, projectsInfo },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取资源详情失败' });
  }
});

router.post('/:id/versions', authMiddleware, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: '缺少文件' });
      return;
    }
    const { note } = req.body as { note?: string };
    const db = await getDb();
    const resource = db.data.resources.find(r => r.id === id);
    if (!resource) {
      res.status(404).json({ success: false, error: '资源不存在' });
      return;
    }

    const versionCount = db.data.versions.filter(v => v.resourceId === id).length;
    const newVersion = versionCount + 1;
    const thumbName = `${id}_v${newVersion}.jpg`;
    const { width, height } = await generateThumbnail(file.path, thumbName);

    const version: Version = {
      id: uuid(),
      resourceId: id,
      versionNumber: newVersion,
      fileUrl: `/uploads/${file.filename}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbName}`,
      size: file.size,
      width,
      height,
      note: note || `版本 ${newVersion}`,
      createdAt: new Date().toISOString(),
    };

    db.data.versions.push(version);
    resource.versionCount = newVersion;
    resource.size = file.size;
    resource.width = width;
    resource.height = height;
    resource.fileUrl = version.fileUrl;
    resource.thumbnailUrl = version.thumbnailUrl;
    resource.updatedAt = new Date().toISOString();
    await db.write();

    res.status(201).json({ success: true, data: version });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建版本失败' });
  }
});

router.get('/:id/compare/:v1/:v2', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, v1, v2 } = req.params;
    const db = await getDb();
    const versions = db.data.versions.filter(x => x.resourceId === id);
    const version1 = versions.find(x => x.versionNumber === parseInt(v1, 10));
    const version2 = versions.find(x => x.versionNumber === parseInt(v2, 10));
    if (!version1 || !version2) {
      res.status(404).json({ success: false, error: '版本不存在' });
      return;
    }

    const v1Rel = version1.fileUrl.replace('/uploads/', '');
    const v2Rel = version2.fileUrl.replace('/uploads/', '');
    const v1Path = path.join(UPLOAD_DIR, v1Rel);
    const v2Path = path.join(UPLOAD_DIR, v2Rel);
    const diffName = `${id}_${v1}_${v2}.png`;

    const { percent, changed, total } = await generateDiffImage(v1Path, v2Path, diffName);

    res.json({
      success: true,
      data: {
        diffImageUrl: `/uploads/diffs/${diffName}`,
        changePercent: Number(percent.toFixed(2)),
        changedPixels: changed,
        totalPixels: total,
        version1,
        version2,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '生成差异图失败' });
  }
});

router.post('/:id/compare/:v1/:v2/annotation', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, v1, v2 } = req.params;
    const { annotation } = req.body as { annotation: string };
    const userId = (req as Request & { userId: string }).userId;
    const db = await getDb();

    const existing = db.data.annotations.find(
      a => a.resourceId === id && a.v1Id === v1 && a.v2Id === v2 && a.userId === userId
    );
    if (existing) {
      existing.content = annotation;
    } else {
      db.data.annotations.push({
        id: uuid(),
        resourceId: id,
        v1Id: v1,
        v2Id: v2,
        userId,
        content: annotation,
        createdAt: new Date().toISOString(),
      });
    }
    await db.write();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '保存注释失败' });
  }
});

export default router;
