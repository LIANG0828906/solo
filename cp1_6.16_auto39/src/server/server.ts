import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { saveAudioFile, getAudioFilePath, deleteAudioFile } from './audioStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const CLIPS_PATH = path.join(UPLOADS_DIR, 'clips.json');
const PORT = 3001;

interface ClipData {
  id: string;
  name: string;
  audioId: string;
  fileName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface ExportTrackClip {
  clipId: string;
  clipName: string;
  audioId: string;
  startTime: number;
  endTime: number;
  trackStartTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

interface ExportTrack {
  id: number;
  name: string;
  color: string;
  volume: number;
  clips: ExportTrackClip[];
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only mp3 and wav files are allowed'));
    }
  },
});

async function readClips(): Promise<ClipData[]> {
  try {
    const data = await fs.readFile(CLIPS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeClips(clips: ClipData[]): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(CLIPS_PATH, JSON.stringify(clips, null, 2), 'utf-8');
}

async function startServer(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/upload', upload.single('audio'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const audioId = uuidv4();
      await saveAudioFile(audioId, file.path);

      res.json({ audioId, fileName: file.originalname });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  app.get('/api/clips', async (_req, res) => {
    try {
      const clips = await readClips();
      res.json(clips);
    } catch (err) {
      console.error('Read clips error:', err);
      res.status(500).json({ error: 'Failed to read clips' });
    }
  });

  app.post('/api/clips', async (req, res) => {
    try {
      const clip = req.body as Omit<ClipData, 'id'>;
      const newClip: ClipData = { ...clip, id: uuidv4() };

      const clips = await readClips();
      clips.push(newClip);
      await writeClips(clips);

      res.json(newClip);
    } catch (err) {
      console.error('Create clip error:', err);
      res.status(500).json({ error: 'Failed to create clip' });
    }
  });

  app.delete('/api/clips/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let clips = await readClips();
      const target = clips.find((c) => c.id === id);

      if (!target) {
        res.status(404).json({ error: 'Clip not found' });
        return;
      }

      clips = clips.filter((c) => c.id !== id);
      await writeClips(clips);

      res.json({ success: true });
    } catch (err) {
      console.error('Delete clip error:', err);
      res.status(500).json({ error: 'Failed to delete clip' });
    }
  });

  app.post('/api/export', async (req, res) => {
    try {
      const { tracks } = req.body as { tracks: ExportTrack[] };
      if (!tracks || !Array.isArray(tracks)) {
        res.status(400).json({ error: 'Invalid tracks data' });
        return;
      }

      const allClips: ExportTrackClip[] = tracks.flatMap((t) => t.clips);
      if (allClips.length === 0) {
        res.status(400).json({ error: 'No clips to export' });
        return;
      }

      let maxEndTime = 0;
      for (const clip of allClips) {
        const end = clip.trackStartTime + (clip.endTime - clip.startTime);
        if (end > maxEndTime) maxEndTime = end;
      }

      const ffmpegAvailable = await checkFfmpeg();

      if (ffmpegAvailable) {
        await exportWithFfmpeg(tracks, maxEndTime, res);
      } else {
        await exportWithFallback(tracks, res);
      }
    } catch (err) {
      console.error('Export error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`Podcast Studio server running on http://localhost:${PORT}`);
  });
}

function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('exit', (code) => resolve(code === 0));
  });
}

async function exportWithFfmpeg(
  tracks: ExportTrack[],
  maxEndTime: number,
  res: express.Response
): Promise<void> {
  const tmpDir = path.join(UPLOADS_DIR, `export_${uuidv4()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const processedFiles: string[] = [];

  for (const track of tracks) {
    for (const clip of track.clips) {
      const inputPath = await getAudioFilePath(clip.audioId);
      if (!inputPath) continue;

      const outFile = path.join(tmpDir, `clip_${uuidv4()}.mp3`);
      const duration = clip.endTime - clip.startTime;

      await new Promise<void>((resolve, reject) => {
        let cmd = ffmpeg(inputPath)
          .setStartTime(clip.startTime)
          .duration(duration)
          .audioCodec('libmp3lame')
          .audioFilters(`volume=${clip.volume}`);

        if (clip.fadeIn > 0) {
          cmd = cmd.audioFilters(`afade=t=in:st=0:d=${clip.fadeIn}`);
        }
        if (clip.fadeOut > 0) {
          cmd = cmd.audioFilters(`afade=t=out:st=${duration - clip.fadeOut}:d=${clip.fadeOut}`);
        }

        cmd
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(outFile);
      });

      const delayedFile = path.join(tmpDir, `delayed_${uuidv4()}.mp3`);
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(outFile)
          .audioCodec('libmp3lame')
          .audioFilters(`adelay=${clip.trackStartTime * 1000}|${clip.trackStartTime * 1000}`)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(delayedFile);
      });

      processedFiles.push(delayedFile);
    }
  }

  if (processedFiles.length === 0) {
    res.status(400).json({ error: 'No valid audio files found for export' });
    await cleanup(tmpDir);
    return;
  }

  const mixFile = path.join(tmpDir, 'mix.mp3');
  const padFilter = `apad=whole_dur=${maxEndTime}`;

  if (processedFiles.length === 1) {
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(processedFiles[0])
        .audioCodec('libmp3lame')
        .audioFilters(padFilter)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(mixFile);
    });
  } else {
    let cmd = ffmpeg();
    for (const file of processedFiles) {
      cmd = cmd.input(file);
    }
    const filterParts = processedFiles.map((_, i) => `[${i}:a]${padFilter}[a${i}]`);
    const mixInputs = processedFiles.map((_, i) => `[a${i}]`).join('');
    const filterComplex = `${filterParts.join(';')};${mixInputs}amix=inputs=${processedFiles.length}:duration=first[out]`;

    await new Promise<void>((resolve, reject) => {
      cmd
        .complexFilter(filterComplex, 'out')
        .audioCodec('libmp3lame')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(mixFile);
    });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', 'attachment; filename="podcast_export.mp3"');

  const stream = createReadStream(mixFile);
  stream.pipe(res);

  stream.on('end', () => {
    cleanup(tmpDir);
  });
  stream.on('error', () => {
    cleanup(tmpDir);
  });
}

async function exportWithFallback(
  tracks: ExportTrack[],
  res: express.Response
): Promise<void> {
  const allClips = tracks.flatMap((t) => t.clips);
  const files: string[] = [];

  for (const clip of allClips) {
    const inputPath = await getAudioFilePath(clip.audioId);
    if (inputPath) files.push(inputPath);
  }

  if (files.length === 0) {
    res.status(400).json({ error: 'No valid audio files found for export' });
    return;
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', 'attachment; filename="podcast_export.mp3"');

  for (let i = 0; i < files.length; i++) {
    const data = await fs.readFile(files[i]);
    res.write(data);
  }

  res.end();
}

async function cleanup(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
