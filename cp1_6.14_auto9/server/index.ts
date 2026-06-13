import express from 'express';
import session from 'express-session';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ColorPalette {
  id: string;
  colors: string[];
  name?: string;
  createdAt: number;
  imageUrl?: string;
}

interface UserData {
  [sessionId: string]: ColorPalette[];
}

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'userData.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const readUserData = (): UserData => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) as UserData;
  } catch {
    return {};
  }
};

const writeUserData = (data: UserData) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

app.use(express.json());
app.use(session({
  secret: 'inspiration-palette-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('只支持 JPG 和 PNG 格式的图片'));
      return;
    }
    if (!allowedExtensions.includes(ext)) {
      cb(new Error('文件扩展名不支持'));
      return;
    }
    cb(null, true);
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传图片' });
    }

    if (req.file.size === 0) {
      return res.status(400).json({ success: false, error: '上传的文件为空' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      try {
        const metadata = await sharp(req.file.buffer).metadata();
        if (!metadata.width || !metadata.height) {
          return res.status(400).json({ success: false, error: '无法读取图片尺寸' });
        }
      } catch (metadataError) {
        return res.status(400).json({ success: false, error: '图片文件已损坏或格式无效' });
      }
    }

    let compressedBuffer: Buffer;
    try {
      compressedBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } catch (sharpError) {
      return res.status(400).json({ success: false, error: '图片处理失败，请检查图片格式是否正确' });
    }

    const compressedSizeKB = Math.round(compressedBuffer.length / 1024);
    if (compressedSizeKB > 500) {
      compressedBuffer = await sharp(compressedBuffer)
        .jpeg({ quality: 70, progressive: true })
        .toBuffer();
    }

    const filename = `${uuidv4()}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, compressedBuffer);

    const imageUrl = `/uploads/${filename}`;
    res.json({ success: true, imageUrl, compressedSize: Math.round(compressedBuffer.length / 1024) });
  } catch (error) {
    if (error instanceof Error && error.message.includes('File too large')) {
      return res.status(413).json({ success: false, error: '图片大小不能超过10MB' });
    }
    res.status(500).json({ success: false, error: '服务器处理图片时出错' });
  }
});

app.get('/uploads/:filename', (req, res) => {
  const filepath = path.join(UPLOAD_DIR, req.params.filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).send('文件不存在');
  }
});

app.post('/api/palettes', (req, res) => {
  const sessionId = req.sessionID;
  const { colors, name, imageUrl } = req.body;

  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    return res.status(400).json({ success: false, error: '颜色数据无效' });
  }

  const palette: ColorPalette = {
    id: uuidv4(),
    colors,
    name,
    createdAt: Date.now(),
    imageUrl
  };

  const userData = readUserData();
  if (!userData[sessionId]) {
    userData[sessionId] = [];
  }
  userData[sessionId].unshift(palette);
  writeUserData(userData);

  res.json({ success: true, palette });
});

app.get('/api/palettes', (req, res) => {
  const sessionId = req.sessionID;
  const userData = readUserData();
  const palettes = userData[sessionId] || [];
  
  palettes.sort((a, b) => b.createdAt - a.createdAt);
  
  res.json({ success: true, palettes });
});

app.delete('/api/palettes/:id', (req, res) => {
  const sessionId = req.sessionID;
  const { id } = req.params;
  const userData = readUserData();

  if (!userData[sessionId]) {
    return res.status(404).json({ success: false, error: '色板不存在' });
  }

  const index = userData[sessionId].findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: '色板不存在' });
  }

  userData[sessionId].splice(index, 1);
  writeUserData(userData);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
