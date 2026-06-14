import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getCollection, addItem, updateItem, findItems } from '../db';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  try {
    const { fosterId } = req.query;
    const messages = getCollection('messages');
    let filtered = messages;

    if (fosterId) {
      filtered = filtered.filter((m: any) => m.fosterId === fosterId);
    }

    filtered.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fosterId, senderRole, content, photos } = req.body;

    if (!fosterId || !senderRole || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = {
      id: uuidv4(),
      fosterId,
      senderRole,
      content,
      photos: photos || [],
      timestamp: new Date().toISOString(),
      read: false,
    };

    await addItem('messages', message);
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateItem('messages', id, { read: true });
    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message read:', error);
    res.status(500).json({ error: 'Failed to mark message read' });
  }
});

router.post('/upload', upload.array('photos', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedPhotos: string[] = [];

    for (const file of files) {
      const thumbName = `thumb-${file.filename}`;
      const thumbPath = path.join(uploadDir, thumbName);

      try {
        await sharp(file.path)
          .resize(300, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbPath);
      } catch (sharpErr) {
        console.warn('Thumbnail generation failed, using original:', sharpErr);
      }

      uploadedPhotos.push(`/uploads/${file.filename}`);
    }

    res.json({ success: true, photos: uploadedPhotos });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

export default router;
