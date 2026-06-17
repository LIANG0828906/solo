import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG 和 ZIP 格式'));
    }
  }
});

app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的文件' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

app.post('/api/upload/multiple', upload.array('images', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要上传的文件' });
    }

    const files = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
    }));

    res.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

app.post('/api/download', (req, res) => {
  try {
    const { layers, canvasWidth, canvasHeight } = req.body;

    if (!layers || !canvasWidth || !canvasHeight) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    res.json({
      success: true,
      message: '合成接口已就绪，请在前端使用 Canvas 直接导出',
      tip: '前端已实现 Canvas 直接导出 PNG，无需后端处理',
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: '生成失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`
  🚀 商品主图生成器后端服务已启动
  📍 服务地址: http://localhost:${PORT}
  📁 上传目录: ${uploadsDir}
  `);
});
