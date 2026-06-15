import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import petsRouter from './routes/pets';
import recordsRouter from './routes/records';
import medicalRouter from './routes/medical';
import type { Database } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbFile = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFile<Database>(dbFile);
const defaultData: Database = {
  pets: [],
  records: [],
  medical: [],
  measurements: [],
};
export const db = new Low<Database>(adapter, defaultData);

(async () => {
  await db.read();
  if (!db.data) {
    db.data = defaultData;
    await db.write();
  }
  if (!db.data.pets) db.data.pets = [];
  if (!db.data.records) db.data.records = [];
  if (!db.data.medical) db.data.medical = [];
  if (!db.data.measurements) db.data.measurements = [];
  await db.write();
})();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件'));
  },
});

export const processAvatar = async (file: Express.Multer.File): Promise<string> => {
  const filename = `avatar_${Date.now()}_${Math.round(Math.random() * 1e9)}.png`;
  const outputPath = path.join(uploadsDir, filename);

  const roundedCorners = Buffer.from(
    '<svg><rect x="0" y="0" width="200" height="200" rx="100" ry="100"/></svg>'
  );

  await sharp(file.buffer)
    .resize(200, 200, { fit: 'cover' })
    .composite([{ input: roundedCorners, blend: 'dest-in' }])
    .png()
    .toFile(outputPath);

  return `/uploads/${filename}`;
};

app.use('/api/pets', petsRouter);
app.use('/api/records', recordsRouter);
app.use('/api/medical', medicalRouter);

app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
