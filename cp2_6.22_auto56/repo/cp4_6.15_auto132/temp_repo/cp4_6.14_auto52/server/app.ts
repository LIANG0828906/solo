import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
  stream?: NodeJS.ReadableStream;
}

interface Artwork {
  id: string;
  name: string;
  artist: string;
  description: string;
  image: string;
  audioTracks: string[];
  position?: { x: number; y: number; wall: string };
  order?: number;
}

interface Exhibition {
  id: string;
  name: string;
  openingDate: string;
  backgroundColor: string;
  backgroundMode: 'solid' | 'gradient';
  backgroundGradientEnd?: string;
  artworks: Artwork[];
  layout?: { width: number; height: number; hangPoints: any[] };
}

interface Visitor {
  id: string;
  nickname: string;
  startTime: number;
  duration: number;
  completionRate: number;
  artworkStayTimes: Record<string, number>;
}

const ALLOWED_IMAGE_MAGIC: Record<string, number[]> = {
  jpg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
};
const ALLOWED_AUDIO_MAGIC: Record<string, number[]> = {
  mp3_id3v2: [0x49, 0x44, 0x33],
  mp3_frame: [0xFF, 0xFB],
};

function validateMagicNumber(buffer: Buffer, signatures: number[][]): boolean {
  return signatures.some(sig =>
    sig.length <= buffer.length &&
    sig.every((byte, idx) => buffer[idx] === byte)
  );
}

async function validateFileType(file: UploadedFile, type: 'image' | 'audio'): Promise<boolean> {
  const maxBytes = type === 'image' ? 8 : 3;
  const buffer = Buffer.alloc(maxBytes);
  
  return new Promise((resolve) => {
    fs.open(file.path, 'r', (err, fd) => {
      if (err) return resolve(false);
      fs.read(fd, buffer, 0, maxBytes, 0, (readErr, bytesRead) => {
        fs.close(fd, () => {});
        if (readErr || bytesRead < (type === 'image' ? 3 : 2)) return resolve(false);
        
        if (type === 'image') {
          resolve(validateMagicNumber(buffer, [ALLOWED_IMAGE_MAGIC.jpg, ALLOWED_IMAGE_MAGIC.png]));
        } else {
          resolve(validateMagicNumber(buffer, [ALLOWED_AUDIO_MAGIC.mp3_id3v2, ALLOWED_AUDIO_MAGIC.mp3_frame]));
        }
      });
    });
  });
}

function deleteTempFiles(files: Record<string, UploadedFile[]> | undefined) {
  if (!files) return;
  Object.values(files).flat().forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, () => {});
    }
  });
}

type DestinationCb = (error: Error | null, destination: string) => void;
type FilenameCb = (error: Error | null, filename: string) => void;
type FilterCb = (error: Error | null, acceptFile?: boolean) => void;

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: DestinationCb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req: any, file: any, cb: FilenameCb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req: any, file: any, cb: FilterCb) => {
    const fieldName = file.fieldname;
    if (fieldName === 'image') {
      const allowedTypes = /jpeg|jpg|png/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      }
      return cb(new Error('只允许上传 JPG/PNG 格式的图片'));
    } else if (fieldName.startsWith('audio')) {
      const allowedTypes = /mp3/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = /mpeg/.test(file.mimetype) || /mp3/.test(file.mimetype);
      if (extname || mimetype) {
        return cb(null, true);
      }
      return cb(new Error('只允许上传 MP3 格式的音频'));
    }
    cb(new Error('未知的字段类型'));
  },
});

const exhibitions: Record<string, Exhibition> = {};
const visitors: Record<string, Visitor> = {};
const visitorList: string[] = [];

