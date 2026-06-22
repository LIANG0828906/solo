import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
const ORIGINALS_DIR = path.join(UPLOADS_DIR, 'originals');
const WATERMARKED_DIR = path.join(UPLOADS_DIR, 'watermarked');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(DATA_DIR);
ensureDir(UPLOADS_DIR);
ensureDir(THUMBNAILS_DIR);
ensureDir(ORIGINALS_DIR);
ensureDir(WATERMARKED_DIR);

const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
const VIEWS_FILE = path.join(DATA_DIR, 'views.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

const readJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
};

const generateSamplePhotos = async (projectId) => {
  const photos = [];
  const colors = [
    { name: '风景照-山脉.jpg', color: '#4a90a4' },
    { name: '人像摄影-午后.jpg', color: '#d4a574' },
    { name: '城市夜景.jpg', color: '#2c3e50' },
    { name: '自然风光-湖泊.jpg', color: '#3498db' },
    { name: '美食摄影-甜点.jpg', color: '#e74c3c' },
    { name: '街拍-小巷.jpg', color: '#7f8c8d' },
    { name: '花卉微距.jpg', color: '#e91e63' },
    { name: '建筑摄影-教堂.jpg', color: '#9b59b6' },
    { name: '海洋-日落.jpg', color: '#f39c12' },
  ];

  for (let i = 0; i < colors.length; i++) {
    const id = uuidv4();
    const photo = colors[i];
    const originalPath = path.join(ORIGINALS_DIR, `${id}.jpg`);
    const watermarkedPath = path.join(WATERMARKED_DIR, `${id}.jpg`);
    const thumbSmallPath = path.join(THUMBNAILS_DIR, `${id}_small.jpg`);
    const thumbMediumPath = path.join(THUMBNAILS_DIR, `${id}_medium.jpg`);

    const width = 800 + Math.floor(Math.random() * 400);
    const height = 600 + Math.floor(Math.random() * 400);

    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: photo.color,
      },
    })
      .jpeg({ quality: 80 })
      .toFile(originalPath);

    const watermarkText = '李明 2024/01/15';
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonal" patternUnits="userSpaceOnUse" width="200" height="100" patternTransform="rotate(-30)">
            <text x="100" y="50" 
              font-family="Arial, sans-serif" 
              font-size="20" 
              fill="white" 
              fill-opacity="0.3" 
              text-anchor="middle">
              ${watermarkText}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonal)"/>
      </svg>
    `;

    await sharp(originalPath)
      .composite([{ input: Buffer.from(svg) }])
      .jpeg({ quality: 80 })
      .toFile(watermarkedPath);

    await sharp(originalPath)
      .resize(320, 240, { fit: 'inside' })
      .jpeg({ quality: 70 })
      .toFile(thumbSmallPath);

    await sharp(originalPath)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 75 })
      .toFile(thumbMediumPath);

    const daysAgo = Math.floor(Math.random() * 30);
    const uploadDate = new Date();
    uploadDate.setDate(uploadDate.getDate() - daysAgo);

    photos.push({
      id,
      projectId,
      filename: photo.name,
      originalUrl: `/uploads/originals/${id}.jpg`,
      watermarkedUrl: `/uploads/watermarked/${id}.jpg`,
      thumbnailSmall: `/uploads/thumbnails/${id}_small.jpg`,
      thumbnailMedium: `/uploads/thumbnails/${id}_medium.jpg`,
      uploadDate: uploadDate.toISOString(),
      viewCount: Math.floor(Math.random() * 100),
      downloadCount: Math.floor(Math.random() * 20),
      lastViewed: null,
    });
  }

  return photos;
};

const initData = async () => {
  let projects = [];
  if (!fs.existsSync(PROJECTS_FILE) || readJSON(PROJECTS_FILE).length === 0) {
    const defaultProject = {
      id: uuidv4(),
      name: '默认作品集',
      description: '摄影师的精选作品集',
      createdAt: new Date().toISOString(),
      photographerName: '李明',
      watermarkColor: '#ffffff',
      watermarkOpacity: 0.3,
    };
    projects = [defaultProject];
    writeJSON(PROJECTS_FILE, projects);
  } else {
    projects = readJSON(PROJECTS_FILE);
  }
  
  if (!fs.existsSync(PHOTOS_FILE) || readJSON(PHOTOS_FILE).length === 0) {
    const samplePhotos = await generateSamplePhotos(projects[0].id);
    writeJSON(PHOTOS_FILE, samplePhotos);
  }
  
  if (!fs.existsSync(LICENSES_FILE)) writeJSON(LICENSES_FILE, []);
  if (!fs.existsSync(COMMENTS_FILE)) writeJSON(COMMENTS_FILE, []);
  if (!fs.existsSync(VIEWS_FILE)) writeJSON(VIEWS_FILE, []);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ORIGINALS_DIR);
  },
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG 和 PNG 格式'));
    }
  },
});

const generateWatermark = async (inputPath, outputPath, photographerName, color, opacity) => {
  const dateStr = new Date().toLocaleDateString('zh-CN');
  const watermarkText = `${photographerName} ${dateStr}`;
  
  const svg = `
    <svg width="800" height="200" xmlns="http://www.w3.org/2000/svg">
      <text x="400" y="100" 
        font-family="Arial, sans-serif" 
        font-size="36" 
        fill="${color}" 
        fill-opacity="${opacity}" 
        text-anchor="middle"
        transform="rotate(-30, 400, 100)">
        ${watermarkText}
      </text>
    </svg>
  `;
  
  const svgBuffer = Buffer.from(svg);
  
  await sharp(inputPath)
    .composite([
      {
        input: svgBuffer,
        gravity: 'center',
        tile: true,
      },
    ])
    .toFile(outputPath);
};

const generateThumbnails = async (filename, id) => {
  const originalPath = path.join(ORIGINALS_DIR, filename);
  const ext = path.extname(filename);
  
  const sizes = [
    { name: 'small', width: 320, height: 240 },
    { name: 'medium', width: 800, height: 600 },
  ];
  
  for (const size of sizes) {
    const outputPath = path.join(THUMBNAILS_DIR, `${id}_${size.name}${ext}`);
    await sharp(originalPath)
      .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
      .toFile(outputPath);
  }
};

app.get('/api/projects', (req, res) => {
  const projects = readJSON(PROJECTS_FILE);
  res.json(projects);
});

app.get('/api/projects/:projectId/photos', (req, res) => {
  const { projectId } = req.params;
  const photos = readJSON(PHOTOS_FILE).filter(p => p.projectId === projectId);
  res.json(photos);
});

app.get('/api/photos', (req, res) => {
  const photos = readJSON(PHOTOS_FILE);
  res.json(photos);
});

app.get('/api/photos/:id', (req, res) => {
  const { id } = req.params;
  const photos = readJSON(PHOTOS_FILE);
  const photo = photos.find(p => p.id === id);
  
  if (!photo) {
    return res.status(404).json({ error: '照片不存在' });
  }
  
  res.json(photo);
});

app.post('/api/photos/:id/view', (req, res) => {
  const { id } = req.params;
  const { ip = '192.168.x.x' } = req.body;
  
  const views = readJSON(VIEWS_FILE);
  const photos = readJSON(PHOTOS_FILE);
  
  const photoIndex = photos.findIndex(p => p.id === id);
  if (photoIndex === -1) {
    return res.status(404).json({ error: '照片不存在' });
  }
  
  photos[photoIndex].viewCount = (photos[photoIndex].viewCount || 0) + 1;
  photos[photoIndex].lastViewed = new Date().toISOString();
  writeJSON(PHOTOS_FILE, photos);
  
  const viewRecord = {
    id: uuidv4(),
    photoId: id,
    ip: ip,
    timestamp: new Date().toISOString(),
  };
  views.push(viewRecord);
  writeJSON(VIEWS_FILE, views);
  
  res.json({ success: true });
});

app.get('/api/photos/:id/views', (req, res) => {
  const { id } = req.params;
  const views = readJSON(VIEWS_FILE)
    .filter(v => v.photoId === id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
  
  const maskedViews = views.map(v => {
    const parts = v.ip.split('.');
    const maskedIp = parts.length >= 2 ? `${parts[0]}.${parts[1]}.x.x` : v.ip;
    return { ...v, ip: maskedIp };
  });
  
  res.json(maskedViews);
});

app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    const { projectId, photographerName = '摄影师' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }
    
    const id = uuidv4();
    const ext = path.extname(req.file.filename).toLowerCase();
    const originalFilename = req.file.filename;
    
    const projects = readJSON(PROJECTS_FILE);
    const project = projects.find(p => p.id === projectId) || projects[0];
    
    const watermarkColor = project.watermarkColor || '#ffffff';
    const watermarkOpacity = project.watermarkOpacity || 0.3;
    
    const watermarkedPath = path.join(WATERMARKED_DIR, `${id}${ext}`);
    await generateWatermark(
      path.join(ORIGINALS_DIR, originalFilename),
      watermarkedPath,
      photographerName,
      watermarkColor,
      watermarkOpacity
    );
    
    await generateThumbnails(originalFilename, id);
    
    const photo = {
      id,
      projectId: projectId || (projects[0]?.id),
      filename: req.file.originalname,
      originalUrl: `/uploads/originals/${originalFilename}`,
      watermarkedUrl: `/uploads/watermarked/${id}${ext}`,
      thumbnailSmall: `/uploads/thumbnails/${id}_small${ext}`,
      thumbnailMedium: `/uploads/thumbnails/${id}_medium${ext}`,
      uploadDate: new Date().toISOString(),
      viewCount: 0,
      downloadCount: 0,
      lastViewed: null,
    };
    
    const photos = readJSON(PHOTOS_FILE);
    photos.push(photo);
    writeJSON(PHOTOS_FILE, photos);
    
    res.json(photo);
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/licenses/photo/:photoId', (req, res) => {
  const { photoId } = req.params;
  const licenses = readJSON(LICENSES_FILE).filter(l => l.photoId === photoId);
  res.json(licenses);
});

app.get('/api/licenses', (req, res) => {
  const licenses = readJSON(LICENSES_FILE);
  res.json(licenses);
});

app.post('/api/licenses', (req, res) => {
  const {
    photoId,
    type,
    regions,
    duration,
    durationUnit,
    price,
    customerName,
    customerEmail,
  } = req.body;
  
  const license = {
    id: uuidv4(),
    photoId,
    type,
    regions,
    duration,
    durationUnit,
    price,
    customerName,
    customerEmail,
    status: 'pending',
    paymentId: `PAY-${uuidv4().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    approvedAt: null,
    expiresAt: null,
  };
  
  const licenses = readJSON(LICENSES_FILE);
  licenses.push(license);
  writeJSON(LICENSES_FILE, licenses);
  
  res.json(license);
});

