import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueId}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传JSON文件'));
    }
  }
});

const moleculesData = {
  water: {
    name: '水分子 H₂O',
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0, radius: 0.7, color: '#ff4444', hybridization: 'sp³' },
      { element: 'H', x: -0.96, y: 0, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: 0.24, y: 0.93, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' }
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 }
    ]
  },
  co2: {
    name: '二氧化碳 CO₂',
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp' },
      { element: 'O', x: -1.16, y: 0, z: 0, radius: 0.7, color: '#ff4444', hybridization: 'sp²' },
      { element: 'O', x: 1.16, y: 0, z: 0, radius: 0.7, color: '#ff4444', hybridization: 'sp²' }
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 }
    ]
  },
  benzene: {
    name: '苯环 C₆H₆',
    atoms: [
      { element: 'C', x: 1.39, y: 0, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: 0.695, y: 1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: -0.695, y: 1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: -1.39, y: 0, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: -0.695, y: -1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'C', x: 0.695, y: -1.202, z: 0, radius: 0.6, color: '#909090', hybridization: 'sp²' },
      { element: 'H', x: 2.47, y: 0, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: 1.235, y: 2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: -1.235, y: 2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: -2.47, y: 0, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: -1.235, y: -2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' },
      { element: 'H', x: 1.235, y: -2.136, z: 0, radius: 0.35, color: '#ffffff', hybridization: '1s' }
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 3, to: 4, order: 1 },
      { from: 4, to: 5, order: 2 },
      { from: 5, to: 0, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 2, to: 8, order: 1 },
      { from: 3, to: 9, order: 1 },
      { from: 4, to: 10, order: 1 },
      { from: 5, to: 11, order: 1 }
    ]
  }
};

app.get('/api/molecules', (req: Request, res: Response) => {
  res.json(moleculesData);
});

app.post('/api/upload', (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: `文件上传错误: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有选择文件'
      });
    }

    const fileId = path.basename(req.file.filename);
    
    res.json({
      success: true,
      fileId: fileId,
      filename: req.file.originalname,
      size: req.file.size,
      message: '文件上传成功'
    });
  });
});

app.use((err: any, req: Request, res: Response, next: (err?: any) => void) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`🧪 分子可视化器后端服务已启动: http://localhost:${PORT}`);
  console.log(`   GET /api/molecules - 获取分子数据`);
  console.log(`   POST /api/upload - 上传分子文件`);
});
