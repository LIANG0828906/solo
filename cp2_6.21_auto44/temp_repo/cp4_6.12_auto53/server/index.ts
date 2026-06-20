import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const dataFile = path.join(dataDir, 'entries.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

interface TravelEntry {
  id: string;
  date: string;
  location: string;
  lat: number;
  lng: number;
  content: string;
  photos: string[];
  createdAt: number;
}

const readEntries = (): TravelEntry[] => {
  try {
    const data = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeEntries = (entries: TravelEntry[]) => {
  fs.writeFileSync(dataFile, JSON.stringify(entries, null, 2));
};

app.get('/api/entries', (_req, res) => {
  const entries = readEntries();
  res.json(entries);
});

app.get('/api/entries/:id', (req, res) => {
  const entries = readEntries();
  const entry = entries.find((e) => e.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json(entry);
});

app.post('/api/entries', upload.array('photos', 5), (req, res) => {
  try {
    const { date, location, lat, lng, content } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!date || !location || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const photoUrls = files
      ? files.map((f) => `/uploads/${f.filename}`)
      : [];

    const newEntry: TravelEntry = {
      id: uuidv4(),
      date,
      location,
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      content,
      photos: photoUrls,
      createdAt: Date.now(),
    };

    const entries = readEntries();
    entries.push(newEntry);
    writeEntries(entries);

    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Error creating entry:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

app.put('/api/entries/:id', upload.array('photos', 5), (req, res) => {
  try {
    const entries = readEntries();
    const index = entries.findIndex((e) => e.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const { date, location, lat, lng, content, existingPhotos } = req.body;
    const files = req.files as Express.Multer.File[];
    const newPhotoUrls = files
      ? files.map((f) => `/uploads/${f.filename}`)
      : [];

    let keepPhotos: string[] = [];
    if (existingPhotos) {
      keepPhotos = Array.isArray(existingPhotos)
        ? existingPhotos
        : [existingPhotos];
    } else {
      keepPhotos = entries[index].photos;
    }

    entries[index] = {
      ...entries[index],
      date: date || entries[index].date,
      location: location || entries[index].location,
      lat: lat !== undefined ? parseFloat(lat) : entries[index].lat,
      lng: lng !== undefined ? parseFloat(lng) : entries[index].lng,
      content: content !== undefined ? content : entries[index].content,
      photos: [...keepPhotos, ...newPhotoUrls].slice(0, 5),
    };

    writeEntries(entries);
    res.json(entries[index]);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

app.delete('/api/entries/:id', (req, res) => {
  try {
    const entries = readEntries();
    const index = entries.findIndex((e) => e.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const deleted = entries[index];
    deleted.photos.forEach((photo) => {
      const photoPath = path.join(__dirname, photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    });

    entries.splice(index, 1);
    writeEntries(entries);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

app.listen(PORT, () => {
  console.log(`🌍 旅行时光轴服务器已启动: http://localhost:${PORT}`);
  console.log(`📁 数据文件: ${dataFile}`);
  console.log(`📷 上传目录: ${uploadsDir}`);
});