const sampleArtworks: Artwork[] = [
  {
    id: uuidv4(),
    name: '星空',
    artist: '文森特·梵高',
    description: '《星空》是荷兰后印象派画家文森特·梵高于1889年5月在法国圣雷米的一家精神病院创作的一幅油画。画面中展现了一个充满运动感的漩涡状夜空，明亮的星星和弯月照耀着宁静的村庄。',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
    audioTracks: [],
    position: { x: 4, y: 0, wall: 'north' },
    order: 0,
  },
  {
    id: uuidv4(),
    name: '蒙娜丽莎',
    artist: '列奥纳多·达·芬奇',
    description: '《蒙娜丽莎》是意大利文艺复兴时期画家列奥纳多·达·芬奇创作的油画，现收藏于法国卢浮宫博物馆。这幅肖像画以其神秘的微笑和精湛的绘画技巧闻名于世。',
    image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=400&fit=crop',
    audioTracks: [],
    position: { x: 8, y: 0, wall: 'north' },
    order: 1,
  },
  {
    id: uuidv4(),
    name: '呐喊',
    artist: '爱德华·蒙克',
    description: '《呐喊》是挪威表现主义画家爱德华·蒙克的代表作之一，创作于1893年。画面中描绘了一个在血红色天空下扭曲尖叫的人形，表达了现代人内心深处的焦虑与恐惧。',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
    audioTracks: [],
    position: { x: 12, y: 0, wall: 'north' },
    order: 2,
  },
  {
    id: uuidv4(),
    name: '戴珍珠耳环的少女',
    artist: '约翰内斯·维米尔',
    description: '《戴珍珠耳环的少女》是荷兰黄金时代画家约翰内斯·维米尔的代表作，被誉为"北方的蒙娜丽莎"。画中少女侧身回眸，嘴唇微张，珍珠耳环闪烁着柔和的光泽。',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    audioTracks: [],
    position: { x: 16, y: 0, wall: 'north' },
    order: 3,
  },
  {
    id: uuidv4(),
    name: '格尔尼卡',
    artist: '巴勃罗·毕加索',
    description: '《格尔尼卡》是西班牙立体主义画家巴勃罗·毕加索于1937年创作的一幅巨型油画。这幅作品以立体主义的手法描绘了西班牙内战期间格尔尼卡小镇遭受轰炸的惨状。',
    image: 'https://images.unsplash.com/photo-1549289524-06cf8837ace5?w=400&h=400&fit=crop',
    audioTracks: [],
    position: { x: 0, y: 4, wall: 'west' },
    order: 4,
  },
];

const defaultExhibitionId = uuidv4();
exhibitions[defaultExhibitionId] = {
  id: defaultExhibitionId,
  name: '现代艺术大师展',
  openingDate: '2024-01-15',
  backgroundColor: '#1e293b',
  backgroundMode: 'solid',
  artworks: sampleArtworks,
  layout: {
    width: 20,
    height: 15,
    hangPoints: [],
  },
};

for (let i = 0; i < 15; i++) {
  const visitorId = uuidv4();
  const nicknames = ['艺术爱好者', '漫游者', '观展人', '收藏家', '学生', '设计师', '摄影师', '诗人', '建筑师', '音乐人'];
  const nickname = nicknames[Math.floor(Math.random() * nicknames.length)] + (i + 1);
  const startTime = Date.now() - Math.random() * 3600000;
  const duration = Math.floor(Math.random() * 1800) + 60;
  const artworkStayTimes: Record<string, number> = {};
  
  sampleArtworks.forEach(art => {
    artworkStayTimes[art.id] = Math.floor(Math.random() * 120) + 10;
  });

  visitors[visitorId] = {
    id: visitorId,
    nickname,
    startTime,
    duration,
    completionRate: Math.floor(Math.random() * 60) + 40,
    artworkStayTimes,
  };
  visitorList.unshift(visitorId);
}

