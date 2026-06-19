import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Photo, FilterType } from '../types';

const router = Router();

const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
const ORIGINALS_DIR = path.join(UPLOADS_DIR, 'originals');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
const PROCESSED_DIR = path.join(UPLOADS_DIR, 'processed');
const DB_PATH = path.join(UPLOADS_DIR, 'photos.json');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ORIGINALS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = uuidv4();
    cb(null, `${id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG/PNG 格式'));
    }
  }
});

function readPhotos(): Photo[] {
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writePhotos(photos: Photo[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(photos, null, 2));
}

async function applySharpFilter(
  inputPath: string,
  outputPath: string,
  filter: FilterType,
  brightness: number,
  contrast: number
): Promise<void> {
  let pipeline = sharp(inputPath);

  const brightnessFactor = brightness / 100;
  const contrastFactor = contrast / 100;

  if (brightnessFactor !== 1 || contrastFactor !== 1) {
    pipeline = pipeline.linear(contrastFactor, (brightnessFactor - 0.5) * 255 * contrastFactor);
  }

  switch (filter) {
    case 'warm':
      pipeline = pipeline.recomb([
        [1.1, 0, 0],
        [0, 1.0, 0],
        [0, 0, 0.9]
      ]).modulate({ saturation: 1.2, brightness: 1.05 });
      break;
    case 'cool':
      pipeline = pipeline.recomb([
        [0.9, 0, 0],
        [0, 1.0, 0],
        [0, 0, 1.1]
      ]).modulate({ saturation: 0.9, brightness: 0.95 });
      break;
    case 'mono':
      pipeline = pipeline.grayscale().linear(1.1, -10);
      break;
    case 'vintage':
      pipeline = pipeline
        .recomb([
          [0.393, 0.769, 0.189],
          [0.349, 0.686, 0.168],
          [0.272, 0.534, 0.131]
        ])
        .modulate({ saturation: 0.8, brightness: 1.1 })
        .linear(0.9, 15);
      break;
    case 'original':
    default:
      break;
  }

  await pipeline.toFile(outputPath);
}

router.get('/', (_req: Request, res: Response) => {
  const photos = readPhotos().sort((a, b) => b.uploadTime - a.uploadTime);
  res.json({ success: true, photos });
});

router.post('/upload', upload.array('photos', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    const savedPhotos: Photo[] = [];
    const existingPhotos = readPhotos();

    for (const file of files) {
      const id = path.parse(file.filename).name;
      const ext = path.extname(file.filename);
      const thumbnailName = `${id}_thumb${ext}`;
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

      try {
        const metadata = await sharp(file.path).metadata();

        await sharp(file.path)
          .resize(200, 200, { fit: 'cover', position: 'center' })
          .toFile(thumbnailPath);

        const photo: Photo = {
          id,
          originalUrl: `/uploads/originals/${file.filename}`,
          thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
          filename: file.filename,
          uploadTime: Date.now(),
          width: metadata.width || 0,
          height: metadata.height || 0,
          filter: 'original',
          brightness: 100,
          contrast: 100
        };

        savedPhotos.push(photo);
      } catch (err) {
        console.error(`处理照片 ${file.filename} 失败:`, err);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const allPhotos = [...existingPhotos, ...savedPhotos];
    writePhotos(allPhotos);

    res.json({ success: true, photos: savedPhotos });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ success: false, error: '上传失败' });
  }
});

router.post('/apply-filter', async (req: Request, res: Response) => {
  try {
    const { photoId, filter, brightness, contrast } = req.body as {
      photoId: string;
      filter: FilterType;
      brightness: number;
      contrast: number;
    };

    if (!photoId) {
      return res.status(400).json({ success: false, error: '缺少照片ID' });
    }

    const photos = readPhotos();
    const photoIndex = photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ success: false, error: '照片不存在' });
    }

    const photo = photos[photoIndex];
    const ext = path.extname(photo.filename);
    const processedName = `${photo.id}_processed_${Date.now()}${ext}`;
    const processedPath = path.join(PROCESSED_DIR, processedName);

    const originalPath = path.join(ORIGINALS_DIR, photo.filename);
    await applySharpFilter(originalPath, processedPath, filter, brightness, contrast);

    const thumbProcessedName = `${photo.id}_thumb_processed_${Date.now()}${ext}`;
    const thumbProcessedPath = path.join(THUMBNAILS_DIR, thumbProcessedName);
    await sharp(processedPath)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .toFile(thumbProcessedPath);

    photos[photoIndex] = {
      ...photo,
      originalUrl: `/uploads/processed/${processedName}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbProcessedName}`,
      filter,
      brightness,
      contrast
    };
    writePhotos(photos);

    res.json({ success: true, photo: photos[photoIndex] });
  } catch (err) {
    console.error('应用滤镜失败:', err);
    res.status(500).json({ success: false, error: '应用滤镜失败' });
  }
});

export default router;
