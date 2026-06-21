import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { store } from '../store';
import type { VideoMetadata } from '../../types';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 MP4 和 WebM 格式'));
    }
  },
});

router.post('/upload', upload.single('video'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '未找到视频文件' });
      return;
    }

    const duration = Number(req.body.duration) || 0;

    const metadata: VideoMetadata = {
      id: uuidv4(),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      duration,
      mimeType: req.file.mimetype,
      uploadDate: Date.now(),
      url: `/uploads/${req.file.filename}`,
    };

    store.addVideo(metadata);

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    res.status(500).json({ error: '上传失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const video = store.getVideo(req.params.id);
  if (!video) {
    res.status(404).json({ error: '视频不存在' });
    return;
  }
  res.json(video);
});

export default router;
