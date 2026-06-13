import express from 'express';
import session from 'express-session';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { storage } from './storage.js';
import type { Category, Mood } from './storage.js';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'outfit-diary-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use('/uploads', express.static(uploadsDir));

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storageConfig,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

interface ImageProcessingTask {
  inputPath: string;
  outputPath: string;
  resolve: () => void;
  reject: (err: Error) => void;
}

class ImageProcessingQueue {
  private queue: ImageProcessingTask[] = [];
  private processing = false;

  add(task: ImageProcessingTask): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...task,
        resolve: () => resolve(),
        reject: (err) => reject(err),
      });
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const task = this.queue.shift();

    if (!task) {
      this.processing = false;
      return;
    }

    try {
      await sharp(task.inputPath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .toFile(task.outputPath);

      task.resolve();
    } catch (err) {
      task.reject(err instanceof Error ? err : new Error('Image processing failed'));
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}

const imageQueue = new ImageProcessingQueue();

app.get('/api/clothing', async (req: Request, res: Response) => {
  try {
    const clothing = await storage.getClothing();
    res.json(clothing);
  } catch (err) {
    console.error('Error getting clothing:', err);
    res.status(500).json({ error: 'Failed to get clothing' });
  }
});

app.post(
  '/api/clothing',
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const { name, category, color } = req.body;

      if (!name || !category || !color) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(400).json({ error: 'Name, category and color are required' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Image file is required' });
        return;
      }

      const originalPath = req.file.path;
      const thumbFilename = `thumb-${path.basename(originalPath)}`;
      const thumbPath = path.join(uploadsDir, thumbFilename);

      try {
        await imageQueue.add({
          inputPath: originalPath,
          outputPath: thumbPath,
          resolve: () => {},
          reject: () => {},
        });
      } catch (processErr) {
        console.error('Error processing image:', processErr);
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }
        res.status(500).json({ error: 'Failed to process image' });
        return;
      }

      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      const imageUrl = `/uploads/${thumbFilename}`;

      const clothing = await storage.addClothing({
        name,
        category,
        color,
        imageUrl,
      });

      res.status(201).json(clothing);
    } catch (err) {
      console.error('Error adding clothing:', err);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to add clothing' });
    }
  }
);

app.put('/api/clothing/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, color } = req.body;

    const updateData: Partial<{ name: string; category: Category; color: string; imageUrl: string }> = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category as Category;
    if (color !== undefined) updateData.color = color;

    const clothing = await storage.updateClothing(id, updateData);

    if (!clothing) {
      res.status(404).json({ error: 'Clothing not found' });
      return;
    }

    res.json(clothing);
  } catch (err) {
    console.error('Error updating clothing:', err);
    res.status(500).json({ error: 'Failed to update clothing' });
  }
});

app.delete('/api/clothing/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const clothingList = await storage.getClothing();
    const clothing = clothingList.find((c) => c.id === id);

    const success = await storage.deleteClothing(id);

    if (!success) {
      res.status(404).json({ error: 'Clothing not found' });
      return;
    }

    if (clothing && clothing.imageUrl) {
      const imagePath = path.join(__dirname, '../..', clothing.imageUrl);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (unlinkErr) {
          console.warn('Failed to delete image file:', unlinkErr);
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting clothing:', err);
    res.status(500).json({ error: 'Failed to delete clothing' });
  }
});

app.get('/api/diary', async (req: Request, res: Response) => {
  try {
    const diaries = await storage.getDiaries();
    res.json(diaries);
  } catch (err) {
    console.error('Error getting diaries:', err);
    res.status(500).json({ error: 'Failed to get diaries' });
  }
});

app.post('/api/diary', async (req: Request, res: Response) => {
  try {
    const { date, clothingIds, mood, note, outfitImage } = req.body;

    if (!date || !clothingIds || !mood) {
      res.status(400).json({ error: 'Date, clothingIds and mood are required' });
      return;
    }

    const diary = await storage.addDiary({
      date,
      clothingIds: Array.isArray(clothingIds) ? clothingIds : [clothingIds],
      mood,
      note: note || '',
      outfitImage,
    });

    res.status(201).json(diary);
  } catch (err) {
    console.error('Error adding diary:', err);
    res.status(500).json({ error: 'Failed to add diary' });
  }
});

app.delete('/api/diary/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await storage.deleteDiary(id);

    if (!success) {
      res.status(404).json({ error: 'Diary not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting diary:', err);
    res.status(500).json({ error: 'Failed to delete diary' });
  }
});

app.get('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const recommendations = await storage.getRecommendations();
    res.json(recommendations);
  } catch (err) {
    console.error('Error getting recommendations:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