app.put('/api/licenses/:id/approve', (req, res) => {
  const { id } = req.params;
  const licenses = readJSON(LICENSES_FILE);
  const index = licenses.findIndex(l => l.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '授权申请不存在' });
  }
  
  const now = new Date();
  const duration = licenses[index].duration;
  const durationUnit = licenses[index].durationUnit;
  
  let expiresAt = new Date(now);
  if (durationUnit === 'day') {
    expiresAt.setDate(expiresAt.getDate() + duration);
  } else if (durationUnit === 'month') {
    expiresAt.setMonth(expiresAt.getMonth() + duration);
  } else if (durationUnit === 'year') {
    expiresAt.setFullYear(expiresAt.getFullYear() + duration);
  }
  
  licenses[index].status = 'approved';
  licenses[index].approvedAt = now.toISOString();
  licenses[index].expiresAt = expiresAt.toISOString();
  
  writeJSON(LICENSES_FILE, licenses);
  
  res.json(licenses[index]);
});

app.get('/api/licenses/:id/certificate', (req, res) => {
  const { id } = req.params;
  const licenses = readJSON(LICENSES_FILE);
  const license = licenses.find(l => l.id === id);
  const photos = readJSON(PHOTOS_FILE);
  const photo = photos.find(p => p.id === license?.photoId);
  const projects = readJSON(PROJECTS_FILE);
  const project = projects.find(p => photo && p.id === photo.projectId);
  
  if (!license || license.status !== 'approved') {
    return res.status(404).json({ error: '授权证书不存在' });
  }
  
  const certificateHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>授权证书 - ${license.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F5F2EB; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .certificate { background: white; padding: 60px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 600px; text-align: center; }
    .title { font-size: 32px; color: #1C3F60; margin-bottom: 30px; font-weight: bold; }
    .cert-id { font-size: 14px; color: #999; margin-bottom: 30px; }
    .info { text-align: left; margin: 20px 0; line-height: 2; }
    .info-item { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 8px 0; }
    .info-label { color: #666; }
    .info-value { color: #333; font-weight: 500; }
    .footer { margin-top: 40px; color: #999; font-size: 12px; }
    .seal { display: inline-block; width: 100px; height: 100px; border: 3px solid #1C3F60; border-radius: 50%; line-height: 94px; color: #1C3F60; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="title">作品授权证书</div>
    <div class="cert-id">证书编号: ${license.id}</div>
    <div class="info">
      <div class="info-item">
        <span class="info-label">授权作品</span>
        <span class="info-value">${photo?.filename || '未知'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">授权类型</span>
        <span class="info-value">${license.type === 'personal' ? '个人使用' : license.type === 'commercial' ? '商业使用' : '全版权'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">授权地区</span>
        <span class="info-value">${license.regions?.join(', ') || '全球'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">被授权方</span>
        <span class="info-value">${license.customerName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">授权日期</span>
        <span class="info-value">${new Date(license.approvedAt).toLocaleDateString('zh-CN')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">有效期至</span>
        <span class="info-value">${new Date(license.expiresAt).toLocaleDateString('zh-CN')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">授权金额</span>
        <span class="info-value">¥${license.price}</span>
      </div>
    </div>
    <div class="seal">光影交付</div>
    <div class="footer">
      本证书由光影交付平台自动生成 | ${project?.photographerName || '摄影师'}
    </div>
  </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(certificateHtml);
});

app.get('/api/comments/photo/:photoId', (req, res) => {
  const { photoId } = req.params;
  const comments = readJSON(COMMENTS_FILE)
    .filter(c => c.photoId === photoId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(comments);
});

app.post('/api/comments', (req, res) => {
  const { photoId, name, email, content } = req.body;
  
  const comment = {
    id: uuidv4(),
    photoId,
    name,
    email,
    content,
    reply: null,
    createdAt: new Date().toISOString(),
    repliedAt: null,
  };
  
  const comments = readJSON(COMMENTS_FILE);
  comments.push(comment);
  writeJSON(COMMENTS_FILE, comments);
  
  console.log(`新留言通知: 照片 ${photoId} 收到来自 ${name} (${email}) 的留言`);
  
  res.json(comment);
});

app.put('/api/comments/:id/reply', (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  
  const comments = readJSON(COMMENTS_FILE);
  const index = comments.findIndex(c => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '留言不存在' });
  }
  
  comments[index].reply = reply;
  comments[index].repliedAt = new Date().toISOString();
  
  writeJSON(COMMENTS_FILE, comments);
  
  console.log(`留言回复通知: 已回复 ${comments[index].name} (${comments[index].email})`);
  
  res.json(comments[index]);
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

const startServer = async () => {
  await initData();
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
};

startServer();
