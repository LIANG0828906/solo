import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { photoStore, Photo } from '../data/photoStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG 和 PNG 格式'));
    }
  }
});

app.get('/api/photos', (req, res) => {
  const category = req.query.category as string | undefined;
  const photos = photoStore.getPhotos(category);
  res.json(photos);
});

app.post('/api/photos', upload.array('photos', 20), async (req, res) => {
  try {
    const category = (req.body.category || 'portrait') as Photo['category'];
    const title = (req.body.title || '未命名作品') as string;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: '请上传照片' });
      return;
    }

    const newPhotos: Photo[] = [];

    for (const file of files) {
      const filename = path.basename(file.filename);
      const ext = path.extname(filename);
      const thumbFilename = `thumb_${filename}`;
      const thumbPath = path.join(uploadsDir, thumbFilename);

      let width = 0;
      let height = 0;

      try {
        const metadata = await sharp(file.path).metadata();
        width = metadata.width || 800;
        height = metadata.height || 600;

        await sharp(file.path)
          .resize(400, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbPath);
      } catch {
        try {
          await sharp(file.path)
            .resize(400, null, { withoutEnlargement: true })
            .png()
            .toFile(thumbPath);
        } catch {
          // ignore thumbnail errors
        }
      }

      const photo: Photo = {
        id: uuidv4(),
        title: `${title} - ${newPhotos.length + 1}`,
        category,
        url: `/uploads/${filename}`,
        thumbnailUrl: `/uploads/${thumbFilename}`,
        width,
        height,
        createdAt: new Date().toISOString()
      };
      newPhotos.push(photo);
    }

    photoStore.addPhotos(newPhotos);
    res.json({ success: true, photos: newPhotos });
  } catch (err) {
    const message = err instanceof Error ? err.message : '上传失败';
    res.status(500).json({ error: message });
  }
});

app.delete('/api/photos/:id', (req, res) => {
  const { id } = req.params;
  const photo = photoStore.getPhotoById(id);
  if (photo) {
    const filepath = path.join(uploadsDir, path.basename(photo.url));
    const thumbpath = path.join(uploadsDir, path.basename(photo.thumbnailUrl));
    try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch { /* ignore */ }
    try { if (fs.existsSync(thumbpath)) fs.unlinkSync(thumbpath); } catch { /* ignore */ }
  }
  const ok = photoStore.deletePhoto(id);
  res.json({ success: ok });
});

app.post('/api/bookings', (req, res) => {
  try {
    const { serviceType, date, name, phone, email, message } = req.body;
    if (!serviceType || !date || !name || !phone || !email) {
      res.status(400).json({ error: '请填写所有必填信息' });
      return;
    }
    const booking = photoStore.addBooking({
      serviceType, date, name, phone, email, message: message || ''
    });
    res.json({ success: true, bookingId: booking.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : '预约失败';
    res.status(500).json({ error: message });
  }
});

app.get('/api/comments', (req, res) => {
  const photoId = req.query.photoId as string | undefined;
  res.json(photoStore.getComments(photoId));
});

app.post('/api/comments', (req, res) => {
  try {
    const { photoId, username, content } = req.body;
    if (!photoId || !username || !content) {
      res.status(400).json({ error: '请填写评论信息' });
      return;
    }
    if (content.length > 200) {
      res.status(400).json({ error: '评论不能超过200字' });
      return;
    }
    const comment = photoStore.addComment({ photoId, username, content });
    res.json({ success: true, comment });
  } catch (err) {
    const message = err instanceof Error ? err.message : '评论失败';
    res.status(500).json({ error: message });
  }
});

app.get('/api/stats', (_req, res) => {
  res.json(photoStore.getStats());
});

app.listen(PORT, () => {
  console.log(`光匣后端服务已启动: http://localhost:${PORT}`);
});
