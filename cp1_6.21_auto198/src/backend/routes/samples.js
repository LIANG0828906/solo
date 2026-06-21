import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { UPLOAD_DIR, generateWaveformData } from '../services/fileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /wav|mp3|ogg|flac|aac/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('仅支持音频文件'));
  }
});

const mockSamples = [
  {
    id: '1',
    name: 'Kick Drum Deep',
    filename: 'kick_deep.wav',
    url: '/samples/kick_deep.wav',
    duration: 0.6,
    bpm: 128,
    key: 'C',
    tags: ['drum', 'kick', 'bass', 'house'],
    waveformData: generateWaveformData(0.6),
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Snare Snappy',
    filename: 'snare_snappy.wav',
    url: '/samples/snare_snappy.wav',
    duration: 0.3,
    bpm: 128,
    key: 'G',
    tags: ['drum', 'snare', 'trap'],
    waveformData: generateWaveformData(0.3),
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Hi-Hat Closed',
    filename: 'hihat_closed.wav',
    url: '/samples/hihat_closed.wav',
    duration: 0.1,
    bpm: 140,
    key: 'A',
    tags: ['drum', 'hihat', 'closed'],
    waveformData: generateWaveformData(0.1),
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Piano Chord C Major',
    filename: 'piano_cmaj.wav',
    url: '/samples/piano_cmaj.wav',
    duration: 2.5,
    bpm: 90,
    key: 'C',
    tags: ['piano', 'chord', 'ambient'],
    waveformData: generateWaveformData(2.5),
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Bass Sub 808',
    filename: 'bass_808.wav',
    url: '/samples/bass_808.wav',
    duration: 1.2,
    bpm: 140,
    key: 'F',
    tags: ['bass', '808', 'trap', 'hiphop'],
    waveformData: generateWaveformData(1.2),
    createdAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Synth Pad Warm',
    filename: 'synth_pad.wav',
    url: '/samples/synth_pad.wav',
    duration: 4.0,
    bpm: 100,
    key: 'D',
    tags: ['synth', 'pad', 'ambient', 'chill'],
    waveformData: generateWaveformData(4.0),
    createdAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Clap Vintage',
    filename: 'clap_vintage.wav',
    url: '/samples/clap_vintage.wav',
    duration: 0.2,
    bpm: 120,
    key: 'E',
    tags: ['drum', 'clap', 'vintage'],
    waveformData: generateWaveformData(0.2),
    createdAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Vocal Chop Female',
    filename: 'vocal_chop.wav',
    url: '/samples/vocal_chop.wav',
    duration: 1.5,
    bpm: 128,
    key: 'A',
    tags: ['vocal', 'chop', 'female', 'edm'],
    waveformData: generateWaveformData(1.5),
    createdAt: new Date().toISOString()
  }
];

let samples = [...mockSamples];

router.get('/', (req, res) => {
  try {
    const { search, bpmMin, bpmMax, keys, tags } = req.query;
    
    let result = [...samples];
    
    if (search) {
      const searchLower = String(search).toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    
    if (bpmMin) {
      result = result.filter(s => s.bpm >= Number(bpmMin));
    }
    if (bpmMax) {
      result = result.filter(s => s.bpm <= Number(bpmMax));
    }
    
    if (keys && keys.length > 0) {
      const keysArr = Array.isArray(keys) ? keys : String(keys).split(',');
      result = result.filter(s => keysArr.includes(s.key));
    }
    
    if (tags && tags.length > 0) {
      const tagsArr = Array.isArray(tags) ? tags : String(tags).split(',');
      result = result.filter(s => 
        tagsArr.some(t => s.tags.includes(t))
      );
    }
    
    setTimeout(() => {
      res.json({ data: result });
    }, 100);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const sample = samples.find(s => s.id === req.params.id);
    if (!sample) {
      return res.status(404).json({ error: '采样未找到' });
    }
    res.json({ data: sample });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }
    
    const { name, bpm, key, tags } = req.body;
    const id = uuidv4();
    const duration = Number(req.body.duration) || 2.0;
    
    const newSample = {
      id,
      name: name || req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      duration,
      bpm: Number(bpm) || 120,
      key: key || 'C',
      tags: tags ? String(tags).split(',').map(t => t.trim()) : [],
      waveformData: generateWaveformData(duration),
      createdAt: new Date().toISOString()
    };
    
    samples.unshift(newSample);
    
    setTimeout(() => {
      res.json({ data: newSample });
    }, 300);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