app.post('/api/upload', (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio1', maxCount: 1 },
    { name: 'audio2', maxCount: 1 },
    { name: 'audio3', maxCount: 1 },
  ])(req, res, (err: any) => {
    if (err) {
      deleteTempFiles(req.files as unknown as Record<string, UploadedFile[]>);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          success: false, 
          error: '文件大小超出限制，图片不能超过5MB' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        error: err.message || '上传失败' 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const files = req.files as unknown as Record<string, UploadedFile[]>;
    const result: { image?: string; audioTracks: string[] } = { audioTracks: [] };
    
    if (files.image && files.image[0]) {
      const imgFile = files.image[0];
      if (imgFile.size > 5 * 1024 * 1024) {
        deleteTempFiles(files);
        return res.status(400).json({ 
          success: false, 
          error: '图片大小不能超过5MB' 
        });
      }
      const isValid = await validateFileType(imgFile, 'image');
      if (!isValid) {
        deleteTempFiles(files);
        return res.status(415).json({ 
          success: false, 
          error: '图片格式无效，只允许 JPG/PNG 格式' 
        });
      }
      result.image = `/uploads/${imgFile.filename}`;
    }
    
    for (let i = 1; i <= 3; i++) {
      const audioKey = `audio${i}` as keyof typeof files;
      if (files[audioKey] && files[audioKey][0]) {
        const audioFile = files[audioKey][0];
        const maxAudioSize = 2 * 60 * 1024 * 1024;
        if (audioFile.size > maxAudioSize) {
          deleteTempFiles(files);
          return res.status(400).json({ 
            success: false, 
            error: `音频${i}大小不能超过约2分钟` 
          });
        }
        const isValid = await validateFileType(audioFile, 'audio');
        if (!isValid) {
          deleteTempFiles(files);
          return res.status(415).json({ 
            success: false, 
            error: `音频${i}格式无效，只允许 MP3 格式` 
          });
        }
        result.audioTracks.push(`/uploads/${audioFile.filename}`);
      }
    }
    
    res.json({ success: true, data: result });
  } catch (err: any) {
    deleteTempFiles(req.files as Record<string, Express.Multer.File[]>);
    res.status(500).json({ 
      success: false, 
      error: err.message || '服务器内部错误，上传失败' 
    });
  }
});

app.get('/api/exhibitions', (req, res) => {
  res.json(Object.values(exhibitions));
});

app.get('/api/exhibitions/:id', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  res.json(exhibition);
});

app.post('/api/exhibitions', (req, res) => {
  const { name, openingDate, backgroundColor, backgroundMode, backgroundGradientEnd } = req.body;
  const id = uuidv4();
  exhibitions[id] = {
    id,
    name,
    openingDate,
    backgroundColor,
    backgroundMode,
    backgroundGradientEnd,
    artworks: [],
    layout: {
      width: 20,
      height: 15,
      hangPoints: [],
    },
  };
  res.status(201).json(exhibitions[id]);
});

app.put('/api/exhibitions/:id', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  Object.assign(exhibition, req.body);
  res.json(exhibition);
});

app.post('/api/exhibitions/:id/artworks', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  const artwork: Artwork = {
    id: uuidv4(),
    ...req.body,
  };
  exhibition.artworks.push(artwork);
  res.status(201).json(artwork);
});

app.put('/api/exhibitions/:id/layout', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  exhibition.layout = req.body;
  exhibition.artworks = req.body.artworks || exhibition.artworks;
  res.json(exhibition);
});

app.get('/api/visitors', (req, res) => {
  const recentVisitors = visitorList.slice(0, 10).map(id => visitors[id]);
  
  const artworkStats: Record<string, number> = {};
  Object.values(visitors).forEach(visitor => {
    Object.entries(visitor.artworkStayTimes).forEach(([artworkId, time]) => {
      artworkStats[artworkId] = (artworkStats[artworkId] || 0) + time;
    });
  });
  
  res.json({
    recentVisitors,
    artworkStats,
    totalVisitors: visitorList.length,
  });
});

app.post('/api/visitors', (req, res) => {
  const { nickname } = req.body;
  const id = uuidv4();
  const defaultNickname = nickname || '访客' + Math.floor(Math.random() * 10000);
  
  visitors[id] = {
    id,
    nickname: defaultNickname,
    startTime: Date.now(),
    duration: 0,
    completionRate: 0,
    artworkStayTimes: {},
  };
  visitorList.unshift(id);
  
  if (visitorList.length > 100) {
    const oldId = visitorList.pop();
    if (oldId) delete visitors[oldId];
  }
  
  res.status(201).json(visitors[id]);
});

app.put('/api/visitors/:id', (req, res) => {
  const visitor = visitors[req.params.id];
  if (!visitor) {
    return res.status(404).json({ error: '访客不存在' });
  }
  
  const { duration, artworkStayTimes, completionRate } = req.body;
  if (duration !== undefined) visitor.duration = duration;
  if (artworkStayTimes !== undefined) visitor.artworkStayTimes = artworkStayTimes;
  if (completionRate !== undefined) visitor.completionRate = completionRate;
  
  res.json(visitor);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`默认展览ID: ${defaultExhibitionId}`);
});
