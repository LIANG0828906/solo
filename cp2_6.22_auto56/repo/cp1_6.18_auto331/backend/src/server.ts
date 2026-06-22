import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, userQueries, noteQueries, Note } from './database';
import { processAudio, ensureUploadDir } from './audioProcessor';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav') {
      cb(null, true);
    } else {
      cb(new Error('只支持WAV格式音频'));
    }
  },
});

function generateDemoWaveform(durationMs: number): number[] {
  const samples = durationMs;
  const data: number[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const envelope = Math.sin(Math.PI * t);
    const wave = Math.sin(i * 0.05) * 0.3 + Math.sin(i * 0.12) * 0.2 + Math.sin(i * 0.08) * 0.15;
    const value = Math.abs(envelope * wave) + Math.random() * 0.1;
    data.push(Math.min(1, Math.max(0, value)));
  }
  return data;
}

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = userQueries.findByUsername(username);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existing = userQueries.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const userId = userQueries.create(username, password);

    const demoNotes: Omit<Note, 'id' | 'created_at'>[] = [
      { user_id: userId, word: 'hello', ipa: '/həˈloʊ/', description: '英语常用问候语', audio_path: null, audio_duration: 800, waveform_data: JSON.stringify(generateDemoWaveform(800)), language_family: '印欧语系' },
      { user_id: userId, word: 'bonjour', ipa: '/bɔ̃ʒuʁ/', description: '法语你好', audio_path: null, audio_duration: 700, waveform_data: JSON.stringify(generateDemoWaveform(700)), language_family: '印欧语系' },
      { user_id: userId, word: '你好', ipa: '/ni³⁵ xau²¹⁴/', description: '中文问候语', audio_path: null, audio_duration: 600, waveform_data: JSON.stringify(generateDemoWaveform(600)), language_family: '汉藏语系' },
      { user_id: userId, word: 'こんにちは', ipa: '/koɲɲit͡ɕiwa/', description: '日语你好', audio_path: null, audio_duration: 900, waveform_data: JSON.stringify(generateDemoWaveform(900)), language_family: '日本-琉球语系' },
      { user_id: userId, word: '안녕하세요', ipa: '/annjʌŋhasejo/', description: '韩语你好', audio_path: null, audio_duration: 850, waveform_data: JSON.stringify(generateDemoWaveform(850)), language_family: '朝鲜语系' },
      { user_id: userId, word: 'gracias', ipa: '/ˈɡɾaθjas/', description: '西班牙语谢谢', audio_path: null, audio_duration: 650, waveform_data: JSON.stringify(generateDemoWaveform(650)), language_family: '印欧语系' },
      { user_id: userId, word: 'water', ipa: '/ˈwɔːtər/', description: '英语水', audio_path: null, audio_duration: 550, waveform_data: JSON.stringify(generateDemoWaveform(550)), language_family: '印欧语系' },
      { user_id: userId, word: '水', ipa: '/ʂueɪ²¹⁴/', description: '中文水', audio_path: null, audio_duration: 450, waveform_data: JSON.stringify(generateDemoWaveform(450)), language_family: '汉藏语系' },
      { user_id: userId, word: 'ciao', ipa: '/ˈtʃaʊ/', description: '意大利语你好/再见', audio_path: null, audio_duration: 500, waveform_data: JSON.stringify(generateDemoWaveform(500)), language_family: '印欧语系' },
      { user_id: userId, word: 'مرحبا', ipa: '/marħaba/', description: '阿拉伯语你好', audio_path: null, audio_duration: 750, waveform_data: JSON.stringify(generateDemoWaveform(750)), language_family: '亚非语系' },
    ];

    demoNotes.forEach((note) => {
      noteQueries.create(note);
    });

    res.json({
      user: {
        id: userId,
        username,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

app.get('/api/notes', (req, res) => {
  try {
    const userId = Number(req.query.user_id || 1);
    const notes = noteQueries.findAllByUserId(userId);

    const formattedNotes = notes.map((note) => ({
      id: note.id,
      word: note.word,
      ipa: note.ipa,
      description: note.description,
      audioUrl: note.audio_path ? `/api/audio/${path.basename(note.audio_path)}` : null,
      audioDuration: note.audio_duration,
      waveformData: note.waveform_data ? JSON.parse(note.waveform_data) : [],
      languageFamily: note.language_family,
      createdAt: note.created_at,
    }));

    res.json({ notes: formattedNotes });
  } catch (error) {
    res.status(500).json({ error: '获取笔记失败' });
  }
});

app.post('/api/notes', upload.single('audio'), (req, res) => {
  try {
    const userId = Number(req.body.user_id || 1);
    const { word, ipa, description, language_family } = req.body;

    if (!word || !ipa) {
      return res.status(400).json({ error: '单词和音标不能为空' });
    }

    let audioPath: string | null = null;
    let audioDuration = 0;
    let waveformData: string | null = null;

    if (req.file) {
      audioPath = req.file.path;
      const audioResult = processAudio(req.file.path);
      audioDuration = audioResult.duration;
      waveformData = JSON.stringify(audioResult.waveformData);
    }

    const noteData: Omit<Note, 'id' | 'created_at'> = {
      user_id: userId,
      word,
      ipa,
      description: description || '',
      audio_path: audioPath,
      audio_duration: audioDuration,
      waveform_data: waveformData,
      language_family: language_family || '印欧语系',
    };

    const noteId = noteQueries.create(noteData);
    const note = noteQueries.findById(noteId);

    if (!note) {
      return res.status(500).json({ error: '创建笔记失败' });
    }

    res.json({
      note: {
        id: note.id,
        word: note.word,
        ipa: note.ipa,
        description: note.description,
        audioUrl: note.audio_path ? `/api/audio/${path.basename(note.audio_path)}` : null,
        audioDuration: note.audio_duration,
        waveformData: note.waveform_data ? JSON.parse(note.waveform_data) : [],
        languageFamily: note.language_family,
        createdAt: note.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '创建笔记失败' });
  }
});

app.put('/api/notes/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { word, ipa, description, language_family } = req.body;

    const updateData: Partial<Note> = {};
    if (word !== undefined) updateData.word = word;
    if (ipa !== undefined) updateData.ipa = ipa;
    if (description !== undefined) updateData.description = description;
    if (language_family !== undefined) updateData.language_family = language_family;

    noteQueries.update(id, updateData);

    const note = noteQueries.findById(id);
    if (!note) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    res.json({
      note: {
        id: note.id,
        word: note.word,
        ipa: note.ipa,
        description: note.description,
        audioUrl: note.audio_path ? `/api/audio/${path.basename(note.audio_path!)}` : null,
        audioDuration: note.audio_duration,
        waveformData: note.waveform_data ? JSON.parse(note.waveform_data) : [],
        languageFamily: note.language_family,
        createdAt: note.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '更新笔记失败' });
  }
});

app.delete('/api/notes/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const note = noteQueries.findById(id);

    if (!note) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    if (note.audio_path && fs.existsSync(note.audio_path)) {
      fs.unlinkSync(note.audio_path);
    }

    noteQueries.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除笔记失败' });
  }
});

app.get('/api/audio/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '音频文件不存在' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: '获取音频失败' });
  }
});

app.get('/api/stats/families', (req, res) => {
  try {
    const userId = Number(req.query.user_id || 1);
    const stats = noteQueries.getStatsByFamily(userId);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`语音地图后端服务运行在 http://localhost:${PORT}`);
  });
}

startServer();

export default app;
