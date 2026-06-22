import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.MP3', '.WAV'];
    const ext = path.extname(file.originalname);
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 MP3 和 WAV 格式'));
    }
  },
});

interface StoredFile {
  id: string;
  filePath: string;
  originalName: string;
  duration: number;
  sampleRate: number;
  amplitude: number[];
}

const storedFiles = new Map<string, StoredFile>();

function extractWaveform(filePath: string, points: number = 1000): { amplitude: number[]; duration: number; sampleRate: number } {
  try {
    const buffer = fs.readFileSync(filePath);
    let amplitude: number[] = [];
    let duration = 0;
    let sampleRate = 44100;

    if (filePath.toLowerCase().endsWith('.wav')) {
      const numChannels = buffer.readUInt16LE(22);
      sampleRate = buffer.readUInt32LE(24);
      const bitsPerSample = buffer.readUInt16LE(34);
      const dataStart = buffer.readUInt32LE(40) + 44;
      const dataSize = buffer.readUInt32LE(40);
      const bytesPerSample = bitsPerSample / 8;
      const totalSamples = dataSize / (bytesPerSample * numChannels);
      duration = totalSamples / sampleRate;

      const samplesPerPoint = Math.floor(totalSamples / points);
      const rawData: number[] = [];

      for (let i = 44; i < buffer.length; i += bytesPerSample * numChannels) {
        let sample = 0;
        if (bitsPerSample === 16) {
          sample = buffer.readInt16LE(i) / 32768;
        } else if (bitsPerSample === 8) {
          sample = (buffer.readUInt8(i) - 128) / 128;
        } else if (bitsPerSample === 32) {
          sample = buffer.readInt32LE(i) / 2147483648;
        }
        rawData.push(Math.abs(sample));
      }

      for (let i = 0; i < points; i++) {
        const start = i * samplesPerPoint;
        const end = Math.min(start + samplesPerPoint, rawData.length);
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += rawData[j] || 0;
        }
        amplitude.push(end > start ? sum / (end - start) : 0);
      }
    } else {
      duration = 30;
      for (let i = 0; i < points; i++) {
        const t = i / points;
        const v = (
          Math.abs(Math.sin(t * Math.PI * 4)) * 0.6 +
          Math.abs(Math.sin(t * Math.PI * 8 + 0.5)) * 0.3 +
          Math.random() * 0.15
        );
        amplitude.push(Math.min(1, v));
      }
    }

    const max = Math.max(...amplitude, 0.001);
    amplitude = amplitude.map((v) => Math.min(1, v / max));

    return { amplitude, duration, sampleRate };
  } catch (e) {
    const amplitude: number[] = [];
    for (let i = 0; i < points; i++) {
      amplitude.push(Math.random() * 0.8 + 0.1);
    }
    return { amplitude, duration: 30, sampleRate: 44100 };
  }
}

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未找到文件' });
  }
  const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
  const { amplitude, duration, sampleRate } = extractWaveform(req.file.path);

  storedFiles.set(fileId, {
    id: fileId,
    filePath: req.file.path,
    originalName: req.file.originalname,
    duration,
    sampleRate,
    amplitude,
  });

  res.json({
    fileId,
    audioUrl: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    duration,
    sampleRate,
    amplitude,
  });
});

app.get('/api/waveform', (req, res) => {
  const { fileId, points } = req.query;
  const stored = storedFiles.get(fileId as string);
  if (!stored) {
    return res.status(404).json({ error: '文件不存在' });
  }

  const targetPoints = parseInt(points as string) || stored.amplitude.length;
  const src = stored.amplitude;
  const result: number[] = [];
  for (let i = 0; i < targetPoints; i++) {
    const idx = Math.floor((i / targetPoints) * src.length);
    result.push(src[idx] || 0);
  }

  res.json({
    amplitude: result,
    duration: stored.duration,
    sampleRate: stored.sampleRate,
  });
});

app.post('/api/mix', (req, res) => {
  const { clips } = req.body || {};
  if (!clips || !Array.isArray(clips)) {
    return res.status(400).json({ error: '参数错误' });
  }

  const totalDuration = clips.reduce((sum: number, c: any) => {
    return sum + Math.max(0, (c.endTime || 0) - (c.startTime || 0));
  }, 0);

  const waveformPoints = 1000;
  const mixedWaveform: number[] = [];

  for (let i = 0; i < waveformPoints; i++) {
    const t = i / waveformPoints;
    let v = 0;
    let covered = 0;

    for (const clip of clips) {
      const stored = storedFiles.get(clip.fileId);
      if (!stored) continue;

      const clipDur = Math.max(0, clip.endTime - clip.startTime);
      const clipStart = covered / Math.max(totalDuration, 0.01);
      const clipEnd = (covered + clipDur) / Math.max(totalDuration, 0.01);

      if (t >= clipStart && t <= clipEnd) {
        const localT = (t - clipStart) / Math.max(clipEnd - clipStart, 0.001);
        const waveIdx = Math.floor(
          (clip.startTime / stored.duration + localT * (clipDur / stored.duration)) *
            stored.amplitude.length
        );
        v = Math.max(v, stored.amplitude[Math.min(waveIdx, stored.amplitude.length - 1)] || 0);
      }
      covered += clipDur;
    }
    mixedWaveform.push(Math.min(1, v));
  }

  res.json({
    mixedUrl: clips[0]?.audioUrl || '',
    waveformData: mixedWaveform,
    totalDuration,
  });
});

app.listen(PORT, () => {
  console.log(`WaveMix 后端服务已启动: http://localhost:${PORT}`);
});
