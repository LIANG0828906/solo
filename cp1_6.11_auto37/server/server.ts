import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传 PDF、PNG 或 JPG 文件'));
    }
  }
});

interface Note {
  id: string;
  pitch: number;
  start: number;
  duration: number;
}

function generateDemoNotes(): Note[] {
  const demoMelody = [
    { pitch: 60, start: 0, duration: 1 },
    { pitch: 62, start: 1, duration: 1 },
    { pitch: 64, start: 2, duration: 1 },
    { pitch: 65, start: 3, duration: 1 },
    { pitch: 67, start: 4, duration: 1 },
    { pitch: 64, start: 5, duration: 0.5 },
    { pitch: 62, start: 5.5, duration: 0.5 },
    { pitch: 60, start: 6, duration: 2 },
    { pitch: 72, start: 8, duration: 0.5 },
    { pitch: 71, start: 8.5, duration: 0.5 },
    { pitch: 69, start: 9, duration: 1 },
    { pitch: 67, start: 10, duration: 1 },
    { pitch: 65, start: 11, duration: 2 },
    { pitch: 60, start: 13, duration: 0.5 },
    { pitch: 64, start: 13.5, duration: 0.5 },
    { pitch: 67, start: 14, duration: 0.5 },
    { pitch: 72, start: 14.5, duration: 0.5 },
    { pitch: 71, start: 15, duration: 1 },
    { pitch: 67, start: 16, duration: 1 },
    { pitch: 65, start: 17, duration: 2 },
  ];

  return demoMelody.map(n => ({
    ...n,
    id: uuidv4()
  }));
}

function simulateRecognition(fileBuffer: Buffer, originalName: string): Promise<{ notes: Note[]; confidence: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const notes = generateDemoNotes();
      const fileSize = fileBuffer.length;
      const confidence = Math.min(0.98, 0.8 + Math.random() * 0.18);

      console.log(`[识别引擎] 处理文件: ${originalName}, 大小: ${(fileSize / 1024).toFixed(2)}KB`);
      console.log(`[识别引擎] 识别置信度: ${(confidence * 100).toFixed(1)}%, 识别音符数: ${notes.length}`);

      resolve({ notes, confidence });
    }, 800 + Math.random() * 1200);
  });
}

function encodeMIDI(notes: Note[], bpm: number = 120): Uint8Array {
  const ticksPerBeat = 480;
  const microsecondsPerBeat = Math.round(60000000 / bpm);

  const events: Array<{ delta: number; data: number[] }> = [];

  events.push({
    delta: 0,
    data: [0xff, 0x51, 0x03, (microsecondsPerBeat >> 16) & 0xff, (microsecondsPerBeat >> 8) & 0xff, microsecondsPerBeat & 0xff]
  });

  const sortedNotes = [...notes].sort((a, b) => a.start - b.start);
  interface TimedEvent { tick: number; data: number[]; }
  const timedEvents: TimedEvent[] = [];

  sortedNotes.forEach(note => {
    const startTick = Math.round(note.start * ticksPerBeat);
    const endTick = Math.round((note.start + note.duration) * ticksPerBeat);
    timedEvents.push({ tick: startTick, data: [0x90, note.pitch & 0x7f, 0x64] });
    timedEvents.push({ tick: endTick, data: [0x80, note.pitch & 0x7f, 0x40] });
  });

  timedEvents.sort((a, b) => a.tick - b.tick);

  let prevTick = 0;
  timedEvents.forEach(ev => {
    const delta = ev.tick - prevTick;
    events.push({ delta, data: ev.data });
    prevTick = ev.tick;
  });

  events.push({ delta: 0, data: [0xff, 0x2f, 0x00] });

  function encodeVariableLength(value: number): number[] {
    const result: number[] = [];
    let buffer = value & 0x7f;
    while ((value >>= 7) > 0) {
      buffer <<= 8;
      buffer |= ((value & 0x7f) | 0x80);
    }
    while (true) {
      result.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
    return result;
  }

  const trackData: number[] = [];
  events.forEach(ev => {
    trackData.push(...encodeVariableLength(ev.delta));
    trackData.push(...ev.data);
  });

  const midiFile: number[] = [];
  midiFile.push(0x4d, 0x54, 0x68, 0x64);
  midiFile.push(0x00, 0x00, 0x00, 0x06);
  midiFile.push(0x00, 0x00);
  midiFile.push(0x00, 0x01);
  midiFile.push((ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff);

  midiFile.push(0x4d, 0x54, 0x72, 0x6b);
  const length = trackData.length;
  midiFile.push((length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
  midiFile.push(...trackData);

  return new Uint8Array(midiFile);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的文件'
      });
    }

    console.log(`[上传] 收到文件: ${req.file.originalname}, 类型: ${req.file.mimetype}, 大小: ${(req.file.size / 1024).toFixed(2)}KB`);

    const result = await simulateRecognition(req.file.buffer, req.file.originalname);

    return res.json({
      success: true,
      notes: result.notes,
      confidence: result.confidence,
      clef: 'treble',
      timeSignature: [4, 4],
      fileName: req.file.originalname
    });

  } catch (error) {
    console.error('[上传] 处理错误:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '文件处理失败'
    });
  }
});

app.post('/api/export-midi', (req, res) => {
  try {
    const { notes, bpm = 120 } = req.body;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有可导出的音符数据'
      });
    }

    console.log(`[MIDI导出] 导出 ${notes.length} 个音符, BPM: ${bpm}`);

    const midiData = encodeMIDI(notes, bpm);
    const base64Data = uint8ToBase64(midiData);
    const filename = `sheet-music-${Date.now()}.mid`;

    return res.json({
      success: true,
      data: base64Data,
      filename,
      noteCount: notes.length
    });

  } catch (error) {
    console.error('[MIDI导出] 错误:', error);
    return res.status(500).json({
      success: false,
      error: 'MIDI文件生成失败'
    });
  }
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小超过限制（最大5MB）'
      });
    }
    return res.status(400).json({
      success: false,
      error: `文件上传错误: ${error.message}`
    });
  }
  return res.status(500).json({
    success: false,
    error: error.message || '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  乐谱识别后端服务已启动`);
  console.log(`  端口: ${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});
