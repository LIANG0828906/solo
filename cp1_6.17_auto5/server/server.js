// 电商主图生成工具后端服务
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.originalname.endsWith('.zip');
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只支持上传图片文件 (jpg, png, gif, webp) 或 ZIP 压缩包'));
    }
  },
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未接收到文件',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    if (req.file.originalname.toLowerCase().endsWith('.zip')) {
      return res.json({
        success: true,
        data: {
          id: uuidv4(),
          url: fileUrl,
          filename: req.file.originalname,
          isZip: true,
        },
      });
    }

    const imagePath = path.join(uploadsDir, req.file.filename);
    const dimensions = getImageDimensions(imagePath);
    
    res.json({
      success: true,
      data: {
        id: uuidv4(),
        url: fileUrl,
        width: dimensions.width,
        height: dimensions.height,
        filename: req.file.originalname,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '上传失败',
    });
  }
});

app.post('/api/download', async (req, res) => {
  try {
    const { layers, canvas, format = 'png' } = req.body;
    
    if (!layers || !canvas) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 800;

    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `attachment; filename="composite_${Date.now()}.${format}"`);

    const { createCanvas, loadImage } = await import('canvas');
    
    const exportCanvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = exportCanvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);
      ctx.globalAlpha = layer.opacity;

      if (layer.type === 'image' && layer.imageSrc) {
        try {
          const imagePath = layer.imageSrc.startsWith('/uploads/')
            ? path.join(__dirname, '..', layer.imageSrc)
            : layer.imageSrc;
          
          const img = await loadImage(imagePath);
          
          const filter = getFilterString(layer.filterConfig);
          if (filter !== 'none') {
            ctx.filter = filter;
          }
          
          ctx.drawImage(
            img,
            -layer.width / 2,
            -layer.height / 2,
            layer.width,
            layer.height
          );
        } catch (imgError) {
          console.error('Failed to load image:', imgError);
        }
      } else if (layer.type === 'text' && layer.textStyle) {
        const { textStyle } = layer;
        ctx.rotate((textStyle.rotation * Math.PI) / 180);
        ctx.font = `${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
        ctx.fillStyle = textStyle.color;
        ctx.textAlign = textStyle.align;
        ctx.textBaseline = 'middle';
        
        const lines = textStyle.content.split('\n');
        const lineHeight = textStyle.fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = -totalHeight / 2 + lineHeight / 2;
        
        lines.forEach((line, index) => {
          ctx.fillText(line, 0, startY + index * lineHeight);
        });
      }

      ctx.restore();
    }

    const stream = format === 'jpg' 
      ? exportCanvas.createJPEGStream({ quality: 0.9 })
      : exportCanvas.createPNGStream();
    
    stream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: '生成图片失败',
    });
  }
});

function getFilterString(filterConfig) {
  const { brightness, contrast, hue, saturation } = filterConfig;
  const filters = [];
  
  if (brightness !== 0) {
    filters.push(`brightness(${100 + brightness}%)`);
  }
  if (contrast !== 0) {
    filters.push(`contrast(${100 + contrast}%)`);
  }
  if (hue !== 0) {
    filters.push(`hue-rotate(${hue}deg)`);
  }
  if (saturation !== 0) {
    filters.push(`saturate(${100 + saturation}%)`);
  }
  
  return filters.length > 0 ? filters.join(' ') : 'none';
}

function getImageDimensions(imagePath) {
  try {
    const buffer = fs.readFileSync(imagePath);
    const header = buffer.toString('hex', 0, 24);
    
    if (header.startsWith('ffd8')) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        const segmentLength = buffer.readUInt16BE(offset + 2);
        
        if ((marker & 0xff00) !== 0xff00) break;
        
        if ((marker >= 0xffc0 && marker <= 0xffc3) || 
            (marker >= 0xffc5 && marker <= 0xffc7) ||
            (marker >= 0xffc9 && marker <= 0xffcb) ||
            (marker >= 0xffcd && marker <= 0xffcf)) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
          };
        }
        
        offset += 2 + segmentLength;
      }
    } else if (header.startsWith('89504e47')) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }
  } catch (e) {
    console.error('Failed to get image dimensions:', e);
  }
  
  return { width: 800, height: 800 };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});
