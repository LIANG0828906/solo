import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import worksRouter from './routes/works';
import generateRouter from './routes/generate';
import type { ApiResponse, UploadImageResponse } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/.test(file.mimetype);
    cb(null, allowed);
  },
});

app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, data: null, message: '未接收到文件' } as ApiResponse<null>);
    }
    const url = `/uploads/${req.file.filename}`;
    const response: ApiResponse<UploadImageResponse> = {
      code: 0,
      data: { id: uuidv4(), url },
    };
    res.json(response);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '上传失败';
    res.status(500).json({ code: 500, data: null, message } as ApiResponse<null>);
  }
});

app.use('/api/works', worksRouter);
app.use('/api/generate-share', generateRouter);

app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', port: PORT, ts: Date.now() } });
});

app.listen(PORT, () => {
  console.log(`[艺匠工坊] Express API Server running at http://localhost:${PORT}`);
});
