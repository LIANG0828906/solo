import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  buffer: Buffer;
  uploadedAt: Date;
}

const fileStore = new Map<string, StoredFile>();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.wav') || 
        file.originalname.toLowerCase().endsWith('.mp3')) {
      cb(null, true);
    } else {
      cb(new Error('只支持 WAV 和 MP3 格式的音频文件'));
    }
  },
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '没有上传文件' });
      return;
    }

    const id = uuidv4();
    const storedFile: StoredFile = {
      id,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      buffer: req.file.buffer,
      uploadedAt: new Date(),
    };

    fileStore.set(id, storedFile);

    res.json({
      id: storedFile.id,
      name: storedFile.name,
      size: storedFile.size,
      type: storedFile.type,
      url: `/api/files/${id}`,
      uploadedAt: storedFile.uploadedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/tracks', (_req, res) => {
  const tracks = Array.from(fileStore.values()).map((file) => ({
    id: file.id,
    name: file.name,
    size: file.size,
    type: file.type,
    url: `/api/files/${file.id}`,
    uploadedAt: file.uploadedAt.toISOString(),
  }));
  res.json({ tracks });
});

router.get('/files/:id', (req, res) => {
  const file = fileStore.get(req.params.id);
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }

  res.set('Content-Type', file.type);
  res.set('Content-Length', file.size.toString());
  res.send(file.buffer);
});

router.delete('/files/:id', (req, res) => {
  const deleted = fileStore.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  res.json({ success: true });
});

export default router;
